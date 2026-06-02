import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getGroomerInvoices } from '../../api/invoices';
import { useToast } from '../../components/Context/ToastContext';

const statusLabel = (s) => {
  if (s === 'paid') return 'Pagada';
  if (s === 'cancelled') return 'Cancelada';
  return 'Pendiente';
};

export default function GroomerInvoices() {
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getGroomerInvoices();
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

  const totals = useMemo(() => {
    const totalFacturado = items.reduce((s, i) => s + Number(i.total || 0), 0);
    const totalPagado = items.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total || 0), 0);
    const totalPendiente = items.filter(i => i.status === 'pending').reduce((s, i) => s + Number(i.total || 0), 0);
    return { totalFacturado, totalPagado, totalPendiente };
  }, [items]);

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

      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <div style={{ background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 12, padding: 14 }}>
          <div style={{ color: '#666' }}>Total facturado</div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>${totals.totalFacturado.toFixed(2)}</div>
        </div>
        <div style={{ background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 12, padding: 14 }}>
          <div style={{ color: '#666' }}>Total pagado</div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>${totals.totalPagado.toFixed(2)}</div>
        </div>
        <div style={{ background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 12, padding: 14 }}>
          <div style={{ color: '#666' }}>Total pendiente</div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>${totals.totalPendiente.toFixed(2)}</div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 16 }}>Cargando...</div>
      ) : filtered.length === 0 ? (
        <div style={{ marginTop: 12, padding: 16, background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 12 }}>
          No tienes facturas aún.
        </div>
      ) : (
        <div style={{ marginTop: 12, background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
                <th style={{ textAlign: 'left', padding: 12 }}>Factura</th>
                <th style={{ textAlign: 'left', padding: 12 }}>Cliente</th>
                <th style={{ textAlign: 'left', padding: 12 }}>Servicio</th>
                <th style={{ textAlign: 'left', padding: 12 }}>Total</th>
                <th style={{ textAlign: 'left', padding: 12 }}>Estado</th>
                <th style={{ textAlign: 'left', padding: 12 }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id} style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <td style={{ padding: 12 }}>#{inv.invoice_number}</td>
                  <td style={{ padding: 12 }}>{inv.client_name || inv.client_email}</td>
                  <td style={{ padding: 12 }}>{inv.service_name}</td>
                  <td style={{ padding: 12 }}>${Number(inv.total || 0).toFixed(2)}</td>
                  <td style={{ padding: 12, fontWeight: 800 }}>{statusLabel(inv.status)}</td>
                  <td style={{ padding: 12 }}>
                    <Link to={`/groomer/invoices/${inv.id}`} style={{ color: 'var(--primary, #d96c5f)', fontWeight: 800 }}>
                      Ver / PDF
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

