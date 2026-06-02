import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllInvoices } from '../../../api/invoices';
import { cancelInvoice, markInvoicePaid } from '../../../api/payments';
import { useToast } from '../../../components/Context/ToastContext';

const statusLabel = (s) => {
  if (s === 'paid') return 'Pagada';
  if (s === 'cancelled') return 'Cancelada';
  return 'Pendiente';
};

export default function AdminInvoicesPage() {
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getAllInvoices(filter || undefined);
      setItems(data || []);
    } catch (e) {
      showError(e.message || 'Error cargando facturas');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totals = useMemo(() => {
    const total = items.reduce((s, i) => s + Number(i.total || 0), 0);
    const pendientes = items.filter(i => i.status === 'pending').reduce((s, i) => s + Number(i.total || 0), 0);
    const pagadas = items.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total || 0), 0);
    return { total, pendientes, pagadas };
  }, [items]);

  const doMarkPaid = async (id) => {
    try {
      setBusyId(id);
      await markInvoicePaid(id);
      showSuccess('Factura marcada como pagada');
      await load();
    } catch (e) {
      showError(e.message || 'No se pudo marcar como pagada');
    } finally {
      setBusyId(null);
    }
  };

  const doCancel = async (id) => {
    if (!window.confirm('¿Cancelar esta factura?')) return;
    try {
      setBusyId(id);
      await cancelInvoice(id);
      showSuccess('Factura cancelada');
      await load();
    } catch (e) {
      showError(e.message || 'No se pudo cancelar');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h1 style={{ margin: 0 }}>Facturas</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Todas</option>
            <option value="pending">Pendientes</option>
            <option value="paid">Pagadas</option>
            <option value="cancelled">Canceladas</option>
          </select>
          <button onClick={load} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-color, #e5e7eb)' }}>
            Recargar
          </button>
        </div>
      </div>

      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <div style={{ background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 12, padding: 14 }}>
          <div style={{ color: '#666' }}>Total (listado)</div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>${totals.total.toFixed(2)}</div>
        </div>
        <div style={{ background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 12, padding: 14 }}>
          <div style={{ color: '#666' }}>Pendiente</div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>${totals.pendientes.toFixed(2)}</div>
        </div>
        <div style={{ background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 12, padding: 14 }}>
          <div style={{ color: '#666' }}>Pagado</div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>${totals.pagadas.toFixed(2)}</div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 16 }}>Cargando...</div>
      ) : items.length === 0 ? (
        <div style={{ marginTop: 12, padding: 16, background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 12 }}>
          No hay facturas.
        </div>
      ) : (
        <div style={{ marginTop: 12, background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
                <th style={{ textAlign: 'left', padding: 12 }}>Factura</th>
                <th style={{ textAlign: 'left', padding: 12 }}>Cliente</th>
                <th style={{ textAlign: 'left', padding: 12 }}>Mascota</th>
                <th style={{ textAlign: 'left', padding: 12 }}>Servicio</th>
                <th style={{ textAlign: 'left', padding: 12 }}>Total</th>
                <th style={{ textAlign: 'left', padding: 12 }}>Estado</th>
                <th style={{ textAlign: 'left', padding: 12 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map(inv => (
                <tr key={inv.id} style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <td style={{ padding: 12 }}>
                    <Link to={`/admin/invoices/${inv.id}`} style={{ color: 'var(--primary, #d96c5f)', fontWeight: 800 }}>
                      #{inv.invoice_number}
                    </Link>
                  </td>
                  <td style={{ padding: 12 }}>{inv.client_name || inv.client_email}</td>
                  <td style={{ padding: 12 }}>{inv.pet_name || `Pet #${inv.pet_id}`}</td>
                  <td style={{ padding: 12 }}>{inv.service_name}</td>
                  <td style={{ padding: 12 }}>${Number(inv.total || 0).toFixed(2)}</td>
                  <td style={{ padding: 12, fontWeight: 800 }}>{statusLabel(inv.status)}</td>
                  <td style={{ padding: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {inv.status === 'pending' && (
                      <button
                        onClick={() => doMarkPaid(inv.id)}
                        disabled={busyId === inv.id}
                        style={{ padding: '7px 10px', borderRadius: 10, border: '1px solid #16a34a', background: '#16a34a', color: '#fff', fontWeight: 800 }}
                      >
                        Marcar pagada
                      </button>
                    )}
                    {inv.status !== 'cancelled' && (
                      <button
                        onClick={() => doCancel(inv.id)}
                        disabled={busyId === inv.id}
                        style={{ padding: '7px 10px', borderRadius: 10, border: '1px solid #b91c1c', background: '#b91c1c', color: '#fff', fontWeight: 800 }}
                      >
                        Cancelar
                      </button>
                    )}
                    <Link to={`/admin/invoices/${inv.id}`} style={{ padding: '7px 10px', borderRadius: 10, border: '1px solid var(--border-color, #e5e7eb)', fontWeight: 800 }}>
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

