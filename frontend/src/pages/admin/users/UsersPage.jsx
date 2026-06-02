import React, { useState, useEffect } from 'react';
import { 
  getAllUsersAdmin,
  getAdminUserStats,
  adminUpdateUser,
  adminUpdateUserRole,
  adminUpdateUserStatus,
  adminDeleteUser,
} from '../../../api/auth';
import { getAppointmentsByClientAdmin, getAppointmentsByGroomerAdmin } from '../../../api/appointments';
import { getAllPets, createPet } from '../../../api/pets';
import { getInvoicesAdmin } from '../../../api/invoices';
import { registerUser } from '../../../api/auth';
import { useToast } from '../../../components/Context/ToastContext';
import ModalDialog from '../../../components/Common/ModalDialog';
import ExportReportButtons from '../../../components/Common/ExportReportButtons';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

const UsersPage = () => {
  const { showError, showSuccess } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRol, setActiveRol] = useState('Todos');
  const [activeEstado, setActiveEstado] = useState('Todos');
  const [activeFecha, setActiveFecha] = useState('Todos');

  const [editingRoleId, setEditingRoleId] = useState(null);
  const [selectedNewRole, setSelectedNewRole] = useState('');
  const [modalUser, setModalUser] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [historyTab, setHistoryTab] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [historyData, setHistoryData] = useState({ citas: [], pagos: [], servicios: [] });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPetModal, setShowPetModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, userId: null });
  const [selectedUserForPet, setSelectedUserForPet] = useState(null);
  const [petForm, setPetForm] = useState({
    name: '',
    species: '',
    breed: '',
    age: '',
    weight: '',
    notes: '',
  });
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    nombre_completo: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    fecha_nacimiento: '',
    role: 'cliente',
  });

  const [users, setUsers] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar datos reales de los servicios
  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersData, petsData, statsData] = await Promise.all([
          getAllUsersAdmin(),
          getAllPets(),
          getAdminUserStats().catch(() => null),
        ]);
        
        // Transformar usuarios al formato esperado
        const transformedUsers = usersData.map(u => ({
          id: u.id,
          foto: u.foto_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nombre_completo || u.email)}&background=random`,
          nombre: u.nombre_completo || u.email,
          email: u.email,
          telefono: u.telefono || '',
          direccion: u.direccion || '',
          ciudad: u.ciudad || '',
          fecha_nacimiento: u.fecha_nacimiento || '',
          about_me: u.about_me || '',
          rol: u.role === 'admin' ? 'Admin' : u.role === 'groomer' ? 'Groomer' : 'Cliente',
          estado: u.is_active ? 'Activo' : 'Bloqueado',
          fechaRegistro: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : '',
          ultimoAcceso: u.created_at ? new Date(u.created_at).toLocaleString('es-CO') : '',
          mascotas: 0,
        }));

        // Calcular número de mascotas por usuario
        petsData.forEach(pet => {
          const userIndex = transformedUsers.findIndex(u => u.email === pet.owner_email);
          if (userIndex !== -1) {
            transformedUsers[userIndex].mascotas++;
          }
        });

        setUsers(transformedUsers);
        if (statsData) setAdminStats(statsData);
      } catch (err) {
        console.error('Error cargando datos:', err);
        setError('Error cargando datos: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      user.nombre.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.telefono.toLowerCase().includes(term) ||
      user.id.toString().includes(term) ||
      user.mascotas.toString().includes(term);

    const rolMap = { 'Clientes': 'Cliente', 'Groomers': 'Groomer', 'Admins': 'Admin' };
    const expectedRol = rolMap[activeRol] || activeRol;
    const matchesRol = activeRol === 'Todos' || user.rol === expectedRol;

    const matchesEstado = activeEstado === 'Todos' || user.estado === activeEstado;

    let matchesFecha = true;
    const fecha = new Date(user.fechaRegistro);
    const hoy = new Date();

    if (activeFecha === 'Nuevos usuarios' || activeFecha === 'Último mes') {
      const hace30Dias = new Date();
      hace30Dias.setDate(hoy.getDate() - 30);
      matchesFecha = fecha >= hace30Dias;
    } else if (activeFecha === 'Últimos 7 días') {
      const hace7Dias = new Date();
      hace7Dias.setDate(hoy.getDate() - 7);
      matchesFecha = fecha >= hace7Dias;
    }

    return matchesSearch && matchesRol && matchesEstado && matchesFecha;
  });

  // Calcular estadísticas desde datos reales
  const fallbackStats = {
    total: users.length,
    clientes: users.filter(u => u.rol === 'Cliente').length,
    groomers: users.filter(u => u.rol === 'Groomer').length,
    admins: users.filter(u => u.rol === 'Admin').length,
    activos: users.filter(u => u.estado === 'Activo').length,
    bloqueados: users.filter(u => u.estado === 'Bloqueado').length,
  };

  const stats = adminStats
    ? {
        total: adminStats.total ?? fallbackStats.total,
        clientes: adminStats.clientes ?? fallbackStats.clientes,
        groomers: adminStats.groomers ?? fallbackStats.groomers,
        admins: adminStats.admins ?? fallbackStats.admins,
        activos: adminStats.activos ?? fallbackStats.activos,
        bloqueados: adminStats.bloqueados ?? fallbackStats.bloqueados,
      }
    : fallbackStats;

  const highlightText = (text, term) => {
    if (!term || !text) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    return text.split(regex).map((part, index) =>
      regex.test(part) ? <mark key={index} className="search-highlight">{part}</mark> : part
    );
  };

  // Handlers
  const reloadUsers = async () => {
    const [usersData, petsData, statsData] = await Promise.all([
      getAllUsersAdmin(),
      getAllPets(),
      getAdminUserStats().catch(() => null),
    ]);

    const transformedUsers = usersData.map(u => ({
      id: u.id,
      foto: u.foto_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nombre_completo || u.email)}&background=random`,
      nombre: u.nombre_completo || u.email,
      email: u.email,
      telefono: u.telefono || '',
      direccion: u.direccion || '',
      ciudad: u.ciudad || '',
      fecha_nacimiento: u.fecha_nacimiento || '',
      about_me: u.about_me || '',
      rol: u.role === 'admin' ? 'Admin' : u.role === 'groomer' ? 'Groomer' : 'Cliente',
      estado: u.is_active ? 'Activo' : 'Bloqueado',
      fechaRegistro: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : '',
      ultimoAcceso: u.created_at ? new Date(u.created_at).toLocaleString('es-CO') : '',
      mascotas: 0,
    }));

    petsData.forEach(pet => {
      const userIndex = transformedUsers.findIndex(u => u.email === pet.owner_email);
      if (userIndex !== -1) {
        transformedUsers[userIndex].mascotas++;
      }
    });

    setUsers(transformedUsers);
    if (statsData) setAdminStats(statsData);
  };

  const handleToggleBlock = async (user) => {
    try {
      const newIsActive = user.estado !== 'Activo'; // si estaba bloqueado => activar
      await adminUpdateUserStatus(user.id, newIsActive);
      await reloadUsers();
      showSuccess(newIsActive ? 'Usuario desbloqueado' : 'Usuario bloqueado');
    } catch (err) {
      console.error('Error actualizando estado:', err);
      showError(err.message || 'Error actualizando estado del usuario');
    }
  };

  const handleDelete = (userId) => {
    setDeleteConfirm({ isOpen: true, userId });
  };

  const confirmDelete = async () => {
    const { userId } = deleteConfirm;
    if (!userId) return;
    try {
      await adminDeleteUser(userId);
      setDeleteConfirm({ isOpen: false, userId: null });
      await reloadUsers();
      showSuccess('Usuario eliminado');
    } catch (err) {
      console.error('Error eliminando usuario:', err);
      showError(err.message || 'Error eliminando usuario');
    }
  };

  const handleStartChangeRole = (user) => {
    setEditingRoleId(user.id);
    setSelectedNewRole(user.rol);
  };

  const handleSaveRole = async () => {
    if (!editingRoleId) return;
    const roleMap = { Cliente: 'cliente', Groomer: 'groomer', Admin: 'admin' };
    const backendRole = roleMap[selectedNewRole] || 'cliente';

    try {
      await adminUpdateUserRole(editingRoleId, backendRole);
      setEditingRoleId(null);
      setSelectedNewRole('');
      await reloadUsers();
      showSuccess('Rol actualizado');
    } catch (err) {
      console.error('Error actualizando rol:', err);
      showError(err.message || 'Error actualizando rol');
    }
  };

  const handleCancelRole = () => {
    setEditingRoleId(null);
    setSelectedNewRole('');
  };

  const openUserModal = (user, type) => {
    setModalUser(user);
    setModalType(type);
    if (type === 'edit') {
      setEditForm({
        nombre_completo: user.nombre,
        email: user.email,
        telefono: user.telefono,
        direccion: user.direccion,
        rol: user.rol,
        estado: user.estado,
        ciudad: user.ciudad || '',
        fecha_nacimiento: user.fecha_nacimiento || '',
        about_me: user.about_me || '',
      });
    }
    if (type === 'history') {
      setHistoryTab(user.rol === 'Cliente' ? 'citas' : user.rol === 'Groomer' ? 'servicios' : 'general');
    }
  };

  const closeUserModal = () => {
    setModalUser(null);
    setModalType(null);
    setEditForm({});
    setHistoryTab('');
    setHistoryLoading(false);
    setHistoryError(null);
    setHistoryData({ citas: [], pagos: [], servicios: [] });
  };

  const handleViewProfile = (user) => openUserModal(user, 'profile');
  const handleEdit = (user) => openUserModal(user, 'edit');
  const handleViewHistory = (user) => openUserModal(user, 'history');
  const handleAddPet = (user) => {
    setSelectedUserForPet(user);
    setPetForm({
      name: '',
      species: '',
      breed: '',
      age: '',
      weight: '',
      notes: '',
    });
    setShowPetModal(true);
  };

  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    if (!modalUser) return;
    try {
      const updateData = {
        nombre_completo: editForm.nombre_completo,
        telefono: editForm.telefono,
        direccion: editForm.direccion,
        ciudad: editForm.ciudad || null,
        fecha_nacimiento: editForm.fecha_nacimiento || null,
        about_me: editForm.about_me || null,
      };
      
      await adminUpdateUser(modalUser.id, updateData);
      await reloadUsers();
      closeUserModal();
      showSuccess('Usuario actualizado exitosamente');
    } catch (err) {
      console.error('Error actualizando usuario:', err);
      showError('Error actualizando usuario: ' + err.message);
    }
  };

  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
    setCreateForm({
      email: '',
      password: '',
      nombre_completo: '',
      telefono: '',
      direccion: '',
      ciudad: '',
      fecha_nacimiento: '',
      role: 'cliente',
    });
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCreateForm({
      email: '',
      password: '',
      nombre_completo: '',
      telefono: '',
      direccion: '',
      ciudad: '',
      fecha_nacimiento: '',
      role: 'cliente',
    });
  };

  const handleCreateUser = async () => {
    try {
      // Validar campos requeridos
      if (!createForm.email || !createForm.password || !createForm.nombre_completo || 
          !createForm.telefono || !createForm.direccion || !createForm.fecha_nacimiento) {
        showError('Por favor complete todos los campos requeridos');
        return;
      }

      // Validar longitud de contraseña
      if (createForm.password.length < 6) {
        showError('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      // Validar fecha de nacimiento (debe ser al menos 1 año atrás)
      const birthDate = new Date(createForm.fecha_nacimiento);
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - 1);
      if (birthDate > minDate) {
        showError('El usuario debe tener al menos 1 año de edad');
        return;
      }

      const userData = {
        nombreCompleto: createForm.nombre_completo,
        email: createForm.email,
        telefono: createForm.telefono,
        direccion: createForm.direccion,
        ciudad: createForm.ciudad || null,
        password: createForm.password,
        fechaNacimiento: createForm.fecha_nacimiento,
        fotoUrl: null,
        aboutMe: null,
      };

      await registerUser(userData);

      // Si se seleccionó rol distinto a cliente, aplicarlo con endpoint admin
      if (createForm.role && createForm.role !== 'cliente') {
        try {
          const latestUsers = await getAllUsersAdmin();
          const created = latestUsers.find(u => (u.email || '').toLowerCase() === createForm.email.toLowerCase());
          if (created?.id) {
            await adminUpdateUserRole(created.id, createForm.role);
          }
        } catch (e) {
          // No bloquear la creación si el ajuste de rol falla, pero avisar.
          console.warn('No se pudo aplicar rol al usuario creado:', e);
        }
      }

      await reloadUsers();
      handleCloseCreateModal();
      showSuccess('Usuario creado exitosamente');
    } catch (err) {
      console.error('Error creando usuario:', err);
      const errorMessage = err.message || 'Error creando usuario';
      showError(errorMessage);
    }
  };

  const handleCreatePet = async () => {
    try {
      // Validar campos requeridos
      if (!petForm.name || !petForm.species) {
        showError('Por favor complete el nombre y especie de la mascota');
        return;
      }

      const petData = {
        name: petForm.name,
        species: petForm.species,
        breed: petForm.breed || null,
        age: petForm.age ? parseInt(petForm.age) : null,
        weight: petForm.weight ? parseFloat(petForm.weight) : null,
        notes: petForm.notes || null,
        owner_email: selectedUserForPet.email,
      };

      await createPet(petData);
      
      await reloadUsers();
      setShowPetModal(false);
      setSelectedUserForPet(null);
      showSuccess('Mascota creada exitosamente');
    } catch (err) {
      console.error('Error creando mascota:', err);
      showError(err.message || 'Error creando mascota');
    }
  };

  // Cargar historial real cuando se abre el modal
  useEffect(() => {
    const loadHistory = async () => {
      if (modalType !== 'history' || !modalUser?.email) return;
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        if (modalUser.rol === 'Cliente') {
          const [appts, invoices] = await Promise.all([
            getAppointmentsByClientAdmin(modalUser.email),
            getInvoicesAdmin({ clientEmail: modalUser.email }).catch(() => []),
          ]);

          const citas = (appts || []).map(a => ({
            id: a.id,
            fecha: a.date,
            servicio: a.service,
            mascota: a.pet_name || `Mascota #${a.pet_id}`,
          }));

          const pagos = (invoices || []).map(inv => ({
            id: inv.id,
            fecha: (inv.paid_at || inv.issued_at || '').toString().slice(0, 10),
            concepto: inv.service_name || `Factura ${inv.invoice_number || inv.id}`,
            monto: inv.total ?? 0,
          }));

          setHistoryData({ citas, pagos, servicios: [] });
        } else if (modalUser.rol === 'Groomer') {
          const appts = await getAppointmentsByGroomerAdmin(modalUser.email);
          const servicios = (appts || []).map(a => ({
            id: a.id,
            fecha: a.date,
            servicio: a.service,
            cliente: a.client_name || a.client_email,
          }));
          setHistoryData({ citas: [], pagos: [], servicios });
        } else {
          setHistoryData({ citas: [], pagos: [], servicios: [] });
        }
      } catch (err) {
        console.error('Error cargando historial:', err);
        setHistoryError(err.message || 'No pudimos cargar el historial.');
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, [modalType, modalUser]);

  const getClienteHistory = (_user, category) => historyData?.[category] || [];
  const getGroomerHistory = (_user, category) => historyData?.[category] || [];

  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      // Hoja de usuarios
      const usersData = [
        ['ID', 'Nombre', 'Email', 'Teléfono', 'Rol', 'Estado', 'Mascotas', 'Fecha Registro', 'Ciudad', 'Dirección'],
        ...filteredUsers.map(u => [
          u.id,
          u.nombre,
          u.email,
          u.telefono,
          u.rol,
          u.estado,
          u.mascotas,
          u.fechaRegistro,
          u.ciudad,
          u.direccion
        ])
      ];
      const wsUsers = XLSX.utils.aoa_to_sheet(usersData);
      XLSX.utils.book_append_sheet(wb, wsUsers, 'Usuarios');

      // Hoja de estadísticas
      const statsData = [
        ['Métrica', 'Valor'],
        ['Total usuarios', stats.total],
        ['Clientes', stats.clientes],
        ['Groomers', stats.groomers],
        ['Admins', stats.admins],
        ['Activos', stats.activos],
        ['Bloqueados', stats.bloqueados]
      ];
      const wsStats = XLSX.utils.aoa_to_sheet(statsData);
      XLSX.utils.book_append_sheet(wb, wsStats, 'Estadísticas');

      XLSX.writeFile(wb, 'usuarios_export.xlsx');
      showSuccess('Exportación a Excel completada');
    } catch (err) {
      showError('Error al exportar a Excel');
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      let y = 20;

      doc.setFontSize(20);
      doc.text('Reporte de Usuarios', 20, y);
      y += 15;

      // Estadísticas
      doc.setFontSize(14);
      doc.text('Estadísticas Generales', 20, y);
      y += 10;
      doc.setFontSize(11);
      doc.text(`Total usuarios: ${stats.total}`, 25, y);
      y += 7;
      doc.text(`Clientes: ${stats.clientes}`, 25, y);
      y += 7;
      doc.text(`Groomers: ${stats.groomers}`, 25, y);
      y += 7;
      doc.text(`Admins: ${stats.admins}`, 25, y);
      y += 7;
      doc.text(`Activos: ${stats.activos}`, 25, y);
      y += 7;
      doc.text(`Bloqueados: ${stats.bloqueados}`, 25, y);
      y += 15;

      // Lista de usuarios
      doc.setFontSize(14);
      doc.text('Lista de Usuarios', 20, y);
      y += 10;
      doc.setFontSize(9);
      
      filteredUsers.forEach(u => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(`${u.nombre} (${u.email}) - ${u.rol} - ${u.estado}`, 25, y);
        y += 6;
      });

      doc.save('usuarios_export.pdf');
      showSuccess('Exportación a PDF completada');
    } catch (err) {
      showError('Error al exportar a PDF');
    }
  };

  return (
    <div className="admin-page">
      {loading ? (
        <div className="loading-container">
          <p>Cargando datos de usuarios...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>Error: {error}</p>
        </div>
      ) : (
        <>
      {/* Header Superior */}
      <div className="admin-page-header">
        <div className="admin-page-header__main">
          <div className="admin-page-header__title">
            <h1>Usuarios</h1>
            <span className="admin-page-header__count">
              {filteredUsers.length} de {users.length} usuarios
            </span>
          </div>
          <p className="admin-page-header__subtitle">
            Gestiona clientes y groomers desde un solo lugar.
          </p>
          <div className="admin-page-header__actions">
            <ExportReportButtons
              onExportExcel={handleExportExcel}
              onExportPDF={handleExportPDF}
              onExportWord={null}
              title="Exportar Usuarios"
            />
            <button className="btn-primary" onClick={handleOpenCreateModal}>+ Crear usuario</button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="main-stats-grid">
        <div className="stat-card stat-card-primary"><div className="stat-icon">👥</div><div className="stat-content"><h3>Usuarios Totales</h3><p className="stat-number">{stats.total}</p><span className="stat-trend neutral">Total registrado</span></div></div>
        <div className="stat-card stat-card-success"><div className="stat-icon">🧑</div><div className="stat-content"><h3>Clientes</h3><p className="stat-number">{stats.clientes}</p><span className="stat-trend neutral">Total registrado</span></div></div>
        <div className="stat-card stat-card-info"><div className="stat-icon">✂</div><div className="stat-content"><h3>Groomers</h3><p className="stat-number">{stats.groomers}</p><span className="stat-trend neutral">Total registrado</span></div></div>
        <div className="stat-card stat-card-secondary"><div className="stat-icon">🛡</div><div className="stat-content"><h3>Admins</h3><p className="stat-number">{stats.admins}</p><span className="stat-trend neutral">Total registrado</span></div></div>
        <div className="stat-card stat-card-success"><div className="stat-icon">🟢</div><div className="stat-content"><h3>Usuarios Activos</h3><p className="stat-number">{stats.activos}</p><span className="stat-trend neutral">Total activo</span></div></div>
        <div className="stat-card stat-card-warning"><div className="stat-icon">🚫</div><div className="stat-content"><h3>Bloqueados</h3><p className="stat-number">{stats.bloqueados}</p><span className="stat-trend neutral">Total bloqueado</span></div></div>
      </div>

      {/* Search + Filters */}
      <div className="usuarios-controls">
        <div className="search-wrapper">
          <input
            type="text"
            placeholder="Buscar por nombre, correo, teléfono, ID, mascota o groomer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && <button className="clear-search-btn" onClick={() => setSearchTerm('')}>×</button>}
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <span>Rol:</span>
            {['Todos', 'Clientes', 'Groomers', 'Admins'].map(rol => (
              <button key={rol} className={`filter-btn ${activeRol === rol ? 'active' : ''}`} onClick={() => setActiveRol(rol)}>{rol}</button>
            ))}
          </div>
          <div className="filter-group">
            <span>Estado:</span>
            {['Todos', 'Activo', 'Bloqueado', 'Pendiente'].map(estado => (
              <button key={estado} className={`filter-btn ${activeEstado === estado ? 'active' : ''}`} onClick={() => setActiveEstado(estado)}>{estado}</button>
            ))}
          </div>
          <div className="filter-group">
            <span>Fecha:</span>
            {['Todos', 'Nuevos usuarios', 'Últimos 7 días', 'Último mes'].map(fecha => (
              <button key={fecha} className={`filter-btn ${activeFecha === fecha ? 'active' : ''}`} onClick={() => setActiveFecha(fecha)}>{fecha}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="usuarios-table-wrapper">
        <table className="usuarios-table">
          <thead>
            <tr>
              <th>Foto</th><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th>
              <th>Mascotas</th><th>Fecha Registro</th><th>Última Actividad</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <tr key={user.id}>
                  <td><img src={user.foto} alt={user.nombre} className="user-avatar" /></td>
                  <td>{highlightText(user.nombre, searchTerm)}</td>
                  <td>{highlightText(user.email, searchTerm)}</td>
                  <td>
                    {editingRoleId === user.id ? (
                      <div className="role-edit-container">
                        <select value={selectedNewRole} onChange={(e) => setSelectedNewRole(e.target.value)} className="role-edit-select">
                          <option value="Cliente">Cliente</option>
                          <option value="Groomer">Groomer</option>
                          <option value="Admin">Admin</option>
                        </select>
                        <button onClick={handleSaveRole} className="role-save-btn">Guardar</button>
                        <button onClick={handleCancelRole} className="role-cancel-btn">Cancelar</button>
                      </div>
                    ) : (
                      <span className={`role-badge ${user.rol.toLowerCase()}`}>{user.rol}</span>
                    )}
                  </td>
                  <td><span className={`status-badge ${user.estado.toLowerCase()}`}>{user.estado}</span></td>
                  <td>{user.mascotas}</td>
                  <td>{user.fechaRegistro}</td>
                  <td>{user.ultimoAcceso}</td>
                  <td className="actions-cell">
                    <button onClick={() => handleViewProfile(user)}>Ver perfil</button>
                    <button onClick={() => handleEdit(user)}>Editar</button>
                    <button onClick={() => handleToggleBlock(user)}>{user.estado === 'Activo' ? 'Bloquear' : 'Desbloquear'}</button>
                    <button className="danger" onClick={() => handleDelete(user.id)}>Eliminar</button>
                    <button onClick={() => handleStartChangeRole(user)}>Cambiar rol</button>
                    <button onClick={() => handleViewHistory(user)}>Ver historial</button>
                    {user.rol === 'Cliente' && (
                      <button onClick={() => handleAddPet(user)}>🐾 Agregar mascota</button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>No se encontraron usuarios.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {modalUser && modalType && (
        <div className="modal-overlay" onClick={closeUserModal}>
          <div className={`modal ${(modalType === 'profile' || modalType === 'history') ? 'large' : ''}`} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: (modalType === 'edit' || modalType === 'history') ? '12px' : '0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {(modalType === 'edit' || modalType === 'history') && (
                  <img src={modalUser.foto} alt={modalUser.nombre} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid #333' }} />
                )}
                <div>
                  <h3 style={{ margin: 0 }}>
                    {modalType === 'profile' && '👤 Perfil del Usuario'}
                    {modalType === 'edit' && '✏️ Editar Usuario'}
                    {modalType === 'history' && '📋 Historial de Servicios'}
                  </h3>
                  {(modalType === 'edit' || modalType === 'history') && (
                    <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>{modalUser.nombre} • {modalUser.rol}</div>
                  )}
                </div>
              </div>
              <button onClick={closeUserModal} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#888' }}>×</button>
            </div>

            <div className="modal-body">
              {/* Profile, Edit, History content - simplified but functional version of original */}
              {modalType === 'profile' && (
                <div className="user-detail-view">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <img src={modalUser.foto} alt="" style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '3px solid #333' }} />
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: 700 }}>{modalUser.nombre}</div>
                      <div style={{ marginTop: '6px', display: 'flex', gap: '8px' }}>
                        <span className={`role-badge ${modalUser.rol.toLowerCase()}`}>{modalUser.rol}</span>
                        <span className={`status-badge ${modalUser.estado.toLowerCase()}`}>{modalUser.estado}</span>
                      </div>
                    </div>
                  </div>
                  <div className="detail-section">
                    <h4>Información Personal</h4>
                    <div className="detail-grid">
                      <div><strong>Nombre:</strong> {modalUser.nombre}</div>
                      <div><strong>Email:</strong> {modalUser.email}</div>
                      <div><strong>Teléfono:</strong> {modalUser.telefono}</div>
                      <div style={{ gridColumn: '1 / -1' }}><strong>Dirección:</strong> {modalUser.direccion}</div>
                    </div>
                  </div>
                </div>
              )}

              {modalType === 'edit' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ marginBottom: '12px', gridColumn: '1 / -1' }}>
                      <label>Nombre Completo</label>
                      <input 
                        value={editForm.nombre_completo || ''} 
                        onChange={e => handleEditFormChange('nombre_completo', e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                      />
                    </div>
                    <div style={{ marginBottom: '12px', gridColumn: '1 / -1' }}>
                      <label>Email (no editable)</label>
                      <input 
                        value={editForm.email || ''} 
                        disabled
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', backgroundColor: '#f5f5f5' }}
                      />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label>Teléfono</label>
                      <input 
                        value={editForm.telefono || ''} 
                        onChange={e => handleEditFormChange('telefono', e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                      />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label>Fecha de Nacimiento</label>
                      <input 
                        type="date"
                        value={editForm.fecha_nacimiento || ''} 
                        onChange={e => handleEditFormChange('fecha_nacimiento', e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                      />
                    </div>
                    <div style={{ marginBottom: '12px', gridColumn: '1 / -1' }}>
                      <label>Dirección</label>
                      <input 
                        value={editForm.direccion || ''} 
                        onChange={e => handleEditFormChange('direccion', e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                      />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label>Ciudad</label>
                      <input 
                        value={editForm.ciudad || ''} 
                        onChange={e => handleEditFormChange('ciudad', e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                      />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label>Rol</label>
                      <select 
                        value={editForm.rol} 
                        onChange={e => handleEditFormChange('rol', e.target.value)} 
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                      >
                        <option value="Cliente">Cliente</option>
                        <option value="Groomer">Groomer</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label>Estado</label>
                      <select 
                        value={editForm.estado} 
                        onChange={e => handleEditFormChange('estado', e.target.value)} 
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                      >
                        <option value="Activo">Activo</option>
                        <option value="Bloqueado">Bloqueado</option>
                      </select>
                    </div>
                    <div style={{ marginBottom: '12px', gridColumn: '1 / -1' }}>
                      <label>Biografía (About Me)</label>
                      <textarea 
                        value={editForm.about_me || ''} 
                        onChange={e => handleEditFormChange('about_me', e.target.value)}
                        rows="3"
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', resize: 'vertical' }}
                        placeholder="Información adicional sobre el usuario..."
                      />
                    </div>
                  </div>
                  <button onClick={handleSaveEdit} style={{ marginTop: '16px' }} className="btn-primary">Guardar Cambios</button>
                </div>
              )}

              {modalType === 'history' && (
                <div className="user-history-view">
                  <div className="history-tabs">
                    {modalUser.rol === 'Cliente' && ['citas', 'pagos', 'mascotas'].map(tab => (
                      <button key={tab} className={`history-tab ${historyTab === tab ? 'active' : ''}`} onClick={() => setHistoryTab(tab)}>{tab}</button>
                    ))}
                    {modalUser.rol === 'Groomer' && ['servicios', 'reseñas'].map(tab => (
                      <button key={tab} className={`history-tab ${historyTab === tab ? 'active' : ''}`} onClick={() => setHistoryTab(tab)}>{tab}</button>
                    ))}
                  </div>
                  <div className="history-content">
                    {historyLoading ? (
                      <div className="history-row">Cargando historial...</div>
                    ) : historyError ? (
                      <div className="history-row">Error: {historyError}</div>
                    ) : (
                      <>
                        {modalUser.rol === 'Cliente' && historyTab === 'citas' && getClienteHistory(modalUser, 'citas').map(c => (
                          <div key={c.id} className="history-row">{c.fecha} • {c.servicio} • {c.mascota}</div>
                        ))}
                        {modalUser.rol === 'Cliente' && historyTab === 'pagos' && getClienteHistory(modalUser, 'pagos').map(p => (
                          <div key={p.id} className="history-row">{p.fecha} • {p.concepto} • ${p.monto}</div>
                        ))}
                        {modalUser.rol === 'Cliente' && historyTab === 'mascotas' && (
                          <div className="history-row">Historial de mascotas próximamente.</div>
                        )}

                        {modalUser.rol === 'Groomer' && historyTab === 'servicios' && getGroomerHistory(modalUser, 'servicios').map(s => (
                          <div key={s.id} className="history-row">{s.fecha} • {s.servicio} • {s.cliente}</div>
                        ))}
                        {modalUser.rol === 'Groomer' && historyTab === 'reseñas' && (
                          <div className="history-row">Historial de reseñas próximamente.</div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </>
      )}

      {/* Modal de crear usuario */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={handleCloseCreateModal}>
          <div className="modal large" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>➕ Crear Nuevo Usuario</h3>
              <button onClick={handleCloseCreateModal} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#888' }}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label>Email *</label>
                  <input 
                    type="email" 
                    value={createForm.email} 
                    onChange={e => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="usuario@email.com"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label>Contraseña *</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      value={createForm.password} 
                      onChange={e => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Mínimo 6 caracteres"
                      style={{ width: '100%', padding: '10px', paddingRight: '40px', borderRadius: '6px', border: '1px solid #ddd' }}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '0' }}
                    >
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom: '12px', gridColumn: '1 / -1' }}>
                  <label>Nombre Completo *</label>
                  <input 
                    type="text" 
                    value={createForm.nombre_completo} 
                    onChange={e => setCreateForm(prev => ({ ...prev, nombre_completo: e.target.value }))}
                    placeholder="Juan Pérez"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label>Teléfono *</label>
                  <input 
                    type="tel" 
                    value={createForm.telefono} 
                    onChange={e => setCreateForm(prev => ({ ...prev, telefono: e.target.value }))}
                    placeholder="+57 300 123 4567"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label>Fecha de Nacimiento *</label>
                  <input 
                    type="date" 
                    value={createForm.fecha_nacimiento} 
                    onChange={e => setCreateForm(prev => ({ ...prev, fecha_nacimiento: e.target.value }))}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                </div>
                <div style={{ marginBottom: '12px', gridColumn: '1 / -1' }}>
                  <label>Dirección *</label>
                  <input 
                    type="text" 
                    value={createForm.direccion} 
                    onChange={e => setCreateForm(prev => ({ ...prev, direccion: e.target.value }))}
                    placeholder="Calle 123 #45-67"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label>Ciudad</label>
                  <input 
                    type="text" 
                    value={createForm.ciudad} 
                    onChange={e => setCreateForm(prev => ({ ...prev, ciudad: e.target.value }))}
                    placeholder="Bogotá"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label>Rol *</label>
                  <select 
                    value={createForm.role} 
                    onChange={e => setCreateForm(prev => ({ ...prev, role: e.target.value }))}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                  >
                    <option value="cliente">Cliente</option>
                    <option value="groomer">Groomer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={handleCloseCreateModal} style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={handleCreateUser} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>Crear Usuario</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de crear mascota */}
      {showPetModal && selectedUserForPet && (
        <div className="modal-overlay" onClick={() => setShowPetModal(false)}>
          <div className="modal large" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>🐾 Agregar Mascota para {selectedUserForPet.nombre}</h3>
              <button onClick={() => setShowPetModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#888' }}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ marginBottom: '12px', gridColumn: '1 / -1' }}>
                  <label>Nombre de la mascota *</label>
                  <input 
                    type="text"
                    value={petForm.name}
                    onChange={e => setPetForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Firulais"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label>Especie *</label>
                  <select 
                    value={petForm.species}
                    onChange={e => setPetForm(prev => ({ ...prev, species: e.target.value }))}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                  >
                    <option value="">Seleccionar especie</option>
                    <option value="Perro">Perro</option>
                    <option value="Gato">Gato</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label>Raza</label>
                  <input 
                    type="text"
                    value={petForm.breed}
                    onChange={e => setPetForm(prev => ({ ...prev, breed: e.target.value }))}
                    placeholder="Golden Retriever"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label>Edad (años)</label>
                  <input 
                    type="number"
                    value={petForm.age}
                    onChange={e => setPetForm(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="3"
                    min="0"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label>Peso (kg)</label>
                  <input 
                    type="number"
                    value={petForm.weight}
                    onChange={e => setPetForm(prev => ({ ...prev, weight: e.target.value }))}
                    placeholder="25"
                    min="0"
                    step="0.1"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                </div>
                <div style={{ marginBottom: '12px', gridColumn: '1 / -1' }}>
                  <label>Notas adicionales</label>
                  <textarea 
                    value={petForm.notes}
                    onChange={e => setPetForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows="3"
                    placeholder="Información adicional sobre la mascota..."
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', resize: 'vertical' }}
                  />
                </div>
              </div>
              <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowPetModal(false)} style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={handleCreatePet} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>Crear Mascota</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ModalDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, userId: null })}
        title="Confirmar eliminación"
        actions={[
          { label: 'Cancelar', variant: 'secondary', onClick: () => setDeleteConfirm({ isOpen: false, userId: null }) },
          { label: 'Eliminar', variant: 'danger', onClick: confirmDelete }
        ]}
      >
        <p>¿Eliminar este usuario? Esta acción no se puede deshacer.</p>
      </ModalDialog>
    </div>
  );
};

export default UsersPage;
