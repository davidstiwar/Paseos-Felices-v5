import React, { useEffect, useState } from 'react';
import { getCommissionHistory, getCurrentCommissions, updateCommissions } from '../../../api/commissions';
import { useToast } from '../../../components/Context/ToastContext';

export default function CommissionSettings() {
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({ 
    groomer_percentage: 80, 
    platform_percentage: 20, 
    reason: '',
    dynamic_commission_enabled: false,
    location_based: false,
    service_based: false,
    volume_based: false,
    ranking_based: false
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [c, h] = await Promise.all([getCurrentCommissions(), getCommissionHistory().catch(() => [])]);
      setCurrent(c);
      setHistory(h || []);
      setForm({
        groomer_percentage: c.groomer_percentage,
        platform_percentage: c.platform_percentage,
        reason: '',
        dynamic_commission_enabled: c.dynamic_commission_enabled || false,
        location_based: c.location_based || false,
        service_based: c.service_based || false,
        volume_based: c.volume_based || false,
        ranking_based: c.ranking_based || false,
      });
    } catch (e) {
      showError(e.message || 'Error cargando comisiones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (Number(form.groomer_percentage) + Number(form.platform_percentage) !== 100) {
      showError('La suma de porcentajes debe ser 100%.');
      return;
    }
    if (Number(form.groomer_percentage) < 0 || Number(form.platform_percentage) < 0) {
      showError('No se permiten porcentajes negativos.');
      return;
    }

    try {
      setSaving(true);
      await updateCommissions({
        groomer_percentage: Number(form.groomer_percentage),
        platform_percentage: Number(form.platform_percentage),
        reason: form.reason || null,
        dynamic_commission_enabled: form.dynamic_commission_enabled,
        location_based: form.location_based,
        service_based: form.service_based,
        volume_based: form.volume_based,
        ranking_based: form.ranking_based,
      });
      showSuccess('Comisiones actualizadas');
      await load();
    } catch (e) {
      showError(e.message || 'No se pudo actualizar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 16 }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>Configuración de Comisiones</h1>

      <div style={{ background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <p style={{ marginTop: 0, color: '#666', marginBottom: 20 }}>
          La suma debe ser exactamente 100%. Los cambios NO afectan facturas ya creadas (histórico preservado).
        </p>

        {/* Dynamic Commission Toggle */}
        <div style={{ 
          marginBottom: 24, 
          padding: 16, 
          background: 'linear-gradient(135deg, #e07a5f 0%, #d4a373 100%)', 
          borderRadius: 12,
          color: 'white'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700 }}>
                🎯 Comisiones Dinámicas
              </h3>
              <p style={{ margin: 0, fontSize: 14, opacity: 0.9 }}>
                Calcula comisiones basadas en ubicación, tipo de servicio, volumen y ranking
              </p>
            </div>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600
            }}>
              <input
                type="checkbox"
                checked={form.dynamic_commission_enabled}
                onChange={(e) => onChange('dynamic_commission_enabled', e.target.checked)}
                style={{ width: 20, height: 20 }}
              />
              Habilitar
            </label>
          </div>
        </div>

        {/* Dynamic Commission Options */}
        {form.dynamic_commission_enabled && (
          <div style={{ 
            marginBottom: 24, 
            padding: 20, 
            background: '#f9fafb', 
            borderRadius: 12,
            border: '1px solid #e5e7eb'
          }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: '#2d2d2d' }}>
              Factores de Cálculo Dinámico
            </h4>
            <div style={{ display: 'grid', gap: 12 }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12, 
                cursor: 'pointer',
                padding: 12,
                background: 'white',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.borderColor = '#e07a5f'}
              onMouseOut={(e) => e.target.style.borderColor = '#e5e7eb'}
              >
                <input
                  type="checkbox"
                  checked={form.location_based}
                  onChange={(e) => onChange('location_based', e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                <div>
                  <div style={{ fontWeight: 600, color: '#2d2d2d' }}>📍 Basado en Ubicación</div>
                  <div style={{ fontSize: 13, color: '#666' }}>Ajusta comisiones según la zona del groomer</div>
                </div>
              </label>

              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12, 
                cursor: 'pointer',
                padding: 12,
                background: 'white',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.borderColor = '#e07a5f'}
              onMouseOut={(e) => e.target.style.borderColor = '#e5e7eb'}
              >
                <input
                  type="checkbox"
                  checked={form.service_based}
                  onChange={(e) => onChange('service_based', e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                <div>
                  <div style={{ fontWeight: 600, color: '#2d2d2d' }}>🐾 Basado en Tipo de Servicio</div>
                  <div style={{ fontSize: 13, color: '#666' }}>Diferentes comisiones por servicio (baño, corte, etc.)</div>
                </div>
              </label>

              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12, 
                cursor: 'pointer',
                padding: 12,
                background: 'white',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.borderColor = '#e07a5f'}
              onMouseOut={(e) => e.target.style.borderColor = '#e5e7eb'}
              >
                <input
                  type="checkbox"
                  checked={form.volume_based}
                  onChange={(e) => onChange('volume_based', e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                <div>
                  <div style={{ fontWeight: 600, color: '#2d2d2d' }}>📊 Basado en Volumen</div>
                  <div style={{ fontSize: 13, color: '#666' }}>Bonificaciones por alto volumen de citas mensuales</div>
                </div>
              </label>

              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12, 
                cursor: 'pointer',
                padding: 12,
                background: 'white',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.borderColor = '#e07a5f'}
              onMouseOut={(e) => e.target.style.borderColor = '#e5e7eb'}
              >
                <input
                  type="checkbox"
                  checked={form.ranking_based}
                  onChange={(e) => onChange('ranking_based', e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                <div>
                  <div style={{ fontWeight: 600, color: '#2d2d2d' }}>⭐ Basado en Ranking</div>
                  <div style={{ fontSize: 13, color: '#666' }}>Mejores comisiones para groomers con mejor rating</div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Base Commission */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          <div>
            <label style={{ fontWeight: 800, color: '#2d2d2d' }}>Groomer (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={form.groomer_percentage}
              onChange={(e) => onChange('groomer_percentage', e.target.value)}
              style={{ 
                width: '100%', 
                padding: 12, 
                borderRadius: 10, 
                border: '2px solid #e5e7eb',
                fontSize: 16,
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#e07a5f'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          <div>
            <label style={{ fontWeight: 800, color: '#2d2d2d' }}>Plataforma (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={form.platform_percentage}
              onChange={(e) => onChange('platform_percentage', e.target.value)}
              style={{ 
                width: '100%', 
                padding: 12, 
                borderRadius: 10, 
                border: '2px solid #e5e7eb',
                fontSize: 16,
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#e07a5f'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontWeight: 800, color: '#2d2d2d' }}>Motivo (opcional)</label>
            <input
              type="text"
              value={form.reason}
              onChange={(e) => onChange('reason', e.target.value)}
              placeholder="Ej: Promoción del mes / Ajuste de comisiones"
              style={{ 
                width: '100%', 
                padding: 12, 
                borderRadius: 10, 
                border: '2px solid #e5e7eb',
                fontSize: 16,
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#e07a5f'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ 
              padding: '12px 20px', 
              borderRadius: 10, 
              border: 'none', 
              background: 'linear-gradient(135deg, #e07a5f 0%, #d4a373 100%)', 
              color: '#fff', 
              fontWeight: 700,
              fontSize: 16,
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(224, 122, 95, 0.3)'
            }}
            onMouseOver={(e) => {
              if (!saving) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(224, 122, 95, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              if (!saving) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(224, 122, 95, 0.3)';
              }
            }}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          {current && (
            <span style={{ color: '#666', fontSize: 14 }}>
              Actual: <strong>{current.groomer_percentage}%</strong> / <strong>{current.platform_percentage}%</strong>
            </span>
          )}
        </div>
      </div>

      <h2 style={{ marginTop: 24, marginBottom: 16, fontSize: 20, fontWeight: 700, color: '#2d2d2d' }}>
        📜 Historial de Cambios
      </h2>
      <div style={{ 
        background: 'var(--bg-card, #fff)', 
        border: '1px solid var(--border-color, #e5e7eb)', 
        borderRadius: 12, 
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(224, 122, 95, 0.1)' }}>
              <th style={{ textAlign: 'left', padding: 14, fontWeight: 700, color: '#2d2d2d' }}>Fecha</th>
              <th style={{ textAlign: 'left', padding: 14, fontWeight: 700, color: '#2d2d2d' }}>Antes</th>
              <th style={{ textAlign: 'left', padding: 14, fontWeight: 700, color: '#2d2d2d' }}>Después</th>
              <th style={{ textAlign: 'left', padding: 14, fontWeight: 700, color: '#2d2d2d' }}>Admin</th>
              <th style={{ textAlign: 'left', padding: 14, fontWeight: 700, color: '#2d2d2d' }}>Motivo</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: 20, color: '#666', textAlign: 'center' }}>
                  Sin cambios registrados.
                </td>
              </tr>
            ) : (
              history.map(h => (
                <tr key={h.id} style={{ borderTop: '1px solid rgba(0,0,0,0.06)', transition: 'background 0.2s' }}
                onMouseOver={(e) => e.target.style.background = '#f9fafb'}
                onMouseOut={(e) => e.target.style.background = 'transparent'}
                >
                  <td style={{ padding: 14, color: '#666' }}>{new Date(h.changed_at).toLocaleString()}</td>
                  <td style={{ padding: 14, color: '#666' }}>{h.previous_groomer_percentage}% / {h.previous_platform_percentage}%</td>
                  <td style={{ padding: 14, fontWeight: 700, color: '#e07a5f' }}>{h.new_groomer_percentage}% / {h.new_platform_percentage}%</td>
                  <td style={{ padding: 14, color: '#666' }}>{h.changed_by_admin_email}</td>
                  <td style={{ padding: 14, color: '#666' }}>{h.reason || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

