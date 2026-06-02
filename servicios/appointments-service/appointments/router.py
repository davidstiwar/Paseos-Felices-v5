from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, date as date_type, time as time_type
from typing import List, Optional
import httpx
import random
from sqlalchemy.orm import Session
from sqlalchemy import and_

from appointments.schemas import AppointmentCreate, AppointmentUpdate, AppointmentOut
from appointments.models import Appointment, AppointmentStatus, AppointmentNotificationLog
from appointments.database import get_db
from core.security import get_current_user
from invoices.utils import create_invoice_for_appointment
from invoices.models import Invoice, InvoiceStatus as InvoiceStatusEnum

# Helper para enviar notificaciones al servicio de notificaciones
async def _send_notification(user_email: str, notif_type: str, title: str, message: str):
    """Envía una notificación de forma no bloqueante (no falla si el servicio de notificaciones está caído)."""
    for base_url in ["http://localhost:3008", "http://notifications-service:3008"]:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.post(
                    f"{base_url}/notifications/internal",
                    json={
                        "user_email": user_email,
                        "type": notif_type,
                        "title": title,
                        "message": message,
                    },
                )
                if resp.status_code < 400:
                    return
        except Exception as e:
            # En producción usarías logging en vez de print
            print(f"[Notifications] Error al enviar notificación ({base_url}): {e}")
            continue

# Helper para obtener datos de la mascota desde pets-service
async def _get_pet_details(pet_id: int) -> Optional[dict]:
    """Obtener detalles de una mascota desde el pets-service"""
    # Intentar localhost primero (desarrollo local), luego pets-service (Docker)
    for base_url in ["http://localhost:3022", "http://pets-service:3022"]:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                pets_url = f"{base_url}/pets/internal/{pet_id}"
                response = await client.get(pets_url)
                print(f"[DEBUG] Pets service ({base_url}) response status: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    print(f"[DEBUG] Pets service returned data: {data}")
                    return data
                else:
                    print(f"[DEBUG] Pets service returned status {response.status_code}: {response.text}")
        except Exception as e:
            print(f"[Pets Service] Error fetching pet {pet_id} from {base_url}: {e}")
            continue
    return None

# Helper para obtener nombre del cliente desde auth-service
async def _get_client_name(client_email: str) -> Optional[str]:
    """Obtener nombre del cliente desde auth-service"""
    # Intentar localhost primero (desarrollo local), luego auth-service (Docker)
    for base_url in ["http://localhost:8000", "http://auth-service:8000"]:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                response = await client.get(f"{base_url}/auth/internal/users/{client_email}")
                if response.status_code == 200:
                    user_data = response.json()
                    return user_data.get("nombre_completo")
        except Exception as e:
            print(f"[Auth Service] Error fetching user {client_email} from {base_url}: {e}")
            continue
    return None

async def _enrich_appointment(appt: Appointment, pet_cache: dict, client_cache: dict) -> dict:
    """Retorna un dict con datos base + nombres de mascota/cliente para UI."""
    # base
    # Nota: `appt.status` viene del Enum del modelo (appointments.models.AppointmentStatus),
    # pero el schema usa su propio Enum (appointments.schemas.AppointmentStatus). Para evitar
    # errores de validación (500), enviamos el valor string del estado.
    status_value = appt.status.value if hasattr(appt.status, "value") else appt.status

    appointment_dict = {
        "id": appt.id,
        "client_email": appt.client_email,
        "pet_id": appt.pet_id,
        "service": appt.service_name,
        "date": appt.appointment_date.isoformat() if hasattr(appt.appointment_date, 'isoformat') else str(appt.appointment_date),
        "time": appt.appointment_time.isoformat() if hasattr(appt.appointment_time, 'isoformat') else str(appt.appointment_time),
        "notes": appt.notes,
        "status": status_value,
        "price": float(appt.price) if appt.price else None,
        "groomer_email": appt.groomer_email,
        "created_at": appt.created_at,
        "updated_at": appt.updated_at,
    }

    # pet details (cache por pet_id)
    pet_details = pet_cache.get(appt.pet_id)
    if pet_details is None and appt.pet_id not in pet_cache:
        pet_details = await _get_pet_details(appt.pet_id)
        pet_cache[appt.pet_id] = pet_details

    if pet_details:
        appointment_dict["pet_name"] = pet_details.get("name") or f"Pet #{appt.pet_id}"
        appointment_dict["pet_breed"] = pet_details.get("breed", "N/A")
        appointment_dict["pet_weight"] = pet_details.get("weight", "N/A")
        appointment_dict["pet_photo_url"] = pet_details.get("photo_url", "")
    else:
        appointment_dict["pet_name"] = f"Pet #{appt.pet_id}"
        appointment_dict["pet_breed"] = "N/A"
        appointment_dict["pet_weight"] = "N/A"
        appointment_dict["pet_photo_url"] = ""

    # client name (cache por email)
    client_name = client_cache.get(appt.client_email)
    if client_name is None and appt.client_email not in client_cache:
        client_name = await _get_client_name(appt.client_email)
        client_cache[appt.client_email] = client_name
    appointment_dict["client_name"] = client_name or appt.client_email

    return appointment_dict

# Helper para obtener precio del servicio desde services-catalog-service
async def _get_service_price(service_name: str) -> Optional[float]:
    """Obtener precio del servicio desde services-catalog-service"""
    try:
        # Use local host port for development; service port is 3014
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"http://localhost:3014/catalog/?active_only=false")
            if response.status_code == 200:
                services = response.json()
                for service in services:
                    if service.get("name") == service_name:
                        return float(service.get("base_price", 0))
    except Exception as e:
        print(f"[Services Catalog] Error fetching price for {service_name}: {e}")
    return None

# Helper para asignar un groomer automáticamente
async def _assign_groomer(service: str, appointment_date: date_type, appointment_time: time_type) -> Optional[str]:
    """Asigna un groomer aleatorio que ofrece el servicio y está disponible en la fecha y hora especificadas."""
    try:
        # Groomer service runs on port 3025 in development
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"http://localhost:3025/groomers/?service={service}&active_only=true"
            )
            if response.status_code == 200:
                groomers = response.json()
                if groomers and len(groomers) > 0:
                    # Filtrar groomers por disponibilidad
                    day_of_week = appointment_date.strftime("%A").lower()
                    available_groomers = []
                    
                    for groomer in groomers:
                        # Verificar si tiene disponibilidad configurada
                        availability = groomer.get("availability", {})
                        if availability and day_of_week in availability:
                            day_availability = availability[day_of_week]
                            if day_availability.get("available", False):
                                # Verificar si la hora está dentro del rango de disponibilidad
                                start_time = day_availability.get("start", "00:00")
                                end_time = day_availability.get("end", "23:59")
                                
                                if start_time <= str(appointment_time) <= end_time:
                                    available_groomers.append(groomer)
                    
                    # Seleccionar un groomer aleatorio de los disponibles
                    if available_groomers:
                        selected_groomer = random.choice(available_groomers)
                        return selected_groomer["email"]
                    else:
                        print(f"[Groomer Assignment] No hay groomers disponibles para {service} el {appointment_date} a las {appointment_time}")
    except Exception as e:
        print(f"[Groomer Assignment] Error al asignar groomer: {e}")
    return None

router = APIRouter(prefix="/appointments", tags=["appointments"])

# Default prices (simple for now)
SERVICE_PRICES = {
    "Paseo Premium": 35,
    "Paseo Estándar": 25,
    "Grooming": 45,
    "Entrenamiento": 55,
    "Paseo + Grooming": 70,
}

@router.post("/", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appointment_in: AppointmentCreate, 
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Obtener precio real del servicio desde services-catalog-service
    price = await _get_service_price(appointment_in.service)
    if price is None:
        # Fallback a precio predeterminado si no se puede obtener del catálogo
        price = SERVICE_PRICES.get(appointment_in.service, 30)

    # Parse date and time strings
    appointment_date = date_type.fromisoformat(appointment_in.date)
    appointment_time = time_type.fromisoformat(appointment_in.time)

    # Validar que la fecha no sea en el pasado
    today = date_type.today()
    if appointment_date < today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes registrar citas en fechas pasadas. Por favor, selecciona una fecha futura."
        )

    # Validar que la hora no sea en el pasado (si es hoy)
    now = datetime.now()
    appointment_datetime = datetime.combine(appointment_date, appointment_time)
    if appointment_datetime < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes registrar citas en horas pasadas. Por favor, selecciona una hora futura."
        )

    # Asignar groomer si no se proporcionó uno
    groomer_email = appointment_in.groomer_email
    if not groomer_email:
        groomer_email = await _assign_groomer(appointment_in.service, appointment_date, appointment_time)

    # Validar que el groomer no tenga otra cita en la misma fecha y hora
    if groomer_email:
        existing_appointment = db.query(Appointment).filter(
            Appointment.groomer_email == groomer_email,
            Appointment.appointment_date == appointment_datetime,
            Appointment.status.in_([AppointmentStatus.pending, AppointmentStatus.confirmed, AppointmentStatus.in_progress])
        ).first()
        
        if existing_appointment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El groomer ya tiene una cita agendada para el {appointment_date} a las {appointment_time}. Por favor, selecciona otro horario."
            )

    new_appointment = Appointment(
        client_email=current_user["email"],
        pet_id=appointment_in.pet_id,
        service_name=appointment_in.service,
        appointment_date=datetime.combine(appointment_date, appointment_time),
        appointment_time=datetime.combine(appointment_date, appointment_time),
        notes=appointment_in.notes,
        status=AppointmentStatus.pending,
        price=price,
        groomer_email=groomer_email,
    )

    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)

    # === FACTURACIÓN: crear factura automáticamente (estado: pending) ===
    # Reglas:
    # - 1 factura por cita
    # - pago presencial en efectivo (no se procesa pago aquí)
    try:
        create_invoice_for_appointment(
            db,
            appointment_id=new_appointment.id,
            client_email=new_appointment.client_email,
            pet_id=new_appointment.pet_id,
            groomer_email=new_appointment.groomer_email,
            service_name=new_appointment.service_name,
            price=float(new_appointment.price) if new_appointment.price else 0,
        )
    except Exception as e:
        # No bloqueamos la creación de la cita si falla el módulo de facturación,
        # pero lo registramos para diagnóstico.
        print(f"[Billing] Error creando factura para cita #{new_appointment.id}: {e}")

    # Enviar notificación al cliente (integración entre servicios)
    await _send_notification(
        user_email=new_appointment.client_email,
        notif_type="appointment_requested",
        title="Cita solicitada",
        message=f"Tu cita para '{new_appointment.service_name}' el {appointment_date} a las {appointment_time} ha sido registrada. Te avisaremos cuando sea confirmada."
    )

    # Enviar notificación al groomer si fue asignado
    if groomer_email:
        await _send_notification(
            user_email=groomer_email,
            notif_type="new_appointment",
            title="Nueva cita asignada",
            message=f"Tienes una nueva cita para '{new_appointment.service_name}' el {appointment_date} a las {appointment_time}."
        )

    return AppointmentOut(
        id=new_appointment.id,
        client_email=new_appointment.client_email,
        pet_id=new_appointment.pet_id,
        service=new_appointment.service_name,
        date=new_appointment.appointment_date.isoformat() if hasattr(new_appointment.appointment_date, 'isoformat') else str(new_appointment.appointment_date),
        time=new_appointment.appointment_time.isoformat() if hasattr(new_appointment.appointment_time, 'isoformat') else str(new_appointment.appointment_time),
        notes=new_appointment.notes,
        status=new_appointment.status,
        price=float(new_appointment.price) if new_appointment.price else None,
        groomer_email=new_appointment.groomer_email,
        created_at=new_appointment.created_at,
        updated_at=new_appointment.updated_at,
    )

@router.get("/all", response_model=List[AppointmentOut])
async def get_all_appointments(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Obtener todas las citas (solo para admin)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")
    try:
        all_appointments = db.query(Appointment).order_by(Appointment.appointment_date.desc(), Appointment.appointment_time.desc()).all()
        pet_cache = {}
        client_cache = {}
        enriched = []
        for appt in all_appointments:
            enriched.append(await _enrich_appointment(appt, pet_cache, client_cache))
        return enriched
    except Exception as e:
        print(f"Error getting all appointments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Hubo un error al cargar las citas. Por favor, intenta nuevamente más tarde."
        )


@router.get("/admin/by-client", response_model=List[AppointmentOut])
async def admin_appointments_by_client(
    email: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Historial (admin): citas por cliente."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")

    appts = (
        db.query(Appointment)
        .filter(Appointment.client_email == email)
        .order_by(Appointment.appointment_date.desc(), Appointment.appointment_time.desc())
        .all()
    )
    pet_cache = {}
    client_cache = {}
    return [await _enrich_appointment(a, pet_cache, client_cache) for a in appts]


@router.get("/admin/by-groomer", response_model=List[AppointmentOut])
async def admin_appointments_by_groomer(
    email: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Historial (admin): citas/servicios por groomer."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")

    appts = (
        db.query(Appointment)
        .filter(Appointment.groomer_email == email)
        .order_by(Appointment.appointment_date.desc(), Appointment.appointment_time.desc())
        .all()
    )
    pet_cache = {}
    client_cache = {}
    return [await _enrich_appointment(a, pet_cache, client_cache) for a in appts]

@router.get("/public/all")
async def get_all_appointments_public(db: Session = Depends(get_db)):
    """Obtener todas las citas sin autenticación (para frontend público)"""
    try:
        all_appointments = db.query(Appointment).order_by(Appointment.appointment_date.desc(), Appointment.appointment_time.desc()).all()
        # Return basic data without enrichment to avoid timeouts
        return [
            {
                "id": appt.id,
                "client_email": appt.client_email,
                "pet_id": appt.pet_id,
                "service": appt.service_name,
                "date": appt.appointment_date.isoformat() if hasattr(appt.appointment_date, 'isoformat') else str(appt.appointment_date),
                "time": appt.appointment_time.isoformat() if hasattr(appt.appointment_time, 'isoformat') else str(appt.appointment_time),
                "notes": appt.notes,
                "status": appt.status.value if hasattr(appt.status, "value") else appt.status,
                "price": float(appt.price) if appt.price else None,
                "groomer_email": appt.groomer_email,
                "created_at": appt.created_at,
                "updated_at": appt.updated_at,
            }
            for appt in all_appointments
        ]
    except Exception as e:
        print(f"Error getting all appointments (public): {str(e)}")
        return []

@router.get("/public/stats")
async def get_public_stats(db: Session = Depends(get_db)):
    """
    Estadísticas públicas para la landing (sin autenticación).
    Opción A: "mascotas felices" = número de citas completadas.
    """
    try:
        completed_appointments = db.query(Appointment).filter(
            Appointment.status == AppointmentStatus.completed
        ).count()
        return {"completed_appointments": completed_appointments}
    except Exception as e:
        print(f"Error getting appointments stats (public): {str(e)}")
        return {"completed_appointments": 0}


@router.get("/public/service-popularity")
async def get_public_service_popularity(db: Session = Depends(get_db)):
    """
    Popularidad pública por servicio (sin PII).
    Retorna conteos agregados para que el frontend pueda mostrar "servicios más populares".
    """
    try:
        # Contar citas por nombre de servicio
        appts = db.query(Appointment.service_name).all()
        counts = {}
        for (service_name,) in appts:
            if not service_name:
                continue
            counts[service_name] = counts.get(service_name, 0) + 1

        # Ordenar desc
        items = [{"service": k, "count": v} for k, v in counts.items()]
        items.sort(key=lambda x: x["count"], reverse=True)
        return {"items": items}
    except Exception as e:
        print(f"Error getting service popularity (public): {str(e)}")
        return {"items": []}


@router.get("/admin/metrics")
async def get_admin_metrics(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Métricas batch para panel admin (sin tiempo real).
    - uso por servicio
    - conteo por estado
    - tiempo de respuesta aproximado (updated_at - created_at) cuando exista
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")

    q = db.query(Appointment)
    try:
        if from_date:
            fd = datetime.fromisoformat(from_date).date()
            q = q.filter(Appointment.appointment_date >= fd)
        if to_date:
            td = datetime.fromisoformat(to_date).date()
            q = q.filter(Appointment.appointment_date <= td)
    except Exception:
        raise HTTPException(status_code=422, detail="Formato de fecha inválido. Usa YYYY-MM-DD.")

    appts = q.all()

    by_status = {}
    by_service = {}
    response_minutes = []

    for a in appts:
        status_val = a.status.value if hasattr(a.status, "value") else a.status
        by_status[status_val] = by_status.get(status_val, 0) + 1

        if a.service_name:
            by_service[a.service_name] = by_service.get(a.service_name, 0) + 1

        if a.updated_at and a.created_at:
            delta = a.updated_at - a.created_at
            mins = max(delta.total_seconds() / 60.0, 0)
            response_minutes.append(mins)

    avg_response = (sum(response_minutes) / len(response_minutes)) if response_minutes else None

    # Percentiles (p50, p95) para dar más contexto que solo el promedio.
    p50 = None
    p95 = None
    if response_minutes:
        sorted_vals = sorted(response_minutes)
        n = len(sorted_vals)
        # índices 0-based
        p50 = sorted_vals[int(round(0.50 * (n - 1)))]
        p95 = sorted_vals[int(round(0.95 * (n - 1)))]

    return {
        "total": len(appts),
        "by_status": by_status,
        "by_service": by_service,
        "avg_response_minutes": avg_response,
        "p50_response_minutes": p50,
        "p95_response_minutes": p95,
    }

@router.get("/debug/pet-communication")
async def debug_pet_communication():
    """Endpoint de diagnóstico para verificar comunicación con pets-service"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Verificar si pets-service está respondiendo (dev port 3022)
            response = await client.get("http://pets-service:3022/health")
            health_status = response.status_code == 200
            health_data = response.json() if health_status else None
            
            # Intentar obtener todas las mascotas
            pets_response = await client.get("http://pets-service:3022/pets/debug/all-pets")
            all_pets = pets_response.json() if pets_response.status_code == 200 else []
            
            return {
                "pets_service_healthy": health_status,
                "pets_service_health": health_data,
                "total_pets_in_db": len(all_pets),
                "pets_sample": all_pets[:5] if all_pets else []
            }
    except Exception as e:
        return {
            "error": str(e),
            "pets_service_healthy": False
        }

@router.get("/debug/appointments-data")
async def debug_appointments_data(db: Session = Depends(get_db)):
    """Endpoint de diagnóstico para ver los datos de citas en la base de datos"""
    try:
        all_appointments = db.query(Appointment).all()
        return [
            {
                "id": appt.id,
                "client_email": appt.client_email,
                "pet_id": appt.pet_id,
                "service_name": appt.service_name,
                "status": appt.status,
                "price": float(appt.price) if appt.price else None,
                "groomer_email": appt.groomer_email,
                "appointment_date": str(appt.appointment_date),
            }
            for appt in all_appointments
        ]
    except Exception as e:
        return {"error": str(e)}

@router.post("/debug/fix-service-names")
async def fix_service_names(db: Session = Depends(get_db)):
    """Endpoint para corregir nombres de servicio incorrectos en la base de datos"""
    try:
        # Mapeo de servicios incorrectos a correctos
        SERVICE_NAME_MAPPING = {
            "cds": "Paseo Premium",
        }
        
        # Obtener todas las citas con servicio "cds"
        appointments_to_fix = db.query(Appointment).filter(
            Appointment.service_name == "cds"
        ).all()
        
        print(f"[DEBUG] Found {len(appointments_to_fix)} appointments with service_name='cds'")
        
        # Actualizar cada cita
        updated_count = 0
        for appt in appointments_to_fix:
            old_service = appt.service_name
            appt.service_name = SERVICE_NAME_MAPPING.get(old_service, old_service)
            print(f"[DEBUG] Updated appointment {appt.id}: {old_service} -> {appt.service_name}")
            updated_count += 1
        
        db.commit()
        return {
            "message": f"Successfully updated {updated_count} appointments",
            "updated_count": updated_count
        }
        
    except Exception as e:
        print(f"[ERROR] Error fixing service names: {e}")
        db.rollback()
        return {"error": str(e)}

@router.get("/debug/test-pet-details/{pet_id}")
async def test_pet_details(pet_id: int):
    """Endpoint de diagnóstico para probar la función _get_pet_details"""
    pet_details = await _get_pet_details(pet_id)
    return {
        "pet_id": pet_id,
        "pet_details": pet_details,
        "success": pet_details is not None
    }

@router.post("/debug/seed-sample-data")
async def seed_sample_data(db: Session = Depends(get_db)):
    """Endpoint para agregar datos de muestra a la base de datos"""
    try:
        from datetime import datetime, date as date_type, time as time_type
        
        # Verificar si ya hay datos
        existing_appointments = db.query(Appointment).count()
        if existing_appointments > 0:
            return {"message": "Sample data already exists", "total_appointments": existing_appointments}
        
        # Crear citas de muestra
        sample_appointments = [
            Appointment(
                client_email="cliente@gmail.com",
                pet_id=1,
                service_name="Paseo Premium",
                appointment_date=datetime.combine(date_type.fromisoformat("2026-05-28"), time_type.fromisoformat("10:00")),
                appointment_time=datetime.combine(date_type.fromisoformat("2026-05-28"), time_type.fromisoformat("10:00")),
                notes="Cita de prueba",
                status=AppointmentStatus.completed,
                price=35.00,
                groomer_email="groomer@gmail.com"
            ),
            Appointment(
                client_email="cliente@gmail.com",
                pet_id=1,
                service_name="Paseo Premium",
                appointment_date=datetime.combine(date_type.fromisoformat("2026-05-28"), time_type.fromisoformat("11:00")),
                appointment_time=datetime.combine(date_type.fromisoformat("2026-05-28"), time_type.fromisoformat("11:00")),
                notes="Cita de prueba 2",
                status=AppointmentStatus.completed,
                price=35.00,
                groomer_email="groomer@gmail.com"
            ),
            Appointment(
                client_email="cliente@gmail.com",
                pet_id=1,
                service_name="Paseo Premium",
                appointment_date=datetime.combine(date_type.fromisoformat("2026-05-28"), time_type.fromisoformat("12:00")),
                appointment_time=datetime.combine(date_type.fromisoformat("2026-05-28"), time_type.fromisoformat("12:00")),
                notes="Cita de prueba 3",
                status=AppointmentStatus.completed,
                price=35.00,
                groomer_email="groomer@gmail.com"
            ),
            Appointment(
                client_email="cliente@gmail.com",
                pet_id=1,
                service_name="Paseo Premium",
                appointment_date=datetime.combine(date_type.fromisoformat("2026-05-28"), time_type.fromisoformat("13:00")),
                appointment_time=datetime.combine(date_type.fromisoformat("2026-05-28"), time_type.fromisoformat("13:00")),
                notes="Cita de prueba 4",
                status=AppointmentStatus.completed,
                price=35.00,
                groomer_email="groomer@gmail.com"
            ),
            Appointment(
                client_email="cliente@gmail.com",
                pet_id=1,
                service_name="Paseo Premium",
                appointment_date=datetime.combine(date_type.fromisoformat("2026-05-28"), time_type.fromisoformat("14:00")),
                appointment_time=datetime.combine(date_type.fromisoformat("2026-05-28"), time_type.fromisoformat("14:00")),
                notes="Cita de prueba 5",
                status=AppointmentStatus.completed,
                price=35.00,
                groomer_email="groomer@gmail.com"
            ),
            Appointment(
                client_email="cliente@gmail.com",
                pet_id=1,
                service_name="Paseo Premium",
                appointment_date=datetime.combine(date_type.fromisoformat("2026-05-28"), time_type.fromisoformat("15:00")),
                appointment_time=datetime.combine(date_type.fromisoformat("2026-05-28"), time_type.fromisoformat("15:00")),
                notes="Cita de prueba 6",
                status=AppointmentStatus.completed,
                price=35.00,
                groomer_email="groomer@gmail.com"
            ),
        ]
        
        for appt in sample_appointments:
            db.add(appt)
        
        db.commit()
        
        return {
            "message": "Sample data added successfully",
            "total_appointments": len(sample_appointments),
            "service_name": "Paseo Premium",
            "total_revenue": 35.00 * len(sample_appointments)
        }
    except Exception as e:
        print(f"[ERROR] Error seeding sample data: {e}")
        db.rollback()
        return {"error": str(e)}

@router.get("/debug/groomer-data/{groomer_email}")
async def debug_groomer_data(groomer_email: str, db: Session = Depends(get_db)):
    """Endpoint de diagnóstico para simular el groomer endpoint sin autenticación"""
    try:
        groomer_appointments = db.query(Appointment).filter(Appointment.groomer_email == groomer_email).all()
        print(f"[DEBUG] Found {len(groomer_appointments)} appointments for groomer {groomer_email}")
        
        # Obtener datos adicionales para cada cita
        appointments_with_details = []
        for appt in groomer_appointments:
            # Obtener datos de la mascota
            pet_details = await _get_pet_details(appt.pet_id)
            print(f"[DEBUG] Pet details for pet_id {appt.pet_id}: {pet_details}")
            
            # Obtener nombre del cliente
            client_name = await _get_client_name(appt.client_email)
            print(f"[DEBUG] Client name for {appt.client_email}: {client_name}")
            
            appointment_dict = {
                "id": appt.id,
                "client_email": appt.client_email,
                "pet_id": appt.pet_id,
                "service": appt.service_name,
                "date": appt.appointment_date.isoformat() if hasattr(appt.appointment_date, 'isoformat') else str(appt.appointment_date),
                "time": appt.appointment_time.isoformat() if hasattr(appt.appointment_time, 'isoformat') else str(appt.appointment_time),
                "notes": appt.notes,
                "status": appt.status,
                "price": float(appt.price) if appt.price else None,
                "groomer_email": appt.groomer_email,
                "created_at": appt.created_at,
                "updated_at": appt.updated_at,
            }
            
            # Agregar datos adicionales
            if pet_details:
                appointment_dict["pet_name"] = pet_details.get("name", f"Pet #{appt.pet_id}")
                appointment_dict["pet_breed"] = pet_details.get("breed", "N/A")
                appointment_dict["pet_weight"] = pet_details.get("weight", "N/A")
                appointment_dict["pet_photo_url"] = pet_details.get("photo_url", "")
            else:
                appointment_dict["pet_name"] = f"Pet #{appt.pet_id}"
                appointment_dict["pet_breed"] = "N/A"
                appointment_dict["pet_weight"] = "N/A"
                appointment_dict["pet_photo_url"] = ""
            
            appointment_dict["client_name"] = client_name or appt.client_email
            
            appointments_with_details.append(appointment_dict)
        
        return appointments_with_details
    except Exception as e:
        print(f"Error getting groomer data: {str(e)}")
        return {"error": str(e)}

@router.get("/groomer", response_model=List[AppointmentOut])
async def get_groomer_appointments(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Obtener las citas asignadas al groomer actual con datos de mascota y cliente"""
    try:
        groomer_appointments = db.query(Appointment).filter(Appointment.groomer_email == current_user["email"]).all()
        print(f"[DEBUG] Found {len(groomer_appointments)} appointments for groomer {current_user['email']}")
        
        pet_cache = {}
        client_cache = {}
        enriched = []
        for appt in groomer_appointments:
            enriched.append(await _enrich_appointment(appt, pet_cache, client_cache))
        return enriched
    except Exception as e:
        print(f"Error getting groomer appointments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Hubo un error al cargar tus citas. Por favor, intenta nuevamente más tarde."
        )

@router.get("/", response_model=List[AppointmentOut])
async def get_my_appointments(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        user_appointments = db.query(Appointment).filter(Appointment.client_email == current_user["email"]).all()
        pet_cache = {}
        client_cache = {}
        enriched = []
        for appt in user_appointments:
            enriched.append(await _enrich_appointment(appt, pet_cache, client_cache))
        return enriched
    except Exception as e:
        print(f"Error getting appointments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Hubo un error al cargar tus citas. Por favor, intenta nuevamente más tarde."
        )

@router.get("/{appointment_id}", response_model=AppointmentOut)
async def get_appointment(
    appointment_id: int, 
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt or appt.client_email != current_user["email"]:
        raise HTTPException(status_code=404, detail="No encontramos la cita que buscas. Verifica que el ID sea correcto.")
    return AppointmentOut(
        id=appt.id,
        client_email=appt.client_email,
        pet_id=appt.pet_id,
        service=appt.service_name,
        date=appt.appointment_date.isoformat() if hasattr(appt.appointment_date, 'isoformat') else str(appt.appointment_date),
        time=appt.appointment_time.isoformat() if hasattr(appt.appointment_time, 'isoformat') else str(appt.appointment_time),
        notes=appt.notes,
        status=appt.status,
        price=float(appt.price) if appt.price else None,
        groomer_email=appt.groomer_email,
        created_at=appt.created_at,
        updated_at=appt.updated_at,
    )

@router.put("/{appointment_id}", response_model=AppointmentOut)
async def update_appointment(
    appointment_id: int, 
    update_data: AppointmentUpdate, 
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    # Permitir que tanto el cliente como el groomer actualicen la cita
    if not appt or (appt.client_email != current_user["email"] and appt.groomer_email != current_user["email"]):
        raise HTTPException(status_code=404, detail="No encontramos la cita que buscas. Verifica que el ID sea correcto.")

    old_status = appt.status
    
    if update_data.date is not None:
        appt.appointment_date = datetime.combine(date_type.fromisoformat(update_data.date), appt.appointment_time.time())
    if update_data.time is not None:
        appt.appointment_time = datetime.combine(appt.appointment_date.date(), time_type.fromisoformat(update_data.time))
    if update_data.notes is not None:
        appt.notes = update_data.notes
    if update_data.status is not None:
        appt.status = update_data.status

    db.commit()
    db.refresh(appt)

    # Enviar notificación según cambio de estado (integración servicios)
    new_status = appt.status
    if new_status != old_status:
        if new_status == AppointmentStatus.confirmed:
            await _send_notification(
                user_email=appt.client_email,
                notif_type="appointment_confirmed",
                title="Cita confirmada",
                message=f"¡Buenas noticias! Tu cita para '{appt.service_name}' el {appt.appointment_date.isoformat() if hasattr(appt.appointment_date, 'isoformat') else str(appt.appointment_date)} a las {appt.appointment_time.isoformat() if hasattr(appt.appointment_time, 'isoformat') else str(appt.appointment_time)} ha sido confirmada."
            )
        elif new_status == AppointmentStatus.cancelled:
            # Si se cancela la cita, cancelamos la factura asociada (si existe).
            try:
                inv = db.query(Invoice).filter(Invoice.appointment_id == appt.id).first()
                if inv and inv.status != InvoiceStatusEnum.paid:
                    inv.status = InvoiceStatusEnum.cancelled
                    inv.cancelled_at = datetime.utcnow()
                    db.commit()
            except Exception as e:
                print(f"[Billing] Error cancelando factura de cita #{appt.id}: {e}")
            await _send_notification(
                user_email=appt.client_email,
                notif_type="appointment_cancelled",
                title="Cita cancelada",
                message=f"Tu cita para '{appt.service_name}' el {appt.appointment_date.isoformat() if hasattr(appt.appointment_date, 'isoformat') else str(appt.appointment_date)} a las {appt.appointment_time.isoformat() if hasattr(appt.appointment_time, 'isoformat') else str(appt.appointment_time)} ha sido cancelada."
            )

    return AppointmentOut(
        id=appt.id,
        client_email=appt.client_email,
        pet_id=appt.pet_id,
        service=appt.service_name,
        date=appt.appointment_date.isoformat() if hasattr(appt.appointment_date, 'isoformat') else str(appt.appointment_date),
        time=appt.appointment_time.isoformat() if hasattr(appt.appointment_time, 'isoformat') else str(appt.appointment_time),
        notes=appt.notes,
        status=appt.status,
        price=float(appt.price) if appt.price else None,
        groomer_email=appt.groomer_email,
        created_at=appt.created_at,
        updated_at=appt.updated_at,
    )

@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_appointment(
    appointment_id: int, 
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt or appt.client_email != current_user["email"]:
        raise HTTPException(status_code=404, detail="No encontramos la cita que buscas. Verifica que el ID sea correcto.")

    appt.status = AppointmentStatus.cancelled
    db.commit()

    # Cancelar factura asociada si no está pagada
    try:
        inv = db.query(Invoice).filter(Invoice.appointment_id == appt.id).first()
        if inv and inv.status != InvoiceStatusEnum.paid:
            inv.status = InvoiceStatusEnum.cancelled
            inv.cancelled_at = datetime.utcnow()
            db.commit()
    except Exception as e:
        print(f"[Billing] Error cancelando factura de cita #{appt.id}: {e}")

    # Notificación de cancelación
    await _send_notification(
        user_email=appt.client_email,
        notif_type="appointment_cancelled",
        title="Cita cancelada",
        message=f"Tu cita para '{appt.service_name}' el {appt.appointment_date.isoformat() if hasattr(appt.appointment_date, 'isoformat') else str(appt.appointment_date)} a las {appt.appointment_time.isoformat() if hasattr(appt.appointment_time, 'isoformat') else str(appt.appointment_time)} ha sido cancelada."
    )

    return None
