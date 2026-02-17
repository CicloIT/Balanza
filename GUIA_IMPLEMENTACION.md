#!/usr/bin/env markdown

# 🗄️ GUÍA DE IMPLEMENTACIÓN - SISTEMA DE BALANZAS

## Descripción General

Esta es una base de datos PostgreSQL optimizada para un sistema de balanzas agroindustriales con control de pesadas brutas y taras.

## 📁 Archivos Generados

```
proyecto/
├── balanza_db_improved.sql          ← BD completa mejorada
├── ejemplos_consultas.sql           ← Datos de ejemplo + consultas útiles
├── ANALISIS_BD_MEJORADA.md         ← Análisis detallado
└── GUIA_IMPLEMENTACION.md           ← Este archivo
```

---

## 🚀 PASOS DE IMPLEMENTACIÓN

### PASO 1: Instalar PostgreSQL

**Windows:**
```bash
# Descargar desde: https://www.postgresql.org/download/windows/
# Instalador: postgresql-16.x-1-windows-x64.exe

# Verificar instalación
psql --version
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**macOS (Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
```

---

### PASO 2: Crear la Base de Datos

```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE balanza_sistema
    OWNER postgres
    ENCODING 'UTF8'
    LOCALE 'es_ES.UTF-8'
    TEMPLATE template0;

# Salir
\q
```

---

### PASO 3: Ejecutar el Script SQL

```bash
# Opción 1: Desde terminal
psql -U postgres -d balanza_sistema -f balanza_db_improved.sql

# Opción 2: Desde pgAdmin (GUI)
# 1. Abrir pgAdmin
# 2. Conectar a PostgreSQL
# 3. Right-click en balanza_sistema → Query Tool
# 4. Copiar y pegar contenido de balanza_db_improved.sql
# 5. Ejecutar (F5 o botón "Ejecutar")

# Opción 3: Desde DBeaver (IDE)
# 1. File → New → SQL Script
# 2. Copiar contenido del SQL
# 3. Ejecutar (Ctrl+Enter)
```

---

### PASO 4: Cargar Datos Iniciales

```bash
# Cargar datos de ejemplo
psql -U postgres -d balanza_sistema -f ejemplos_consultas.sql

# O dentro de psql:
\i ejemplos_consultas.sql
```

---

### PASO 5: Verificar Instalación

```bash
# Conectar a la BD
psql -U postgres -d balanza_sistema

# Listar tablas
\dt

# Listar vistas
\dv

# Ver estructura de tabla
\d ticket

# Contar registros
SELECT COUNT(*) FROM balanza;
SELECT COUNT(*) FROM usuario;
SELECT COUNT(*) FROM vehiculo;
SELECT COUNT(*) FROM ticket;

# Salir
\q
```

**Salida esperada:**
```
 count 
-------
     2       <- 2 balanzas
 count 
-------
     4       <- 4 usuarios
 count 
-------
     6       <- 6 vehículos
 count 
-------
     3       <- 3 tickets
```

---

## 🔌 Conectar Backend/API

### Configuración de Conexión String

**Node.js (pool de conexión):**
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'balanza_sistema',
  password: 'tu_contraseña',
  port: 5432,
});

module.exports = pool;
```

**Python (psycopg2):**
```python
import psycopg2

conn = psycopg2.connect(
    host="localhost",
    database="balanza_sistema",
    user="postgres",
    password="tu_contraseña",
    port=5432
)

cursor = conn.cursor()
```

**Python (SQLAlchemy):**
```python
from sqlalchemy import create_engine

engine = create_engine(
    'postgresql://postgres:tu_contraseña@localhost:5432/balanza_sistema'
)
```

**PHP (PDO):**
```php
$pdo = new PDO(
    'pgsql:host=localhost;dbname=balanza_sistema',
    'postgres',
    'tu_contraseña'
);
```

**Java (JDBC):**
```java
String url = "jdbc:postgresql://localhost:5432/balanza_sistema";
String user = "postgres";
String password = "tu_contraseña";

Connection conn = DriverManager.getConnection(url, user, password);
```

---

## 📊 Consultas Frecuentes

### Obtener todos los tickets con pesos calculados

```sql
SELECT 
    numero_ticket,
    patente,
    chofer_nombre,
    producto_nombre,
    peso_bruto,
    peso_tara,
    peso_neto,
    estado,
    fecha_hora_entrada
FROM v_ticket_pesos
WHERE estado = 'CERRADO'
ORDER BY fecha_hora_entrada DESC
LIMIT 100;
```

### Buscar tickets abiertos (pendientes)

```sql
SELECT 
    numero_ticket,
    patente,
    chofer_nombre,
    peso_bruto,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - fecha_hora_entrada))/3600 AS horas_abierto
FROM v_ticket_pesos
WHERE estado = 'ABIERTO'
ORDER BY fecha_hora_entrada ASC;
```

### Reporte por transporte (empresa)

```sql
SELECT 
    transporte_nombre,
    COUNT(*) AS viajes,
    SUM(peso_neto)::INTEGER AS total_kilos,
    ROUND(AVG(peso_neto), 2) AS promedio
FROM v_ticket_pesos
WHERE estado = 'CERRADO'
  AND DATE(fecha_hora_entrada) = CURRENT_DATE
GROUP BY transporte_nombre
ORDER BY total_kilos DESC;
```

### Reporte por producto y rango de fechas

```sql
SELECT 
    producto_nombre,
    COUNT(*) AS cargas,
    SUM(peso_neto)::INTEGER AS total_kilos,
    MIN(peso_neto) AS minimo,
    MAX(peso_neto) AS maximo
FROM v_ticket_pesos
WHERE estado = 'CERRADO'
  AND fecha_hora_entrada >= '2024-02-10'::DATE
  AND fecha_hora_entrada < '2024-02-11'::DATE
GROUP BY producto_nombre
ORDER BY total_kilos DESC;
```

### Insertar nuevo ticket

```sql
INSERT INTO ticket (
    numero_ticket,
    fecha_hora_entrada,
    balanza_id,
    chofer_id,
    productor_id,
    transporte_id,
    producto_id,
    vehiculo_id,
    operario_id,
    nro_remito
) VALUES (
    (SELECT NEXTVAL('ticket_numero_ticket_seq')),
    CURRENT_TIMESTAMP,
    1,                    -- balanza_id
    1,                    -- chofer_id
    1,                    -- productor_id
    1,                    -- transporte_id
    1,                    -- producto_id
    1,                    -- vehiculo_id
    1,                    -- operario_id
    'REM-2024-999'
);
```

### Registrar pesada BRUTO

```sql
INSERT INTO pesada (
    ticket_id,
    tipo,
    peso,
    operario_id
) VALUES (
    1,                    -- ticket_id (del INSERT anterior)
    'BRUTO',
    25500.50,
    1                     -- operario_id
);
```

### Registrar pesada TARA y cerrar ticket

```sql
INSERT INTO pesada (
    ticket_id,
    tipo,
    peso,
    operario_id
) VALUES (
    1,
    'TARA',
    8500.00,
    1
);

UPDATE ticket 
SET estado = 'CERRADO',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 1;
```

---

## ⚙️ Configuración de Seguridad

### Crear usuario con permisos limitados (NO usar postgres en producción)

```sql
-- Crear usuario solo lectura (reportes)
CREATE USER reportes_user WITH PASSWORD 'password_seguro_a_generar';
GRANT CONNECT ON DATABASE balanza_sistema TO reportes_user;
GRANT USAGE ON SCHEMA public TO reportes_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO reportes_user;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO reportes_user;

-- Crear usuario de aplicación (lectura/escritura)
CREATE USER app_user WITH PASSWORD 'otro_password_seguro_a_generar';
GRANT CONNECT ON DATABASE balanza_sistema TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app_user;

-- Verificar permisos
\du
```

### Cambiar contraseña de postgres (IMPORTANTE)

```sql
ALTER USER postgres WITH PASSWORD 'nueva_contraseña_segura';

-- En Windows, editar archivo de ambiente:
-- %APPDATA%\postgresql\pgpass.txt
```

---

## 📈 Mantenimiento y Backup

### Backup de la base de datos

```bash
# Backup completo (formato SQL)
pg_dump -U postgres -d balanza_sistema -f backup_$(date +%Y%m%d).sql

# Backup comprimido (formato custom)
pg_dump -U postgres -d balanza_sistema -Fc -f backup_$(date +%Y%m%d).dump

# Con verbosidad
pg_dump -U postgres -d balanza_sistema -v -f backup_completo.sql
```

### Restaurar backup

```bash
# Desde archivo SQL
psql -U postgres -d balanza_sistema -f backup_20240210.sql

# Desde archivo comprimido
pg_restore -U postgres -d balanza_sistema backup_20240210.dump
```

### Vacío de tabla (borrar datos)

```sql
-- Borrar todas las pesadas (cascada)
TRUNCATE TABLE pesada CASCADE;

-- Borrar todos los tickets (cascada)
TRUNCATE TABLE ticket CASCADE;

-- Borrar todo desde el inicio
TRUNCATE TABLE pesada, ticket, usuario_balanza CASCADE;
```

### Reindexar (optimizar performance)

```sql
-- Reindexar una tabla
REINDEX TABLE vehiculo;

-- Reindexar toda la BD
REINDEX DATABASE balanza_sistema;
```

### Analizar estadísticas

```sql
ANALYZE vehiculo;
ANALYZE;  -- Analiza toda la BD
```

---

## 🔍 Debugging y Troubleshooting

### Error: "Relación no existe"

```bash
# Verificar que la BD existe
psql -U postgres -l

# Verificar que estás en la BD correcta
psql -U postgres -d balanza_sistema -c "\dt"
```

### Error: "Permiso denegado"

```sql
-- Verificar permisos del usuario
SELECT * FROM information_schema.role_table_grants 
WHERE grantee = 'tu_usuario';

-- Revertir permisos
REVOKE ALL ON DATABASE balanza_sistema FROM usuario;

-- Otorgar permisos básicos
GRANT CONNECT ON DATABASE balanza_sistema TO usuario;
GRANT USAGE ON SCHEMA public TO usuario;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO usuario;
```

### Verificar conexión desde aplicación

```javascript
// Node.js - Test conexión
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'balanza_sistema',
  user: 'postgres',
  password: '...'
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Conectado:', res.rows);
  }
  pool.end();
});
```

### Ver logs de PostgreSQL

```bash
# Linux
tail -f /var/log/postgresql/postgresql.log

# Windows (archivo de log de la instalación)
# C:\Program Files\PostgreSQL\16\data\log\
```

---

## 📋 Checklist de Implementación

- [ ] PostgreSQL instalado y ejecutándose
- [ ] Base de datos `balanza_sistema` creada
- [ ] Script SQL ejecutado exitosamente
- [ ] Datos iniciales cargados
- [ ] Consultas de verificación ejecutadas correctamente
- [ ] Usuario de aplicación creado con permisos
- [ ] Connection string configurado en backend
- [ ] Backup inicial realizado
- [ ] Pruebas de conexión desde aplicación exitosas
- [ ] Documentación compartida con equipo DevOps

---

## 🆘 Contacto y Soporte

Si encuentras problemas:

1. **Revisar logs**: `psql -U postgres -d balanza_sistema` → `\dt` (¿existen las tablas?)
2. **Ejecutar script de verificación**: Ver sección "6. VERIFICACIONES DE INTEGRIDAD" en `ejemplos_consultas.sql`
3. **Consultar documentation**: https://www.postgresql.org/docs/

---

## 📞 Contacto

**Proyecto**: Sistema de Balanzas   
**Versión**:v1.0 - Mejorada   
**BD**: PostgreSQL 14+   
**Fecha**: Febrero 2024

---

*Documento generado como guía de implementación. Ajustar según tu entorno específico.*
