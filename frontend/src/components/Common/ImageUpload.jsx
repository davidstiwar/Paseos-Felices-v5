import React, { useState } from 'react';
import { getSafeImageUrl, handleImageError } from '../../utils/imageUtils';
import './ImageUpload.css';

/**
 * ImageUpload Component
 * Reusable image upload component with support for two modes:
 * - 'api': Uploads to API endpoint (returns URL)
 * - 'base64': Converts to base64 string (for direct storage)
 * 
 * @param {Object} props
 * @param {string} props.value - Current image URL or base64 string
 * @param {Function} props.onChange - Callback when image changes (receives URL or base64)
 * @param {string} props.mode - 'api' or 'base64' (default: 'base64')
 * @param {string} props.uploadEndpoint - API endpoint for upload (required if mode='api')
 * @param {string} props.label - Label for the upload button
 * @param {boolean} props.disabled - Disable the upload
 * @param {number} props.maxSize - Max file size in MB (default: 5)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.previewSize - Size of preview: 'small' | 'medium' | 'large' (default: 'medium')
 * @param {boolean} props.circular - Circular preview (default: false)
 * @param {boolean} props.showRemove - Show remove button (default: true)
 */
const ImageUpload = ({
  value = '',
  onChange,
  mode = 'base64',
  uploadEndpoint = '',
  label = 'Elegir archivo',
  disabled = false,
  maxSize = 2,
  className = '',
  previewSize = 'medium',
  circular = false,
  showRemove = true,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(value);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Debes seleccionar una imagen');
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`La imagen debe ser menor a ${maxSize}MB`);
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (mode === 'api') {
        // Upload to API endpoint
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(uploadEndpoint, {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => null);
          throw new Error(errorText || 'Error al subir la imagen');
        }

        const body = await response.json();
        const url = body.url || body.fileUrl || body.file_url;
        if (!url) throw new Error('No se recibió URL de la subida');

        setPreview(url);
        onChange(url);
      } else {
        // Convert to base64
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        setPreview(base64);
        onChange(base64);
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err.message || 'Error al subir la imagen');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setPreview('');
    onChange('');
    setError('');
  };

  const getPreviewClass = () => {
    const sizeClass = `preview-${previewSize}`;
    const shapeClass = circular ? 'preview-circular' : 'preview-square';
    return `${sizeClass} ${shapeClass}`;
  };

  return (
    <div className={`image-upload ${className}`}>
      <div className="image-upload-container">
        {preview && getSafeImageUrl(preview) !== '🐾' ? (
          <div className={`image-upload-preview ${getPreviewClass()}`}>
            <img
              src={getSafeImageUrl(preview)}
              alt="Vista previa"
              onError={(e) => handleImageError(e, 'image-upload-preview')}
            />
            {showRemove && !disabled && (
              <button
                type="button"
                className="image-upload-remove"
                onClick={handleRemove}
                disabled={loading}
                title="Quitar imagen"
              >
                ×
              </button>
            )}
          </div>
        ) : (
          <div className={`image-upload-placeholder ${getPreviewClass()}`}>
            <span className="placeholder-icon">📷</span>
          </div>
        )}

        {!disabled && (
          <label className="image-upload-button">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={loading}
              style={{ display: 'none' }}
            />
            {loading ? 'Subiendo...' : label}
          </label>
        )}
      </div>

      {error && (
        <div className="image-upload-error">
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
