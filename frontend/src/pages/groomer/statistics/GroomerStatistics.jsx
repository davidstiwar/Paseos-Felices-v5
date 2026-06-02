import React, { useEffect, useMemo, useState } from 'react';
import { Pie, Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
} from 'chart.js';
import { startOfMonth, startOfWeek, startOfYear } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import ExportReportButtons from '../../../components/Common/ExportReportButtons';
import '../../../estilos/ClientPanel.css';
import '../../../estilos/components/StatCard.css';
import { getGroomerAppointments } from '../../../api/appointments';
import { getGroomerProfile } from '../../../api/groomer';
import { getReviewsByGroomer } from '../../../api/reviews';
import { getAllServices } from '../../../api/servicesCatalog';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement
);

const GroomerStatistics = () => {
  const [timePeriod, setTimePeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [reviewsByAppointmentId, setReviewsByAppointmentId] = useState({});
  const [durationByServiceName, setDurationByServiceName] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [appts, groomerProfile, servicesCatalog] = await Promise.all([
          getGroomerAppointments().catch(() => []),
          getGroomerProfile().catch(() => null),
          getAllServices(true).catch(() => []),
        ]);

        setAppointments(Array.isArray(appts) ? appts : []);

        const durationMap = (servicesCatalog || []).reduce((acc, svc) => {
          const name = (svc?.name || '').trim();
          const mins = Number(svc?.duration_minutes);
          if (name) acc[name] = Number.isFinite(mins) ? mins : 0;
          return acc;
        }, {});
        setDurationByServiceName(durationMap);

        const groomerId = groomerProfile?.id;
        if (groomerId) {
          const reviews = await getReviewsByGroomer(groomerId).catch(() => []);
          const byAppt = (reviews || []).reduce((acc, r) => {
            if (r?.appointment_id != null) {
              acc[r.appointment_id] = {
                rating: Number(r.rating) || 0,
                comment: r.comment || '',
                created_at: r.created_at,
              };
            }
            return acc;
          }, {});
          setReviewsByAppointmentId(byAppt);
        } else {
          setReviewsByAppointmentId({});
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const current = useMemo(() => {
    const now = new Date();

    const getRangeStart = () => {
      if (timePeriod === 'week') return startOfWeek(now, { weekStartsOn: 1 }); // lunes
      if (timePeriod === 'month') return startOfMonth(now);
      return startOfYear(now);
    };
    const rangeStart = getRangeStart();

    const parseDate = (v) => {
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    const inPeriod = (appt) => {
      const d = parseDate(appt?.date);
      return d && d >= rangeStart && d <= now;
    };

    const apptsInPeriod = (appointments || []).filter(inPeriod);
    const completedInPeriod = apptsInPeriod.filter(a => a?.status === 'completed');
    const cancelledInPeriod = apptsInPeriod.filter(a => a?.status === 'cancelled');

    const totalServices = completedInPeriod.length;
    const totalAppointments = completedInPeriod.length + cancelledInPeriod.length;
    const totalEarnings = completedInPeriod.reduce((sum, a) => sum + (Number(a?.price) || 0), 0);

    const completionRate = totalAppointments > 0
      ? Math.round((totalServices / totalAppointments) * 100)
      : 0;

    // Rating promedio (solo citas completadas del período con reseña)
    const ratings = completedInPeriod
      .map(a => reviewsByAppointmentId?.[a?.id]?.rating || 0)
      .filter(r => r > 0);
    const averageRating = ratings.length > 0
      ? Number((ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1))
      : 0;

    // Clientes activos + nuevos/recurrentes
    const clientEmail = (a) => (a?.client_email || '').trim().toLowerCase();
    const activeClientSet = new Set(apptsInPeriod.map(clientEmail).filter(Boolean));
    const activeClients = activeClientSet.size;

    // Para "nuevos": primer servicio (de todos los tiempos) cae dentro del rango
    const firstDateByClient = (appointments || []).reduce((acc, a) => {
      const email = clientEmail(a);
      const d = parseDate(a?.date);
      if (!email || !d) return acc;
      if (!acc[email] || d < acc[email]) acc[email] = d;
      return acc;
    }, {});
    const newClients = [...activeClientSet].filter((email) => {
      const first = firstDateByClient[email];
      return first && first >= rangeStart;
    }).length;
    const returningClients = Math.max(activeClients - newClients, 0);

    // Servicios por tipo (top)
    const serviceName = (a) => (a?.service || 'Sin servicio').trim();
    const serviceCounts = completedInPeriod.reduce((acc, a) => {
      const s = serviceName(a);
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
    const sortedServices = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]);

    const palette = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#0ea5e9', '#22c55e'];
    const topN = timePeriod === 'year' ? 4 : 5;
    const top = sortedServices.slice(0, topN);
    const rest = sortedServices.slice(topN);
    const labels = top.map(([name]) => name);
    const data = top.map(([, c]) => c);
    if (timePeriod === 'year' && rest.length > 0) {
      labels.push('Otros');
      data.push(rest.reduce((s, [, c]) => s + c, 0));
    }

    const servicesByType = {
      labels: labels.length ? labels : ['Sin datos'],
      data: data.length ? data : [0],
      colors: labels.length ? labels.map((_, i) => palette[i % palette.length]) : ['#cbd5e1'],
    };

    const favoriteService = top.length ? top[0][0] : 'N/A';

    // Ganancias: semana/mes por día de semana; año por mes
    const weekdayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    let earningsByDay = { labels: weekdayLabels, data: Array(7).fill(0) };

    if (timePeriod === 'year') {
      const byMonth = Array(12).fill(0);
      completedInPeriod.forEach((a) => {
        const d = parseDate(a?.date);
        if (!d) return;
        byMonth[d.getMonth()] += Number(a?.price) || 0;
      });
      earningsByDay = { labels: monthLabels, data: byMonth };
    } else {
      const byWeekday = Array(7).fill(0);
      completedInPeriod.forEach((a) => {
        const d = parseDate(a?.date);
        if (!d) return;
        // JS: 0=Dom,1=Lun... -> queremos L=0..D=6
        const idx = (d.getDay() + 6) % 7;
        byWeekday[idx] += Number(a?.price) || 0;
      });
      earningsByDay = { labels: weekdayLabels, data: byWeekday };
    }

    // Distribución de calificaciones (1..5)
    const ratingDistributionCounts = [0, 0, 0, 0, 0]; // 1..5
    completedInPeriod.forEach((a) => {
      const r = reviewsByAppointmentId?.[a?.id]?.rating || 0;
      if (r >= 1 && r <= 5) ratingDistributionCounts[r - 1] += 1;
    });
    const ratingDistribution = {
      labels: ['⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'],
      data: ratingDistributionCounts,
    };

    // Insights: mejor día + horas promedio por día laboral
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const byDayName = completedInPeriod.reduce((acc, a) => {
      const d = parseDate(a?.date);
      if (!d) return acc;
      const name = dayNames[d.getDay()];
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});
    const bestDay = Object.entries(byDayName).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    const totalMinutes = completedInPeriod.reduce((sum, a) => {
      const svc = serviceName(a);
      return sum + (Number(durationByServiceName?.[svc]) || 0);
    }, 0);
    const distinctDaysWorked = new Set(
      completedInPeriod
        .map(a => parseDate(a?.date))
        .filter(Boolean)
        .map(d => d.toISOString().slice(0, 10))
    ).size;
    const avgHoursPerDay = distinctDaysWorked > 0
      ? Number(((totalMinutes / 60) / distinctDaysWorked).toFixed(1))
      : 0;

    return {
      totalServices,
      totalEarnings: Number(totalEarnings.toFixed(2)),
      averageRating,
      completionRate,
      activeClients,
      newClients,
      returningClients,
      favoriteService,
      servicesByType,
      earningsByDay,
      ratingDistribution,
      bestDay,
      avgEarning: totalServices > 0 ? Number((totalEarnings / totalServices).toFixed(2)) : 0,
      avgHoursPerDay,
    };
  }, [appointments, reviewsByAppointmentId, durationByServiceName, timePeriod]);

  // Dynamic chart data
  const servicesPieData = {
    labels: current.servicesByType.labels,
    datasets: [{
      data: current.servicesByType.data,
      backgroundColor: current.servicesByType.colors,
      borderWidth: 2,
      borderColor: '#fff',
    }],
  };

  const earningsLineData = {
    labels: current.earningsByDay.labels,
    datasets: [{
      label: 'Ganancias ($)',
      data: current.earningsByDay.data,
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      tension: 0.35,
      fill: true,
      pointBackgroundColor: '#10b981',
      pointRadius: 4,
    }],
  };

  const ratingsBarData = {
    labels: current.ratingDistribution.labels,
    datasets: [{
      label: 'Número de calificaciones',
      data: current.ratingDistribution.data,
      backgroundColor: '#f59e0b',
      borderRadius: 8,
    }],
  };

  // ==================== EXPORT FUNCTIONS ====================

  const getPeriodLabel = () => {
    if (timePeriod === 'week') return 'Esta Semana';
    if (timePeriod === 'month') return 'Este Mes';
    return 'Este Año';
  };

  // Export to Excel
  const exportToExcel = () => {
    const wsData = [
      ['INFORME DE ESTADÍSTICAS - PASEOS FELICES'],
      [`Período: ${getPeriodLabel()}`],
      [''],
      ['RESUMEN GENERAL'],
      ['Métrica', 'Valor'],
      ['Servicios Realizados', current.totalServices],
      ['Ganancias Totales ($)', current.totalEarnings],
      ['Rating Promedio', current.averageRating],
      ['Tasa de Finalización (%)', current.completionRate],
      ['Clientes Activos', current.activeClients],
      [''],
      ['SERVICIOS POR TIPO'],
      ['Servicio', 'Cantidad'],
      ...current.servicesByType.labels.map((label, i) => [label, current.servicesByType.data[i]]),
      [''],
      ['DISTRIBUCIÓN DE CALIFICACIONES'],
      ['Calificación', 'Cantidad'],
      ...current.ratingDistribution.labels.map((label, i) => [label, current.ratingDistribution.data[i]]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Estadísticas');

    XLSX.writeFile(wb, `Informe_Estadisticas_${getPeriodLabel().replace(/\s/g, '_')}.xlsx`);
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const period = getPeriodLabel();

    doc.setFontSize(18);
    doc.text('📈 Informe de Estadísticas - Paseos Felices', 20, 20);
    doc.setFontSize(12);
    doc.text(`Período: ${period}`, 20, 28);

    // KPIs
    doc.setFontSize(14);
    doc.text('Resumen General', 20, 40);

    const kpiData = [
      ['Métrica', 'Valor'],
      ['Servicios Realizados', current.totalServices.toString()],
      ['Ganancias Totales', `$${current.totalEarnings}`],
      ['Rating Promedio', current.averageRating.toString()],
      ['Tasa de Finalización', `${current.completionRate}%`],
      ['Clientes Activos', current.activeClients.toString()],
    ];

    doc.autoTable({
      startY: 45,
      head: [kpiData[0]],
      body: kpiData.slice(1),
    });

    // Services by type
    doc.text('Servicios por Tipo', 20, doc.lastAutoTable.finalY + 15);
    const servicesData = current.servicesByType.labels.map((l, i) => [l, current.servicesByType.data[i]]);
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Servicio', 'Cantidad']],
      body: servicesData,
    });

    // Ratings
    doc.text('Distribución de Calificaciones', 20, doc.lastAutoTable.finalY + 15);
    const ratingsData = current.ratingDistribution.labels.map((l, i) => [l, current.ratingDistribution.data[i]]);
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Calificación', 'Cantidad']],
      body: ratingsData,
    });

    doc.save(`Informe_Estadisticas_${period.replace(/\s/g, '_')}.pdf`);
  };

  // Export to Word
  const exportToWord = () => {
    const period = getPeriodLabel();

    const kpiRows = [
      ['Servicios Realizados', String(current.totalServices)],
      ['Ganancias Totales ($)', String(current.totalEarnings)],
      ['Rating Promedio', String(current.averageRating)],
      ['Tasa de Finalización (%)', String(current.completionRate)],
      ['Clientes Activos', String(current.activeClients)],
    ];

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            children: ['Informe de Estadísticas - Paseos Felices'],
          }),
          new Paragraph({
            children: [`Período: ${period}`],
          }),
          new Paragraph({ children: [''] }),

          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: ['Resumen General'],
          }),

          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: ['Métrica'] })] }),
                  new TableCell({ children: [new Paragraph({ children: ['Valor'] })] }),
                ],
              }),
              ...kpiRows.map(([label, value]) =>
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [label] })] }),
                    new TableCell({ children: [new Paragraph({ children: [value] })] }),
                  ],
                })
              ),
            ],
          }),

          new Paragraph({ children: [''] }),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: ['Servicios por Tipo'],
          }),
          ...current.servicesByType.labels.map((label, i) =>
            new Paragraph({ children: [`• ${label}: ${current.servicesByType.data[i]} servicios`] })
          ),

          new Paragraph({ children: [''] }),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: ['Distribución de Calificaciones'],
          }),
          ...current.ratingDistribution.labels.map((label, i) =>
            new Paragraph({ children: [`• ${label}: ${current.ratingDistribution.data[i]} calificaciones`] })
          ),
        ],
      }],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, `Informe_Estadisticas_${period.replace(/\s/g, '_')}.docx`);
    });
  };

  // ==================== END EXPORT FUNCTIONS ====================

  return (
    <div className="groomer-statistics">
      <div className="stats-header">
        <h1>📈 Estadísticas y Análisis</h1>
        <p>Tu desempeño y métricas principales</p>
      </div>

      {/* Period Selector */}
      <div className="period-selector">
        <button 
          className={`period-btn ${timePeriod === 'week' ? 'active' : ''}`}
          onClick={() => setTimePeriod('week')}
        >
          Semana
        </button>
        <button 
          className={`period-btn ${timePeriod === 'month' ? 'active' : ''}`}
          onClick={() => setTimePeriod('month')}
        >
          Mes
        </button>
        <button 
          className={`period-btn ${timePeriod === 'year' ? 'active' : ''}`}
          onClick={() => setTimePeriod('year')}
        >
          Año
        </button>
      </div>

      {/* Export Buttons - Reusable Component */}
      <ExportReportButtons
        onExportExcel={exportToExcel}
        onExportPDF={exportToPDF}
        onExportWord={exportToWord}
        title="Exportar Informe"
      />

      {/* Main Stats */}
      <div className="main-stats-grid">
        <div className="stat-card stat-card-warning">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>Rating Promedio</h3>
            <p className="stat-number">{loading ? '...' : current.averageRating}</p>
            <p className="stat-detail">de clientes satisfechos</p>
          </div>
        </div>

        <div className="stat-card stat-card-primary">
          <div className="stat-icon">🧾</div>
          <div className="stat-content">
            <h3>Servicios Realizados</h3>
            <p className="stat-number">{loading ? '...' : current.totalServices}</p>
            <p className="stat-detail">servicios completados</p>
          </div>
        </div>

        <div className="stat-card stat-card-info">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Tasa de Finalización</h3>
            <p className="stat-number">{loading ? '...' : `${current.completionRate}%`}</p>
            <p className="stat-detail">servicios completados</p>
          </div>
        </div>

        <div className="stat-card stat-card-success">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Ganancias Totales</h3>
            <p className="stat-number">{loading ? '...' : `$${current.totalEarnings}`}</p>
            <p className="stat-detail">ingresos generados</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Services by Type Chart */}
        <div className="chart-card">
          <h3>📋 Servicios por Tipo</h3>
          <div className="chart-placeholder" style={{ height: '220px', padding: '10px' }}>
            <Pie 
              data={servicesPieData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      color: '#64748b',
                      padding: 20,
                      font: { size: 13 }
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => `${ctx.label}: ${ctx.raw} servicios`
                    }
                  }
                }
              }} 
            />
          </div>
        </div>

        {/* Earnings Chart */}
        <div className="chart-card">
          <h3>💰 Ganancias por Semana</h3>
          <div className="chart-placeholder" style={{ height: '220px' }}>
            <Line 
              data={earningsLineData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => `$${ctx.raw}`
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { color: '#64748b' },
                    grid: { color: 'rgba(148, 163, 184, 0.1)' }
                  },
                  x: {
                    ticks: { color: '#64748b' },
                    grid: { color: 'rgba(148, 163, 184, 0.1)' }
                  }
                }
              }} 
            />
          </div>
        </div>

        {/* Client Distribution */}
        <div className="chart-card">
          <h3>👥 Clientes Activos</h3>
          <div className="chart-placeholder">
            <div className="client-stats">
               <div className="client-stat">
                 <span className="client-stat-label">Clientes Nuevos</span>
                 <span className="client-stat-value">{loading ? '...' : current.newClients}</span>
               </div>
               <div className="client-stat">
                 <span className="client-stat-label">Clientes Recurrentes</span>
                 <span className="client-stat-value">{loading ? '...' : current.returningClients}</span>
               </div>
               <div className="client-stat">
                 <span className="client-stat-label">Total</span>
                 <span className="client-stat-value">{loading ? '...' : current.activeClients}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Top Services */}
        <div className="chart-card">
          <h3>🔝 Servicios Populares</h3>
          <div className="chart-placeholder">
            <div className="top-services-list">
              {(() => {
                const total = current.totalServices || 0;
                const pairs = current.servicesByType.labels
                  .map((label, i) => ({ label, count: current.servicesByType.data[i] || 0 }))
                  .filter(x => x.label !== 'Sin datos')
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 4);

                if (loading) {
                  return (
                    <div className="service-item">
                      <span>Cargando...</span>
                      <span className="badge">-</span>
                    </div>
                  );
                }

                if (pairs.length === 0) {
                  return (
                    <div className="service-item">
                      <span>Sin datos</span>
                      <span className="badge">0%</span>
                    </div>
                  );
                }

                return pairs.map((s) => (
                  <div className="service-item" key={s.label}>
                    <span>{s.label}</span>
                    <span className="badge">{total > 0 ? `${Math.round((s.count / total) * 100)}%` : '0%'}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="chart-card">
          <h3>⭐ Distribución de Calificaciones</h3>
          <div className="chart-placeholder" style={{ height: '200px' }}>
            <Bar 
              data={ratingsBarData} 
              options={{
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  x: {
                    beginAtZero: true,
                    ticks: { color: '#64748b' },
                    grid: { color: 'rgba(148, 163, 184, 0.1)' }
                  },
                  y: {
                    ticks: { color: '#64748b', font: { size: 13 } },
                    grid: { color: 'rgba(148, 163, 184, 0.1)' }
                  }
                }
              }} 
            />
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="insights-section">
        <h3>💡 Insights de Desempeño</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <p className="insight-title">Servicio Favorito</p>
            <p className="insight-value">{loading ? '...' : current.favoriteService}</p>
            <p className="insight-note">Tu servicio más solicitado</p>
          </div>
          <div className="insight-card">
            <p className="insight-title">Ganancia Promedio</p>
            <p className="insight-value">{loading ? '...' : `$${current.avgEarning}`}</p>
            <p className="insight-note">Por servicio completado</p>
          </div>
          <div className="insight-card">
            <p className="insight-title">Mejor Día</p>
            <p className="insight-value">{loading ? '...' : current.bestDay}</p>
            <p className="insight-note">Mayor número de citas</p>
          </div>
          <div className="insight-card">
            <p className="insight-title">Horas Promedio</p>
            <p className="insight-value">{loading ? '...' : `${current.avgHoursPerDay} hrs`}</p>
            <p className="insight-note">Por día laboral</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroomerStatistics;
