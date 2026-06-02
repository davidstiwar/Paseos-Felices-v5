-- ============================================
-- Paseos Felices - MySQL Setup Script (NORMALIZADO)
-- Crea todas las bases de datos y tablas necesarias
-- Normalizado según 3FN (Tercera Forma Normal)
-- ============================================

-- Crear bases de datos
CREATE DATABASE IF NOT EXISTS paseos_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS paseos_pets CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS paseos_groomer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS paseos_appointments CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS paseos_services_catalog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS paseos_availability CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS paseos_reviews CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS paseos_notifications CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS paseos_user_profile CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS paseos_reporting CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- BASE DE DATOS: paseos_auth
-- ============================================
USE paseos_auth;

-- Tabla de usuarios (1FN, 2FN, 3FN)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    telefono VARCHAR(50) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    ciudad VARCHAR(100),
    foto_url TEXT,
    about_me TEXT,
    fecha_nacimiento DATE,
    hashed_password VARCHAR(255) NOT NULL,
    role ENUM('cliente', 'groomer', 'admin') DEFAULT 'cliente' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_ciudad (ciudad),
    CONSTRAINT chk_role CHECK (role IN ('cliente', 'groomer', 'admin'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de solicitudes de groomer (1FN, 2FN, 3FN)
CREATE TABLE IF NOT EXISTS groomer_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    telefono VARCHAR(50) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    foto_url TEXT,
    about_me TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' NOT NULL,
    rejection_reason TEXT,
    reviewed_by_admin_id INT,
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_ciudad (ciudad),
    CONSTRAINT chk_application_status CHECK (status IN ('pending', 'approved', 'rejected'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BASE DE DATOS: paseos_pets
-- ============================================
USE paseos_pets;

-- Tabla de mascotas (1FN, 2FN, 3FN)
CREATE TABLE IF NOT EXISTS pets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    breed VARCHAR(255),
    age INT,
    weight DECIMAL(5,2),
    photo_url TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_owner_email (owner_email),
    INDEX idx_name (name),
    INDEX idx_breed (breed),
    CONSTRAINT chk_age CHECK (age >= 0),
    CONSTRAINT chk_weight CHECK (weight >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BASE DE DATOS: paseos_groomer
-- ============================================
USE paseos_groomer;

-- Tabla principal de groomers (1FN, 2FN, 3FN)
CREATE TABLE IF NOT EXISTS groomers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    bio TEXT,
    photo TEXT,
    rating DECIMAL(3,2) DEFAULT 0.0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_rating (rating),
    INDEX idx_is_active (is_active),
    CONSTRAINT chk_rating CHECK (rating >= 0.0 AND rating <= 5.0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de especialidades (normalizada - 2FN, 3FN)
CREATE TABLE IF NOT EXISTS groomer_specialties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    groomer_id INT NOT NULL,
    specialty_name VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_groomer_id (groomer_id),
    INDEX idx_specialty_name (specialty_name),
    UNIQUE KEY unique_specialty (groomer_id, specialty_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de disponibilidad (normalizada - 2FN, 3FN)
CREATE TABLE IF NOT EXISTS groomer_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    groomer_id INT NOT NULL,
    day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_groomer_id (groomer_id),
    INDEX idx_day_of_week (day_of_week),
    UNIQUE KEY unique_availability (groomer_id, day_of_week),
    CONSTRAINT chk_time_range CHECK (end_time > start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de servicios del groomer (conecta con catálogo de servicios - 2FN, 3FN)
CREATE TABLE IF NOT EXISTS groomer_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    groomer_id INT NOT NULL,
    service_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_groomer_id (groomer_id),
    INDEX idx_service_id (service_id),
    UNIQUE KEY unique_service (groomer_id, service_id),
    FOREIGN KEY (groomer_id) REFERENCES groomers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BASE DE DATOS: paseos_appointments
-- ============================================
USE paseos_appointments;

-- Tabla de citas (1FN, 2FN, 3FN)
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_email VARCHAR(255) NOT NULL,
    pet_id INT NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    notes TEXT,
    status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending' NOT NULL,
    price DECIMAL(10,2),
    groomer_email VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_client_email (client_email),
    INDEX idx_pet_id (pet_id),
    INDEX idx_groomer_email (groomer_email),
    INDEX idx_appointment_date (appointment_date),
    INDEX idx_status (status),
    INDEX idx_service_name (service_name),
    CONSTRAINT chk_appointment_status CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    CONSTRAINT chk_price CHECK (price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FACTURACIÓN / MONETIZACIÓN (paseos_appointments)
-- ============================================

-- Configuración global (activa) de comisiones.
-- Nota: se conserva histórico en commission_change_audit y en cada invoice.
CREATE TABLE IF NOT EXISTS commission_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    groomer_percentage INT NOT NULL,
    platform_percentage INT NOT NULL,
    is_active TINYINT DEFAULT 1 NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_commission_is_active (is_active),
    CONSTRAINT chk_commission_non_negative CHECK (groomer_percentage >= 0 AND platform_percentage >= 0),
    CONSTRAINT chk_commission_sum_100 CHECK (groomer_percentage + platform_percentage = 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Auditoría de cambios de comisión (solo admin)
CREATE TABLE IF NOT EXISTS commission_change_audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    previous_groomer_percentage INT NOT NULL,
    previous_platform_percentage INT NOT NULL,
    new_groomer_percentage INT NOT NULL,
    new_platform_percentage INT NOT NULL,
    changed_by_admin_email VARCHAR(255) NOT NULL,
    reason TEXT,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Facturas (1 por cita)
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(20) UNIQUE,
    appointment_id INT NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    pet_id INT NOT NULL,
    groomer_email VARCHAR(255),
    service_name VARCHAR(255) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    status ENUM('pending','paid','cancelled') DEFAULT 'pending' NOT NULL,
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    paid_at DATETIME,
    cancelled_at DATETIME,
    groomer_percentage INT NOT NULL,
    platform_percentage INT NOT NULL,
    groomer_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    platform_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_invoices_status (status),
    INDEX idx_invoices_client (client_email),
    INDEX idx_invoices_groomer (groomer_email),
    INDEX idx_invoices_appointment (appointment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pagos en efectivo (registro administrativo)
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    method ENUM('cash') DEFAULT 'cash' NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    received_by_admin_email VARCHAR(255) NOT NULL,
    received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_payments_invoice (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BASE DE DATOS: paseos_services_catalog
-- ============================================
USE paseos_services_catalog;

-- Tabla de servicios (1FN, 2FN, 3FN)
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    duration_minutes INT,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_category (category),
    INDEX idx_is_active (is_active),
    CONSTRAINT chk_base_price CHECK (base_price >= 0),
    CONSTRAINT chk_duration CHECK (duration_minutes > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar servicios por defecto
INSERT INTO services (name, description, base_price, duration_minutes, category) VALUES
('Paseo Premium', 'Paseo de 60 minutos con atención personalizada', 35.00, 60, 'paseo'),
('Paseo Estándar', 'Paseo de 30 minutos en grupo', 25.00, 30, 'paseo'),
('Grooming', 'Baño y corte completo', 45.00, 90, 'grooming'),
('Entrenamiento', 'Sesión de entrenamiento básico', 55.00, 60, 'entrenamiento'),
('Paseo + Grooming', 'Paseo y baño completo', 70.00, 120, 'combo');

-- ============================================
-- BASE DE DATOS: paseos_availability
-- ============================================
USE paseos_availability;

-- Tabla de disponibilidad global (1FN, 2FN, 3FN)
CREATE TABLE IF NOT EXISTS availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    groomer_email VARCHAR(255) NOT NULL,
    day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_groomer_email (groomer_email),
    INDEX idx_day_of_week (day_of_week),
    UNIQUE KEY unique_availability (groomer_email, day_of_week),
    CONSTRAINT chk_time_range CHECK (end_time > start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BASE DE DATOS: paseos_reviews
-- ============================================
USE paseos_reviews;

-- Tabla de reseñas (1FN, 2FN, 3FN)
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_email VARCHAR(255) NOT NULL,
    -- ID del groomer (microservicio groomer-service)
    groomer_id INT NOT NULL,
    appointment_id INT,
    rating TINYINT NOT NULL,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_client_email (client_email),
    INDEX idx_groomer_id (groomer_id),
    INDEX idx_appointment_id (appointment_id),
    INDEX idx_rating (rating),
    INDEX idx_created_at (created_at),
    CONSTRAINT chk_rating CHECK (rating >= 1 AND rating <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BASE DE DATOS: paseos_notifications
-- ============================================
USE paseos_notifications;

-- Tabla de notificaciones (1FN, 2FN, 3FN)
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    type ENUM('appointment', 'review', 'system', 'promotion') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_email (user_email),
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at),
    CONSTRAINT chk_notification_type CHECK (type IN ('appointment', 'review', 'system', 'promotion'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BASE DE DATOS: paseos_user_profile
-- ============================================
USE paseos_user_profile;

-- Tabla principal de perfiles (1FN, 2FN, 3FN)
CREATE TABLE IF NOT EXISTS user_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(255) UNIQUE NOT NULL,
    photo_url TEXT,
    bio TEXT,
    phone VARCHAR(50),
    address VARCHAR(255),
    city VARCHAR(100),
    date_of_birth DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (user_email),
    INDEX idx_city (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de preferencias (normalizada - 2FN, 3FN)
CREATE TABLE IF NOT EXISTS user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    preference_key VARCHAR(100) NOT NULL,
    preference_value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (user_email),
    INDEX idx_preference_key (preference_key),
    UNIQUE KEY unique_preference (user_email, preference_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BASE DE DATOS: paseos_reporting
-- ============================================
USE paseos_reporting;

-- Tabla de reportes (1FN, 2FN, 3FN)
CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_type ENUM('appointments', 'revenue', 'groomers', 'services', 'custom') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    parameters JSON,
    generated_by VARCHAR(255),
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    file_url VARCHAR(500),
    INDEX idx_report_type (report_type),
    INDEX idx_generated_by (generated_by),
    INDEX idx_generated_at (generated_at),
    CONSTRAINT chk_report_type CHECK (report_type IN ('appointments', 'revenue', 'groomers', 'services', 'custom'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de analíticas (1FN, 2FN, 3FN)
CREATE TABLE IF NOT EXISTS analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    metric_name VARCHAR(255) NOT NULL,
    metric_value DECIMAL(20,2),
    dimensions JSON,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_metric_name (metric_name),
    INDEX idx_recorded_at (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FINALIZACIÓN
-- ============================================

-- Mostrar resumen
SELECT '============================================' AS '';
SELECT 'Setup normalizado completado exitosamente' AS '';
SELECT 'Bases de datos creadas:' AS '';
SHOW DATABASES LIKE 'paseos_%';
SELECT '============================================' AS '';
SELECT 'Normalización aplicada:' AS '';
SELECT '- 1FN: Eliminados grupos repetitivos' AS '';
SELECT '- 2FN: Eliminadas dependencias parciales' AS '';
SELECT '- 3FN: Eliminadas dependencias transitivas' AS '';
SELECT '- Agregadas tablas normalizadas para specialties, availability, preferences' AS '';
SELECT '- Agregadas restricciones CHECK y ENUM' AS '';
SELECT '- Agregados índices optimizados' AS '';
SELECT '============================================' AS '';
