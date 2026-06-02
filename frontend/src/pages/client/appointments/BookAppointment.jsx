import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyPets } from '../../../api/pets';
import { createAppointment } from '../../../api/appointments';
import { getGroomersByService, getAllGroomers } from '../../../api/groomer';
import { getAllServices } from '../../../api/servicesCatalog';
import { useToast } from '../../../components/Context/ToastContext';

const BookAppointment = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(false);
  const [pets, setPets] = useState([]);
  const [petsLoading, setPetsLoading] = useState(true);
  const [groomers, setGroomers] = useState([]);
  const [groomersLoading, setGroomersLoading] = useState(false);
  const [servicesList, setServicesList] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  const [formData, setFormData] = useState({
    petId: '',
    service: '',
    date: '',
    time: '',
    notes: '',
    groomerEmail: '',
  });

  // Cargar mascotas reales del pets-service
  useEffect(() => {
    const loadPets = async () => {
      try {
        const data = await getMyPets();
        setPets(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, petId: data[0].id }));
        }
      } catch (err) {
        console.error('Error cargando mascotas:', err);
        setPets([]);
      } finally {
        setPetsLoading(false);
      }
    };
    loadPets();
  }, []);

  // Cargar servicios reales del services-catalog-service
  useEffect(() => {
    const loadServices = async () => {
      try {
        const data = await getAllServices();
        const activeServices = data.filter(s => s.is_active);
        setServicesList(activeServices);
        if (activeServices.length > 0) {
          setFormData(prev => ({ ...prev, service: activeServices[0].name }));
        }
      } catch (err) {
        console.error('Error cargando servicios:', err);
        setServicesList([]);
      } finally {
        setServicesLoading(false);
      }
    };
    loadServices();
  }, []);

  // Cargar todos los groomers activos
  useEffect(() => {
    const loadGroomers = async () => {
      setGroomersLoading(true);
      try {
        // Primero intentar cargar groomers por servicio
        let data = [];
        if (formData.service) {
          try {
            data = await getGroomersByService(formData.service);
          } catch (err) {
            console.log('No se encontraron groomers por servicio, cargando todos...');
          }
        }
        
        // Si no hay groomers por servicio o no hay servicio seleccionado, cargar todos
        if (data.length === 0) {
          data = await getAllGroomers();
        }
        
        // Filtrar solo groomers activos
        const activeGroomers = data.filter(g => g.is_active !== false);
        setGroomers(activeGroomers);
      } catch (err) {
        console.error('Error cargando groomers:', err);
        setGroomers([]);
      } finally {
        setGroomersLoading(false);
      }
    };
    loadGroomers();
  }, [formData.service]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateDateTime = () => {
    if (!formData.date || !formData.time) return true;

    const selectedDate = new Date(`${formData.date}T${formData.time}`);
    const now = new Date();

    if (selectedDate < now) {
      showError('No puedes seleccionar una fecha y hora que ya pasaron.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateDateTime()) {
      return;
    }
    
    setLoading(true);

    try {
      await createAppointment({
        pet_id: parseInt(formData.petId),
        service: formData.service,
        date: formData.date,
        time: formData.time,
        notes: formData.notes || null,
        groomer_email: formData.groomerEmail || null,
      });

      showSuccess('¡Cita agendada con éxito! Se generó una factura (pago presencial en efectivo).');
      navigate('/client/appointments');
    } catch (error) {
      showError(error.message || 'Error al agendar la cita');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="book-appointment">
      <h1>Agendar Nueva Cita</h1>

      <form onSubmit={handleSubmit} className="register-pet">
        <div className="form-group">
          <label>Mascota *</label>
            <select 
              name="petId" 
              value={formData.petId} 
              onChange={handleChange} 
              required
              disabled={petsLoading}
            >
              <option value="">Selecciona una mascota</option>
              {pets.map(pet => (
                <option key={pet.id} value={pet.id}>{pet.name}</option>
              ))}
            </select>
        </div>

        <div className="form-group">
          <label>Tipo de servicio *</label>
          <select 
            name="service" 
            value={formData.service} 
            onChange={handleChange} 
            required
            disabled={servicesLoading}
          >
            <option value="">Selecciona un servicio</option>
            {servicesList.map(s => (
              <option key={s.id} value={s.name}>{s.name} - ${s.base_price || s.price}</option>
            ))}
          </select>
          {formData.service && servicesList.find(s => s.name === formData.service) && (
            <div className="service-info" style={{
              marginTop: '10px',
              padding: '12px',
              background: 'var(--bg-card, #f5f5f5)',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #e5e7eb)'
            }}>
              <strong>{servicesList.find(s => s.name === formData.service)?.name}</strong>
              <p style={{ margin: '5px 0', fontSize: '14px', color: 'var(--text-secondary, #666)' }}>
                {servicesList.find(s => s.name === formData.service)?.description || 'Sin descripción'}
              </p>
              <p style={{ margin: '0', fontSize: '16px', fontWeight: '700', color: 'var(--primary, #d96c5f)' }}>
                Precio: ${servicesList.find(s => s.name === formData.service)?.base_price || servicesList.find(s => s.name === formData.service)?.price}
              </p>
            </div>
          )}
          {servicesLoading && <small style={{ color: '#666' }}>Cargando servicios...</small>}
          {!servicesLoading && servicesList.length === 0 && (
            <small style={{ color: '#d96c5f' }}>No hay servicios disponibles. Contacta al administrador.</small>
          )}
        </div>

        <div className="form-group">
          <label>Groomer (Opcional)</label>
          <select 
            name="groomerEmail" 
            value={formData.groomerEmail} 
            onChange={handleChange}
            disabled={groomersLoading}
          >
            <option value="">Asignar automáticamente</option>
            {groomers.map(groomer => (
              <option key={groomer.id} value={groomer.email}>
                {groomer.full_name} - ⭐ {groomer.rating > 0 ? groomer.rating : 'Sin calificar'}
              </option>
            ))}
          </select>
          {groomersLoading && <small style={{ color: '#666' }}>Cargando groomers disponibles...</small>}
          {!groomersLoading && groomers.length === 0 && formData.service && (
            <small style={{ color: '#d96c5f' }}>No hay groomers disponibles para este servicio. Se asignará uno automáticamente.</small>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Fecha *</label>
            <input 
              type="date" 
              name="date" 
              value={formData.date} 
              onChange={handleChange} 
              required 
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group">
            <label>Hora *</label>
            <input 
              type="time" 
              name="time" 
              value={formData.time} 
              onChange={handleChange} 
              required 
            />
          </div>
        </div>

        <div className="form-group">
          <label>Notas adicionales</label>
          <textarea 
            name="notes" 
            value={formData.notes} 
            onChange={handleChange} 
            placeholder="Instrucciones especiales para el paseador..."
            rows="3"
          />
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={() => navigate('/client/appointments')}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
          >
            {loading ? 'Agendando...' : 'Confirmar Cita'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookAppointment;
