import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { downloadInvoicePdf, getInvoice } from '../../api/invoices';
import { useToast } from '../../components/Context/ToastContext';
import InvoiceCard from '../../components/Common/InvoiceCard';

export default function GroomerInvoiceViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getInvoice(id);
        setInvoice(data);
      } catch (e) {
        showError(e.message || 'Error cargando factura');
        navigate('/groomer/invoices');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate, showError]);

  const handleDownload = async () => {
    try {
      setDownloading(true);
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
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div style={{ padding: 16 }}>Cargando...</div>;
  if (!invoice) return null;

  return (
    <div style={{ maxWidth: 950, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#1f2937' }}>Factura #{invoice.invoice_number}</h1>
        <button
          onClick={handleDownload}
          disabled={downloading}
          style={{
            padding: '12px 20px',
            borderRadius: 12,
            border: '1px solid var(--border-color, #e5e7eb)',
            background: 'var(--primary, #d96c5f)',
            color: '#fff',
            fontWeight: 800,
            cursor: downloading ? 'not-allowed' : 'pointer',
            fontSize: 14,
            transition: 'all 0.2s',
          }}
        >
          {downloading ? 'Descargando...' : '📥 Descargar PDF'}
        </button>
      </div>

      <InvoiceCard 
        invoice={invoice} 
        showGroomerInfo={false}
        showCommissionInfo={true}
        showPaymentNote={false}
      />

      <button
        onClick={() => navigate(-1)}
        style={{ marginTop: 24, background: 'transparent', border: 'none', color: 'var(--primary, #d96c5f)', fontWeight: 800, cursor: 'pointer', fontSize: 14 }}
      >
        ← Volver
      </button>
    </div>
  );
}

