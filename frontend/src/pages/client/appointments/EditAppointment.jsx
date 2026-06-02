import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAppointment, updateAppointment } from '../../../api/appointments';
import { getMyPets } from '../../../api/pets';
import { getAllServices } from '../../../api/servicesCatalog';
import { useToast } from '../../../components/Context/ToastContext';

const EditAppointment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(false);
  const [pets, setPets] = useState([]);
  const [services, setServices] = useState([]);

  const [formData, setFormData] = useState({
    petId: '',
    service: '',
    date: '',
    time: '',
    notes: '',
  });

  // Cargar datos de la cita, las mascotas y los servicios
  useEffect(() => {
    const loadData = async () => {
      try {
        const [appt, userPets, catalogServices] = await Promise.all([
          getAppointment(parseInt(id)),
          getMyPets(),
          getAllServices()
        ]);
        
        setFormData({
          petId: appt.pet_id.toString(),
          service: appt.service,
          date: appt.date,
          time: appt.time,
          notes: appt.notes || '',
        });
        setPets(userPets);
        setServices(catalogServices);
      } catch (err) {
        showError(err.message || 'Error al cargar la cita');
        navigate('/client/appointments');
      }
    };
    loadData();
  }, [id, navigate, showError]);

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
      await updateAppointment(parseInt(id), {
        pet_id: parseInt(formData.petId),
        service: formData.service,
        date: formData.date,
        time: formData.time,
        notes: formData.notes || null,
      });

      showSuccess('Cita actualizada correctamente');
      navigate('/client/appointments');
    } catch (error) {
      showError(error.message || 'Error al actualizar la cita');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="book-appointment">
      <h1>Editar Cita</h1>

      <form onSubmit={handleSubmit} className="register-pet">
        <div className="form-group">
          <label>Mascota</label>
          <select name="petId" value={formData.petId} onChange={handleChange} required>
            {pets.map(pet => (
              <option key={pet.id} value={pet.id}>{pet.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Servicio</label>
          <select name="service" value={formData.service} onChange={handleChange} required>
            {services.map(s => (
              <option key={s.id} value={s.name}>{s.name} - ${s.base_price}</option>
            ))}
          </select>
          {formData.service && (
            <div className="service-info" style={{
              marginTop: '10px',
              padding: '12px',
              background: 'var(--bg-card, #f5f5f5)',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #e5e7eb)'
            }}>
              <strong>{services.find(s => s.name === formData.service)?.name}</strong>
              <p style={{ margin: '5px 0', fontSize: '14px', color: 'var(--text-secondary, #666)' }}>
                {services.find(s => s.name === formData.service)?.description || 'Sin descripción'}
              </p>
              <p style={{ margin: '0', fontSize: '16px', fontWeight: '700', color: 'var(--primary, #d96c5f)' }}>
                Precio: ${services.find(s => s.name === formData.service)?.base_price}
              </p>
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Fecha</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} required min={new Date().toISOString().split('T')[0]} />
          </div>
          <div className="form-group">
            <label>Hora</label>
            <input type="time" name="time" value={formData.time} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group">
          <label>Notas</label>
          <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" />
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/client/appointments')}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditAppointment;
