import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Document, Packer, Paragraph, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import ExportReportButtons from '../../../components/Common/ExportReportButtons';
import '../../../estilos/ClientPanel.css';
import '../../../estilos/GroomerServices.css';
import { getGroomerAppointments, updateAppointment } from '../../../api/appointments';
import { getAllServices } from '../../../api/servicesCatalog';
import { getGroomerProfile, addServiceToGroomer, removeServiceFromGroomer } from '../../../api/groomer';
import { useToast } from '../../../components/Context/ToastContext';
import ModalDialog from '../../../components/Common/ModalDialog';

const GroomerServices = () => {
  const { showError, showSuccess } = useToast();
  const [services, setServices] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [offeredServices, setOfferedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('todos');
  const [selectedService, setSelectedService] = useState(null);
  const [showAvailableModal, setShowAvailableModal] = useState(false);
  const [activeView, setActiveView] = useState('citas');
  const [searchTerm, setSearchTerm] = useState('');
  const [removeConfirm, setRemoveConfirm] = useState({ isOpen: false, serviceId: null });

  // Cargar citas del groomer desde appointments-service y servicios disponibles del catálogo
  useEffect(() => {
    const loadData = async () => {
      try {
        // Paralelizar todas las llamadas
        const [appointments, catalogServices, groomerData] = await Promise.all([
          getGroomerAppointments(),
          getAllServices(),
          getGroomerProfile()
        ]);
        
        // Transformar datos de appointments al formato esperado
        const transformedServices = appointments.map(appt => ({
          id: appt.id,
          petName: appt.pet_name || `Pet #${appt.pet_id}`,
          owner: appt.client_name || appt.client_email,
          service: appt.service,
          time: appt.time,
          status: getStatusLabel(appt.status),
          statusColor: getStatusColorClass(appt.status),
          breed: appt.pet_breed || 'N/A',
          weight: appt.pet_weight || 'N/A',
          notes: appt.notes || '',
          price: appt.price,
        }));
        
        setServices(transformedServices);
        setAvailableServices(catalogServices || []);
        if (groomerData && groomerData.services) {
          setOfferedServices(groomerData.services);
        }
      } catch (err) {
        console.error('Error cargando datos:', err);
        setServices([]);
        setAvailableServices([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'Pendiente por confirmar',
      'confirmed': 'Confirmado',
      'in_progress': 'En ejecución',
      'completed': 'Terminado',
      'cancelled': 'Cancelado',
    };
    return labels[status] || status;
  };

  const getStatusColorClass = (status) => {
    const colors = {
      'pending': 'pendiente_confirmar',
      'confirmed': 'confirmado',
      'in_progress': 'en_ejecucion',
      'completed': 'terminado',
      'cancelled': 'cancelado',
    };
    return colors[status] || 'pendiente_confirmar';
  };

  // availableServices ya está declarado arriba

  const filteredServices = services
    .filter(s => {
      if (filterStatus === 'todos') return true;
      if (filterStatus === 'pendiente_confirmar') return s.status === 'Pendiente por confirmar';
      if (filterStatus === 'en_ejecucion') return s.status === 'En ejecución';
      if (filterStatus === 'terminado') return s.status === 'Terminado';
      if (filterStatus === 'cancelado') return s.status === 'Cancelado';
      return s.status.toLowerCase() === filterStatus;
    })
    .filter(s => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase().trim();
      return (
        (s.petName && s.petName.toLowerCase().includes(term)) ||
        (s.owner && s.owner.toLowerCase().includes(term))
      );
    });

  // Métricas destacadas del Resumen del Día
  const totalMascotas = new Set(services.map(s => s.petName)).size;
  const serviciosRealizados = services.filter(s => s.status === 'Terminado').length;

  const ownerCounts = services.reduce((acc, s) => {
    acc[s.owner] = (acc[s.owner] || 0) + 1;
    return acc;
  }, {});
  const clienteFrecuente = Object.keys(ownerCounts).length > 0 
    ? Object.entries(ownerCounts).sort((a, b) => b[1] - a[1])[0][0]
    : 'N/A';

  // ==================== EXPORT FUNCTIONS ====================

  const exportCitasToExcel = () => {
    const data = filteredServices.map(s => [
      s.time,
      s.petName,
      s.owner,
      s.service,
      s.status,
      s.breed,
      s.weight,
      s.notes || '',
    ]);

    const wsData = [
      ['CITAS DEL DÍA - PASEOS FELICES'],
      [`Fecha de exportación: ${new Date().toLocaleDateString('es-ES')}`],
      [''],
      ['Hora', 'Mascota', 'Dueño', 'Servicio', 'Estado', 'Raza', 'Peso', 'Notas'],
      ...data,
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Citas');

    XLSX.writeFile(wb, 'Citas_del_Dia.xlsx');
  };

  const exportCitasToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Citas del Día - Paseos Felices', 20, 20);

    const tableData = filteredServices.map(s => [
      s.time,
      s.petName,
      s.owner,
      s.service,
      s.status,
    ]);

    doc.autoTable({
      startY: 30,
      head: [['Hora', 'Mascota', 'Dueño', 'Servicio', 'Estado']],
      body: tableData,
    });

    doc.save('Citas_del_Dia.pdf');
  };

  const exportCitasToWord = () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({ heading: HeadingLevel.TITLE, children: ['Citas del Día - Paseos Felices'] }),
          new Paragraph({ children: [`Exportado: ${new Date().toLocaleDateString('es-ES')}`] }),
          new Paragraph({ children: [''] }),
          ...filteredServices.map(s =>
            new Paragraph({
              children: [`${s.time} | ${s.petName} (${s.owner}) | ${s.service} | ${s.status}`],
            })
          ),
        ],
      }],
    });

    Packer.toBlob(doc).then(blob => saveAs(blob, 'Citas_del_Dia.docx'));
  };

  const exportPortfolioToExcel = () => {
    const data = offeredServices.map(s => [s.name, `${s.duration_minutes} minutos`, `$${s.base_price}`, s.description || '']);

    const wsData = [
      ['SERVICIOS QUE OFREZCO'],
      [''],
      ['Nombre', 'Duración', 'Precio', 'Descripción'],
      ...data,
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Portafolio');

    XLSX.writeFile(wb, 'Servicios_Que_Ofrezco.xlsx');
  };

  // For simplicity, portfolio PDF and Word can be similar
  const exportPortfolioToPDF = () => {
    const doc = new jsPDF();
    doc.text('Servicios que Ofrezco', 20, 20);
    const tableData = offeredServices.map(s => [s.name, `${s.duration_minutes} minutos`, `$${s.base_price}`]);
    doc.autoTable({ startY: 30, head: [['Nombre', 'Duración', 'Precio']], body: tableData });
    doc.save('Servicios_Que_Ofrezco.pdf');
  };

  const exportPortfolioToWord = () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({ heading: HeadingLevel.TITLE, children: ['Servicios que Ofrezco'] }),
          ...offeredServices.map(s => new Paragraph({ children: [`• ${s.name} - ${s.duration_minutes} minutos - $${s.base_price}`] })),
        ],
      }],
    });
    Packer.toBlob(doc).then(blob => saveAs(blob, 'Servicios_Que_Ofrezco.docx'));
  };

  // ==================== END EXPORT ====================

  const handleAddService = async (serviceId) => {
    try {
      const groomerData = await getGroomerProfile();
      if (!groomerData || !groomerData.id) {
        showError('Primero debes crear tu perfil de groomer');
        return;
      }
      await addServiceToGroomer(groomerData.id, serviceId);
      // Recargar servicios del groomer
      const updatedGroomerData = await getGroomerProfile();
      if (updatedGroomerData && updatedGroomerData.services) {
        setOfferedServices(updatedGroomerData.services);
      }
      showSuccess('Servicio agregado exitosamente');
    } catch (err) {
      console.error('Error agregando servicio:', err);
      showError(err.message || 'Error al agregar servicio');
    }
  };

  const handleRemoveService = async (serviceId) => {
    try {
      const groomerData = await getGroomerProfile();
      if (!groomerData || !groomerData.id) return;
      await removeServiceFromGroomer(groomerData.id, serviceId);
      // Recargar servicios del groomer
      const updatedGroomerData = await getGroomerProfile();
      if (updatedGroomerData && updatedGroomerData.services) {
        setOfferedServices(updatedGroomerData.services);
      }
      showSuccess('Servicio removido exitosamente');
    } catch (err) {
      console.error('Error removiendo servicio:', err);
      showError(err.message || 'Error al remover servicio');
    }
  };

  const handleStatusChange = async (serviceId, newStatus) => {
    // newStatus llega como "confirmado" | "en_ejecucion" | "terminado" | "cancelado"
    // (valores internos de UI). El backend espera: confirmed | in_progress | completed | cancelled.
    const statusMap = {
      confirmado: 'confirmed',
      en_ejecucion: 'in_progress',
      terminado: 'completed',
      cancelado: 'cancelled',
      pendiente_confirmar: 'pending',
    };
    
    try {
      const backendStatus = statusMap[newStatus];
      if (!backendStatus) {
        throw new Error(`Estado inválido: ${newStatus}`);
      }

      await updateAppointment(serviceId, { status: backendStatus });
      // Recargar citas del groomer
      const appointments = await getGroomerAppointments();
      const transformedServices = appointments.map(appt => ({
        id: appt.id,
        petName: appt.pet_name || `Pet #${appt.pet_id}`,
        owner: appt.client_name || appt.client_email,
        service: appt.service,
        time: appt.time,
        status: getStatusLabel(appt.status),
        statusColor: getStatusColorClass(appt.status),
        breed: appt.pet_breed || 'N/A',
        weight: appt.pet_weight || 'N/A',
        notes: appt.notes || '',
        price: appt.price,
      }));
      setServices(transformedServices);
      showSuccess('Estado actualizado exitosamente');
    } catch (error) {
      showError(error.message || 'Error al actualizar el estado');
    }
  };

  // Agregar un servicio del catálogo del admin al portafolio del groomer
  const handleAddAvailableService = async (serviceType) => {
    // Evitar duplicados
    const alreadyExists = offeredServices.some(s => s.name === serviceType.name);
    if (alreadyExists) {
      showError('Este servicio ya lo tienes en tu portafolio.');
      setShowAvailableModal(false);
      return;
    }

    await handleAddService(serviceType.id);
    setShowAvailableModal(false);
  };

  // Eliminar un servicio del portafolio del groomer
  const handleRemoveOfferedService = async (id) => {
    setRemoveConfirm({ isOpen: true, serviceId: id });
  };

  const confirmRemove = async () => {
    const { serviceId } = removeConfirm;
    try {
      await handleRemoveService(serviceId);
      setRemoveConfirm({ isOpen: false, serviceId: null });
    } catch (err) {
      setRemoveConfirm({ isOpen: false, serviceId: null });
    }
  };

  if (loading) {
    return <div className="groomer-services"><p>Cargando servicios...</p></div>;
  }

  return (
    <div className="groomer-services">
      {/* Header */}
      <div className="services-header">
        <div>
          <h1>📋 Mis Servicios</h1>
          <p>Gestiona tus servicios ofrecidos y tus citas del día</p>
        </div>

        {activeView === 'ofrecidos' && (
          <button 
            className="btn-add-service"
            onClick={() => setShowAvailableModal(true)}
          >
            + Agregar Servicio Disponible
          </button>
        )}
      </div>

      {/* View Switch */}
      <div className="view-switch">
        <button 
          className={`switch-btn ${activeView === 'citas' ? 'active' : ''}`}
          onClick={() => setActiveView('citas')}
        >
          Citas del Día
        </button>
        <button 
          className={`switch-btn ${activeView === 'ofrecidos' ? 'active' : ''}`}
          onClick={() => setActiveView('ofrecidos')}
        >
          Servicios que Ofrezco
        </button>
      </div>

      {/* ==================== VISTA: SERVICIOS QUE OFREZCO ==================== */}
      {activeView === 'ofrecidos' && (
        <div className="offered-services-section">
           <h2 className="section-title">Servicios que Ofrezco</h2>

            {/* Export Buttons - Reusable Component */}
            <ExportReportButtons
              onExportExcel={exportPortfolioToExcel}
              onExportPDF={exportPortfolioToPDF}
              onExportWord={exportPortfolioToWord}
              title="Exportar Portafolio"
            />

           {offeredServices.length > 0 ? (
            <div className="offered-services-grid">
              {offeredServices.map((service) => (
                <div key={service.id} className="offered-service-card">
                  <button 
                    className="delete-offered-btn"
                    onClick={() => handleRemoveOfferedService(service.id)}
                    title="Quitar de mi portafolio"
                  >
                    ×
                  </button>

                  <div className="service-card-header">
                    <h3>{service.name}</h3>
                    <span className="service-price">${service.base_price}</span>
                  </div>
                  <p className="service-duration">{service.duration_minutes} minutos</p>
                  <p className="service-description">{service.description || 'Sin descripción'}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-offered">
              <p>Aún no has agregado ningún servicio a tu portafolio.</p>
              <p>Haz clic en el botón de arriba para agregar servicios que el administrador ha creado.</p>
            </div>
          )}
        </div>
      )}

      {/* ==================== VISTA: CITAS DEL DÍA ==================== */}
      {activeView === 'citas' && (
        <div className="citas-section">
          <h2 className="section-title">Citas del Día</h2>

          {/* Search Bar */}
          <div className="search-bar">
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por nombre de mascota o dueño..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

           {/* Export Buttons - Reusable Component */}
           <ExportReportButtons
             onExportExcel={exportCitasToExcel}
             onExportPDF={exportCitasToPDF}
             onExportWord={exportCitasToWord}
             title="Exportar Citas"
           />

          {/* Filters */}
          <div className="filters-section">
            <div className="filter-group">
              <label>Filtrar por estado:</label>
              <div className="filter-buttons">
              <button className={`filter-btn ${filterStatus === 'todos' ? 'active' : ''}`} onClick={() => setFilterStatus('todos')}>
                Todos ({services.length})
              </button>
              <button className={`filter-btn ${filterStatus === 'pendiente_confirmar' ? 'active' : ''}`} onClick={() => setFilterStatus('pendiente_confirmar')}>
                Pendiente por confirmar
              </button>
              <button className={`filter-btn ${filterStatus === 'confirmado' ? 'active' : ''}`} onClick={() => setFilterStatus('confirmado')}>
                Confirmados
              </button>
              <button className={`filter-btn ${filterStatus === 'en_ejecucion' ? 'active' : ''}`} onClick={() => setFilterStatus('en_ejecucion')}>
                En ejecución
              </button>
              <button className={`filter-btn ${filterStatus === 'terminado' ? 'active' : ''}`} onClick={() => setFilterStatus('terminado')}>
                Terminados
              </button>
              <button className={`filter-btn ${filterStatus === 'cancelado' ? 'active' : ''}`} onClick={() => setFilterStatus('cancelado')}>
                Cancelados
              </button>
              </div>
            </div>

            <div className="sort-group">
              <label>Ordenar por:</label>
              <select className="sort-select">
                <option>Hora más cercana</option>
                <option>Más reciente</option>
                <option>Tipo de servicio</option>
              </select>
            </div>
          </div>

          {/* Services List - Table */}
          <div className="services-list">
            {filteredServices.length > 0 ? (
              <table className="services-table">
                <thead>
                  <tr>
                    <th>Mascota</th>
                    <th>Cliente</th>
                    <th>Servicio</th>
                    <th>Hora</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map(service => (
                    <tr key={service.id}>
                      <td>{service.petName}</td>
                      <td>{service.owner}</td>
                      <td>{service.service}</td>
                      <td>{service.time}</td>
                      <td>
                        <span className={`status-badge status-${service.statusColor}`}>
                          {service.status}
                        </span>
                      </td>
                      <td>
                        {service.status === 'Pendiente por confirmar' && (
                          <button 
                            className="btn-action"
                            onClick={() => handleStatusChange(service.id, 'confirmado')}
                            title="Confirmar"
                          >
                            Confirmar
                          </button>
                        )}
                        {service.status === 'Confirmado' && (
                          <button 
                            className="btn-action"
                            onClick={() => handleStatusChange(service.id, 'en_ejecucion')}
                            title="Iniciar"
                          >
                            Iniciar
                          </button>
                        )}
                        {service.status === 'En ejecución' && (
                          <button 
                            className="btn-action"
                            onClick={() => handleStatusChange(service.id, 'terminado')}
                            title="Terminar"
                          >
                            Terminar
                          </button>
                        )}
                        <button 
                          className="btn-action"
                          onClick={() => setSelectedService(service)}
                          title="Detalles"
                        >
                          Detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <p>📭 No hay servicios con este filtro</p>
              </div>
            )}
          </div>

           {/* Daily Summary - Métricas Destacadas */}
           <div className="daily-summary">
             <h3>Resumen del Día</h3>
             <div className="summary-grid stats-highlights">
               {/* Total de Mascotas */}
               <div className="summary-item stat-mascotas">
                 <span className="summary-icon">🐾</span>
                 <span className="summary-label">Total de Mascotas</span>
                 <span className="summary-value">{totalMascotas}</span>
               </div>

               {/* Servicios Realizados */}
               <div className="summary-item stat-realizados">
                 <span className="summary-icon">📊</span>
                 <span className="summary-label">Servicios Realizados</span>
                 <span className="summary-value">{serviciosRealizados}</span>
               </div>

               {/* Cliente Frecuente */}
               <div className="summary-item stat-cliente">
                 <span className="summary-icon">⭐</span>
                 <span className="summary-label">Cliente Frecuente</span>
                 <span className="summary-value cliente-name">{clienteFrecuente}</span>
               </div>
             </div>
           </div>
        </div>
      )}

      {/* Modal para agregar servicios del catálogo del admin */}
      {showAvailableModal && (
        <div className="modal-overlay" onClick={() => setShowAvailableModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 Servicios Disponibles (Creados por el Admin)</h2>
              <button className="modal-close" onClick={() => setShowAvailableModal(false)}>×</button>
            </div>

            <div className="available-services-list">
              {availableServices.length > 0 ? (
                availableServices.map((service) => (
                  <div key={service.id} className="available-service-item">
                    <div className="available-service-info">
                      <h4>{service.name}</h4>
                      <p><strong>Duración:</strong> {service.duration_minutes} minutos</p>
                      <p><strong>Precio:</strong> ${service.base_price}</p>
                      <p className="service-description">{service.description || 'Sin descripción'}</p>
                    </div>
                    <button 
                      className="btn-add"
                      onClick={() => handleAddAvailableService(service)}
                    >
                      Agregar
                    </button>
                  </div>
                ))
              ) : (
                <p className="no-available">No hay servicios disponibles en este momento.</p>
              )}
            </div>

             <div className="modal-footer">
               <button className="btn-cancel" onClick={() => setShowAvailableModal(false)}>
                 Cerrar
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Modal de Detalles de la Cita */}
       {selectedService && (
         <div className="modal-overlay" onClick={() => setSelectedService(null)}>
           <div className="modal-content" onClick={e => e.stopPropagation()}>
             <div className="modal-header">
               <h2>📋 Detalles de la Cita</h2>
               <button className="modal-close" onClick={() => setSelectedService(null)}>×</button>
             </div>

             <div className="modal-body">
               <div className="info-grid">
                 <div className="info-item">
                   <span className="info-label">Mascota</span>
                   <span className="info-value">{selectedService.petName}</span>
                 </div>
                 <div className="info-item">
                   <span className="info-label">Dueño de la mascota</span>
                   <span className="info-value">{selectedService.owner}</span>
                 </div>
                 <div className="info-item">
                   <span className="info-label">Nombre del servicio</span>
                   <span className="info-value">{selectedService.service}</span>
                 </div>
                 <div className="info-item">
                   <span className="info-label">Precio</span>
                   <span className="info-value">${selectedService.price}</span>
                 </div>
                 <div className="info-item">
                   <span className="info-label">Hora</span>
                   <span className="info-value">{selectedService.time}</span>
                 </div>
                 <div className="info-item">
                   <span className="info-label">Raza</span>
                   <span className="info-value">{selectedService.breed}</span>
                 </div>
                 <div className="info-item">
                   <span className="info-label">Peso</span>
                   <span className="info-value">{selectedService.weight}</span>
                 </div>
                 <div className="info-item full-width">
                   <span className="info-label">Notas</span>
                   <span className="info-value">{selectedService.notes}</span>
                 </div>
                 <div className="info-item full-width">
                   <span className="info-label">Estado actual</span>
                   <span className={`info-value status-${selectedService.statusColor}`}>
                     {selectedService.status}
                   </span>
                 </div>
               </div>
             </div>

             <div className="modal-footer">
               <button className="btn-cancel" onClick={() => setSelectedService(null)}>
                 Cerrar
               </button>
             </div>
           </div>
         </div>
       )}
      <ModalDialog
        isOpen={removeConfirm.isOpen}
        onClose={() => setRemoveConfirm({ isOpen: false, serviceId: null })}
        title="Confirmar eliminación"
        actions={[
          { label: 'Cancelar', variant: 'secondary', onClick: () => setRemoveConfirm({ isOpen: false, serviceId: null }) },
          { label: 'Eliminar', variant: 'danger', onClick: confirmRemove }
        ]}
      >
        <p>¿Estás seguro de quitar este servicio de tu portafolio?</p>
      </ModalDialog>
    </div>
  );
 };

export default GroomerServices;
