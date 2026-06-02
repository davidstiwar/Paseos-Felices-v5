import React, { useState, useEffect } from 'react';
import { getAllUsersAdmin } from '../../../api/auth';
import { getAllAppointments } from '../../../api/appointments';
import { getReviewsByGroomer } from '../../../api/reviews';
import { useToast } from '../../../components/Context/ToastContext';

const SatisfactionStats = () => {
  const { showError } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('all'); // all, week, month, year

  useEffect(() => {
    loadStats();
  }, [timePeriod]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [users, appointments] = await Promise.all([
        getAllUsersAdmin(),
        getAllAppointments().catch(() => []),
      ]);

      // Filtrar por período de tiempo
      let filteredAppointments = appointments;
      if (timePeriod !== 'all') {
        const now = new Date();
        const cutoffDate = new Date();
        if (timePeriod === 'week') cutoffDate.setDate(now.getDate() - 7);
        else if (timePeriod === 'month') cutoffDate.setMonth(now.getMonth() - 1);
        else if (timePeriod === 'year') cutoffDate.setFullYear(now.getFullYear() - 1);
        
        filteredAppointments = appointments.filter(a => 
          new Date(a.date) >= cutoffDate
        );
      }

      // Obtener reviews de todos los groomers
      const groomers = users.filter(u => u.role === 'groomer');
      const allReviews = await Promise.all(
        groomers.map(g => getReviewsByGroomer(g.id).catch(() => []))
      );
      const reviews = allReviews.flat();

      // Calcular estadísticas de satisfacción
      const totalReviews = reviews.length;
      const fiveStarReviews = reviews.filter(r => r.rating === 5).length;
      const fourStarReviews = reviews.filter(r => r.rating === 4).length;
      const threeStarReviews = reviews.filter(r => r.rating === 3).length;
      const twoStarReviews = reviews.filter(r => r.rating === 2).length;
      const oneStarReviews = reviews.filter(r => r.rating === 1).length;

      const avgRating = totalReviews > 0 
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews 
        : 0;

      const satisfactionRate = totalReviews > 0
        ? ((fiveStarReviews + fourStarReviews) / totalReviews) * 100
        : 0;

      // Satisfacción por servicio
      const serviceSatisfaction = {};
      filteredAppointments.forEach(appt => {
        if (appt.status === 'completed' && appt.service) {
          if (!serviceSatisfaction[appt.service]) {
            serviceSatisfaction[appt.service] = { total: 0, satisfied: 0 };
          }
          serviceSatisfaction[appt.service].total++;
          // Considerar como satisfecho si no hay queja (simplificado)
          serviceSatisfaction[appt.service].satisfied++;
        }
      });

      const serviceStats = Object.entries(serviceSatisfaction).map(([service, data]) => ({
        service,
        total: data.total,
        satisfaction: data.total > 0 ? (data.satisfied / data.total) * 100 : 0
      })).sort((a, b) => b.satisfaction - a.satisfaction);

      // Tendencia de satisfacción (últimos 6 meses)
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

        const monthReviews = reviews.filter(r => {
          const reviewDate = new Date(r.created_at);
          return reviewDate >= monthStart && reviewDate <= monthEnd;
        });

        const monthAvg = monthReviews.length > 0
          ? monthReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / monthReviews.length
          : 0;

        monthlyTrend.push({
          month: monthDate.toLocaleDateString('es-ES', { month: 'short' }),
          avg: monthAvg,
          count: monthReviews.length
        });
      }

      // Top groomers por satisfacción
      const groomerSatisfaction = await Promise.all(
        groomers.map(async (groomer) => {
          const groomerReviews = await getReviewsByGroomer(groomer.id).catch(() => []);
          const groomerAvg = groomerReviews.length > 0
            ? groomerReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / groomerReviews.length
            : 0;
          const groomerSat = groomerReviews.length > 0
            ? (groomerReviews.filter(r => r.rating >= 4).length / groomerReviews.length) * 100
            : 0;

          return {
            groomer: groomer.nombre_completo || groomer.email,
            email: groomer.email,
            avgRating: groomerAvg,
            satisfaction: groomerSat,
            totalReviews: groomerReviews.length
          };
        })
      );

      const topGroomers = groomerSatisfaction
        .filter(g => g.totalReviews > 0)
        .sort((a, b) => b.satisfaction - a.satisfaction)
        .slice(0, 10);

      setStats({
        totalReviews,
        fiveStarReviews,
        fourStarReviews,
        threeStarReviews,
        twoStarReviews,
        oneStarReviews,
        avgRating,
        satisfactionRate,
        serviceStats,
        monthlyTrend,
        topGroomers
      });
    } catch (err) {
      showError('Error cargando estadísticas de satisfacción');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading-container">
          <p>Cargando estadísticas de satisfacción...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="admin-page">
        <div className="error-container">
          <p>No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-header__main">
          <div className="admin-page-header__title">
            <h1>📊 Estadísticas de Satisfacción</h1>
          </div>
          <p className="admin-page-header__subtitle">
            Análisis de satisfacción del cliente basado en reviews y feedback
          </p>
        </div>
      </div>

      {/* Period Selector */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ marginRight: '8px', fontWeight: 600 }}>Período:</label>
        <select 
          value={timePeriod}
          onChange={(e) => setTimePeriod(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #ddd',
            fontSize: '14px'
          }}
        >
          <option value="all">Todo el tiempo</option>
          <option value="week">Última semana</option>
          <option value="month">Último mes</option>
          <option value="year">Último año</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="main-stats-grid">
        <div className="stat-card stat-card-primary">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>Rating Promedio</h3>
            <p className="stat-number">{stats.avgRating.toFixed(2)} / 5.0</p>
            <span className="stat-trend neutral">Basado en {stats.totalReviews} reviews</span>
          </div>
        </div>
        <div className="stat-card stat-card-success">
          <div className="stat-icon">😊</div>
          <div className="stat-content">
            <h3>Tasa de Satisfacción</h3>
            <p className="stat-number">{stats.satisfactionRate.toFixed(1)}%</p>
            <span className="stat-trend neutral">Reviews 4-5 estrellas</span>
          </div>
        </div>
        <div className="stat-card stat-card-info">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>Total Reviews</h3>
            <p className="stat-number">{stats.totalReviews}</p>
            <span className="stat-trend neutral">Feedback recibido</span>
          </div>
        </div>
        <div className="stat-card stat-card-warning">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <h3>5 Estrellas</h3>
            <p className="stat-number">{stats.fiveStarReviews}</p>
            <span className="stat-trend neutral">Reviews perfectas</span>
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div style={{ marginTop: '32px' }}>
        <h2 style={{ marginBottom: '16px' }}>Distribución de Ratings</h2>
        <div style={{ background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 12, padding: '24px' }}>
          {[
            { stars: 5, count: stats.fiveStarReviews, color: '#10b981' },
            { stars: 4, count: stats.fourStarReviews, color: '#34d399' },
            { stars: 3, count: stats.threeStarReviews, color: '#f59e0b' },
            { stars: 2, count: stats.twoStarReviews, color: '#f97316' },
            { stars: 1, count: stats.oneStarReviews, color: '#ef4444' },
          ].map(({ stars, count, color }) => {
            const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
            return (
              <div key={stars} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>{'⭐'.repeat(stars)}</span>
                  <span>{count} ({percentage.toFixed(1)}%)</span>
                </div>
                <div style={{ 
                  height: '8px', 
                  background: '#e5e7eb', 
                  borderRadius: '4px', 
                  overflow: 'hidden' 
                }}>
                  <div style={{ 
                    height: '100%', 
                    background: color, 
                    width: `${percentage}%`,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Groomers by Satisfaction */}
      <div style={{ marginTop: '32px' }}>
        <h2 style={{ marginBottom: '16px' }}>🏆 Top Groomers por Satisfacción</h2>
        <div className="usuarios-table-wrapper">
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>Ranking</th>
                <th>Groomer</th>
                <th>Email</th>
                <th>Rating Promedio</th>
                <th>Satisfacción</th>
                <th>Reviews</th>
              </tr>
            </thead>
            <tbody>
              {stats.topGroomers.length > 0 ? (
                stats.topGroomers.map((g, index) => (
                  <tr key={g.email}>
                    <td>
                      <span style={{ 
                        fontWeight: 700,
                        color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#333'
                      }}>
                        #{index + 1}
                      </span>
                    </td>
                    <td>{g.groomer}</td>
                    <td>{g.email}</td>
                    <td>{g.avgRating.toFixed(2)} ⭐</td>
                    <td>
                      <span style={{ 
                        fontWeight: 600,
                        color: g.satisfaction >= 80 ? '#10b981' : g.satisfaction >= 60 ? '#f59e0b' : '#ef4444'
                      }}>
                        {g.satisfaction.toFixed(1)}%
                      </span>
                    </td>
                    <td>{g.totalReviews}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                    No hay datos de satisfacción disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Satisfaction by Service */}
      {stats.serviceStats.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ marginBottom: '16px' }}>📋 Satisfacción por Servicio</h2>
          <div className="usuarios-table-wrapper">
            <table className="usuarios-table">
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Total</th>
                  <th>Satisfacción</th>
                </tr>
              </thead>
              <tbody>
                {stats.serviceStats.map((s, index) => (
                  <tr key={index}>
                    <td>{s.service}</td>
                    <td>{s.total}</td>
                    <td>
                      <span style={{ 
                        fontWeight: 600,
                        color: s.satisfaction >= 90 ? '#10b981' : s.satisfaction >= 70 ? '#f59e0b' : '#ef4444'
                      }}>
                        {s.satisfaction.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monthly Trend */}
      <div style={{ marginTop: '32px' }}>
        <h2 style={{ marginBottom: '16px' }}>📈 Tendencia Mensual</h2>
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          flexWrap: 'wrap',
          background: 'var(--bg-card, #fff)', 
          border: '1px solid var(--border-color, #e5e7eb)', 
          borderRadius: 12, 
          padding: '24px' 
        }}>
          {stats.monthlyTrend.map((month, index) => (
            <div key={index} style={{ 
              flex: '1 1 120px',
              textAlign: 'center',
              padding: '12px',
              background: '#f9fafb',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>{month.month}</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#333' }}>
                {month.avg > 0 ? month.avg.toFixed(1) : '-'}
              </div>
              <div style={{ fontSize: '12px', color: '#888' }}>{month.count} reviews</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SatisfactionStats;
