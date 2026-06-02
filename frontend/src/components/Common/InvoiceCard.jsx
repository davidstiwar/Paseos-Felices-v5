import React from 'react';

/**
 * InvoiceCard - Componente reutilizable para mostrar facturas con estilo profesional
 * @param {Object} invoice - Datos de la factura
 * @param {string} invoice.invoice_number - Número de factura
 * @param {string} invoice.client_name - Nombre del cliente
 * @param {string} invoice.client_email - Email del cliente
 * @param {string} invoice.pet_name - Nombre de la mascota
 * @param {number} invoice.pet_id - ID de la mascota
 * @param {string} invoice.groomer_name - Nombre del groomer
 * @param {string} invoice.groomer_email - Email del groomer
 * @param {string} invoice.service_name - Nombre del servicio
 * @param {number} invoice.subtotal - Subtotal
 * @param {number} invoice.total - Total
 * @param {string} invoice.status - Estado (paid, pending, cancelled)
 * @param {number} invoice.groomer_percentage - Porcentaje del groomer
 * @param {number} invoice.platform_percentage - Porcentaje de la plataforma
 * @param {number} invoice.groomer_amount - Monto del groomer
 * @param {number} invoice.platform_amount - Monto de la plataforma
 * @param {boolean} showGroomerInfo - Mostrar información del groomer (default: true)
 * @param {boolean} showCommissionInfo - Mostrar información de comisiones (default: false)
 * @param {boolean} showPaymentNote - Mostrar nota de pago (default: true)
 */
const InvoiceCard = ({ 
  invoice, 
  showGroomerInfo = true, 
  showCommissionInfo = false,
  showPaymentNote = true 
}) => {
  const statusLabel = (s) => {
    if (s === 'paid') return 'Pagada';
    if (s === 'cancelled') return 'Cancelada';
    return 'Pendiente';
  };

  const getStatusColor = (s) => {
    if (s === 'paid') return '#16a34a';
    if (s === 'cancelled') return '#b91c1c';
    return '#f59e0b';
  };

  const getStatusBg = (s) => {
    if (s === 'paid') return '#dcfce7';
    if (s === 'cancelled') return '#fee2e2';
    return '#fef3c7';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div style={styles.container}>
      {/* Header con logo y número de factura */}
      <div style={styles.header}>
        <div style={styles.logoSection}>
          <img 
            src="/img/gato-480.png" 
            alt="Paseos Felices" 
            style={styles.logo}
          />
          <div style={styles.companyInfo}>
            <h2 style={styles.companyName}>Paseos Felices</h2>
            <p style={styles.companyTagline}>El mejor cuidado para tu mascota</p>
          </div>
        </div>
        <div style={styles.invoiceNumberSection}>
          <div style={styles.invoiceNumberLabel}>Factura</div>
          <div style={styles.invoiceNumber}>#{invoice.invoice_number || 'N/A'}</div>
          <div style={styles.invoiceDate}>
            {formatDate(invoice.issued_at)}
          </div>
        </div>
      </div>

      {/* Badge de estado */}
      <div style={styles.statusBadgeContainer}>
        <span style={{
          ...styles.statusBadge,
          backgroundColor: getStatusBg(invoice.status),
          color: getStatusColor(invoice.status)
        }}>
          {statusLabel(invoice.status)}
        </span>
      </div>

      {/* Información del cliente */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Información del Cliente</h3>
        <div style={styles.infoGrid}>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Cliente:</span>
            <span style={styles.infoValue}>{invoice.client_name || invoice.client_email}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Mascota:</span>
            <span style={styles.infoValue}>{invoice.pet_name || `Pet #${invoice.pet_id}`}</span>
          </div>
          {showGroomerInfo && (
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Groomer:</span>
              <span style={styles.infoValue}>{invoice.groomer_name || invoice.groomer_email || 'Sin asignar'}</span>
            </div>
          )}
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Servicio:</span>
            <span style={styles.infoValue}>{invoice.service_name}</span>
          </div>
        </div>
      </div>

      {/* Detalles de pago */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Detalles de Pago</h3>
        <div style={styles.paymentDetails}>
          <div style={styles.paymentRow}>
            <span style={styles.paymentLabel}>Subtotal:</span>
            <span style={styles.paymentValue}>${Number(invoice.subtotal || 0).toFixed(2)}</span>
          </div>
          <div style={styles.paymentRowTotal}>
            <span style={styles.paymentLabelTotal}>Total:</span>
            <span style={styles.paymentValueTotal}>${Number(invoice.total || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Información de comisiones (solo para admin/groomer) */}
      {showCommissionInfo && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Distribución de Ingresos</h3>
          <div style={styles.commissionGrid}>
            {invoice.platform_percentage != null && (
              <div style={styles.commissionItem}>
                <span style={styles.commissionLabel}>% Plataforma:</span>
                <span style={styles.commissionValue}>{invoice.platform_percentage}%</span>
              </div>
            )}
            {invoice.groomer_percentage != null && (
              <div style={styles.commissionItem}>
                <span style={styles.commissionLabel}>% Groomer:</span>
                <span style={styles.commissionValue}>{invoice.groomer_percentage}%</span>
              </div>
            )}
            {invoice.platform_amount != null && (
              <div style={styles.commissionItem}>
                <span style={styles.commissionLabel}>Ingreso Plataforma:</span>
                <span style={styles.commissionValue}>${Number(invoice.platform_amount).toFixed(2)}</span>
              </div>
            )}
            {invoice.groomer_amount != null && (
              <div style={styles.commissionItem}>
                <span style={styles.commissionLabel}>Ingreso Groomer:</span>
                <span style={styles.commissionValue}>${Number(invoice.groomer_amount).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nota de pago */}
      {showPaymentNote && (
        <div style={styles.noteSection}>
          <p style={styles.noteText}>
            💰 El pago de esta factura se realiza de forma presencial y en efectivo.
          </p>
        </div>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        <p style={styles.footerText}>
          Gracias por confiar en Paseos Felices. ¡Tu mascota merece lo mejor!
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    padding: 32,
    maxWidth: 900,
    margin: '0 auto',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottom: '2px solid #f3f4f6',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    width: 80,
    height: 80,
    objectFit: 'contain',
    borderRadius: 12,
  },
  companyInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  companyName: {
    margin: 0,
    fontSize: 28,
    fontWeight: 800,
    color: '#d96c5f',
    lineHeight: 1.2,
  },
  companyTagline: {
    margin: '4px 0 0 0',
    fontSize: 14,
    color: '#6b7280',
    fontWeight: 500,
  },
  invoiceNumberSection: {
    textAlign: 'right',
  },
  invoiceNumberLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  invoiceNumber: {
    fontSize: 32,
    fontWeight: 900,
    color: '#1f2937',
    lineHeight: 1.2,
  },
  invoiceDate: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statusBadgeContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: 24,
  },
  statusBadge: {
    padding: '8px 16px',
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    margin: '0 0 16px 0',
    fontSize: 16,
    fontWeight: 700,
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: 500,
  },
  paymentDetails: {
    background: '#f9fafb',
    borderRadius: 12,
    padding: 20,
  },
  paymentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #e5e7eb',
  },
  paymentRowTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 0 8px 0',
    marginTop: 8,
    borderTop: '2px solid #d96c5f',
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: 600,
  },
  paymentValue: {
    fontSize: 18,
    color: '#1f2937',
    fontWeight: 700,
  },
  paymentLabelTotal: {
    fontSize: 18,
    color: '#1f2937',
    fontWeight: 800,
  },
  paymentValueTotal: {
    fontSize: 28,
    color: '#d96c5f',
    fontWeight: 900,
  },
  commissionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
  },
  commissionItem: {
    background: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    border: '1px solid #bbf7d0',
  },
  commissionLabel: {
    fontSize: 12,
    color: '#166534',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  commissionValue: {
    fontSize: 18,
    color: '#15803d',
    fontWeight: 700,
  },
  noteSection: {
    background: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    border: '1px solid #fde68a',
  },
  noteText: {
    margin: 0,
    fontSize: 14,
    color: '#92400e',
    fontWeight: 500,
  },
  footer: {
    marginTop: 32,
    paddingTop: 24,
    borderTop: '2px solid #f3f4f6',
    textAlign: 'center',
  },
  footerText: {
    margin: 0,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: 500,
  },
};

export default InvoiceCard;
