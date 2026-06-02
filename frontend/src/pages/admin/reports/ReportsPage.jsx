import React, { useState, useEffect } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { getAllAppointments, getAdminMetrics } from '../../../api/appointments';
import { getAllGroomers } from '../../../api/groomer';
import { getAllServices } from '../../../api/servicesCatalog';
import { useToast } from '../../../components/Context/ToastContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AdminReportsPage = () => {
  const { showError, showSuccess } = useToast();
  const [timeFilter, setTimeFilter] = useState('estemes');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customRangeApplied, setCustomRangeApplied] = useState(false);

  // Estados para datos reales
  const [appointments, setAppointments] = useState([]);
  const [groomers, setGroomers] = useState([]);
  const [services, setServices] = useState([]);
  const [adminMetrics, setAdminMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estado para modal individual de groomer
  const [selectedGroomer, setSelectedGroomer] = useState(null);
  const [showGroomerModal, setShowGroomerModal] = useState(false);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError('');
      const [appointmentsData, groomersData, servicesData, metricsData] = await Promise.all([
        getAllAppointments(),
        getAllGroomers(),
        getAllServices(false),
        getAdminMetrics().catch(() => null),
      ]);
      setAppointments(appointmentsData);
      setGroomers(groomersData);
      setServices(servicesData);
      if (metricsData) setAdminMetrics(metricsData);
    } catch (err) {
      console.error('Error cargando datos de reportes:', err);
      setError(err.message || 'Error al cargar los datos de reportes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  const computeMetricsRange = () => {
    const today = new Date();
    const toDate = today.toISOString().split('T')[0];

    if (customRangeApplied && startDate && endDate) {
      return { fromDate: startDate, toDate: endDate };
    }

    const from = new Date(today);
    if (timeFilter === 'hoy') {
      return { fromDate: toDate, toDate };
    }
    if (timeFilter === 'estasemana') {
      from.setDate(from.getDate() - 7);
      return { fromDate: from.toISOString().split('T')[0], toDate };
    }
    if (timeFilter === 'estemes') {
      from.setDate(from.getDate() - 30);
      return { fromDate: from.toISOString().split('T')[0], toDate };
    }
    if (timeFilter === 'esteano') {
      from.setFullYear(from.getFullYear() - 1);
      return { fromDate: from.toISOString().split('T')[0], toDate };
    }
    return {};
  };

  const formatMinutes = (mins) => {
    if (mins === null || mins === undefined || Number.isNaN(Number(mins))) return 'N/A';
    const m = Number(mins);
    if (m < 60) return `${m.toFixed(1)} min`;
    return `${(m / 60).toFixed(1)} h`;
  };

  // Recargar métricas cuando cambie el filtro (sin recargar todo el dataset).
  useEffect(() => {
    let cancelled = false;
    const loadMetrics = async () => {
      try {
        setMetricsLoading(true);
        setMetricsError('');
        const range = computeMetricsRange();
        const data = await getAdminMetrics(range);
        if (!cancelled) setAdminMetrics(data);
      } catch (e) {
        if (!cancelled) setMetricsError(e.message || 'No pudimos cargar métricas.');
      } finally {
        if (!cancelled) setMetricsLoading(false);
      }
    };

    loadMetrics();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFilter, customRangeApplied, startDate, endDate]);

  const handleExport = (type) => {
    if (type === 'Excel') {
      exportReportsToCSV();
    } else if (type === 'PDF') {
      exportToPDF();
    } else if (type === 'Custom') {
      setShowGenerateModal(true);
    }
  };

  // Captura las gráficas actuales como imágenes base64
  const captureChartsAsImages = () => {
    const images = {};

  const chartIds = [
    'chart-ingresos-mensuales',
    'chart-servicios-vendidos',
    'chart-distribucion-ingresos',
    'chart-citas-estados',
    'chart-horarios-solicitados',
    'chart-servicios-groomer'
  ];

    chartIds.forEach(id => {
      const container = document.getElementById(id);
      if (container) {
        const canvas = container.querySelector('canvas');
        if (canvas) {
          try {
            images[id] = canvas.toDataURL('image/png');
          } catch (e) {
            images[id] = null;
          }
        }
      }
    });

    return images;
  };

  // Exportar PDF limpio con datos y resúmenes de gráficas
  const exportToPDF = () => {
    // Capturamos las gráficas ANTES de abrir la ventana
    const chartImages = captureChartsAsImages();

    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
      showError('Por favor permite pop-ups para generar el PDF.');
      return;
    }

    const currentDate = new Date().toLocaleDateString('es-ES');
    const filterText = customRangeApplied && startDate && endDate 
      ? `Rango personalizado: ${startDate} - ${endDate}`
      : timeFilter === 'hoy' ? 'Hoy'
      : timeFilter === 'estasemana' ? 'Esta semana'
      : timeFilter === 'estemes' ? 'Este mes'
      : timeFilter === 'esteano' ? 'Este año'
      : 'Período actual';

    let html = `
      <html>
      <head>
        <title>Reporte de Analíticas - Paseos Felices</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 30px; color: #222; }
          h1 { color: #d96c5f; margin-bottom: 5px; }
          .header { border-bottom: 2px solid #d96c5f; padding-bottom: 10px; margin-bottom: 25px; }
          .date { color: #666; font-size: 14px; }
          .section { margin-bottom: 30px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
          .kpi { border: 1px solid #ddd; padding: 12px; border-radius: 6px; }
          .kpi h4 { margin: 0 0 5px 0; font-size: 13px; color: #666; }
          .kpi p { margin: 0; font-size: 20px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background: #f5f5f5; }
          .chart-summary { background: #f9f9f9; padding: 15px; border-radius: 6px; margin-top: 10px; }
          .footer { margin-top: 40px; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 10px; }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Reporte de Analíticas</h1>
          <p class="date">Paseos Felices • Generado el ${currentDate}</p>
          <p><strong>Período:</strong> ${filterText}</p>
        </div>

        <div class="section">
          <h2>Indicadores Clave (KPIs)</h2>
          <div class="kpi-grid">
            <div class="kpi"><h4>Ingresos Totales</h4><p>$${(filteredKPIs.ingresosTotales / 1000000).toFixed(2)}M</p></div>
            <div class="kpi"><h4>Servicios Realizados</h4><p>${filteredKPIs.serviciosRealizados.toLocaleString()}</p></div>
            <div class="kpi"><h4>Citas Completadas</h4><p>${filteredKPIs.citasCompletadas.toLocaleString()}</p></div>
            <div class="kpi"><h4>Clientes Activos</h4><p>${filteredKPIs.clientesActivos}</p></div>
            <div class="kpi"><h4>Groomers Activos</h4><p>${filteredKPIs.groomersActivos}</p></div>
            <div class="kpi"><h4>Cancelaciones</h4><p>${filteredKPIs.cancelaciones}</p></div>
            ${
              adminMetrics && adminMetrics.avg_response_minutes !== null && adminMetrics.avg_response_minutes !== undefined
                ? `<div class="kpi"><h4>Tiempo de respuesta</h4><p>${formatMinutes(adminMetrics.avg_response_minutes)}</p></div>`
                : ''
            }
          </div>
        </div>

        <div class="section">
          <h2>Ingresos Diarios</h2>
          <table>
            <thead><tr><th>Fecha</th><th>Ingresos</th></tr></thead>
            <tbody>
              ${filteredDaily.map(item => `<tr><td>${item.date}</td><td>$${item.amount.toLocaleString('es-CO')}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Ingresos por Servicio</h2>
          <table>
            <thead><tr><th>Servicio</th><th>Total Generado</th></tr></thead>
            <tbody>
              ${serviceRevenues.map(item => `<tr><td>${item.service}</td><td>$${item.total.toLocaleString('es-CO')}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Ingresos por Groomer</h2>
          <table>
            <thead><tr><th>Groomer</th><th>Ganancias</th><th>Servicios</th></tr></thead>
            <tbody>
              ${groomerRevenues.map(item => `<tr><td>${item.groomer}</td><td>$${item.total.toLocaleString('es-CO')}</td><td>${item.services}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Gráficas del Reporte</h2>

          ${chartImages['chart-ingresos-mensuales'] 
            ? `<div style="margin-bottom: 20px;">
                 <strong>Ingresos Mensuales</strong><br>
                 <img src="${chartImages['chart-ingresos-mensuales']}" style="max-width: 100%; border: 1px solid #ddd; border-radius: 6px; margin-top: 8px;" />
               </div>` 
            : `<p><strong>Ingresos Mensuales:</strong> Se observa una tendencia de crecimiento sostenido.</p>`
          }

          ${chartImages['chart-servicios-vendidos'] 
            ? `<div style="margin-bottom: 20px;">
                 <strong>Servicios más vendidos</strong><br>
                 <img src="${chartImages['chart-servicios-vendidos']}" style="max-width: 100%; border: 1px solid #ddd; border-radius: 6px; margin-top: 8px;" />
               </div>` 
            : `<p><strong>Servicios más vendidos:</strong> Grooming Premium es el más demandado.</p>`
          }

           ${chartImages['chart-distribucion-ingresos'] 
             ? `<div style="margin-bottom: 20px;">
                  <strong>Distribución de Ingresos</strong><br>
                  <img src="${chartImages['chart-distribucion-ingresos']}" style="max-width: 420px; border: 1px solid #ddd; border-radius: 6px; margin-top: 8px;" />
                </div>` 
             : `<p><strong>Distribución de ingresos:</strong> Grooming representa el mayor porcentaje.</p>`
           }

           ${chartImages['chart-citas-estados'] 
             ? `<div style="margin-bottom: 20px;">
                  <strong>Distribución de Citas por Estado</strong><br>
                  <img src="${chartImages['chart-citas-estados']}" style="max-width: 100%; border: 1px solid #ddd; border-radius: 6px; margin-top: 8px;" />
                </div>` 
             : ''
           }

           ${chartImages['chart-horarios-solicitados'] 
             ? `<div style="margin-bottom: 20px;">
                  <strong>Horarios Más Solicitados</strong><br>
                  <img src="${chartImages['chart-horarios-solicitados']}" style="max-width: 100%; border: 1px solid #ddd; border-radius: 6px; margin-top: 8px;" />
                </div>` 
             : ''
           }

           ${chartImages['chart-servicios-groomer'] 
             ? `<div style="margin-bottom: 20px;">
                  <strong>Servicios Realizados por Groomer</strong><br>
                  <img src="${chartImages['chart-servicios-groomer']}" style="max-width: 100%; border: 1px solid #ddd; border-radius: 6px; margin-top: 8px;" />
                </div>` 
             : ''
           }
         </div>

        <div class="footer">
          Reporte generado automáticamente • Paseos Felices • ${currentDate}<br>
          Este documento es confidencial y para uso interno.
        </div>

        <button onclick="window.print()" style="margin-top: 30px; padding: 10px 20px; background: #d96c5f; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 15px;">
          Guardar como PDF / Imprimir
        </button>
      </body>
      </html>
    `;

    reportWindow.document.write(html);
    reportWindow.document.close();
  };

  // Función para exportar a CSV (Excel) - con la misma información que el PDF
  const exportReportsToCSV = (sections = reportSections) => {
    let csvContent = "data:text/csv;charset=utf-8,";

    // === ENCABEZADO ===
    csvContent += "REPORTE DE ANALÍTICAS - PASEOS FELICES\n";
    csvContent += `Fecha de generación,${new Date().toLocaleDateString('es-ES')}\n`;
    csvContent += `Período,${customRangeApplied && startDate && endDate ? `${startDate} - ${endDate}` : timeFilter}\n\n`;

    // === KPIs ===
    if (sections?.kpis) {
      csvContent += "INDICADORES CLAVE (KPIs)\n";
      csvContent += "Indicador,Valor\n";
      csvContent += `Ingresos Totales,${filteredKPIs.ingresosTotales}\n`;
      csvContent += `Servicios Realizados,${filteredKPIs.serviciosRealizados}\n`;
      csvContent += `Citas Completadas,${filteredKPIs.citasCompletadas}\n`;
      csvContent += `Clientes Activos,${filteredKPIs.clientesActivos}\n`;
      csvContent += `Groomers Activos,${filteredKPIs.groomersActivos}\n`;
      csvContent += `Cancelaciones,${filteredKPIs.cancelaciones}\n\n`;

      if (adminMetrics) {
        csvContent += "MÉTRICAS DE RENDIMIENTO\n";
        csvContent += "Métrica,Valor\n";
        if (adminMetrics.avg_response_minutes !== null && adminMetrics.avg_response_minutes !== undefined) {
          csvContent += `Tiempo de respuesta promedio (min),${adminMetrics.avg_response_minutes}\n`;
        }
        if (adminMetrics.p50_response_minutes !== null && adminMetrics.p50_response_minutes !== undefined) {
          csvContent += `Tiempo de respuesta p50 (min),${adminMetrics.p50_response_minutes}\n`;
        }
        if (adminMetrics.p95_response_minutes !== null && adminMetrics.p95_response_minutes !== undefined) {
          csvContent += `Tiempo de respuesta p95 (min),${adminMetrics.p95_response_minutes}\n`;
        }
        csvContent += "\n";
      }
    }

    // === INGRESOS DIARIOS ===
    if (sections?.dailyRevenue) {
      csvContent += "INGRESOS DIARIOS\n";
      csvContent += "Fecha,Ingresos\n";
      filteredDaily.forEach(item => {
        csvContent += `${item.date},${item.amount}\n`;
      });
      csvContent += "\n";
    }

    // === INGRESOS POR SERVICIO ===
    if (sections?.serviceRevenue) {
      csvContent += "INGRESOS POR SERVICIO\n";
      csvContent += "Servicio,Total Generado\n";
      serviceRevenues.forEach(item => {
        csvContent += `${item.service},${item.total}\n`;
      });
      csvContent += "\n";
    }

    // === INGRESOS POR GROOMER ===
    if (sections?.groomerRevenue) {
      csvContent += "INGRESOS POR GROOMER\n";
      csvContent += "Groomer,Ganancias,Servicios\n";
      groomerRevenues.forEach(item => {
        csvContent += `${item.groomer},${item.total},${item.services}\n`;
      });
      csvContent += "\n";
    }

    // === ANÁLISIS DE CITAS - ESTADOS ===
    if (sections?.appointmentsAnalysis) {
      csvContent += "ANÁLISIS DE CITAS - DISTRIBUCIÓN POR ESTADO\n";
      csvContent += "Estado,Porcentaje\n";
      citasPorEstado.labels.forEach((label, index) => {
        csvContent += `${label},${citasPorEstado.datasets[0].data[index]}\n`;
      });
      csvContent += "\n";
    }

    // === HORARIOS MÁS SOLICITADOS ===
    if (sections?.appointmentsAnalysis) {
      csvContent += "HORARIOS MÁS SOLICITADOS\n";
      csvContent += "Horario,Cantidad de Citas\n";
      horariosMasSolicitados.labels.forEach((label, index) => {
        csvContent += `${label},${horariosMasSolicitados.datasets[0].data[index]}\n`;
      });
      csvContent += "\n";
    }

    // === DETALLE DE GROOMERS ===
    if (sections?.groomerRevenue) {
      csvContent += "DETALLE DE GROOMERS\n";
      csvContent += "Groomer,Servicios,Horas,Ingresos,Calificación,Clientes Recurrentes\n";
      groomersDetailed.forEach(g => {
        const ratingDisplay = typeof g.rating === 'number' && g.rating > 0 ? g.rating : 'Sin calificar';
        csvContent += `${g.name},${g.services},${g.hours},${g.revenue},${ratingDisplay},${g.recurrentClients}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_paseos_felices_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Estado para modal de Generar Reporte
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [reportSections, setReportSections] = useState({
    kpis: true,
    dailyRevenue: true,
    serviceRevenue: true,
    groomerRevenue: true,
    appointmentsAnalysis: true,
  });

  // ==================== CÁLCULO DE ESTADÍSTICAS REALES ====================
  
  // Calcular ingresos diarios desde appointments
  const calculateDailyRevenues = () => {
    const revenueMap = {};
    appointments.forEach(apt => {
      if (apt.status === 'completed' && apt.date) {
        const date = apt.date;
        const price = apt.price || 0;
        revenueMap[date] = (revenueMap[date] || 0) + price;
      }
    });
    
    return Object.entries(revenueMap)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Calcular ingresos por servicio
  const calculateServiceRevenues = () => {
    const serviceMap = {};
    appointments.forEach(apt => {
      if (apt.status === 'completed' && apt.service) {
        const price = apt.price || 0;
        serviceMap[apt.service] = (serviceMap[apt.service] || 0) + price;
      }
    });
    
    return Object.entries(serviceMap)
      .map(([service, total]) => ({ service, total }))
      .sort((a, b) => b.total - a.total);
  };

  // Calcular ingresos por groomer
  const calculateGroomerRevenues = () => {
    const groomerMap = {};
    appointments.forEach(apt => {
      if (apt.status === 'completed' && apt.groomer_email) {
        const price = apt.price || 0;
        groomerMap[apt.groomer_email] = {
          total: (groomerMap[apt.groomer_email]?.total || 0) + price,
          services: (groomerMap[apt.groomer_email]?.services || 0) + 1
        };
      }
    });
    
    return Object.entries(groomerMap)
      .map(([groomer, data]) => ({ groomer, total: data.total, services: data.services }))
      .sort((a, b) => b.total - a.total);
  };

  // Calcular KPIs
  const calculateKPIs = () => {
    const completedAppointments = appointments.filter(a => a.status === 'completed');
    const cancelledAppointments = appointments.filter(a => a.status === 'cancelled');
    const activeClients = new Set(appointments.map(a => a.client_email)).size;
    const activeGroomers = groomers.length;
    
    const totalRevenue = completedAppointments.reduce((sum, apt) => sum + (apt.price || 0), 0);
    
    return {
      ingresosTotales: totalRevenue,
      serviciosRealizados: completedAppointments.length,
      citasCompletadas: completedAppointments.length,
      clientesActivos: activeClients,
      groomersActivos: activeGroomers,
      cancelaciones: cancelledAppointments.length
    };
  };

  // Calcular distribución de citas por estado
  const calculateCitasPorEstado = () => {
    const statusMap = {
      'Completadas': 0,
      'Pendientes': 0,
      'Canceladas': 0,
      'Reagendadas': 0,
      'En progreso': 0
    };
    
    appointments.forEach(apt => {
      if (apt.status === 'completed') statusMap['Completadas']++;
      else if (apt.status === 'pending') statusMap['Pendientes']++;
      else if (apt.status === 'cancelled') statusMap['Canceladas']++;
      else if (apt.status === 'confirmed') statusMap['Reagendadas']++;
      else if (apt.status === 'in_progress') statusMap['En progreso']++;
    });
    
    return {
      labels: Object.keys(statusMap),
      datasets: [{
        data: Object.values(statusMap),
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6'],
        borderWidth: 0,
      }]
    };
  };

  // Calcular horarios más solicitados
  const calculateHorariosMasSolicitados = () => {
    const timeMap = {};
    appointments.forEach(apt => {
      if (apt.time) {
        timeMap[apt.time] = (timeMap[apt.time] || 0) + 1;
      }
    });
    
    const sortedTimes = Object.entries(timeMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    
    return {
      labels: sortedTimes.map(([time]) => time),
      datasets: [{
        label: 'Citas',
        data: sortedTimes.map(([, count]) => count),
        backgroundColor: '#d96c5f',
      }]
    };
  };

  // Calcular datos detallados de groomers
  const calculateGroomersDetailed = () => {
    return groomers.map(groomer => {
      const groomerAppointments = appointments.filter(a => a.groomer_email === groomer.email);
      const completed = groomerAppointments.filter(a => a.status === 'completed');
      const totalRevenue = completed.reduce((sum, apt) => sum + (apt.price || 0), 0);
      
      return {
        name: groomer.nombre_completo,
        services: completed.length,
        hours: Math.round(completed.length * 2.15), // Aproximación de 2.15 horas por servicio
        revenue: totalRevenue,
        rating: groomer.rating > 0 ? groomer.rating : 'Sin calificar',
        recurrentClients: Math.floor(completed.length / 3.8) // Aproximación
      };
    }).sort((a, b) => b.revenue - a.revenue);
  };

  // Calcular servicios más vendidos
  const calculateServiciosMasVendidos = () => {
    const serviceMap = {};
    appointments.forEach(apt => {
      if (apt.status === 'completed' && apt.service) {
        serviceMap[apt.service] = (serviceMap[apt.service] || 0) + 1;
      }
    });
    
    const sortedServices = Object.entries(serviceMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    return {
      labels: sortedServices.map(([service]) => service),
      datasets: [{
        label: 'Cantidad vendida',
        data: sortedServices.map(([, count]) => count),
        backgroundColor: ['#d96c5f', '#8b5cf6', '#10b981', '#f59e0b', '#3b82f6'],
      }]
    };
  };

  // Calcular distribución de ingresos por categoría
  const calculateDistribucionIngresos = () => {
    const categoryMap = {};
    appointments.forEach(apt => {
      if (apt.status === 'completed' && apt.service) {
        const service = services.find(s => s.name === apt.service);
        const category = service?.category || 'Otro';
        const price = apt.price || 0;
        categoryMap[category] = (categoryMap[category] || 0) + price;
      }
    });
    
    const totalRevenue = Object.values(categoryMap).reduce((sum, val) => sum + val, 0);
    
    return {
      labels: Object.keys(categoryMap),
      datasets: [{
        data: Object.values(categoryMap).map(val => Math.round((val / totalRevenue) * 100)),
        backgroundColor: ['#d96c5f', '#8b5cf6', '#10b981', '#f59e0b'],
        borderWidth: 0,
      }]
    };
  };

  // Calcular clientes más activos
  const calculateTopClients = () => {
    const clientMap = {};
    appointments.forEach(apt => {
      if (apt.client_email) {
        clientMap[apt.client_email] = (clientMap[apt.client_email] || 0) + 1;
      }
    });
    
    return Object.entries(clientMap)
      .map(([email, count]) => ({ email, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  // Datos calculados
  const dailyRevenues = calculateDailyRevenues();
  const serviceRevenues = calculateServiceRevenues();
  const groomerRevenues = calculateGroomerRevenues();
  const kpis = calculateKPIs();
  const citasPorEstado = calculateCitasPorEstado();
  const horariosMasSolicitados = calculateHorariosMasSolicitados();
  const groomersDetailed = calculateGroomersDetailed();
  const serviciosMasVendidosData = calculateServiciosMasVendidos();
  const distribucionIngresosData = calculateDistribucionIngresos();
  const topClients = calculateTopClients();

  // ==================== FILTRADO ====================
  const getFilteredDailyRevenues = () => {
    if (timeFilter === 'rangopersonalizado' && customRangeApplied && startDate && endDate) {
      return dailyRevenues.filter(item => item.date >= startDate && item.date <= endDate);
    }
    
    const today = new Date().toISOString().split('T')[0];
    const todayDate = new Date(today);
    
    if (timeFilter === 'hoy') {
      return dailyRevenues.filter(d => d.date === today);
    }
    if (timeFilter === 'estasemana') {
      const weekAgo = new Date(todayDate);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return dailyRevenues.filter(d => new Date(d.date) >= weekAgo);
    }
    if (timeFilter === 'estemes') {
      const monthAgo = new Date(todayDate);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return dailyRevenues.filter(d => new Date(d.date) >= monthAgo);
    }
    if (timeFilter === 'esteano') {
      const yearAgo = new Date(todayDate);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      return dailyRevenues.filter(d => new Date(d.date) >= yearAgo);
    }
    // Por defecto (este mes) devolvemos todo
    return dailyRevenues;
  };

  const filteredDaily = getFilteredDailyRevenues();
  const filteredTotal = filteredDaily.reduce((sum, item) => sum + item.amount, 0);

  // KPIs calculados (filtrados)
  const filteredKPIs = {
    ingresosTotales: filteredTotal || kpis.ingresosTotales,
    serviciosRealizados: kpis.serviciosRealizados,
    citasCompletadas: kpis.citasCompletadas,
    clientesActivos: kpis.clientesActivos,
    groomersActivos: kpis.groomersActivos,
    cancelaciones: kpis.cancelaciones
  };

  const filteredAppointmentsForHistory = (() => {
    // Nota: usamos apt.date (YYYY-MM-DD) como referencia, igual que en calculateDailyRevenues().
    if (customRangeApplied && startDate && endDate) {
      return (appointments || []).filter((a) => a.date && a.date >= startDate && a.date <= endDate);
    }

    const today = new Date().toISOString().split('T')[0];
    const todayDate = new Date(today);

    if (timeFilter === 'hoy') {
      return (appointments || []).filter((a) => a.date === today);
    }
    if (timeFilter === 'estasemana') {
      const weekAgo = new Date(todayDate);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return (appointments || []).filter((a) => a.date && new Date(a.date) >= weekAgo);
    }
    if (timeFilter === 'estemes') {
      const monthAgo = new Date(todayDate);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return (appointments || []).filter((a) => a.date && new Date(a.date) >= monthAgo);
    }
    if (timeFilter === 'esteano') {
      const yearAgo = new Date(todayDate);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      return (appointments || []).filter((a) => a.date && new Date(a.date) >= yearAgo);
    }
    return appointments || [];
  })();

  const recentAppointments = [...filteredAppointmentsForHistory]
    .sort((a, b) => {
      const aKey = `${a.date || '0000-00-00'}T${a.time || '00:00'}`;
      const bKey = `${b.date || '0000-00-00'}T${b.time || '00:00'}`;
      return new Date(bKey) - new Date(aKey);
    })
    .slice(0, 20);

  const applyCustomRange = () => {
    if (startDate && endDate) {
      setCustomRangeApplied(true);
      setTimeFilter('rangopersonalizado');
    }
  };

  const clearCustomRange = () => {
    setStartDate('');
    setEndDate('');
    setCustomRangeApplied(false);
    setTimeFilter('estemes');
  };

  // Ingresos mensuales (Line Chart) - calculados desde citas completadas
  const ingresosMensualesData = (() => {
    const monthMap = {};
    (filteredDaily || []).forEach((d) => {
      const monthKey = (d.date || '').slice(0, 7); // YYYY-MM
      if (!monthKey) return;
      monthMap[monthKey] = (monthMap[monthKey] || 0) + (d.amount || 0);
    });

    const labels = Object.keys(monthMap).sort();
    const data = labels.map((k) => monthMap[k]);

    return {
      labels: labels.length ? labels : ['Sin datos'],
      datasets: [
        {
          label: 'Ingresos (COP)',
          data: labels.length ? data : [0],
          borderColor: '#d96c5f',
          backgroundColor: 'rgba(217, 108, 95, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  })();

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header__main">
          <div className="admin-page-header__title">
            <h1>Reportes y Analíticas</h1>
          </div>
          <p className="admin-page-header__subtitle">
            Visualiza el rendimiento completo de la plataforma.
          </p>
          <div className="admin-page-header__actions" style={{ display: 'flex', gap: '6px' }}>
            <button 
              onClick={() => handleExport('PDF')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: '#dc2626',
                color: 'white',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              📄 PDF
            </button>
            
            <button 
              onClick={() => handleExport('Excel')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: '#16a34a',
                color: 'white',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              📊 Excel
            </button>
            
            <button 
              onClick={() => handleExport('Custom')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: '#3b82f6',
                color: 'white',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              📋 Generar
            </button>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
          Cargando datos de reportes...
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{
          background: '#fee2e2',
          color: '#b91c1c',
          padding: '12px 20px',
          borderRadius: '8px',
          margin: '16px 0',
          fontWeight: 500
        }}>
          {error} — <button onClick={loadReportData} style={{ color: '#b91c1c', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>Reintentar</button>
        </div>
      )}

      {!loading && !error && (
        <>
      {/* Filtros Globales */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { label: 'Hoy', value: 'hoy' },
          { label: 'Esta semana', value: 'estasemana' },
          { label: 'Este mes', value: 'estemes' },
          { label: 'Este año', value: 'esteano' },
        ].map(({ label, value }) => (
          <button
            key={value}
            onClick={() => {
              setTimeFilter(value);
              setCustomRangeApplied(false);
            }}
            className={`filter-btn ${timeFilter === value && !customRangeApplied ? 'active' : ''}`}
          >
            {label}
          </button>
        ))}

        <button
          onClick={() => setTimeFilter('rangopersonalizado')}
          className={`filter-btn ${timeFilter === 'rangopersonalizado' || customRangeApplied ? 'active' : ''}`}
        >
          Rango personalizado
        </button>
      </div>

      {/* Selector de Rango Personalizado */}
      {(timeFilter === 'rangopersonalizado' || customRangeApplied) && (
        <div style={{ 
          marginBottom: '24px', 
          padding: '16px', 
          background: '#1f1f1f', 
          borderRadius: '8px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end',
          flexWrap: 'wrap'
        }}>
          <div>
            <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>Desde</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #333', background: '#111', color: 'white' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>Hasta</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #333', background: '#111', color: 'white' }}
            />
          </div>
          <button onClick={applyCustomRange} className="btn-primary" style={{ padding: '8px 16px' }}>
            Aplicar
          </button>
          {customRangeApplied && (
            <button onClick={clearCustomRange} className="btn-secondary" style={{ padding: '8px 16px' }}>
              Limpiar
            </button>
          )}
        </div>
      )}

      {/* Mostrar rango activo */}
      {customRangeApplied && startDate && endDate && (
        <div style={{ marginBottom: '16px', color: '#888', fontSize: '13px' }}>
          Mostrando datos del <strong>{startDate}</strong> al <strong>{endDate}</strong>
        </div>
      )}

      {(metricsLoading || metricsError) && (
        <div style={{ marginBottom: '12px', fontSize: '13px', color: metricsError ? '#b91c1c' : '#888' }}>
          {metricsLoading ? 'Cargando métricas de rendimiento…' : metricsError}
        </div>
      )}

      {/* KPIs */}
      <div className="main-stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <h3>Ingresos Totales</h3>
            <p className="stat-number">${(filteredKPIs.ingresosTotales / 1000000).toFixed(1)}M</p>
            <span className="stat-trend positive">+18% este mes</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <h3>Servicios Realizados</h3>
            <p className="stat-number">{filteredKPIs.serviciosRealizados.toLocaleString()}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <h3>Citas Completadas</h3>
            <p className="stat-number">{filteredKPIs.citasCompletadas.toLocaleString()}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <h3>Clientes Activos</h3>
            <p className="stat-number">{filteredKPIs.clientesActivos}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <h3>Groomers Activos</h3>
            <p className="stat-number">{filteredKPIs.groomersActivos}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <h3>Cancelaciones</h3>
            <p className="stat-number">{filteredKPIs.cancelaciones}</p>
            <span className="stat-trend negative">-4% vs mes anterior</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <h3>Tiempo de respuesta</h3>
            <p className="stat-number">{formatMinutes(adminMetrics?.avg_response_minutes)}</p>
            <span className="stat-trend neutral">
              p50: {formatMinutes(adminMetrics?.p50_response_minutes)} • p95: {formatMinutes(adminMetrics?.p95_response_minutes)}
            </span>
          </div>
        </div>
      </div>

      {/* Historial de solicitudes de servicios */}
      <div className="chart-card" style={{ marginTop: 24 }}>
        <h3>Historial de solicitudes (últimas 20)</h3>
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Servicio</th>
                <th>Estado</th>
                <th>Cliente</th>
                <th>Groomer</th>
                <th>Precio</th>
              </tr>
            </thead>
            <tbody>
              {recentAppointments.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: 12, color: '#666' }}>Sin datos para este rango.</td>
                </tr>
              ) : (
                recentAppointments.map((a) => (
                  <tr key={a.id}>
                    <td>{a.date || ''}</td>
                    <td>{a.time || ''}</td>
                    <td>{a.service || ''}</td>
                    <td>{a.status || ''}</td>
                    <td>{a.client_email || ''}</td>
                    <td>{a.groomer_email || ''}</td>
                    <td>${Number(a.price || 0).toLocaleString('es-CO')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gráficas Principales */}
      <div style={{ marginTop: '40px' }}>
        <h2 style={{ marginBottom: '24px', fontSize: '20px' }}>Gráficas principales</h2>

        <div className="charts-grid">
          {/* Ingresos Mensuales */}
          <div className="chart-card" id="chart-ingresos-mensuales">
            <h3>Ingresos mensuales</h3>
            <Line
              data={ingresosMensualesData}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>

          {/* Servicios más vendidos */}
          <div className="chart-card" id="chart-servicios-vendidos">
            <h3>Servicios más vendidos</h3>
            <Bar
              data={serviciosMasVendidosData}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>
        </div>

        {/* Distribución de ingresos */}
        <div className="chart-card" id="chart-distribucion-ingresos" style={{ maxWidth: '420px', marginTop: '24px' }}>
          <h3>Distribución de ingresos</h3>
          <Doughnut
            data={distribucionIngresosData}
            options={{
              responsive: true,
              plugins: { legend: { position: 'bottom' } },
            }}
          />
        </div>
      </div>

      {/* Secciones adicionales (versión inicial) */}
      <div style={{ marginTop: '50px' }}>
        <h2 style={{ marginBottom: '24px', fontSize: '20px' }}>Reportes rápidos</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Ingresos por Groomer */}
          <div className="chart-card">
            <h3>Ingresos por Groomer</h3>
            <div style={{ marginTop: '16px' }}>
              {groomerRevenues.length > 0 ? (
                groomerRevenues.slice(0, 3).map((item, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: index < 2 ? '8px' : '0' }}>
                    <span>{item.groomer}</span>
                    <strong>${item.total.toLocaleString('es-CO')}</strong>
                  </div>
                ))
              ) : (
                <p style={{ color: '#999', fontSize: '14px' }}>No hay datos disponibles</p>
              )}
            </div>
          </div>

          {/* Clientes más activos */}
          <div className="chart-card">
            <h3>Clientes más activos</h3>
            <div style={{ marginTop: '16px' }}>
              {topClients.length > 0 ? (
                topClients.map((item, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: index < 2 ? '8px' : '0' }}>
                    <span>{item.email}</span>
                    <strong>{item.count} servicios</strong>
                  </div>
                ))
              ) : (
                <p style={{ color: '#999', fontSize: '14px' }}>No hay datos disponibles</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ==================== REPORTES FINANCIEROS ==================== */}
      <div style={{ marginTop: '50px' }}>
        <h2 style={{ marginBottom: '24px', fontSize: '20px' }}>Reportes financieros</h2>

        <div style={{ display: 'grid', gap: '32px' }}>

          {/* Ingresos diarios */}
          <div className="chart-card">
            <h3>Ingresos diarios</h3>
            <div className="usuarios-table-wrapper" style={{ marginTop: '16px' }}>
              <table className="usuarios-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDaily.length > 0 ? (
                    filteredDaily.map((item, index) => (
                      <tr key={index}>
                        <td>{item.date}</td>
                        <td>${item.amount.toLocaleString('es-CO')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" style={{ textAlign: 'center', color: '#888' }}>
                        No hay datos en el rango seleccionado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ingresos por servicio */}
          <div className="chart-card">
            <h3>Ingresos por servicio</h3>
            <div className="usuarios-table-wrapper" style={{ marginTop: '16px' }}>
              <table className="usuarios-table">
                <thead>
                  <tr>
                    <th>Servicio</th>
                    <th>Total generado</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceRevenues.map((item, index) => (
                    <tr key={index}>
                      <td>{item.service}</td>
                      <td>${item.total.toLocaleString('es-CO')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ingresos por groomer */}
          <div className="chart-card">
            <h3>Ingresos por groomer</h3>
            <div className="usuarios-table-wrapper" style={{ marginTop: '16px' }}>
              <table className="usuarios-table">
                <thead>
                  <tr>
                    <th>Groomer</th>
                    <th>Ganancias</th>
                    <th>Servicios</th>
                  </tr>
                </thead>
                <tbody>
                  {groomerRevenues.map((item, index) => (
                    <tr key={index}>
                      <td>{item.groomer}</td>
                      <td>${item.total.toLocaleString('es-CO')}</td>
                      <td>{item.services}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* ==================== ANÁLISIS DE CITAS ==================== */}
      <div style={{ marginTop: '50px' }}>
        <h2 style={{ marginBottom: '24px', fontSize: '20px' }}>Análisis de citas</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>

          {/* Donut de estados de citas */}
          <div className="chart-card" id="chart-citas-estados">
            <h3>Distribución por estado</h3>
            <div style={{ maxWidth: '320px', margin: '20px auto' }}>
              <Doughnut
                data={citasPorEstado}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => `${ctx.label}: ${ctx.raw}%`,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Horarios más solicitados */}
          <div className="chart-card" id="chart-horarios-solicitados">
            <h3>Horarios más solicitados</h3>
            <Bar
              data={horariosMasSolicitados}
              options={{
                responsive: true,
                indexAxis: 'y', // Barras horizontales
                plugins: { legend: { display: false } },
                scales: {
                  x: { beginAtZero: true },
                },
              }}
            />
            <p style={{ marginTop: '12px', fontSize: '12px', color: '#888' }}>
              Las 2:00 PM y 4:00 PM son los horarios con mayor demanda.
            </p>
          </div>

        </div>
      </div>

      {/* ==================== REPORTE DE GROOMERS (GENERAL) ==================== */}
      <div style={{ marginTop: '50px' }}>
        <h2 style={{ marginBottom: '24px', fontSize: '20px' }}>Reporte de Groomers</h2>

        {/* Resumen superior */}
        <div className="main-stats-grid" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-content">
              <h3>Total Groomers</h3>
              <p className="stat-number">{groomers.length}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <h3>Promedio Calificación</h3>
              <p className="stat-number">
                {groomers.length > 0 
                  ? (() => {
                      const validRatings = groomers.filter(g => g.rating > 0);
                      if (validRatings.length === 0) return 'Sin calificar';
                      return (validRatings.reduce((sum, g) => sum + g.rating, 0) / validRatings.length).toFixed(2);
                    })()
                  : 'Sin calificar'}
              </p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <h3>Total Servicios</h3>
              <p className="stat-number">{kpis.serviciosRealizados.toLocaleString()}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <h3>Ingresos Generados</h3>
              <p className="stat-number">${(kpis.ingresosTotales / 1000000).toFixed(2)}M</p>
            </div>
          </div>
        </div>

        {/* Tabla de Groomers */}
        <div className="chart-card" style={{ marginBottom: '24px' }}>
          <h3>Desempeño por Groomer</h3>
          <div className="usuarios-table-wrapper" style={{ marginTop: '16px' }}>
            <table className="usuarios-table">
              <thead>
                <tr>
                  <th>Groomer</th>
                  <th>Servicios</th>
                  <th>Horas</th>
                  <th>Ingresos</th>
                  <th>Calificación</th>
                  <th>Clientes Recurrentes</th>
                </tr>
              </thead>
               <tbody>
                 {groomersDetailed.map((g, index) => (
                   <tr 
                     key={index} 
                     onClick={() => {
                       setSelectedGroomer(g);
                       setShowGroomerModal(true);
                     }}
                     style={{ cursor: 'pointer' }}
                   >
                     <td><strong>{g.name}</strong></td>
                     <td>{g.services}</td>
                     <td>{g.hours}h</td>
                     <td>${g.revenue.toLocaleString('es-CO')}</td>
                     <td>
                       <span style={{ color: '#10b981', fontWeight: 600 }}>{typeof g.rating === 'number' && g.rating > 0 ? g.rating : 'Sin calificar'}</span> ★
                     </td>
                     <td>{g.recurrentClients}</td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        </div>

        {/* Gráfica de Servicios por Groomer */}
        <div className="chart-card" id="chart-servicios-groomer">
          <h3>Servicios realizados por Groomer</h3>
          <Bar
            data={{
              labels: groomersDetailed.map(g => g.name),
              datasets: [
                {
                  label: 'Servicios',
                  data: groomersDetailed.map(g => g.services),
                  backgroundColor: ['#d96c5f', '#8b5cf6', '#10b981', '#f59e0b'],
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true } },
            }}
          />
        </div>
      </div>

      {/* ==================== MODAL DETALLE INDIVIDUAL DE GROOMER ==================== */}
      {showGroomerModal && selectedGroomer && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowGroomerModal(false)}
          style={{ zIndex: 1000 }}
        >
          <div 
            className="modal" 
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '900px', width: '95%' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0 }}>{selectedGroomer.name}</h3>
                <div style={{ color: '#10b981', fontWeight: 600 }}>
                  {typeof selectedGroomer.rating === 'number' && selectedGroomer.rating > 0 ? selectedGroomer.rating : 'Sin calificar'} ★ • {selectedGroomer.recurrentClients} clientes recurrentes
                </div>
              </div>
              <button 
                onClick={() => setShowGroomerModal(false)} 
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#888' }}
              >
                ×
              </button>
            </div>

            {/* KPIs personales */}
            <div className="main-stats-grid" style={{ marginBottom: '24px' }}>
              <div className="stat-card">
                <div className="stat-content">
                  <h3>Servicios</h3>
                  <p className="stat-number">{selectedGroomer.services}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-content">
                  <h3>Horas trabajadas</h3>
                  <p className="stat-number">{selectedGroomer.hours}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-content">
                  <h3>Ingresos</h3>
                  <p className="stat-number">${(selectedGroomer.revenue / 1000000).toFixed(2)}M</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-content">
                  <h3>Clientes recurrentes</h3>
                  <p className="stat-number">{selectedGroomer.recurrentClients}</p>
                </div>
              </div>
            </div>

            {/* Gráficas individuales */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              
              {/* Servicios por semana */}
              <div className="chart-card">
                <h3>Servicios por semana</h3>
                <Bar
                  data={{
                    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                    datasets: [{
                      label: 'Servicios',
                      data: selectedGroomer.weeklyServices,
                      backgroundColor: '#d96c5f',
                    }],
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } },
                  }}
                />
              </div>

              {/* Rendimiento mensual */}
              <div className="chart-card">
                <h3>Rendimiento mensual (ingresos)</h3>
                <Line
                  data={{
                    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                    datasets: [{
                      label: 'Ingresos',
                      data: selectedGroomer.monthlyRevenue,
                      borderColor: '#8b5cf6',
                      backgroundColor: 'rgba(139, 92, 246, 0.1)',
                      tension: 0.4,
                      fill: true,
                    }],
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } },
                  }}
                />
              </div>
            </div>

            {/* Servicios más realizados por este groomer */}
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ marginBottom: '12px' }}>Servicios más realizados</h3>
              <div className="usuarios-table-wrapper">
                <table className="usuarios-table">
                  <thead>
                    <tr>
                      <th>Servicio</th>
                      <th>Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedGroomer.topServices.map((s, i) => (
                      <tr key={i}>
                        <td>{s.name}</td>
                        <td>{s.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button onClick={() => setShowGroomerModal(false)} className="btn-secondary">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL GENERAR REPORTE ==================== */}
      {showGenerateModal && (
        <div className="modal-overlay" onClick={() => setShowGenerateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <h3 style={{ marginBottom: '16px' }}>Generar Reporte</h3>
            
            <p style={{ color: '#888', marginBottom: '16px' }}>
              Selecciona qué incluir en el reporte:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={reportSections.kpis}
                  onChange={(e) => setReportSections(prev => ({ ...prev, kpis: e.target.checked }))}
                /> KPIs y Métricas principales
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={reportSections.dailyRevenue}
                  onChange={(e) => setReportSections(prev => ({ ...prev, dailyRevenue: e.target.checked }))}
                /> Ingresos diarios
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={reportSections.serviceRevenue}
                  onChange={(e) => setReportSections(prev => ({ ...prev, serviceRevenue: e.target.checked }))}
                /> Ingresos por servicio
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={reportSections.groomerRevenue}
                  onChange={(e) => setReportSections(prev => ({ ...prev, groomerRevenue: e.target.checked }))}
                /> Ingresos por groomer
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={reportSections.appointmentsAnalysis}
                  onChange={(e) => setReportSections(prev => ({ ...prev, appointmentsAnalysis: e.target.checked }))}
                /> Análisis de citas
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowGenerateModal(false)} className="btn-secondary">
                Cancelar
              </button>
              <button 
                onClick={() => {
                  setShowGenerateModal(false);
                  exportReportsToCSV(reportSections);
                  showSuccess('Reporte generado y descargado como CSV');
                }} 
                className="btn-primary"
              >
                Generar y Descargar
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '40px', color: '#888', fontSize: '13px' }}>
        Datos cargados desde base de datos • Los filtros afectan los ingresos diarios y el KPI principal.
      </div>
        </>
      )}
    </div>
  );
};

export default AdminReportsPage;
