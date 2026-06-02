import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Document, Packer, Paragraph, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import ExportReportButtons from '../../../components/Common/ExportReportButtons';
import '../../../estilos/ClientPanel.css';
import '../../../estilos/GroomerHistory.css';
import { getGroomerAppointments } from '../../../api/appointments';
import { getGroomerProfile } from '../../../api/groomer';
import { getReviewsByGroomer } from '../../../api/reviews';
import { getAllServices } from '../../../api/servicesCatalog';

const GroomerHistory = () => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState('week');
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Estilos de tabla (copiados del enfoque de "Mascotas atendidas": estilos inline para evitar conflictos CSS)
  const tableStyles = {
    tableContainer: {
      width: '100%',
      overflowX: 'auto',
      marginTop: '22px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: '20px',
      boxShadow: 'var(--shadow-sm)',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      backgroundColor: 'var(--bg-main)',
      borderRadius: '20px',
      overflow: 'hidden',
    },
    th: {
      backgroundColor: 'var(--bg-hover)',
      padding: '12px',
      textAlign: 'left',
      fontWeight: 800,
      borderBottom: '2px solid var(--border-color)',
      color: 'var(--text-primary)',
      whiteSpace: 'nowrap',
      fontSize: '12px',
      textTransform: 'uppercase',
      letterSpacing: '0.6px',
    },
    td: {
      padding: '12px',
      borderBottom: '1px solid var(--border-color)',
      color: 'var(--text-primary)',
      verticalAlign: 'middle',
      fontSize: '14px',
    },
    row: {
      cursor: 'default',
      transition: 'backgroundColor 0.2s',
    },
    rowHover: {
      backgroundColor: 'var(--bg-hover)',
    },
    emptyState: {
      textAlign: 'center',
      padding: '24px',
      color: 'var(--text-tertiary)',
    },
    actionBtn: {
      padding: '8px 12px',
      border: '1px solid var(--border-color)',
      background: 'transparent',
      color: 'var(--text-primary)',
      borderRadius: '10px',
      fontSize: '13px',
      cursor: 'pointer',
      fontWeight: 700,
      transition: 'all 0.2s',
      whiteSpace: 'nowrap',
    },
  };

  const getStatusBadgeStyle = (status) => {
    const base = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '6px 12px',
      borderRadius: '999px',
      fontSize: '12px',
      fontWeight: 800,
      border: '1px solid transparent',
      whiteSpace: 'nowrap',
    };
    const key = (status || '').toLowerCase();
    if (key.includes('complet')) {
      return { ...base, background: 'rgba(34, 197, 94, 0.14)', color: '#16a34a', borderColor: 'rgba(34, 197, 94, 0.30)' };
    }
    if (key.includes('cancel')) {
      return { ...base, background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', borderColor: 'rgba(239, 68, 68, 0.30)' };
    }
    return { ...base, background: 'rgba(245, 158, 11, 0.14)', color: '#b45309', borderColor: 'rgba(245, 158, 11, 0.30)' };
  };

  // Cargar historial desde appointments-service
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const [appointments, groomerProfile, servicesCatalog] = await Promise.all([
          getGroomerAppointments(),
          getGroomerProfile(),
          getAllServices(true).catch(() => []),
        ]);

        // Mapa: nombre de servicio -> duración (minutos)
        const durationByServiceName = (servicesCatalog || []).reduce((acc, svc) => {
          const name = (svc?.name || '').trim();
          const mins = Number(svc?.duration_minutes);
          if (name) acc[name] = Number.isFinite(mins) ? mins : 0;
          return acc;
        }, {});

        // Si no existe perfil groomer, no hay forma de asociar reseñas por groomer_id
        const groomerId = groomerProfile?.id;
        let reviewByAppointmentId = {};
        if (groomerId) {
          const reviews = await getReviewsByGroomer(groomerId);
          reviewByAppointmentId = reviews.reduce((acc, r) => {
            if (r.appointment_id != null) {
              acc[r.appointment_id] = {
                rating: r.rating ?? 0,
                comment: r.comment ?? '',
              };
            }
            return acc;
          }, {});
        }

        const completedAppointments = appointments.filter(appt => 
          appt.status === 'completed' || appt.status === 'cancelled'
        );
        const transformedHistory = completedAppointments.map(appt => ({
          id: appt.id,
          date: appt.date,
          petName: appt.pet_name || `Pet #${appt.pet_id}`,
          owner: appt.client_name || appt.client_email,
          service: appt.service,
          durationMinutes: durationByServiceName[(appt.service || '').trim()] || 0,
          duration: (durationByServiceName[(appt.service || '').trim()] || 0)
            ? `${durationByServiceName[(appt.service || '').trim()]} min`
            : '-',
          earnings: appt.price ? `$${appt.price}` : '$0',
          // Si no hay reseña, no inventamos: 0 = "Sin calificar"
          rating: reviewByAppointmentId[appt.id]?.rating || 0,
          reviewComment: reviewByAppointmentId[appt.id]?.comment || '',
          status: appt.status === 'completed' ? 'Completado' : 'Cancelado',
        }));
        setHistoryData(transformedHistory);
      } catch (err) {
        console.error('Error cargando historial:', err);
        setHistoryData([]);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);
  const totalEarnings = historyData.reduce((sum, item) => {
    const amount = parseFloat(item.earnings.replace('$', ''));
    return sum + amount;
  }, 0);

  const rated = historyData.filter(i => i.rating > 0);
  const averageRating = rated.length > 0
    ? (rated.reduce((sum, item) => sum + item.rating, 0) / rated.length).toFixed(1)
    : 'Sin calificar';
  const completedServices = historyData.filter(item => item.status === 'Completado').length;

  // Horas trabajadas (desde BD): suma de duraciones de servicios completados
  const totalMinutesWorked = historyData
    .filter(item => item.status === 'Completado')
    .reduce((sum, item) => sum + (Number(item.durationMinutes) || 0), 0);
  const hoursWorked = totalMinutesWorked > 0
    ? `${(totalMinutesWorked / 60).toFixed(1)} hrs`
    : '0 hrs';

  const renderRating = (rating) => {
    if (rating === 0) return 'Sin calificar';
    return '⭐'.repeat(rating);
  };

  if (loading) {
    return <div className="groomer-history"><p>Cargando historial...</p></div>;
  }

  // ==================== EXPORT FUNCTIONS ====================

  const exportToExcel = () => {
    const wsData = [
      ['HISTORIAL DE SERVICIOS - PASEOS FELICES'],
      [''],
      ['Fecha', 'Mascota', 'Dueño', 'Servicio', 'Duración', 'Ganancias', 'Rating', 'Estado'],
      ...historyData.map(item => [
        new Date(item.date).toLocaleDateString('es-ES'),
        item.petName,
        item.owner,
        item.service,
        item.duration,
        item.earnings,
        item.rating,
        item.status,
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Historial');

    XLSX.writeFile(wb, 'Historial_Servicios.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Historial de Servicios - Paseos Felices', 20, 20);

    const tableData = historyData.map(item => [
      new Date(item.date).toLocaleDateString('es-ES'),
      item.petName,
      item.owner,
      item.service,
      item.duration,
      item.earnings,
      renderRating(item.rating),
      item.status,
    ]);

    doc.autoTable({
      startY: 30,
      head: [['Fecha', 'Mascota', 'Dueño', 'Servicio', 'Duración', 'Ganancias', 'Rating', 'Estado']],
      body: tableData,
    });

    doc.save('Historial_Servicios.pdf');
  };

  const exportToWord = () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            children: ['Historial de Servicios - Paseos Felices'],
          }),
          new Paragraph({ children: [''] }),
          ...historyData.map(item =>
            new Paragraph({
              children: [
                `${new Date(item.date).toLocaleDateString('es-ES')} | ${item.petName} (${item.owner}) | ${item.service} | ${item.earnings} | ${renderRating(item.rating)}`,
              ],
            })
          ),
        ],
      }],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, 'Historial_Servicios.docx');
    });
  };

  // ==================== END EXPORT ====================

  return (
    <div className="groomer-history">
      <div className="history-header">
        <h1>📜 Historial de Servicios</h1>
        <p>Registro completo de todos los servicios realizados</p>
      </div>

      {/* Export Buttons - Reusable Component */}
      <ExportReportButtons
        onExportExcel={exportToExcel}
        onExportPDF={exportToPDF}
        onExportWord={exportToWord}
        title="Exportar Informe"
      />

      {/* Summary Cards */}
      <div className="history-summary">
        <div className="summary-card">
          <span className="summary-icon">💰</span>
          <div className="summary-content">
            <p className="summary-label">Ganancias Total</p>
            <p className="summary-value">${totalEarnings}</p>
          </div>
        </div>
        <div className="summary-card">
          <span className="summary-icon">⭐</span>
          <div className="summary-content">
            <p className="summary-label">Rating Promedio</p>
            <p className="summary-value">{averageRating}</p>
          </div>
        </div>
        <div className="summary-card">
          <span className="summary-icon">✅</span>
          <div className="summary-content">
            <p className="summary-label">Servicios Completados</p>
            <p className="summary-value">{completedServices}</p>
          </div>
        </div>
        <div className="summary-card">
          <span className="summary-icon">⏱️</span>
          <div className="summary-content">
            <p className="summary-label">Horas Trabajadas</p>
            <p className="summary-value">{hoursWorked}</p>
          </div>
        </div>
      </div>

      {/* Filter Period */}
      <div className="filter-section">
        <label>Período:</label>
        <div className="period-buttons">
          <button 
            className={`period-btn ${filterPeriod === 'day' ? 'active' : ''}`}
            onClick={() => setFilterPeriod('day')}
          >
            Hoy
          </button>
          <button 
            className={`period-btn ${filterPeriod === 'week' ? 'active' : ''}`}
            onClick={() => setFilterPeriod('week')}
          >
            Esta Semana
          </button>
          <button 
            className={`period-btn ${filterPeriod === 'month' ? 'active' : ''}`}
            onClick={() => setFilterPeriod('month')}
          >
            Este Mes
          </button>
          <button 
            className={`period-btn ${filterPeriod === 'all' ? 'active' : ''}`}
            onClick={() => setFilterPeriod('all')}
          >
            Todo
          </button>
        </div>
      </div>

      {/* History Table */}
      <div style={tableStyles.tableContainer}>
        <table style={tableStyles.table}>
          <thead>
            <tr>
              <th style={tableStyles.th}>Fecha</th>
              <th style={tableStyles.th}>Mascota</th>
              <th style={tableStyles.th}>Dueño</th>
              <th style={tableStyles.th}>Servicio</th>
              <th style={tableStyles.th}>Duración</th>
              <th style={tableStyles.th}>Ganancias</th>
              <th style={tableStyles.th}>Rating</th>
              <th style={tableStyles.th}>Estado</th>
              <th style={tableStyles.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {historyData.length > 0 ? (
              historyData.map(record => (
                <tr
                  key={record.id}
                  style={tableStyles.row}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = tableStyles.rowHover.backgroundColor)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                >
                  <td style={{ ...tableStyles.td, whiteSpace: 'nowrap' }}>{new Date(record.date).toLocaleDateString('es-ES')}</td>
                  <td style={tableStyles.td}>{record.petName}</td>
                  <td style={tableStyles.td}>{record.owner}</td>
                  <td style={tableStyles.td}>{record.service}</td>
                  <td style={{ ...tableStyles.td, whiteSpace: 'nowrap' }}>{record.duration}</td>
                  <td style={{ ...tableStyles.td, whiteSpace: 'nowrap', fontWeight: 800, color: 'var(--primary)' }}>{record.earnings}</td>
                  <td style={{ ...tableStyles.td, whiteSpace: 'nowrap' }}>
                    <span className="rating-stars">{renderRating(record.rating)}</span>
                  </td>
                  <td style={{ ...tableStyles.td, whiteSpace: 'nowrap' }}>
                    <span style={getStatusBadgeStyle(record.status)}>{record.status}</span>
                  </td>
                  <td style={{ ...tableStyles.td, whiteSpace: 'nowrap' }}>
                    <button
                      style={tableStyles.actionBtn}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--primary)';
                        e.currentTarget.style.borderColor = 'var(--primary)';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                      onClick={() => setSelectedRecord(record)}
                    >
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} style={tableStyles.emptyState}>
                  📭 No hay servicios en el historial
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

       {/* Detail Modal - usando el mismo estilo que el resto de la app */}
       {selectedRecord && (
         <div className="modal-overlay" onClick={() => setSelectedRecord(null)}>
           <div className="modal-content" onClick={(e) => e.stopPropagation()}>
             <div className="modal-header">
               <h2>Detalles del Servicio</h2>
               <button className="modal-close" onClick={() => setSelectedRecord(null)}>×</button>
             </div>

             <div className="modal-body">
               <div className="detail-row">
                 <span className="detail-label">Fecha:</span>
                 <span className="detail-value">{new Date(selectedRecord.date).toLocaleDateString('es-ES')}</span>
               </div>
               <div className="detail-row">
                 <span className="detail-label">Mascota:</span>
                 <span className="detail-value">{selectedRecord.petName}</span>
               </div>
               <div className="detail-row">
                 <span className="detail-label">Dueño:</span>
                 <span className="detail-value">{selectedRecord.owner}</span>
               </div>
               <div className="detail-row">
                 <span className="detail-label">Servicio:</span>
                 <span className="detail-value">{selectedRecord.service}</span>
               </div>
               <div className="detail-row">
                 <span className="detail-label">Duración:</span>
                 <span className="detail-value">{selectedRecord.duration}</span>
               </div>
               <div className="detail-row">
                 <span className="detail-label">Ganancias:</span>
                 <span className="detail-value">{selectedRecord.earnings}</span>
               </div>
               <div className="detail-row">
                 <span className="detail-label">Calificación del Cliente:</span>
                 <span className="detail-value">{renderRating(selectedRecord.rating)}</span>
               </div>
               <div className="detail-row">
                 <span className="detail-label">Comentario del Cliente:</span>
                <span className="detail-value">{selectedRecord.reviewComment || 'Sin comentario'}</span>
               </div>
             </div>

             <div className="modal-footer">
               <button className="btn-cancel" onClick={() => setSelectedRecord(null)}>
                 Cerrar
               </button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
};

export default GroomerHistory;
