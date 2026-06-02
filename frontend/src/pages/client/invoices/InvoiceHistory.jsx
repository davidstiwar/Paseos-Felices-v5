import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyInvoices } from '../../../api/invoices';
import { useToast } from '../../../components/Context/ToastContext';

const statusLabel = (s) => {
  if (s === 'paid') return 'Pagada';
  if (s === 'cancelled') return 'Cancelada';
  return 'Pendiente';
};

const statusColor = (s) => {
  if (s === 'paid') return '#16a34a';
  if (s === 'cancelled') return '#b91c1c';
  return '#d97706';
};

export default function InvoiceHistory() {
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getMyInvoices();
        setItems(data || []);
      } catch (e) {
        showError(e.message || 'Error cargando facturas');
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showError]);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter(i => i.status === filter);
  }, [items, filter]);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h1 style={{ margin: 0 }}>Mis Facturas</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Todas</option>
          <option value="pending">Pendientes</option>
          <option value="paid">Pagadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
      </div>

      <p style={{ color: '#666', marginTop: 8 }}>
        El pago de las facturas se realiza de forma presencial y en efectivo.
      </p>

      {loading ? (
        <div style={{ padding: 16 }}>Cargando...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 16, background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 12 }}>
          No tienes facturas aún.
        </div>
      ) : (
        <div style={{ marginTop: 12, background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
                <th style={{ textAlign: 'left', padding: 12 }}>Factura</th>
                <th style={{ textAlign: 'left', padding: 12 }}>Servicio</th>
                <th style={{ textAlign: 'left', padding: 12 }}>Mascota</th>
                <th style={{ textAlign: 'left', padding: 12 }}>Total</th>
                <th style={{ textAlign: 'left', padding: 12 }}>Estado</th>
                <th style={{ textAlign: 'left', padding: 12 }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <td style={{ padding: 12 }}>#{inv.invoice_number}</td>
                  <td style={{ padding: 12 }}>{inv.service_name}</td>
                  <td style={{ padding: 12 }}>{inv.pet_name || `Pet #${inv.pet_id}`}</td>
                  <td style={{ padding: 12 }}>${Number(inv.total || 0).toFixed(2)}</td>
                  <td style={{ padding: 12, color: statusColor(inv.status), fontWeight: 700 }}>{statusLabel(inv.status)}</td>
                  <td style={{ padding: 12 }}>
                    <Link to={`/client/invoices/${inv.id}`} style={{ color: 'var(--primary, #d96c5f)', fontWeight: 700 }}>
                      Ver / Descargar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

