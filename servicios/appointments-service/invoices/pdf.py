from __future__ import annotations

from io import BytesIO
from typing import Dict, Any

import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas


def build_invoice_pdf(payload: Dict[str, Any]) -> bytes:
    """
    Genera un PDF simple (sin pasarelas de pago) con los datos visibles para el cliente.
    """
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    width, height = letter

    x = 0.8 * inch
    y = height - 0.9 * inch

    # Logo (opcional): intenta usar el logo del frontend si existe.
    # En dev, el cwd suele ser `servicios/appointments-service`, por eso el path relativo.
    logo_path_candidates = [
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "frontend", "public", "logo192.png"),
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "frontend", "public", "logo512.png"),
    ]
    logo_path = next((p for p in logo_path_candidates if os.path.exists(os.path.abspath(p))), None)
    if logo_path:
        try:
            c.drawImage(os.path.abspath(logo_path), x, y - 0.15 * inch, width=0.6 * inch, height=0.6 * inch, mask='auto')
        except Exception:
            # Si falla el logo, seguimos sin bloquear la factura.
            pass

    c.setFont("Helvetica-Bold", 18)
    c.drawString(x + (0.75 * inch if logo_path else 0), y, "PASEOS FELICES")
    y -= 0.35 * inch

    c.setFont("Helvetica", 12)
    c.drawString(x, y, f"Factura #{payload['invoice_number']}")
    y -= 0.25 * inch
    c.drawString(x, y, f"Fecha de emisión: {payload.get('issued_at', '')}")
    y -= 0.35 * inch

    c.setFont("Helvetica-Bold", 12)
    c.drawString(x, y, "Cliente:")
    c.setFont("Helvetica", 12)
    c.drawString(x + 1.2 * inch, y, payload.get("client_name") or payload.get("client_email", ""))
    y -= 0.22 * inch

    c.setFont("Helvetica-Bold", 12)
    c.drawString(x, y, "Mascota:")
    c.setFont("Helvetica", 12)
    c.drawString(x + 1.2 * inch, y, payload.get("pet_name") or f"Pet #{payload.get('pet_id')}")
    y -= 0.22 * inch

    c.setFont("Helvetica-Bold", 12)
    c.drawString(x, y, "Groomer:")
    c.setFont("Helvetica", 12)
    c.drawString(x + 1.2 * inch, y, payload.get("groomer_name") or (payload.get("groomer_email") or "Sin asignar"))
    y -= 0.35 * inch

    c.setFont("Helvetica-Bold", 12)
    c.drawString(x, y, "Servicio")
    c.drawString(x + 4.5 * inch, y, "Precio")
    y -= 0.18 * inch
    c.line(x, y, width - x, y)
    y -= 0.22 * inch

    c.setFont("Helvetica", 12)
    c.drawString(x, y, payload.get("service_name", ""))
    c.drawRightString(width - x, y, f"$ {payload.get('total', 0):.2f}")
    y -= 0.4 * inch

    c.setFont("Helvetica-Bold", 14)
    c.drawRightString(width - x, y, f"TOTAL A PAGAR: $ {payload.get('total', 0):.2f}")
    y -= 0.35 * inch

    c.setFont("Helvetica-Bold", 12)
    c.drawString(x, y, f"Estado: {payload.get('status', '')}")
    y -= 0.45 * inch

    c.setFont("Helvetica", 11)
    c.drawString(x, y, "Método de pago:")
    y -= 0.18 * inch
    c.drawString(x, y, "El pago de esta factura se realiza de forma presencial y en efectivo.")
    y -= 0.35 * inch

    c.setFont("Helvetica", 10)
    c.drawString(x, y, "Contacto: Paseos Felices")

    c.showPage()
    c.save()

    return buf.getvalue()
