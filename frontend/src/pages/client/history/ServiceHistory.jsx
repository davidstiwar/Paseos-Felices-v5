import React, { useState, useEffect, useCallback } from 'react';
import { getMyAppointments } from '../../../api/appointments';
import { getMyPets } from '../../../api/pets';
import { getUserByEmail } from '../../../api/auth';
import { getGroomerByEmail } from '../../../api/groomer';
import { createReview, getMyReviews, getReviewByAppointment, updateReview } from '../../../api/reviews';
import { useToast } from '../../../components/Context/ToastContext';

const ServiceHistory = () => {
  const { showError, showSuccess } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [pets, setPets] = useState([]);
  const [groomerNames, setGroomerNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [myReviewsByAppointment, setMyReviewsByAppointment] = useState({});
  const [reviewModal, setReviewModal] = useState({ open: false, appt: null, rating: 5, comment: '' });

  const loadData = useCallback(async () => {
    try {
      const [appointmentsData, petsData, myReviews] = await Promise.all([
        getMyAppointments(),
        getMyPets(),
        getMyReviews().catch(() => []),
      ]);
      
      // Filtrar solo citas completadas o canceladas
      const completedAppointments = appointmentsData.filter(appt => 
        appt.status === 'completed' || appt.status === 'cancelled'
      );
      setAppointments(completedAppointments);
      setPets(petsData);

      const reviewsMap = {};
      (myReviews || []).forEach(r => {
        if (r.appointment_id != null) reviewsMap[r.appointment_id] = r;
      });
      setMyReviewsByAppointment(reviewsMap);

      // Obtener nombres de groomers
      const groomerEmails = [...new Set(completedAppointments.map(appt => appt.groomer_email).filter(Boolean))];
      const names = {};
      
      for (const email of groomerEmails) {
        try {
          const user = await getUserByEmail(email);
          names[email] = user.nombre_completo || email;
        } catch (err) {
          names[email] = email;
        }
      }
      setGroomerNames(names);
    } catch (err) {
      console.error(err);
      showError(err.message || 'Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#22c55e';
      case 'completed': return '#3b82f6';
      case 'cancelled': return '#ef4444';
      default: return '#f59e0b'; // pending
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const renderStars = (rating) => {
    if (!rating) return 'Sin calificar';
    return '⭐'.repeat(rating);
  };

  const openReview = (appt) => {
    const existing = myReviewsByAppointment[appt.id];
    setReviewModal({
      open: true,
      appt,
      rating: existing?.rating ?? 5,
      comment: existing?.comment ?? '',
    });
  };

  const submitReview = async () => {
    const appt = reviewModal.appt;
    if (!appt?.groomer_email) {
      showError('Esta cita no tiene groomer asignado.');
      return;
    }

    try {
      const groomer = await getGroomerByEmail(appt.groomer_email);
      if (!groomer?.id) {
        showError('No encontramos el perfil del groomer para poder reseñarlo.');
        return;
      }

      const existing = myReviewsByAppointment[appt.id];
      let saved;
      if (existing?.id) {
        saved = await updateReview(existing.id, { rating: reviewModal.rating, comment: reviewModal.comment });
      } else {
        try {
          saved = await createReview({
            groomer_id: groomer.id,
            appointment_id: appt.id,
            rating: reviewModal.rating,
            comment: reviewModal.comment,
          });
        } catch (e) {
          // Si ya existía una reseña para esta cita, recuperarla y actualizarla
          const msg = (e?.message || '').toLowerCase();
          if (e?.status === 400 && msg.includes('ya has dejado una reseña')) {
            const existingByAppt = await getReviewByAppointment(appt.id);
            if (existingByAppt?.id) {
              saved = await updateReview(existingByAppt.id, { rating: reviewModal.rating, comment: reviewModal.comment });
            } else {
              throw e;
            }
          } else {
            throw e;
          }
        }
      }

      setMyReviewsByAppointment(prev => ({ ...prev, [appt.id]: saved }));
      setReviewModal({ open: false, appt: null, rating: 5, comment: '' });
      showSuccess('Reseña guardada exitosamente.');
    } catch (err) {
      showError(err.message || 'No pudimos guardar la reseña.');
    }
  };

  if (loading) {
    return (
      <div className="service-history">
        <h1>📜 Historial de Servicios</h1>
        <p>Cargando historial...</p>
      </div>
    );
  }

  return (
    <div className="service-history">
      <h1>📜 Historial</h1>
      <p>Aquí verás tu historial de mascotas y citas</p>

      {/* Sección de Mascotas */}
      <div style={{ marginTop: '30px' }}>
        <h2>🐾 Mis Mascotas</h2>
        {pets.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            background: 'var(--bg-card, #f8f9fa)', 
            borderRadius: '12px',
            marginTop: '20px'
          }}>
            <p style={{ color: 'var(--text-secondary, #666)' }}>
              No tienes mascotas registradas aún.
            </p>
          </div>
        ) : (
          <table style={{ marginTop: '20px' }}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Especie</th>
                <th>Raza</th>
                <th>Edad</th>
                <th>Peso</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {pets.map((pet) => (
                <tr key={pet.id}>
                  <td>{pet.name}</td>
                  <td>{pet.species || '-'}</td>
                  <td>{pet.breed || '-'}</td>
                  <td>{pet.age || '-'}</td>
                  <td>{pet.weight ? `${pet.weight} kg` : '-'}</td>
                  <td>{pet.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Sección de Citas */}
      <div style={{ marginTop: '40px' }}>
        <h2>📅 Historial de Citas</h2>
        {appointments.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            background: 'var(--bg-card, #f8f9fa)', 
            borderRadius: '12px',
            marginTop: '20px'
          }}>
            <p style={{ color: 'var(--text-secondary, #666)' }}>
              No tienes citas en el historial aún.
            </p>
          </div>
        ) : (
          <table style={{ marginTop: '20px' }}>
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Fecha</th>
                <th>Groomer</th>
                <th>Precio</th>
                <th>Estado</th>
                <th>Notas</th>
                <th>Reseña</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => (
                <tr key={appt.id}>
                  <td>{appt.service}</td>
                  <td>{appt.date}</td>
                  <td>{groomerNames[appt.groomer_email] || appt.groomer_email || '-'}</td>
                  <td>${appt.price || '-'}</td>
                  <td>
                    <span style={{
                      background: getStatusColor(appt.status),
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {getStatusLabel(appt.status)}
                    </span>
                  </td>
                  <td>{appt.notes || '-'}</td>
                  <td>
                    {appt.status === 'completed' ? (
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span>{renderStars(myReviewsByAppointment[appt.id]?.rating)}</span>
                        <button
                          className="btn-secondary"
                          style={{ padding: '6px 10px' }}
                          onClick={() => openReview(appt)}
                        >
                          {myReviewsByAppointment[appt.id] ? 'Editar' : 'Reseñar'}
                        </button>
                      </div>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal reseña */}
      {reviewModal.open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setReviewModal({ open: false, appt: null, rating: 5, comment: '' })}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 12,
              padding: 20,
              width: 'min(520px, 92vw)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Reseñar groomer</h3>
            <p style={{ marginTop: 0, color: 'var(--text-secondary)' }}>
              Cita #{reviewModal.appt?.id} • {reviewModal.appt?.service}
            </p>

            <label style={{ display: 'block', fontWeight: 600, marginTop: 12 }}>Calificación (1-5)</label>
            <select
              value={reviewModal.rating}
              onChange={(e) => setReviewModal((p) => ({ ...p, rating: Number(e.target.value) }))}
              style={{
                width: '100%',
                padding: 10,
                borderRadius: 8,
                marginTop: 6,
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--input-border)',
              }}
            >
              <option value={5}>5 - Excelente</option>
              <option value={4}>4 - Muy bueno</option>
              <option value={3}>3 - Bueno</option>
              <option value={2}>2 - Regular</option>
              <option value={1}>1 - Malo</option>
            </select>

            <label style={{ display: 'block', fontWeight: 600, marginTop: 12 }}>Comentario (opcional)</label>
            <textarea
              value={reviewModal.comment}
              onChange={(e) => setReviewModal((p) => ({ ...p, comment: e.target.value }))}
              rows={4}
              style={{
                width: '100%',
                padding: 10,
                borderRadius: 8,
                marginTop: 6,
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--input-border)',
              }}
              placeholder="Cuéntanos cómo fue el servicio..."
            />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                className="btn-secondary"
                onClick={() => setReviewModal({ open: false, appt: null, rating: 5, comment: '' })}
              >
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={submitReview}>
                Guardar reseña
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceHistory;
