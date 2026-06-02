import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPet } from '../../../api/pets';
import { useToast } from '../../../components/Context/ToastContext';
import ImageUpload from '../../../components/Common/ImageUpload';

const RegisterPet = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    age: '',
    peso_kg: '',
    descripcion: '',
    photo_url: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImgChange = (base64) => {
    setFormData((prev) => ({ ...prev, photo_url: base64 }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createPet({
        name: formData.name,
        breed: formData.breed,
        age: formData.age ? parseInt(formData.age) : null,
        weight: formData.peso_kg ? parseFloat(formData.peso_kg) : null,
        notes: formData.descripcion || null,
        photo_url: formData.photo_url || null
      });

      showSuccess('Mascota registrada correctamente');
      navigate('/client/pets');
    } catch (error) {
      showError(error.message || 'Error al registrar la mascota');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pet-form-page">
      <h2>Registrar Nueva Mascota</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input
              type="text"
              name="name"
              placeholder="Nombre"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Raza</label>
            <input
              type="text"
              name="breed"
              placeholder="Raza"
              value={formData.breed}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Edad (años)</label>
            <input
              type="number"
              name="age"
              placeholder="Edad"
              value={formData.age}
              onChange={handleChange}
              required
              min={0}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Peso (kg)</label>
            <input
              type="number"
              name="peso_kg"
              placeholder="Ej: 8.5"
              value={formData.peso_kg}
              onChange={handleChange}
              min={0}
              step="0.1"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Descripción</label>
            <textarea
              name="descripcion"
              placeholder="Describe a tu mascota..."
              value={formData.descripcion}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Imagen</label>
            <ImageUpload
              value={formData.photo_url}
              onChange={handleImgChange}
              mode="base64"
              label="Elegir archivo"
              previewSize="medium"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)} disabled={loading}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar Mascota'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterPet;

