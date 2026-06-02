import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './estilos/App.css';
import './estilos/components/Buttons.css';




import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import Auth from './pages/auth/Auth';
import PasswordReset from './components/Auth/PasswordReset';
import GoogleCallback from './pages/auth/GoogleCallback';
import { UserProvider, useUser } from './components/Context/UserContext';
import { ToastProvider } from './components/Context/ToastContext';
import SessionDebugger from './components/Utils/SessionDebugger';
import { getAllServices } from './api/servicesCatalog';
import { getPublicAppointmentStats, getPublicServicePopularity } from './api/appointments';
import { getAllReviewsPublic } from './api/reviews';
import { ToastContainer } from './components/Common/Toast';

// Client Panel
import ClientDashboard from './pages/client/dashboard/ClientDashboard';
import ClientProfile from './pages/client/profile/ClientProfile';
import MyPets from './pages/client/pets/MyPets';
import RegisterPet from './pages/client/pets/RegisterPet';
import EditPet from './pages/client/pets/EditPet';
import MyAppointments from './pages/client/appointments/MyAppointments';
import BookAppointment from './pages/client/appointments/BookAppointment';
import EditAppointment from './pages/client/appointments/EditAppointment';
import ServiceHistory from './pages/client/history/ServiceHistory';
import ClientLayout from './pages/client/ClientLayout';
import InvoiceHistory from './pages/client/invoices/InvoiceHistory';
import InvoiceViewer from './pages/client/invoices/InvoiceViewer';

// Groomer Panel
import GroomerLayout from './pages/groomer/GroomerLayout';
import GroomerDashboard from './pages/groomer/GroomerDashboard';
import GroomerServices from './pages/groomer/services/GroomerServices';
import GroomerPets from './pages/groomer/pets/GroomerPets';
import GroomerHistory from './pages/groomer/history/GroomerHistory';
import GroomerStatistics from './pages/groomer/statistics/GroomerStatistics';
import GroomerProfile from './pages/groomer/profile/GroomerProfile';
import GroomerInvoices from './pages/groomer/GroomerInvoices';
import GroomerInvoiceViewer from './pages/groomer/GroomerInvoiceViewer';
import { ThemeProvider } from './components/Context/ThemeContext';

// Admin

import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminServicesPage from './pages/admin/services/AdminServicesPage';
import AdminAppointmentsPage from './pages/admin/appointments/AdminAppointmentsPage';
import AdminReportsPage from './pages/admin/reports/ReportsPage';
import UsersPage from './pages/admin/users/UsersPage';
import AdminProfile from './pages/admin/profile/AdminProfile';
import AdminInvoicesPage from './pages/admin/billing/AdminInvoicesPage';
import AdminInvoiceViewer from './pages/admin/billing/AdminInvoiceViewer';
import CommissionSettings from './pages/admin/billing/CommissionSettings';
import FinancialReports from './pages/admin/billing/FinancialReports';
// Lazy-loaded admin panel
const GroomerApplications = React.lazy(() => import('./pages/admin/groomer-applications/GroomerApplications'));

const useScrollReveal = (selector, threshold = 0.2) => {
  useEffect(() => {
    const elements = document.querySelectorAll(selector);
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold });

    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [selector, threshold]);
};


const Hero = () => {
  const navigate = useNavigate();
  const { token, userRole } = useUser();
  const [stats, setStats] = useState({
    activeServices: 0,
    totalPets: 0,
    totalAppointments: 0
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [services, apptStats] = await Promise.all([
          getAllServices(false),
          getPublicAppointmentStats(),
        ]);
        setStats(prev => ({
          ...prev,
          activeServices: services.filter(s => s.is_active).length,
          totalPets: apptStats?.completed_appointments ?? 0,
        }));
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };
    loadStats();
  }, []);

  const handleAgendarCita = () => {
    if (!token) {
      navigate('/login');
    } else if (userRole === 'groomer') {
      navigate('/groomer');
    } else {
      navigate('/client/book');
    }
  };

  return (
    <section className="hero">
      <div className="hero-content">
        <div className="badge">
          <span style={{ background: '#d96c5f', width: 8, height: 8, borderRadius: '50%', display: 'inline-block' }}></span> 
          Para amantes de mascotas
        </div>
        
        <h1>Cuidado premium<br />para tu mejor amigo</h1>
        <div className="accent-line"></div>
        
        <p>Paseos, baños y más. Profesionales de confianza que tratan a tu mascota como familia.</p>
        
        <div className="hero-buttons">
          <button className="btn-primary" onClick={handleAgendarCita}>
            Agendar cita
          </button>
        </div>

        <div style={{
          marginTop: '42px', 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '48px', 
          fontSize: '18px', 
          fontWeight: 600,
          opacity: 0.7
        }}>
          <div>⭐ {stats.activeServices} Servicios</div>
          <div>+{stats.totalPets} mascotas felices</div>
        </div>
      </div>
      
      <div className="scroll-indicator">
        <div className="mouse"></div>
        <div>SCROLL</div>
      </div>
    </section>
  );
};


const Beneficios = () => {
  const benefits = [
    { icon: '❤️', title: 'Amor real', desc: 'Cada paseo y cuidado se hace con cariño y atención personalizada.' },
    { icon: '🛡️', title: 'Seguridad total', desc: 'Profesionales verificados, seguros y seguimiento en tiempo real.' },
    { icon: '⚡', title: 'Flexibilidad', desc: 'Reserva en minutos. Elige horarios que se adapten a tu rutina.' },
    { icon: '🌟', title: 'Calidad premium', desc: 'Solo los mejores cuidadores. Calificaciones y reseñas verificadas.' },
  ];

  return (
    <section id="beneficios" className="section">
      <div className="section-title">
        <div className="section-label">POR QUÉ ELEGIRNOS</div>
        <h2>Todo lo que tu mascota merece</h2>
      </div>
      <div className="benefits-grid">
        {benefits.map((b, i) => (
          <div key={i} className="benefit-card fade-up">
            <div className="benefit-icon">{b.icon}</div>
            <h3>{b.title}</h3>
            <p>{b.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

const Servicios = () => {
  const [loading, setLoading] = useState(true);
  const [popularServices, setPopularServices] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const servicesData = await getAllServices(false);
        
        // Intentar cargar popularidad (endpoint público sin PII)
        let top3Services = [];
        try {
          const popularity = await getPublicServicePopularity();
          const servicePopularity = {};
          (popularity?.items || []).forEach(item => {
            if (item?.service) servicePopularity[item.service] = item.count || 0;
          });

          // Ordenar servicios por popularidad
          const sortedServices = servicesData.map(service => ({
            ...service,
            popularity: servicePopularity[service.name] || 0
          })).sort((a, b) => b.popularity - a.popularity);

          // Tomar los top 3
          top3Services = sortedServices.slice(0, 3);
        } catch (appointmentError) {
          // Si no hay token o error al cargar citas, mostrar los primeros 3 servicios activos
          console.log('No se pudieron cargar las citas, mostrando primeros servicios activos');
          top3Services = servicesData.filter(s => s.is_active).slice(0, 3);
        }
        
setPopularServices(top3Services);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getServiceIcon = (category) => {
    const icons = {
      'paseo': '🐕',
      'paseos': '🐕',
      'Paseos': '🐕',
      'grooming': '✂️',
      'Grooming': '✂️',
      'cuidado en casa': '🏠',
      'Cuidado en casa': '🏠',
      'entrenamiento': '🎯',
      'Entrenamiento': '🎯',
      'veterinaria': '🏥',
      'Veterinaria': '🏥',
      'nutrición': '🍖',
      'Nutrición': '🍖',
      'default': '🐾'
    };
    return icons[category] || icons['default'];
  };

  return (
    <section id="servicios" className="section services">
      <div className="section-title">
        <div className="section-label">NUESTROS SERVICIOS</div>
        <h2>Servicios pensados para ellos</h2>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 20px' }}>
          <p>Cargando servicios...</p>
        </div>
      ) : popularServices.length > 0 ? (
        <div className="benefits-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {popularServices.map((service) => (
            <div key={service.id} className="benefit-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="benefit-icon">{getServiceIcon(service.category)}</div>
              <h3>{service.name}</h3>
              <p style={{ fontSize: '14px', opacity: 0.8, marginBottom: '12px', flex: 1 }}>
                {service.description || 'Servicio profesional para tu mascota'}
              </p>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255,255,255,0.1)'
              }}>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#d96c5f' }}>
                  ${service.base_price?.toLocaleString('es-CO') || '0'}
                </span>
                <span style={{ fontSize: '12px', opacity: 0.7 }}>
                  {service.duration_minutes} min
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="coming-soon-box" style={{ 
          textAlign: 'center', 
          padding: '50px 20px', 
          borderRadius: '16px',
          maxWidth: '700px',
          margin: '0 auto'
        }}>
          <h3 style={{ marginBottom: '12px' }}>🚀 Próximamente</h3>
          <p style={{ fontSize: '16px', opacity: 0.8 }}>
            Nuestros servicios estarán disponibles muy pronto.<br />
            ¡Regístrate para ser de los primeros en enterarte!
          </p>
        </div>
      )}
    </section>
  );
};

const ComoFunciona = () => {
  const steps = [
    { 
      num: '01', 
      icon: '📅',
      title: 'Elige y reserva', 
      desc: 'Selecciona el servicio que necesitas, la fecha y la hora que mejor te convenga.',
      detail: 'Paseos, baños, entrenamiento y más.'
    },
    { 
      num: '02', 
      icon: '🤝',
      title: 'Conecta con el profesional', 
      desc: 'Recibe confirmación instantánea y los datos del cuidador verificado asignado a tu mascota.',
      detail: 'Fotos del profesional y calificaciones.'
    },
    { 
      num: '03', 
      icon: '📍',
      title: 'Disfruta la tranquilidad', 
      desc: 'Sigue el paseo en tiempo real, recibe fotos y un reporte completo al finalizar.',
      detail: 'Notificaciones y actualizaciones en vivo.'
    },
  ];

  return (
    <section id="como-funciona" className="section como-funciona">
      <div className="section-title">
        <div className="section-label">MUY FÁCIL</div>
        <h2>Así de simple es empezar</h2>
        <p className="section-subtitle">En solo 3 pasos tu mascota estará en las mejores manos.</p>
      </div>
      
      <div className="steps-visual">
        {steps.map((step, index) => (
          <div key={index} className="step-card">
            <div className="step-visual-header">
              <div className="step-icon">{step.icon}</div>
              <div className="step-number">{step.num}</div>
            </div>
            
            <h3>{step.title}</h3>
            <p className="step-desc">{step.desc}</p>
            <p className="step-detail">{step.detail}</p>
            
            {index < steps.length - 1 && (
              <div className="step-connector">
                <span>→</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};


const Resenas = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const reviewsData = await getAllReviewsPublic(3);
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      } catch (err) {
        console.error('Error cargando reseñas:', err);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };
    loadReviews();
  }, []);

  return (
    <section id="resenas" className="section resenas-section">
      <div className="section-title">
        <div className="section-label">RESEÑAS REALES</div>
        <h2>Lo que dicen nuestros clientes</h2>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p>Cargando reseñas...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="coming-soon-box" style={{ 
          textAlign: 'center', 
          padding: '40px 20px', 
          borderRadius: '16px',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <h3>📝 Próximamente</h3>
          <p style={{ marginTop: '8px', opacity: 0.8 }}>
            Las reseñas y testimonios de nuestros clientes estarán disponibles 
            cuando lancemos el servicio.
          </p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '24px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {reviews.map((review) => (
            <div key={review.id} style={{
              background: 'var(--bg-card, white)',
              padding: '24px',
              borderRadius: '16px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              border: '1px solid var(--border-color, #e5e7eb)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '12px' 
              }}>
                <div style={{ 
                  fontSize: '24px', 
                  marginRight: '8px' 
                }}>
                  {'⭐'.repeat(review.rating)}
                </div>
                <div style={{ 
                  fontWeight: '600', 
                  color: 'var(--text-secondary, #666)' 
                }}>
                  {review.rating}/5
                </div>
              </div>
              <p style={{ 
                lineHeight: '1.6',
                marginBottom: '16px',
                fontStyle: review.comment ? 'normal' : 'italic',
                color: review.comment ? 'var(--text-primary, #374151)' : 'var(--text-tertiary, #9ca3af)'
              }}>
                {review.comment || 'Sin comentario'}
              </p>
              <div style={{ 
                fontSize: '14px', 
                color: 'var(--text-tertiary, #9ca3af)' 
              }}>
                {new Date(review.created_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

function AppContent() {
  // Scroll reveal animations
  useScrollReveal('.benefit-card, .service-card, .step', 0.15);

  return (
    <>
      <SessionDebugger />
      <Navbar />
      <Hero />
      <Beneficios />
      <Servicios />
      <ComoFunciona />
      <Resenas />
      <Footer />
    </>
  );
}

function App() {
  return (
    <UserProvider>
      <ToastProvider>
        <ThemeProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Auth />} />
              <Route path="/reset-password" element={<PasswordReset />} />
              <Route path="/auth/google/callback" element={<GoogleCallback />} />
              <Route path="/" element={<AppContent />} />

              {/* Client Panel Routes with Layout */}
              <Route path="/client" element={<ClientLayout />}>
                <Route index element={<ClientDashboard />} />
                <Route path="profile" element={<ClientProfile />} />
                <Route path="pets" element={<MyPets />} />
                <Route path="pets/register" element={<RegisterPet />} />
                <Route path="pets/edit/:id" element={<EditPet />} />
                <Route path="appointments" element={<MyAppointments />} />
                <Route path="book" element={<BookAppointment />} />
                <Route path="appointments/edit/:id" element={<EditAppointment />} />
                <Route path="history" element={<ServiceHistory />} />
                <Route path="invoices" element={<InvoiceHistory />} />
                <Route path="invoices/:id" element={<InvoiceViewer />} />
              </Route>

              {/* Groomer Panel Routes (using Outlet) */}
              <Route path="/groomer" element={<GroomerLayout />}>
                <Route index element={<GroomerDashboard />} />
                <Route path="dashboard" element={<GroomerDashboard />} />
                <Route path="services" element={<GroomerServices />} />
                <Route path="pets" element={<GroomerPets />} />
                <Route path="history" element={<GroomerHistory />} />
                <Route path="statistics" element={<GroomerStatistics />} />
                <Route path="profile" element={<GroomerProfile />} />
                <Route path="invoices" element={<GroomerInvoices />} />
                <Route path="invoices/:id" element={<GroomerInvoiceViewer />} />
              </Route>

              {/* Admin Panel Routes (using Outlet) */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="groomer-applications" element={
                  <React.Suspense fallback={<div className="loading">Cargando panel...</div>}>
                    <GroomerApplications />
                  </React.Suspense>
                } />
                <Route path="services" element={<AdminServicesPage />} />
                <Route path="appointments" element={<AdminAppointmentsPage />} />
                <Route path="reports" element={<AdminReportsPage />} />
                <Route path="invoices" element={<AdminInvoicesPage />} />
                <Route path="invoices/:id" element={<AdminInvoiceViewer />} />
                <Route path="commissions" element={<CommissionSettings />} />
                <Route path="financial-reports" element={<FinancialReports />} />
                <Route path="profile" element={<AdminProfile />} />
              </Route>
            </Routes>
            <ToastContainer />
          </Router>
        </ThemeProvider>
      </ToastProvider>
    </UserProvider>
  );
}

export default App;
