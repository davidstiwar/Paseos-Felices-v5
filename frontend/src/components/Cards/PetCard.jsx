import React from 'react';

/**
 * PetCard (unificado)
 * Reutiliza estilos existentes: `.pet-card` y variantes usadas en la app.
 */
export default function PetCard({
  pet,
  onClick,
  actions,
  showActions = true,
  className = '',
}) {
  if (!pet) return null;
  const { id, name, breed, age, image, weight } = pet;

  return (
    <div
      className={['pet-card', className].filter(Boolean).join(' ')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="pet-image">
        <img src={image || 'https://via.placeholder.com/100'} alt={name} />
      </div>
      <div className="pet-info">
        <h3>{name}</h3>
        {breed ? <p className="breed">{breed}</p> : null}
        {typeof age !== 'undefined' && age !== null ? <p className="age">Edad: {age} años</p> : null}
        {typeof weight !== 'undefined' && weight !== null ? <p className="weight">Peso: {weight} kg</p> : null}

        {showActions && Array.isArray(actions) && actions.length > 0 ? (
          <div className="pet-card__actions" onClick={e => e.stopPropagation()}>
            {actions.map((a, idx) => (
              <button
                key={idx}
                type="button"
                className={a.className || 'btn btn-secondary btn-small pet-card__action'}
                onClick={a.onClick}
                disabled={a.disabled}
              >
                {a.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

