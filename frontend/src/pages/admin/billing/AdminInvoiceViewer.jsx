import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { downloadInvoicePdf, getInvoice } from '../../../api/invoices';
import { cancelInvoice, initPayUPayment, markInvoicePaid } from '../../../api/payments';
import { useToast } from '../../../components/Context/ToastContext';
import InvoiceCard from '../../../components/Common/InvoiceCard';

export default function AdminInvoiceViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getInvoice(id);
      setInvoice(data);
    } catch (e) {
      showError(e.message || 'Error cargando factura');
      navigate('/admin/invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownload = async () => {
    try {
      const blob = await downloadInvoicePdf(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = invoice?.invoice_number ? `factura_${invoice.invoice_number}.pdf` : `factura_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showSuccess('PDF descargado');
    } catch (e) {
      showError(e.message || 'No pudimos descargar el PDF');
    }
  };

  const doMarkPaid = async () => {
    try {
      setBusy(true);
      await markInvoicePaid(id);
      showSuccess('Factura marcada como pagada');
      await load();
    } catch (e) {
      showError(e.message || 'No se pudo marcar como pagada');
    } finally {
      setBusy(false);
    }
  };

  const doCancel = async () => {
    if (!window.confirm('¿Cancelar esta factura?')) return;
    try {
      setBusy(true);
      await cancelInvoice(id);
      showSuccess('Factura cancelada');
      await load();
    } catch (e) {
      showError(e.message || 'No se pudo cancelar');
    } finally {
      setBusy(false);
    }
  };

  const doPayU = async () => {
    try {
      setBusy(true);
      const data = await initPayUPayment(id);
      const { payment_url: paymentUrl, fields } = data || {};
      if (!paymentUrl || !fields) {
        throw new Error('Respuesta inválida desde el servidor para PayU.');
      }

      const win = window.open('', '_blank');
      if (!win) {
        throw new Error('Por favor permite pop-ups para continuar con el pago.');
      }

      const inputs = Object.entries(fields)
        .map(([k, v]) => `<input type="hidden" name="${k}" value="${String(v).replace(/"/g, '&quot;')}" />`)
        .join('');

      win.document.write(`
        <html>
          <head><title>Redirigiendo a PayU…</title></head>
          <body>
            <p>Redirigiendo a PayU…</p>
            <form id="payuForm" method="POST" action="${paymentUrl}">
              ${inputs}
            </form>
            <script>document.getElementById('payuForm').submit();</script>
          </body>
        </html>
      `);
      win.document.close();

      showSuccess('Redirigiendo a PayU…');
      // Recargar para reflejar transacción "initiated"
      await load();
    } catch (e) {
      showError(e.message || 'No se pudo iniciar el pago con PayU');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div style={{ padding: 16 }}>Cargando...</div>;
  if (!invoice) return null;

  const hasPendingGateway = (invoice.gateway_transactions || []).some(t => ['initiated', 'pending'].includes(String(t.status || '').toLowerCase()));

  return (
    <div style={{ maxWidth: 950, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#1f2937' }}>Factura #{invoice.invoice_number}</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={handleDownload}
            style={{ padding: '12px 20px', borderRadius: 12, border: '1px solid var(--border-color, #e5e7eb)', fontWeight: 800, fontSize: 14 }}
          >
            📥 Descargar PDF
          </button>
          {invoice.status === 'pending' && (
            <button
              onClick={doMarkPaid}
              disabled={busy}
              style={{ padding: '12px 20px', borderRadius: 12, border: '1px solid #16a34a', background: '#16a34a', color: '#fff', fontWeight: 900, fontSize: 14 }}
            >
              ✅ Marcar pagada
            </button>
          )}
          {invoice.status === 'pending' && (
            <button
              onClick={doPayU}
              disabled={busy}
              style={{ padding: '12px 20px', borderRadius: 12, border: '1px solid #0ea5e9', background: '#0ea5e9', color: '#fff', fontWeight: 900, fontSize: 14 }}
              title="Iniciar pago online con PayU"
            >
              💳 Pagar con PayU
            </button>
          )}
          {invoice.status !== 'cancelled' && (
            <button
              onClick={doCancel}
              disabled={busy}
              style={{ padding: '12px 20px', borderRadius: 12, border: '1px solid #b91c1c', background: '#b91c1c', color: '#fff', fontWeight: 900, fontSize: 14 }}
            >
              ❌ Cancelar
            </button>
          )}
        </div>
      </div>

      <InvoiceCard 
        invoice={invoice} 
        showGroomerInfo={true}
        showCommissionInfo={true}
        showPaymentNote={true}
      />

      {hasPendingGateway && (
        <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', fontWeight: 700 }}>
          ⚠️ Hay un pago PayU en proceso para esta factura. Si ya se completó, espera unos segundos y recarga.
        </div>
      )}

      <div style={{ marginTop: 18, background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 12, padding: 14 }}>
        <h2 style={{ marginTop: 0, marginBottom: 10, fontSize: 18 }}>Historial de transacciones</h2>
        {(invoice.payments || []).length === 0 ? (
          <div style={{ color: '#666' }}>Sin transacciones registradas.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
                  <th style={{ textAlign: 'left', padding: 10 }}>Fecha</th>
                  <th style={{ textAlign: 'left', padding: 10 }}>Método</th>
                  <th style={{ textAlign: 'left', padding: 10 }}>Monto</th>
                  <th style={{ textAlign: 'left', padding: 10 }}>Registrado por</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.payments || []).map(p => (
                  <tr key={p.id} style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <td style={{ padding: 10 }}>{p.received_at ? new Date(p.received_at).toLocaleString('es-CO') : ''}</td>
                    <td style={{ padding: 10 }}>{p.method || 'cash'}</td>
                    <td style={{ padding: 10 }}>${Number(p.amount || 0).toFixed(2)}</td>
                    <td style={{ padding: 10 }}>{p.received_by_admin_email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ marginTop: 18, background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 12, padding: 14 }}>
        <h2 style={{ marginTop: 0, marginBottom: 10, fontSize: 18 }}>Transacciones PayU</h2>
        {(invoice.gateway_transactions || []).length === 0 ? (
          <div style={{ color: '#666' }}>Sin transacciones PayU.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
                  <th style={{ textAlign: 'left', padding: 10 }}>Fecha</th>
                  <th style={{ textAlign: 'left', padding: 10 }}>Estado</th>
                  <th style={{ textAlign: 'left', padding: 10 }}>Referencia</th>
                  <th style={{ textAlign: 'left', padding: 10 }}>Txn ID</th>
                  <th style={{ textAlign: 'left', padding: 10 }}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.gateway_transactions || []).map(t => (
                  <tr key={t.id} style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <td style={{ padding: 10 }}>{t.created_at ? new Date(t.created_at).toLocaleString('es-CO') : ''}</td>
                    <td style={{ padding: 10 }}>{t.status}</td>
                    <td style={{ padding: 10 }}>{t.reference_code}</td>
                    <td style={{ padding: 10 }}>{t.transaction_id || ''}</td>
                    <td style={{ padding: 10 }}>${Number(t.amount || 0).toFixed(2)} {t.currency || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <button
        onClick={() => navigate(-1)}
        style={{ marginTop: 24, background: 'transparent', border: 'none', color: 'var(--primary, #d96c5f)', fontWeight: 800, cursor: 'pointer', fontSize: 14 }}
      >
        ← Volver
      </button>
    </div>
  );
}
