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
   USUARIOS Y PERMISOS
   ============================= */
CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,        
    rol rol_enum NOT NULL DEFAULT 'empleado',
    localidad_id INTEGER REFERENCES localidad(id),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
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
    patente_acoplado VARCHAR(15),
    tipo_vehiculo tipo_vehiculo_enum NOT NULL,    
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
    pesada_id INTEGER REFERENCES pesada(id),        
    estado estado_ticket_enum DEFAULT 'ABIERTO',
    observaciones TEXT,
    nro_remito VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX idx_ticket_estado ON ticket(estado);




/* =============================
   PESADAS (DETALLE)
   ============================= */

CREATE TABLE operacion_pesaje (
    id SERIAL PRIMARY KEY,
    vehiculo_patente VARCHAR(15) NOT NULL REFERENCES vehiculo(patente),
    abierta BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX unica_operacion_abierta_por_camion
ON operacion_pesaje (vehiculo_patente)
WHERE abierta = true;

CREATE TABLE pesada (
    id SERIAL PRIMARY KEY,
    operacion_id INTEGER NOT NULL REFERENCES operacion_pesaje(id) ON DELETE CASCADE,
    tipo tipo_pesada_enum NOT NULL,
    peso NUMERIC(12,2) NOT NULL,
    chofer_id INTEGER REFERENCES chofer(id),
    productor_id INTEGER REFERENCES productor(id),
    neto NUMERIC(12,2),
    transporte_id INTEGER REFERENCES transporte(id),
    producto_id INTEGER REFERENCES producto(id),
    vehiculo_patente VARCHAR(15) REFERENCES vehiculo(patente),
    balancero VARCHAR(100),
    nro_remito VARCHAR(50),
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_peso_positivo CHECK (peso > 0)
);

ALTER TABLE pesada
ADD CONSTRAINT unica_pesada_por_tipo UNIQUE (operacion_id, tipo);


CREATE OR REPLACE FUNCTION calcular_neto()
RETURNS TRIGGER AS $$
DECLARE
    peso_bruto NUMERIC(12,2);
    peso_tara  NUMERIC(12,2);
BEGIN
    SELECT peso INTO peso_bruto
    FROM pesada
    WHERE operacion_id = NEW.operacion_id
      AND tipo = 'BRUTO'
    LIMIT 1;

    SELECT peso INTO peso_tara
    FROM pesada
    WHERE operacion_id = NEW.operacion_id
      AND tipo = 'TARA'
    LIMIT 1;

    IF peso_bruto IS NOT NULL AND peso_tara IS NOT NULL THEN
        UPDATE pesada
        SET neto = peso_bruto - peso_tara
        WHERE operacion_id = NEW.operacion_id;

        UPDATE operacion_pesaje
        SET abierta = FALSE
        WHERE id = NEW.operacion_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calcular_neto
AFTER INSERT ON pesada
FOR EACH ROW
EXECUTE FUNCTION calcular_neto();

CREATE INDEX idx_pesada_fecha ON pesada (fecha_hora);
CREATE INDEX idx_operacion_fecha ON operacion_pesaje (created_at);
CREATE INDEX idx_operacion_patente ON operacion_pesaje (vehiculo_patente);