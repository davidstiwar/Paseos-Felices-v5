import React, { useState, useEffect } from 'react';
import { getAllUsersAdmin } from '../../../api/auth';
import { getAllAppointments } from '../../../api/appointments';
import { getReviewsByGroomer } from '../../../api/reviews';
import { useToast } from '../../../components/Context/ToastContext';

const GroomerRankings = () => {
  const { showError } = useToast();
  const [groomers, setGroomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('rating'); // rating, services, completion, earnings, satisfaction
  const [timePeriod, setTimePeriod] = useState('all'); // all, week, month, year

  useEffect(() => {
    loadRankings();
  }, [timePeriod]);

  const loadRankings = async () => {
    try {
      setLoading(true);
      const [users, appointments] = await Promise.all([
        getAllUsersAdmin(),
        getAllAppointments().catch(() => []),
      ]);

      // Filtrar solo groomers
      const groomerUsers = users.filter(u => u.role === 'groomer');

      // Calcular métricas para cada groomer
      const groomersWithMetrics = await Promise.all(
        groomerUsers.map(async (groomer) => {
          const groomerAppointments = appointments.filter(a => a.groomer_email === groomer.email);
          const reviews = await getReviewsByGroomer(groomer.id).catch(() => []);

          // Filtrar por período de tiempo
          let filteredAppointments = groomerAppointments;
          if (timePeriod !== 'all') {
            const now = new Date();
            const cutoffDate = new Date();
            if (timePeriod === 'week') cutoffDate.setDate(now.getDate() - 7);
            else if (timePeriod === 'month') cutoffDate.setMonth(now.getMonth() - 1);
            else if (timePeriod === 'year') cutoffDate.setFullYear(now.getFullYear() - 1);
            
            filteredAppointments = groomerAppointments.filter(a => 
              new Date(a.date) >= cutoffDate
            );
          }

          const completed = filteredAppointments.filter(a => a.status === 'completed').length;
          const total = filteredAppointments.length;
          const completionRate = total > 0 ? (completed / total) * 100 : 0;
          
          const avgRating = reviews.length > 0 
            ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length 
            : 0;

          const earnings = filteredAppointments
            .filter(a => a.status === 'completed')
            .reduce((sum, a) => sum + (a.price || 0), 0);

          // Calcular satisfacción del cliente (basado en reviews)
          const satisfaction = reviews.length > 0
            ? reviews.filter(r => r.rating >= 4).length / reviews.length * 100
            : 0;

          return {
            ...groomer,
            metrics: {
              rating: avgRating,
              services: completed,
              completionRate,
              earnings,
              satisfaction,
              totalReviews: reviews.length,
            }
          };
        })
      );

      setGroomers(groomersWithMetrics);
    } catch (err) {
      showError('Error cargando rankings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sortGroomers = (groomersList) => {
    return [...groomersList].sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.metrics.rating - a.metrics.rating;
        case 'services':
          return b.metrics.services - a.metrics.services;
        case 'completion':
          return b.metrics.completionRate - a.metrics.completionRate;
        case 'earnings':
          return b.metrics.earnings - a.metrics.earnings;
        case 'satisfaction':
          return b.metrics.satisfaction - a.metrics.satisfaction;
        default:
          return 0;
      }
    });
  };

  const sortedGroomers = sortGroomers(groomers);

  const getRankBadge = (index) => {
    if (index === 0) return <span className="rank-badge gold">🥇 #1</span>;
    if (index === 1) return <span className="rank-badge silver">🥈 #2</span>;
    if (index === 2) return <span className="rank-badge bronze">🥉 #3</span>;
    return <span className="rank-badge">#{index + 1}</span>;
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case 'rating': return 'Rating Promedio';
      case 'services': return 'Servicios Completados';
      case 'completion': return 'Tasa de Finalización';
      case 'earnings': return 'Ganancias Totales';
      case 'satisfaction': return 'Satisfacción del Cliente';
      default: return 'Rating';
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading-container">
          <p>Cargando rankings de groomers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-header__main">
          <div className="admin-page-header__title">
            <h1>🏆 Rankings de Groomers</h1>
          </div>
          <p className="admin-page-header__subtitle">
            Sistema de ranking avanzado basado en múltiples métricas de desempeño
          </p>
        </div>
      </div>

      {/* Controls */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        marginBottom: '24px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div>
          <label style={{ marginRight: '8px', fontWeight: 600 }}>Ordenar por:</label>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '14px'
            }}
          >
            <option value="rating">Rating Promedio</option>
            <option value="services">Servicios Completados</option>
            <option value="completion">Tasa de Finalización</option>
            <option value="earnings">Ganancias Totales</option>
            <option value="satisfaction">Satisfacción del Cliente</option>
          </select>
        </div>

        <div>
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
      </div>

      {/* Rankings Table */}
      <div className="usuarios-table-wrapper">
        <table className="usuarios-table">
          <thead>
            <tr>
              <th>Ranking</th>
              <th>Groomer</th>
              <th>Email</th>
              <th>Rating ⭐</th>
              <th>Servicios</th>
              <th>Finalización</th>
              <th>Ganancias</th>
              <th>Satisfacción</th>
              <th>Reviews</th>
            </tr>
          </thead>
          <tbody>
            {sortedGroomers.length > 0 ? (
              sortedGroomers.map((groomer, index) => (
                <tr key={groomer.id}>
                  <td>{getRankBadge(index)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img 
                        src={groomer.foto_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(groomer.nombre_completo || groomer.email)}&background=random`}
                        alt={groomer.nombre_completo}
                        style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <strong>{groomer.nombre_completo || groomer.email}</strong>
                    </div>
                  </td>
                  <td>{groomer.email}</td>
                  <td>
                    <span style={{ 
                      fontWeight: 700,
                      color: groomer.metrics.rating >= 4.5 ? '#10b981' : 
                             groomer.metrics.rating >= 4 ? '#f59e0b' : '#ef4444'
                    }}>
                      {groomer.metrics.rating.toFixed(1)} ⭐
                    </span>
                  </td>
                  <td>{groomer.metrics.services}</td>
                  <td>
                    <span style={{ 
                      fontWeight: 600,
                      color: groomer.metrics.completionRate >= 90 ? '#10b981' : 
                             groomer.metrics.completionRate >= 70 ? '#f59e0b' : '#ef4444'
                    }}>
                      {groomer.metrics.completionRate.toFixed(1)}%
                    </span>
                  </td>
                  <td>${groomer.metrics.earnings.toFixed(2)}</td>
                  <td>
                    <span style={{ 
                      fontWeight: 600,
                      color: groomer.metrics.satisfaction >= 80 ? '#10b981' : 
                             groomer.metrics.satisfaction >= 60 ? '#f59e0b' : '#ef4444'
                    }}>
                      {groomer.metrics.satisfaction.toFixed(1)}%
                    </span>
                  </td>
                  <td>{groomer.metrics.totalReviews}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                  No hay groomers registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{ marginTop: '20px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h4 style={{ margin: '0 0 12px 0' }}>📊 Métricas de Ranking</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13px' }}>
          <div><strong>Rating Promedio:</strong> Calificación promedio de clientes (1-5)</div>
          <div><strong>Servicios:</strong> Total de servicios completados</div>
          <div><strong>Finalización:</strong> Porcentaje de citas completadas vs totales</div>
          <div><strong>Ganancias:</strong> Ingresos totales generados</div>
          <div><strong>Satisfacción:</strong> Porcentaje de reviews positivas (4-5 estrellas)</div>
        </div>
      </div>

      <style>{`
        .rank-badge {
          display: inline-block;
          padding: '4px 12px';
          borderRadius: '20px';
          font-weight: 700;
          font-size: '14px';
        }
        .rank-badge.gold {
          background: linear-gradient(135deg, #ffd700 0%, #ffec8b 100%);
          color: #333;
        }
        .rank-badge.silver {
          background: linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%);
          color: #333;
        }
        .rank-badge.bronze {
          background: linear-gradient(135deg, #cd7f32 0%, #e8a862 100%);
          color: #fff;
        }
        .rank-badge:not(.gold):not(.silver):not(.bronze) {
          background: #333;
          color: #fff;
        }
      `}</style>
    </div>
  );
};

export default GroomerRankings;
