import React, { useState, useEffect } from 'react';
import { getGroomerAppointments } from '../../../api/appointments';
import { getSafeImageUrl, handleImageError } from '../../../utils/imageUtils';
import '../../../estilos/components/StatCard.css';
import '../../../estilos/components/PetModal.css';

const GroomerPets = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBreed, setFilterBreed] = useState('todas');
  const [sortBy, setSortBy] = useState('name');
  const [selectedPet, setSelectedPet] = useState(null);

  const tableStyles = {
    petsTableContainer: {
      width: '100%',
      overflowX: 'auto',
      marginBottom: '24px'
    },
    petsTable: {
      width: '100%',
      borderCollapse: 'collapse',
      backgroundColor: 'var(--bg-main)',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)'
    },
    petsTableTh: {
      backgroundColor: 'var(--bg-hover)',
      padding: '12px',
      textAlign: 'left',
      fontWeight: 'bold',
      borderBottom: '2px solid var(--border-color)',
      color: 'var(--text-primary)'
    },
    petsTableTd: {
      padding: '12px',
      borderBottom: '1px solid var(--border-color)',
      color: 'var(--text-primary)'
    },
    petRow: {
      cursor: 'pointer',
      transition: 'backgroundColor 0.2s'
    },
    petRowHover: {
      backgroundColor: 'var(--bg-hover)'
    },
    tablePetImage: {
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      objectFit: 'cover'
    },
    tablePetPlaceholder: {
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      backgroundColor: 'var(--bg-hover)'
    },
    emptyState: {
      textAlign: 'center',
      padding: '24px',
      color: 'var(--text-tertiary)'
    }
  };

  // Cargar mascotas atendidas desde appointments-service
  useEffect(() => {
    const loadPets = async () => {
      try {
        const appointments = await getGroomerAppointments();
        
        // Validar que appointments es un array
        if (!Array.isArray(appointments)) {
          console.warn('Appointments no es un array:', appointments);
          setPets([]);
          setLoading(false);
          return;
        }
        
        // Agrupar mascotas por pet_id y contar servicios
        const petsMap = new Map();
        appointments.forEach(appt => {
          const petId = appt.pet_id;
          if (!petsMap.has(petId)) {
            petsMap.set(petId, {
              id: petId,
              name: appt.pet_name || `Pet #${petId}`,
              breed: appt.pet_breed || 'N/A',
              weight: appt.pet_weight || 'N/A',
              owner: appt.client_name || appt.client_email,
              totalServices: 0,
              lastService: appt.date || 'N/A',
              image: appt.pet_photo_url || '',
              age: 'N/A',
              notes: appt.notes || '',
            });
          }
          const pet = petsMap.get(petId);
          pet.totalServices += 1;
          // Actualizar último servicio si es más reciente
          if (appt.date && appt.date > pet.lastService) {
            pet.lastService = appt.date;
          }
        });
        
        const transformedPets = Array.from(petsMap.values());
        setPets(transformedPets);
      } catch (err) {
        console.error('Error cargando mascotas:', err);
        setPets([]);
      } finally {
        setLoading(false);
      }
    };
    loadPets();
  }, []);

  const breeds = ['todas', ...new Set(pets.map(p => p.breed))];

  const filteredPets = pets.filter(pet => {
    const matchesSearch = pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pet.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBreed = filterBreed === 'todas' || pet.breed === filterBreed;
    return matchesSearch && matchesBreed;
  });

  const sortedPets = [...filteredPets].sort((a, b) => {
    switch(sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'services':
        return b.totalServices - a.totalServices;
      case 'recent':
        return b.id - a.id;
      default:
        return 0;
    }
  });

  if (loading) {
    return <div className="groomer-pets"><p>Cargando mascotas...</p></div>;
  }

  return (
    <div className="groomer-pets">
      <div className="pets-header">
        <h1>🐾 Mascotas Atendidas</h1>
        <p>Historial completo de las mascotas que has atendido</p>
      </div>

      {/* Search and Filters */}
      <div className="search-filters">
        <div className="search-box">
          <input 
            type="text"
            placeholder="Buscar por nombre de mascota o dueño..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filters">
          <div className="filter-item">
            <label>Raza:</label>
            <select 
              value={filterBreed}
              onChange={(e) => setFilterBreed(e.target.value)}
              className="filter-select"
            >
              {breeds.map(breed => (
                <option key={breed} value={breed}>
                  {breed.charAt(0).toUpperCase() + breed.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>Ordenar por:</label>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="name">Nombre</option>
              <option value="services">Más servicios</option>
              <option value="recent">Más reciente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pets Table */}
      <div style={tableStyles.petsTableContainer}>
        <table style={tableStyles.petsTable}>
          <thead>
            <tr>
              <th style={tableStyles.petsTableTh}>Imagen</th>
              <th style={tableStyles.petsTableTh}>Nombre</th>
              <th style={tableStyles.petsTableTh}>Raza</th>
              <th style={tableStyles.petsTableTh}>Peso</th>
              <th style={tableStyles.petsTableTh}>Dueño</th>
              <th style={tableStyles.petsTableTh}>Último Servicio</th>
              <th style={tableStyles.petsTableTh}>Total Servicios</th>
            </tr>
          </thead>
          <tbody>
            {sortedPets.length > 0 ? (
              sortedPets.map(pet => (
                <tr 
                  key={pet.id}
                  style={tableStyles.petRow}
                  onClick={() => setSelectedPet(pet)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = tableStyles.petRowHover.backgroundColor}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                >
                  <td style={tableStyles.petsTableTd}>
                    {pet.image && getSafeImageUrl(pet.image) !== '🐾' ? (
                      <img 
                        src={getSafeImageUrl(pet.image)} 
                        alt={pet.name} 
                        style={tableStyles.tablePetImage}
                        onError={(e) => handleImageError(e, `groomer-pet-${pet.name}`)}
                      />
                    ) : (
                      <div style={tableStyles.tablePetPlaceholder}>🐾</div>
                    )}
                  </td>
                  <td style={tableStyles.petsTableTd}>{pet.name}</td>
                  <td style={tableStyles.petsTableTd}>{pet.breed}</td>
                  <td style={tableStyles.petsTableTd}>{pet.weight}</td>
                  <td style={tableStyles.petsTableTd}>{pet.owner}</td>
                  <td style={tableStyles.petsTableTd}>{pet.lastService}</td>
                  <td style={tableStyles.petsTableTd}>{pet.totalServices}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={tableStyles.emptyState}>
                  🔍 No se encontraron mascotas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Stats */}
      <div className="pets-stats">
        <div className="pets-stat">
          <span className="pets-stat-icon">🐾</span>
          <span className="pets-stat-label">Total de Mascotas</span>
          <span className="pets-stat-value">{pets.length}</span>
        </div>
        <div className="pets-stat">
          <span className="pets-stat-icon">📊</span>
          <span className="pets-stat-label">Servicios Realizados</span>
          <span className="pets-stat-value">{pets.reduce((sum, p) => sum + p.totalServices, 0)}</span>
        </div>
        <div className="pets-stat">
          <span className="pets-stat-icon">⭐</span>
          <span className="pets-stat-label">Cliente Frecuente</span>
          <span className="pets-stat-value">{pets[0]?.owner || 'N/A'}</span>
        </div>
      </div>

       {/* Pet Modal */}
       {selectedPet && (
         <div className="pet-modal-overlay" onClick={() => setSelectedPet(null)}>
           <div className="pet-modal" onClick={(e) => e.stopPropagation()}>
             <button className="modal-close" onClick={() => setSelectedPet(null)}>✕</button>
             <div className="modal-image-container">
               {selectedPet.image && getSafeImageUrl(selectedPet.image) !== '🐾' ? (
                 <img 
                   src={getSafeImageUrl(selectedPet.image)} 
                   alt={selectedPet.name} 
                   className="modal-image"
                   onError={(e) => handleImageError(e, `groomer-pet-modal-${selectedPet.name}`)}
                 />
               ) : (
                 <div className="modal-image-placeholder">
                   🐾
                 </div>
               )}
             </div>
             <div className="modal-content">
               <h2>{selectedPet.name}</h2>
               <div className="detail">
                 <span className="label">Raza:</span>
                 <span className="value">{selectedPet.breed}</span>
               </div>
               <div className="detail">
                 <span className="label">Dueño:</span>
                 <span className="value">{selectedPet.owner}</span>
               </div>
               <div className="detail">
                 <span className="label">Edad:</span>
                 <span className="value">{selectedPet.age}</span>
               </div>
               <div className="detail">
                 <span className="label">Peso:</span>
                 <span className="value">{selectedPet.weight}</span>
               </div>
               <div className="detail">
                 <span className="label">Total de Servicios:</span>
                 <span className="value">{selectedPet.totalServices}</span>
               </div>
               <div className="detail">
                 <span className="label">Último Servicio:</span>
                 <span className="value">{selectedPet.lastService}</span>
               </div>
               <div className="detail full-width">
                 <span className="label">Notas Importantes:</span>
                 <span className="value notes">{selectedPet.notes}</span>
               </div>
             </div>
             <button className="btn-primary">Ver Historial</button>
           </div>
         </div>
       )}
    </div>
  );
};

export default GroomerPets;
