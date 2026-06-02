import React from 'react';
import { Link } from 'react-router-dom';
import { getSafeImageUrl, handleImageError } from '../../utils/imageUtils';

const PetsPreview = ({ pets, loading }) => {
  if (loading) {
    return <p>Cargando mascotas...</p>;
  }

  if (pets.length === 0) {
    return (
      <div className="pets-empty">
        <p>No tienes mascotas registradas aún.</p>
        <Link to="/client/pets/register" className="btn btn-primary">
          Registrar mi primera mascota
        </Link>
      </div>
    );
  }

  return (
    <div className="pets-grid">
      {pets.slice(0, 4).map((pet) => {
        const id = pet.id ?? pet._id;
        const rawImg = pet.photo_url || pet.img_url || pet.img || pet.image_url || '';
        const img = getSafeImageUrl(rawImg, '🐾');
        const peso = pet.weight || pet.peso_kg || pet.peso || '';
        const desc = pet.notes || pet.descripcion || pet.description || '';
        const isPlaceholder = img === '🐾';

        return (
          <div key={id} className="pet-card">
            <div className="pet-card__header">
              <div className="pet-card__photo">
                {!isPlaceholder ? (
                  <img 
                    src={img} 
                    alt={pet.name}
                    onError={(e) => handleImageError(e, `Pet ${pet.name} (${id}`)} 
                  />
                ) : (
                  <div className="pet-card__avatar">🐾</div>
                )}
              </div>

              <div className="pet-card__info">
                <h3 className="pet-card__name">{pet.name}</h3>
                <p className="pet-card__breed">{pet.breed}</p>
              </div>
            </div>

            <div className="pet-card__meta">
              <div className="pet-card__meta-item">
                <span className="pet-card__meta-label">Edad</span>
                <span className="pet-card__meta-value">{pet.age} años</span>
              </div>
              <div className="pet-card__meta-item">
                <span className="pet-card__meta-label">Peso</span>
                <span className="pet-card__meta-value">{peso !== '' ? `${peso} kg` : 'N/A'}</span>
              </div>
              <div className="pet-card__meta-item pet-card__meta-item--full">
                <span className="pet-card__meta-label">Descripción</span>
                <span className="pet-card__meta-value" style={{ fontWeight: 500, fontSize: 14 }}>
                  {desc ? desc : 'N/A'}
                </span>
              </div>
            </div>

            <div className="pet-card__footer">
              <div className="pet-card__actions">
                <Link to={`/client/pets/edit/${id}`} className="btn btn-secondary pet-card__action">
                  Editar
                </Link>
                <button className="pet-card__action pet-card__history btn-small" type="button" disabled>
                  Perfil (próximamente)
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PetsPreview;

