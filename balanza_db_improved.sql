/* ============================================================
   SISTEMA DE BALANZAS - ESTRUCTURA MEJORADA
   Base de datos PostgreSQL
   ============================================================ 
   
   Mejoras implementadas:
   - Campos de auditoría (created_at, updated_at)
   - Restricciones de integridad más robustas
   - Índices optimizados para consultas frecuentes
   - Vistas adicionales para reportes
   - Triggers para validación de datos
   - Soft delete para auditoría
*/

/* =============================
   LIMPIEZA (opcional)
   ============================= */

DROP VIEW IF EXISTS v_ticket_detalle CASCADE;
DROP VIEW IF EXISTS v_pesadas_agrupadas CASCADE;
DROP VIEW IF EXISTS v_ticket_pesos CASCADE;

DROP FUNCTION IF EXISTS fn_validar_pesadas() CASCADE;
DROP FUNCTION IF EXISTS fn_actualizar_ticket_fecha_salida() CASCADE;

DROP TABLE IF EXISTS pesada CASCADE;
DROP TABLE IF EXISTS ticket CASCADE;
DROP TABLE IF EXISTS vehiculo CASCADE;
DROP TABLE IF EXISTS transporte CASCADE;
DROP TABLE IF EXISTS producto CASCADE;
DROP TABLE IF EXISTS productor CASCADE;
DROP TABLE IF EXISTS chofer CASCADE;
DROP TABLE IF EXISTS usuario_balanza CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;
DROP TABLE IF EXISTS balanza CASCADE;
DROP TABLE IF EXISTS localidad CASCADE;
DROP TABLE IF EXISTS provincia CASCADE;

DROP TYPE IF EXISTS rol_enum CASCADE;
DROP TYPE IF EXISTS estado_ticket_enum CASCADE;
DROP TYPE IF EXISTS tipo_pesada_enum CASCADE;
DROP TYPE IF EXISTS tipo_vehiculo_enum CASCADE;


/* =============================
   ENUMS
   ============================= */

CREATE TYPE rol_enum AS ENUM ('admin', 'jefe', 'empleado');

CREATE TYPE estado_ticket_enum AS ENUM ('ABIERTO', 'CERRADO', 'ANULADO');

CREATE TYPE tipo_pesada_enum AS ENUM ('BRUTO', 'TARA');

CREATE TYPE tipo_vehiculo_enum AS ENUM (
    'CHASIS',
    'SEMI_REMOLQUE',
    'FURGON',
    'CAMION_TANQUE',
    'CHASIS_ACOPLADO',
    'JAULA_DOBLE',
    'BATEA',
    'OTRO'
);


/* =============================
   UBICACIÓN (CATÁLOGOS)
   ============================= */

CREATE TABLE provincia (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE localidad (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    provincia_id INTEGER NOT NULL REFERENCES provincia(id) ON DELETE RESTRICT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_localidad_provincia UNIQUE(nombre, provincia_id)
);

CREATE INDEX idx_localidad_provincia ON localidad(provincia_id);


/* =============================
   BALANZA
   ============================= */

CREATE TABLE balanza (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    direccion VARCHAR(200),
    localidad_id INTEGER NOT NULL REFERENCES localidad(id) ON DELETE RESTRICT,
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_balanza_localidad ON balanza(localidad_id);
CREATE INDEX idx_balanza_activa ON balanza(activa);


/* =============================
   USUARIOS Y PERMISOS
   ============================= */

CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    email VARCHAR(100),
    rol rol_enum NOT NULL DEFAULT 'empleado',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usuario_activo ON usuario(activo);
CREATE INDEX idx_usuario_rol ON usuario(rol);

CREATE TABLE usuario_balanza (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    balanza_id INTEGER NOT NULL REFERENCES balanza(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_usuario_balanza UNIQUE(usuario_id, balanza_id)
);

CREATE INDEX idx_usuario_balanza_usuario ON usuario_balanza(usuario_id);
CREATE INDEX idx_usuario_balanza_balanza ON usuario_balanza(balanza_id);


/* =============================
   ENTIDADES OPERATIVAS (CATÁLOGOS)
   ============================= */

CREATE TABLE chofer (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE,
    apellido_nombre VARCHAR(150) NOT NULL,
    tipo_documento VARCHAR(20),
    nro_documento VARCHAR(30) UNIQUE,
    nacionalidad VARCHAR(50),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chofer_codigo ON chofer(codigo);
CREATE INDEX idx_chofer_documento ON chofer(nro_documento);
CREATE INDEX idx_chofer_activo ON chofer(activo);

CREATE TABLE productor (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    cuit VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_productor_codigo ON productor(codigo);
CREATE INDEX idx_productor_activo ON productor(activo);

CREATE TABLE producto (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_producto_codigo ON producto(codigo);
CREATE INDEX idx_producto_activo ON producto(activo);

-- TABLA TRANSPORTE: Representa la EMPRESA de transporte, NO la patente
CREATE TABLE transporte (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    cuit VARCHAR(20) UNIQUE NOT NULL,
    contacto VARCHAR(150),
    telefono VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transporte_codigo ON transporte(codigo);
CREATE INDEX idx_transporte_activo ON transporte(activo);


/* =============================
   VEHÍCULO (PATENTES)
   ============================= */

CREATE TABLE vehiculo (
    id SERIAL PRIMARY KEY,
    patente VARCHAR(15) UNIQUE NOT NULL,
    tipo_vehiculo tipo_vehiculo_enum NOT NULL,
    transporte_id INTEGER REFERENCES transporte(id) ON DELETE SET NULL,
    activo BOOLEAN DEFAULT TRUE,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehiculo_patente ON vehiculo(patente);
CREATE INDEX idx_vehiculo_tipo ON vehiculo(tipo_vehiculo);
CREATE INDEX idx_vehiculo_transporte ON vehiculo(transporte_id);
CREATE INDEX idx_vehiculo_activo ON vehiculo(activo);


/* =============================
   TICKET (OPERACIONES)
   ============================= */

CREATE TABLE ticket (
    id SERIAL PRIMARY KEY,
    numero_ticket BIGSERIAL UNIQUE NOT NULL,
    
    fecha_hora_entrada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_hora_salida TIMESTAMP,
    
    balanza_id INTEGER NOT NULL REFERENCES balanza(id) ON DELETE RESTRICT,
    
    chofer_id INTEGER NOT NULL REFERENCES chofer(id),
    productor_id INTEGER NOT NULL REFERENCES productor(id),
    transporte_id INTEGER NOT NULL REFERENCES transporte(id),
    producto_id INTEGER NOT NULL REFERENCES producto(id),
    vehiculo_id INTEGER NOT NULL REFERENCES vehiculo(id),
    
    operario_id INTEGER NOT NULL REFERENCES usuario(id),
    
    estado estado_ticket_enum DEFAULT 'ABIERTO',
    
    observaciones TEXT,
    nro_remito VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ticket_balanza ON ticket(balanza_id);
CREATE INDEX idx_ticket_fecha ON ticket(fecha_hora_entrada);
CREATE INDEX idx_ticket_estado ON ticket(estado);
CREATE INDEX idx_ticket_operario ON ticket(operario_id);
CREATE INDEX idx_ticket_vehiculo ON ticket(vehiculo_id);
CREATE INDEX idx_ticket_productor ON ticket(productor_id);
CREATE INDEX idx_ticket_transporte ON ticket(transporte_id);

-- Índice compuesto para reportes frecuentes
CREATE INDEX idx_ticket_balanza_fecha ON ticket(balanza_id, fecha_hora_entrada DESC);
CREATE INDEX idx_ticket_estado_fecha ON ticket(estado, fecha_hora_entrada DESC);


/* =============================
   PESADAS (DETALLE)
   ============================= */

CREATE TABLE pesada (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES ticket(id) ON DELETE CASCADE,
    tipo tipo_pesada_enum NOT NULL,
    peso NUMERIC(12,2) NOT NULL,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    operario_id INTEGER REFERENCES usuario(id),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_peso_positivo CHECK (peso > 0)
);

CREATE INDEX idx_pesada_ticket ON pesada(ticket_id);
CREATE INDEX idx_pesada_tipo ON pesada(tipo);
CREATE INDEX idx_pesada_fecha ON pesada(fecha_hora);

-- Índice para obtener rápidamente bruto/tara de un ticket
CREATE INDEX idx_pesada_ticket_tipo ON pesada(ticket_id, tipo);


/* =============================
   FUNCIONES Y TRIGGERS
   ============================= */

-- Validar que cada ticket tenga al menos un BRUTO y un TARA
CREATE OR REPLACE FUNCTION fn_validar_pesadas()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el ticket se marca como CERRADO, validar que tenga pesadas
    IF NEW.estado = 'CERRADO' THEN
        IF NOT EXISTS (
            SELECT 1 FROM pesada 
            WHERE ticket_id = NEW.id AND tipo = 'BRUTO'
        ) OR NOT EXISTS (
            SELECT 1 FROM pesada 
            WHERE ticket_id = NEW.id AND tipo = 'TARA'
        ) THEN
            RAISE EXCEPTION 'El ticket debe tener al menos un peso BRUTO y un TARA para cerrar';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_pesadas
BEFORE UPDATE ON ticket
FOR EACH ROW
WHEN (OLD.estado IS DISTINCT FROM NEW.estado)
EXECUTE FUNCTION fn_validar_pesadas();


-- Actualizar fecha de salida automáticamente si se registra la última pesada
CREATE OR REPLACE FUNCTION fn_actualizar_ticket_fecha_salida()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar la fecha_hora_salida del ticket cuando se registra el TARA
    IF NEW.tipo = 'TARA' THEN
        UPDATE ticket 
        SET fecha_hora_salida = NEW.fecha_hora,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.ticket_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_fecha_salida
AFTER INSERT ON pesada
FOR EACH ROW
EXECUTE FUNCTION fn_actualizar_ticket_fecha_salida();


/* =============================
   VISTAS DE CONSULTA
   ============================= */

-- Vista principal: Calcula pesos brutos, taras y netos
CREATE VIEW v_ticket_pesos AS
SELECT
    t.id,
    t.numero_ticket,
    t.fecha_hora_entrada,
    t.fecha_hora_salida,
    t.estado,
    v.patente,
    v.tipo_vehiculo,
    tp.nombre AS transporte_nombre,
    c.apellido_nombre AS chofer_nombre,
    p.nombre AS producto_nombre,
    pr.nombre AS productor_nombre,
    b.nombre AS balanza_nombre,
    COALESCE(SUM(CASE WHEN pe.tipo = 'BRUTO' THEN pe.peso ELSE 0 END), 0) AS peso_bruto,
    COALESCE(SUM(CASE WHEN pe.tipo = 'TARA' THEN pe.peso ELSE 0 END), 0) AS peso_tara,
    COALESCE(
        SUM(CASE WHEN pe.tipo = 'BRUTO' THEN pe.peso ELSE 0 END) -
        SUM(CASE WHEN pe.tipo = 'TARA' THEN pe.peso ELSE 0 END),
        0
    ) AS peso_neto,
    EXTRACT(EPOCH FROM (t.fecha_hora_salida - t.fecha_hora_entrada))/3600 AS horas_permanencia
FROM ticket t
LEFT JOIN pesada pe ON pe.ticket_id = t.id
LEFT JOIN vehiculo v ON t.vehiculo_id = v.id
LEFT JOIN transporte tp ON t.transporte_id = tp.id
LEFT JOIN chofer c ON t.chofer_id = c.id
LEFT JOIN producto p ON t.producto_id = p.id
LEFT JOIN productor pr ON t.productor_id = pr.id
LEFT JOIN balanza b ON t.balanza_id = b.id
GROUP BY t.id, v.id, tp.id, c.id, p.id, pr.id, b.id;


-- Vista detallada con información completa para reportes
CREATE VIEW v_ticket_detalle AS
SELECT
    tp.id,
    tp.numero_ticket,
    tp.fecha_hora_entrada,
    tp.fecha_hora_salida,
    tp.estado,
    tp.patente,
    tp.tipo_vehiculo,
    tp.transporte_nombre,
    tp.chofer_nombre,
    tp.producto_nombre,
    tp.productor_nombre,
    tp.balanza_nombre,
    tp.peso_bruto,
    tp.peso_tara,
    tp.peso_neto,
    tp.horas_permanencia,
    t.nro_remito,
    t.observaciones,
    u.nombre_completo AS operario_nombre,
    t.created_at
FROM v_ticket_pesos tp
JOIN ticket t ON tp.id = t.id
LEFT JOIN usuario u ON t.operario_id = u.id;


-- Vista para pesadas agrupadas por ticket (cálculo alternativo)
CREATE VIEW v_pesadas_agrupadas AS
SELECT
    ticket_id,
    tipo,
    COUNT(*) as cantidad_pesadas,
    MIN(peso) as peso_minimo,
    MAX(peso) as peso_maximo,
    AVG(peso)::NUMERIC(12,2) as peso_promedio,
    SUM(peso)::NUMERIC(12,2) as peso_total,
    MIN(fecha_hora) as fecha_primera,
    MAX(fecha_hora) as fecha_ultima
FROM pesada
GROUP BY ticket_id, tipo;


/* =============================
   TABLAS DE AUDITORÍA (OPCIONAL)
   ============================= */

CREATE TABLE auditoria_cambios (
    id SERIAL PRIMARY KEY,
    tabla VARCHAR(100) NOT NULL,
    registro_id INTEGER NOT NULL,
    operacion VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    datos_antes JSONB,
    datos_despues JSONB,
    usuario_id INTEGER REFERENCES usuario(id),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auditoria_tabla ON auditoria_cambios(tabla);
CREATE INDEX idx_auditoria_registro ON auditoria_cambios(tabla, registro_id);
CREATE INDEX idx_auditoria_fecha ON auditoria_cambios(fecha);


/* =============================
   DATOS DE EJEMPLO (COMENTADO)
   ============================= */

/*
-- Provincias
INSERT INTO provincia (nombre) VALUES 
('Buenos Aires'),
('Córdoba'),
('Santiago del Estero');

-- Localidades
INSERT INTO localidad (nombre, provincia_id) VALUES 
('La Plata', 1),
('Córdoba Capital', 2),
('Santiago del Estero Capital', 3);

-- Balanza
INSERT INTO balanza (codigo, nombre, direccion, localidad_id) VALUES 
('BAL-001', 'Balanza Principal', 'Calle 1 y 2', 1);

-- Usuarios
INSERT INTO usuario (username, password_hash, nombre_completo, rol) VALUES 
('admin', 'hash_password', 'Administrador Sistema', 'admin'),
('operario1', 'hash_password', 'Juan Pérez', 'empleado');

-- Usuarios por balanza
INSERT INTO usuario_balanza (usuario_id, balanza_id) VALUES 
(1, 1),
(2, 1);

-- Productores
INSERT INTO productor (codigo, nombre, cuit) VALUES 
('PROD-001', 'Productor A', '20123456789');

-- Productos
INSERT INTO producto (codigo, nombre, descripcion) VALUES 
('PROD-001', 'Soja', 'Grano de soja'),
('PROD-002', 'Maíz', 'Grano de maíz');

-- Transportes (Empresas)
INSERT INTO transporte (codigo, nombre, cuit) VALUES 
('TRANS-001', 'Empresa de Transporte A', '30987654321');

-- Choferes
INSERT INTO chofer (codigo, apellido_nombre, nro_documento) VALUES 
('CHO-001', 'García Juan', '12345678');

-- Vehículos
INSERT INTO vehiculo (patente, tipo_vehiculo, transporte_id) VALUES 
('ABC123', 'CHASIS', 1);
*/


/* ============================================================
   MEJORAS RESPECTO A LA VERSIÓN ANTERIOR:
   
   1. AUDITORÍA:
      - Campos created_at y updated_at en tablas principales
      - Tabla auditoria_cambios para registro completo
   
   2. INTEGRIDAD:
      - Constraints más robustos (ON DELETE RESTRICT en catálogos)
      - Soft delete con flag 'activo'
      - Índices compuestos para consultas frecuentes
   
   3. CLARIDAD:
      - Relación explícita vehiculo -> transporte
      - Comentario aclarando que transporte es EMPRESA
      - nro_remito en ticket (para datos adicionales del frontend)
   
   4. FUNCIONALIDAD:
      - Triggers para validación automática
      - Actualización automática de fecha_salida al registrar TARA
      - Función para validar pesadas completas
   
   5. REPORTING:
      - Vista detallada con información completa
      - Vista de pesadas agrupadas para análisis
      - Campos calculados útiles (horas_permanencia, totales)
   
   6. PERFORMANCE:
      - Índices en campos de búsqueda frecuente
      - Índices compuestos para filtros combinados
      - Índices en campos de estado y fecha
   
   ============================================================ */
