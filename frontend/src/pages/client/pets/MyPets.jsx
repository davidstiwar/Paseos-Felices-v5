import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyPets, deletePet } from '../../../api/pets';
import '../../../estilos/Auth.css';
import { useToast } from '../../../components/Context/ToastContext';
import ModalDialog from '../../../components/Common/ModalDialog';

const MyPets = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, petId: null, petName: '' });

  const loadPets = async () => {
    try {
      const data = await getMyPets();
      setPets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPets();
  }, []);

  const handleDelete = async (id, name) => {
    setDeleteConfirm({ isOpen: true, petId: id, petName: name });
  };

  const confirmDelete = async () => {
    const { petId } = deleteConfirm;
    try {
      await deletePet(petId);
      loadPets();
      showSuccess('Mascota eliminada exitosamente');
      setDeleteConfirm({ isOpen: false, petId: null, petName: '' });
    } catch (err) {
      showError(err.message || 'Error al eliminar la mascota');
      setDeleteConfirm({ isOpen: false, petId: null, petName: '' });
    }
  };

  return (
    <div className="my-pets" style={{ padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>🐾 Mis Mascotas</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Gestiona tus mascotas registradas</p>
        </div>
        <button 
          className="auth-button" 
          onClick={() => navigate('/client/pets/register')}
          style={{ width: 'auto', padding: '14px 24px' }}
        >
          + Registrar Mascota
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Cargando mascotas...</p>
      ) : pets.length === 0 ? (
        <div style={{ marginTop: '30px', textAlign: 'center', padding: '60px 20px', background: 'var(--bg-subtle)', borderRadius: '16px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '20px' }}>No tienes mascotas registradas aún.</p>
          <button 
            className="auth-button" 
            onClick={() => navigate('/client/pets/register')}
            style={{ width: 'auto', padding: '14px 24px' }}
          >
            Registrar mi primera mascota
          </button>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            background: '#fff',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md)'
          }} className="dark-table">
            <thead>
              <tr style={{ background: '#f8f9fa' }} className="dark-thead">
                <th style={{ 
                  padding: '16px', 
                  textAlign: 'left', 
                  borderBottom: '2px solid #e8e8e8',
                  color: '#111',
                  fontWeight: '700',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }} className="dark-th">Foto</th>
                <th style={{ 
                  padding: '16px', 
                  textAlign: 'left', 
                  borderBottom: '2px solid #e8e8e8',
                  color: '#111',
                  fontWeight: '700',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }} className="dark-th">Nombre</th>
                <th style={{ 
                  padding: '16px', 
                  textAlign: 'left', 
                  borderBottom: '2px solid #e8e8e8',
                  color: '#111',
                  fontWeight: '700',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }} className="dark-th">Raza</th>
                <th style={{ 
                  padding: '16px', 
                  textAlign: 'left', 
                  borderBottom: '2px solid #e8e8e8',
                  color: '#111',
                  fontWeight: '700',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }} className="dark-th">Edad</th>
                <th style={{ 
                  padding: '16px', 
                  textAlign: 'left', 
                  borderBottom: '2px solid #e8e8e8',
                  color: '#111',
                  fontWeight: '700',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }} className="dark-th">Peso</th>
                <th style={{ 
                  padding: '16px', 
                  textAlign: 'left', 
                  borderBottom: '2px solid #e8e8e8',
                  color: '#111',
                  fontWeight: '700',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }} className="dark-th">Descripción</th>
                <th style={{ 
                  padding: '16px', 
                  textAlign: 'left', 
                  borderBottom: '2px solid #e8e8e8',
                  color: '#111',
                  fontWeight: '700',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }} className="dark-th">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pets.map((pet, index) => (
                <tr key={pet.id} style={{ 
                  borderBottom: index < pets.length - 1 ? '1px solid #e8e8e8' : 'none',
                  transition: 'var(--transition-base)'
                }} className="dark-tr">
                  <td style={{ padding: '16px' }} className="dark-td">
                    <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                      {pet.photo_url ? (
                        <img 
                          src={pet.photo_url} 
                          alt={pet.name} 
                          style={{ 
                            width: '60px', 
                            height: '60px', 
                            objectFit: 'cover', 
                            borderRadius: '8px',
                            border: '2px solid #e8e8e8'
                          }} 
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div style={{ 
                        display: pet.photo_url ? 'none' : 'flex',
                        width: '60px', 
                        height: '60px', 
                        borderRadius: '8px',
                        background: '#f8f9fa',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#999',
                        fontSize: '24px',
                        position: 'absolute',
                        top: 0,
                        left: 0
                      }} className="dark-placeholder">🐾</div>
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: '#111', fontWeight: '600' }} className="dark-td-text">{pet.name}</td>
                  <td style={{ padding: '16px', color: '#666' }} className="dark-td-secondary">{pet.breed || 'No especificada'}</td>
                  <td style={{ padding: '16px', color: '#666' }} className="dark-td-secondary">{pet.age ? `${pet.age} años` : 'No especificada'}</td>
                  <td style={{ padding: '16px', color: '#666' }} className="dark-td-secondary">{pet.weight ? `${pet.weight} kg` : 'No especificado'}</td>
                  <td style={{ padding: '16px', color: '#666', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="dark-td-secondary">{pet.notes || 'Sin descripción'}</td>
                  <td style={{ padding: '16px' }} className="dark-td">
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="auth-button" 
                        onClick={() => navigate(`/client/pets/edit/${pet.id}`)}
                        style={{ 
                          width: 'auto', 
                          padding: '10px 16px',
                          fontSize: '13px',
                          height: 'auto'
                        }}
                      >
                        Editar
                      </button>
                      <button 
                        className="auth-button" 
                        onClick={() => handleDelete(pet.id, pet.name)}
                        style={{ 
                          width: 'auto', 
                          padding: '10px 16px',
                          fontSize: '13px',
                          height: 'auto',
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          boxShadow: '0 6px 20px rgba(239, 68, 68, 0.25)'
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <style>{`
            .dark .dark-table {
              background: #111 !important;
            }
            .dark .dark-thead {
              background: #1a1a1a !important;
            }
            .dark .dark-th {
              color: #fff !important;
              border-bottom-color: #333 !important;
            }
            .dark .dark-tr {
              border-bottom-color: #333 !important;
            }
            .dark .dark-td {
              background: #111 !important;
            }
            .dark .dark-td-text {
              color: #fff !important;
            }
            .dark .dark-td-secondary {
              color: #ccc !important;
            }
            .dark .dark-placeholder {
              background: #1a1a1a !important;
              color: #666 !important;
            }
          `}</style>
        </div>
      )}
      <ModalDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, petId: null, petName: '' })}
        title="Confirmar eliminación"
        actions={[
          { label: 'Cancelar', variant: 'secondary', onClick: () => setDeleteConfirm({ isOpen: false, petId: null, petName: '' }) },
          { label: 'Eliminar', variant: 'danger', onClick: confirmDelete }
        ]}
      >
        <p>¿Estás seguro de que deseas eliminar a {deleteConfirm.petName}? Esta acción no se puede deshacer.</p>
      </ModalDialog>
    </div>
  );
};

export default MyPets;
