import React from 'react';
import { FormGroup } from '../Common';

/**
 * ProfileFormGrid - Componente de formulario de perfil en grid
 * Reutilizable para Client, Groomer y Admin profiles
 */
export default function ProfileFormGrid({
  sections,
  formData,
  onChange,
  onSave,
  loading = false,
  errors = {},
  disabled = false,
  className = '',
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) onSave();
  };

  const handleChange = (name, value) => {
    if (onChange) onChange(name, value);
  };

  return (
    <form onSubmit={handleSubmit} className={`profile-form-grid ${className}`}>
      <div className="form-grid">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="form-section">
            <div className="form-card">
              <h3 className="form-section-title">{section.title}</h3>
              
              <div className="form-fields">
                {section.fields.map((field, fieldIndex) => {
                  const fieldError = errors[field.name];
                  
                  return (
                    <FormGroup
                      key={fieldIndex}
                      label={field.label}
                      name={field.name}
                      type={field.type || 'text'}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      error={fieldError}
                      required={field.required || false}
                      placeholder={field.placeholder}
                      disabled={disabled || field.disabled || loading}
                      options={field.options}
                      multiple={field.multiple}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {onSave && (
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || disabled}
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      )}
    </form>
  );
}
