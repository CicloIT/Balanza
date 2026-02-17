/* ============================================================
   EJEMPLOS PRÁCTICOS - INSERCIÓN Y CONSULTAS
   Base de datos Balanza - PostgreSQL
   ============================================================ */

/* =============================
   1. INSERCIÓN DE DATOS INICIALES
   ============================= */

-- Limpiar datos (si es necesario)
-- TRUNCATE TABLE pesada CASCADE;
-- TRUNCATE TABLE ticket CASCADE;

-- ============ UBICACIÓN ============
INSERT INTO provincia (nombre) VALUES 
('Buenos Aires'),
('Córdoba'),
('Santiago del Estero'),
('Santa Fe')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO localidad (nombre, provincia_id) VALUES 
('La Plata', 1),
('Córdoba Capital', 2),
('Santiago del Estero Capital', 3),
('Rosario', 4)
ON CONFLICT (nombre, provincia_id) DO NOTHING;

-- ============ BALANZA ============
INSERT INTO balanza (codigo, nombre, direccion, localidad_id) VALUES 
('BAL-001', 'Balanza Principal', 'Ruta 5 km 15', 1),
('BAL-002', 'Balanza Secundaria', 'Avenida 7 nro 120', 2)
ON CONFLICT (codigo) DO NOTHING;

-- ============ USUARIOS ============
INSERT INTO usuario (username, password_hash, nombre_completo, email, rol) VALUES 
('admin', '$2b$12$...', 'Administrador Sistema', 'admin@balanza.local', 'admin'),
('jefe_turno', '$2b$12$...', 'Jefe de Turno', 'jefe@balanza.local', 'jefe'),
('operario_juan', '$2b$12$...', 'Juan Pérez', 'juan@balanza.local', 'empleado'),
('operario_maria', '$2b$12$...', 'María García', 'maria@balanza.local', 'empleado')
ON CONFLICT (username) DO NOTHING;

-- Asignar usuarios a balanzas
INSERT INTO usuario_balanza (usuario_id, balanza_id) 
SELECT u.id, b.id 
FROM usuario u, balanza b 
WHERE u.username IN ('operario_juan', 'operario_maria') 
  AND b.codigo = 'BAL-001'
ON CONFLICT (usuario_id, balanza_id) DO NOTHING;

-- ============ TRANSPORTES (EMPRESAS) ============
INSERT INTO transporte (codigo, nombre, cuit, contacto, telefono) VALUES 
('TRANS-001', 'Transportes del Norte S.A.', '30123456789', 'Carlos López', '261-4567890'),
('TRANS-002', 'Fletes Rápidos S.R.L.', '30987654321', 'Roberto Gómez', '261-9876543'),
('TRANS-003', 'Cargas Rosario S.A.', '30456789123', 'Andrés Martinez', '341-5551234')
ON CONFLICT (codigo) DO NOTHING;

-- ============ VEHÍCULOS (PATENTES) ============
INSERT INTO vehiculo (patente, tipo_vehiculo, transporte_id, observaciones) VALUES 
('ABC-123', 'CHASIS', (SELECT id FROM transporte WHERE codigo = 'TRANS-001'), 'En buenas condiciones'),
('DEF-456', 'SEMI_REMOLQUE', (SELECT id FROM transporte WHERE codigo = 'TRANS-001'), NULL),
('GHI-789', 'CAMION_TANQUE', (SELECT id FROM transporte WHERE codigo = 'TRANS-002'), 'Autorizado para granos'),
('JKL-012', 'JAULA_DOBLE', (SELECT id FROM transporte WHERE codigo = 'TRANS-003'), NULL),
('MNO-345', 'FURGON', (SELECT id FROM transporte WHERE codigo = 'TRANS-002'), 'Cámara de carga'),
('PQR-678', 'BATEA', (SELECT id FROM transporte WHERE codigo = 'TRANS-001'), NULL)
ON CONFLICT (patente) DO NOTHING;

-- ============ CHOFERES ============
INSERT INTO chofer (codigo, apellido_nombre, tipo_documento, nro_documento, nacionalidad) VALUES 
('CHO-001', 'García, Juan Carlos', 'DNI', '12345678', 'Argentino'),
('CHO-002', 'López, Roberto Daniel', 'DNI', '23456789', 'Argentino'),
('CHO-003', 'Martínez, Andrés Sebastián', 'DNI', '34567890', 'Argentino'),
('CHO-004', 'Rodríguez, José María', 'DNI', '45678901', 'Argentino'),
('CHO-005', 'Gómez, Luis Fernando', 'DNI', '56789012', 'Uruguayo')
ON CONFLICT (codigo) DO NOTHING;

-- ============ PRODUCTORES ============
INSERT INTO productor (codigo, nombre, cuit) VALUES 
('PROD-001', 'Productor Agropecuario "Las Flores"', '20987654321'),
('PROD-002', 'Cooperativa Campo Argentino', '30123456789'),
('PROD-003', 'Don Enrique Granos S.R.L.', '20555666777'),
('PROD-004', 'Asociación de Productores Unidos', '30888999000')
ON CONFLICT (codigo) DO NOTHING;

-- ============ PRODUCTOS ============
INSERT INTO producto (codigo, nombre, descripcion) VALUES 
('PROD-001', 'Soja', 'Grano de soja, diversos calibres'),
('PROD-002', 'Maíz', 'Maíz blanco y amarillo'),
('PROD-003', 'Trigo', 'Trigo pan y cervecero'),
('PROD-004', 'Girasol', 'Semilla de girasol para aceite'),
('PROD-005', 'Sorgo', 'Sorgo granífero'),
('PROD-006', 'Cebada', 'Cebada cervecera')
ON CONFLICT (codigo) DO NOTHING;


/* =============================
   2. INSERCIÓN DE TICKETS (OPERACIONES)
   ============================= */

-- Ticket 1: Compra de soja completa
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
    estado,
    nro_remito,
    observaciones
) VALUES (
    1,
    '2024-02-10 08:30:00',
    (SELECT id FROM balanza WHERE codigo = 'BAL-001'),
    (SELECT id FROM chofer WHERE codigo = 'CHO-001'),
    (SELECT id FROM productor WHERE codigo = 'PROD-001'),
    (SELECT id FROM transporte WHERE codigo = 'TRANS-001'),
    (SELECT id FROM producto WHERE codigo = 'PROD-001'),
    (SELECT id FROM vehiculo WHERE patente = 'ABC-123'),
    (SELECT id FROM usuario WHERE username = 'operario_juan'),
    'ABIERTO',
    'REM-2024-001',
    'Remisión normal, cliente verificado'
);

-- Ticket 2: Compra de maíz
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
    estado,
    nro_remito
) VALUES (
    2,
    '2024-02-10 10:15:00',
    (SELECT id FROM balanza WHERE codigo = 'BAL-001'),
    (SELECT id FROM chofer WHERE codigo = 'CHO-002'),
    (SELECT id FROM productor WHERE codigo = 'PROD-002'),
    (SELECT id FROM transporte WHERE codigo = 'TRANS-002'),
    (SELECT id FROM producto WHERE codigo = 'PROD-002'),
    (SELECT id FROM vehiculo WHERE patente = 'GHI-789'),
    (SELECT id FROM usuario WHERE username = 'operario_maria'),
    'ABIERTO',
    'REM-2024-002'
);

-- Ticket 3: Compra de trigo
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
    estado
) VALUES (
    3,
    '2024-02-10 14:45:00',
    (SELECT id FROM balanza WHERE codigo = 'BAL-001'),
    (SELECT id FROM chofer WHERE codigo = 'CHO-003'),
    (SELECT id FROM productor WHERE codigo = 'PROD-003'),
    (SELECT id FROM transporte WHERE codigo = 'TRANS-001'),
    (SELECT id FROM producto WHERE codigo = 'PROD-003'),
    (SELECT id FROM vehiculo WHERE patente = 'DEF-456'),
    (SELECT id FROM usuario WHERE username = 'operario_juan'),
    'ABIERTO'
);


/* =============================
   3. INSERCIÓN DE PESADAS
   ============================= */

-- Pesada 1: Ticket 1 - BRUTO
INSERT INTO pesada (ticket_id, tipo, peso, operario_id) VALUES
(
    (SELECT id FROM ticket WHERE numero_ticket = 1),
    'BRUTO',
    25500.50,
    (SELECT id FROM usuario WHERE username = 'operario_juan')
);

-- Pesada 1: Ticket 1 - TARA
INSERT INTO pesada (ticket_id, tipo, peso, operario_id) VALUES
(
    (SELECT id FROM ticket WHERE numero_ticket = 1),
    'TARA',
    8500.00,
    (SELECT id FROM usuario WHERE username = 'operario_juan')
);

-- Actualizar estado del ticket 1 a CERRADO
UPDATE ticket 
SET estado = 'CERRADO'
WHERE numero_ticket = 1;


-- Pesada 2: Ticket 2 - BRUTO
INSERT INTO pesada (ticket_id, tipo, peso, operario_id) VALUES
(
    (SELECT id FROM ticket WHERE numero_ticket = 2),
    'BRUTO',
    18750.75,
    (SELECT id FROM usuario WHERE username = 'operario_maria')
);

-- Pesada 2: Ticket 2 - TARA
INSERT INTO pesada (ticket_id, tipo, peso, operario_id) VALUES
(
    (SELECT id FROM ticket WHERE numero_ticket = 2),
    'TARA',
    7250.25,
    (SELECT id FROM usuario WHERE username = 'operario_maria')
);

-- Actualizar estado del ticket 2 a CERRADO
UPDATE ticket 
SET estado = 'CERRADO'
WHERE numero_ticket = 2;


-- Pesada 3: Ticket 3 - Solamente BRUTO (aún abierto)
INSERT INTO pesada (ticket_id, tipo, peso, operario_id) VALUES
(
    (SELECT id FROM ticket WHERE numero_ticket = 3),
    'BRUTO',
    22000.00,
    (SELECT id FROM usuario WHERE username = 'operario_juan')
);

-- Ticket 3 permanece ABIERTO hasta registrar la TARA


/* =============================
   4. CONSULTAS ÚTILES
   ============================= */

-- ============ Consulta 1: Ver todos los tickets con sus pesos ============
SELECT 
    numero_ticket,
    patente,
    tipo_vehiculo,
    transporte_nombre,
    chofer_nombre,
    producto_nombre,
    peso_bruto,
    peso_tara,
    peso_neto,
    estado,
    fecha_hora_entrada
FROM v_ticket_pesos
ORDER BY numero_ticket DESC;

-- ============ Consulta 2: Tickets abiertos (pendientes de TARA) ============
SELECT 
    id,
    numero_ticket,
    patente,
    chofer_nombre,
    producto_nombre,
    peso_bruto,
    estado,
    fecha_hora_entrada,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - fecha_hora_entrada))/3600 AS horas_abierto
FROM v_ticket_pesos
WHERE estado = 'ABIERTO'
ORDER BY fecha_hora_entrada ASC;

-- ============ Consulta 3: Resumen por transporte ============
SELECT 
    transporte_nombre,
    COUNT(*) AS cantidad_viajes,
    SUM(peso_bruto) AS total_bruto,
    SUM(peso_tara) AS total_tara,
    SUM(peso_neto) AS total_neto,
    AVG(peso_neto) AS promedio_neto
FROM v_ticket_pesos
WHERE estado = 'CERRADO'
GROUP BY transporte_nombre
ORDER BY total_neto DESC;

-- ============ Consulta 4: Resumen por producto ============
SELECT 
    producto_nombre,
    COUNT(*) AS cantidad_cargas,
    SUM(peso_neto) AS total_kilos,
    AVG(peso_neto) AS promedio_por_carga,
    MAX(peso_neto) AS carga_maxima,
    MIN(peso_neto) AS carga_minima
FROM v_ticket_pesos
WHERE estado = 'CERRADO'
GROUP BY producto_nombre
ORDER BY total_kilos DESC;

-- ============ Consulta 5: Rendimiento de choferes ============
SELECT 
    chofer_nombre,
    COUNT(*) AS viajes_realizados,
    SUM(peso_neto) AS total_transportado,
    AVG(horas_permanencia) AS promedio_horas,
    COUNT(DISTINCT DATE(fecha_hora_entrada)) AS dias_trabajados
FROM v_ticket_pesos
WHERE estado = 'CERRADO'
GROUP BY chofer_nombre
ORDER BY total_transportado DESC;

-- ============ Consulta 6: Tickets cerrados en un rango de fechas ============
SELECT 
    numero_ticket,
    DATE(fecha_hora_entrada) AS fecha,
    patente,
    chofer_nombre,
    producto_nombre,
    transporte_nombre,
    peso_bruto,
    peso_tara,
    peso_neto
FROM v_ticket_pesos
WHERE estado = 'CERRADO'
  AND fecha_hora_entrada >= '2024-02-10 00:00:00'
  AND fecha_hora_entrada <= '2024-02-10 23:59:59'
ORDER BY fecha_hora_entrada DESC;

-- ============ Consulta 7: Detalle completo de un ticket ============
SELECT 
    td.numero_ticket,
    td.patente,
    td.tipo_vehiculo,
    td.transporte_nombre,
    td.chofer_nombre,
    td.producto_nombre,
    td.productor_nombre,
    td.peso_bruto,
    td.peso_tara,
    td.peso_neto,
    td.balanza_nombre,
    td.operario_nombre,
    td.nro_remito,
    td.observaciones,
    td.estado,
    td.fecha_hora_entrada,
    td.fecha_hora_salida,
    EXTRACT(EPOCH FROM (td.fecha_hora_salida - td.fecha_hora_entrada))/60 AS minutos_en_balanza
FROM v_ticket_detalle td
WHERE td.numero_ticket = 1;

-- ============ Consulta 8: Análisis de pesadas por ticket ============
SELECT 
    p.ticket_id,
    (SELECT numero_ticket FROM ticket WHERE id = p.ticket_id) AS numero_ticket,
    p.tipo,
    p.cantidad_pesadas,
    p.peso_minimo,
    p.peso_maximo,
    p.peso_promedio,
    p.peso_total,
    p.fecha_primera,
    p.fecha_ultima
FROM v_pesadas_agrupadas p
ORDER BY p.ticket_id DESC;

-- ============ Consulta 9: Vehículos activos con información ============
SELECT 
    v.patente,
    v.tipo_vehiculo,
    t.nombre AS transporte,
    COUNT(tk.id) AS cantidad_viajes_totales,
    SUM(CASE WHEN tk.estado = 'CERRADO' THEN 1 ELSE 0 END) AS viajes_completados
FROM vehiculo v
LEFT JOIN transporte t ON v.transporte_id = t.id
LEFT JOIN ticket tk ON v.id = tk.vehiculo_id
WHERE v.activo = TRUE
GROUP BY v.id, t.id
ORDER BY cantidad_viajes_totales DESC;

-- ============ Consulta 10: Estadísticas generales del día ============
SELECT 
    DATE(fecha_hora_entrada) AS fecha,
    COUNT(*) AS total_tickets,
    SUM(CASE WHEN estado = 'CERRADO' THEN 1 ELSE 0 END) AS cerrados,
    SUM(CASE WHEN estado = 'ABIERTO' THEN 1 ELSE 0 END) AS abiertos,
    COALESCE(SUM(peso_neto), 0) AS total_neto_kilos,
    ROUND(COALESCE(SUM(peso_neto), 0) / 1000, 2) AS total_neto_toneladas,
    COUNT(DISTINCT chofer_nombre) AS choferes_activos,
    COUNT(DISTINCT transporte_nombre) AS transportes_activos
FROM v_ticket_pesos
WHERE DATE(fecha_hora_entrada) >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(fecha_hora_entrada)
ORDER BY fecha DESC;


/* =============================
   5. EJEMPLOS DE ACTUALIZACIÓN
   ============================= */

-- Actualizar observaciones de un ticket
UPDATE ticket 
SET observaciones = 'Retraso en llegada, pero carga verificada',
    updated_at = CURRENT_TIMESTAMP
WHERE numero_ticket = 2;

-- Desactivar un vehículo (soft delete)
UPDATE vehiculo 
SET activo = FALSE,
    updated_at = CURRENT_TIMESTAMP
WHERE patente = 'ABC-123';

-- Cambiar chofer a inactivo
UPDATE chofer 
SET activo = FALSE,
    updated_at = CURRENT_TIMESTAMP
WHERE codigo = 'CHO-005';

-- Cambiar productor a inactivo
UPDATE productor 
SET activo = FALSE,
    updated_at = CURRENT_TIMESTAMP
WHERE codigo = 'PROD-004';


/* =============================
   6. VERIFICACIONES DE INTEGRIDAD
   ============================= */

-- Verificar que todos los tickets CERRADOS tengan BRUTO y TARA
SELECT 
    t.id,
    t.numero_ticket,
    COUNT(CASE WHEN p.tipo = 'BRUTO' THEN 1 END) AS brutos,
    COUNT(CASE WHEN p.tipo = 'TARA' THEN 1 END) AS taras
FROM ticket t
LEFT JOIN pesada p ON t.id = p.ticket_id
WHERE t.estado = 'CERRADO'
GROUP BY t.id
HAVING COUNT(CASE WHEN p.tipo = 'BRUTO' THEN 1 END) = 0 
    OR COUNT(CASE WHEN p.tipo = 'TARA' THEN 1 END) = 0;

-- Si devuelve resultados, hay tickets inválidos

-- Ver tickets con más de 2 pesadas del mismo tipo (anormal)
SELECT 
    t.id,
    t.numero_ticket,
    p.tipo,
    COUNT(*) AS cantidad
FROM ticket t
JOIN pesada p ON t.id = p.ticket_id
GROUP BY t.id, p.tipo
HAVING COUNT(*) > 2
ORDER BY cantidad DESC;

-- ============ Verificar referencias ============

-- Asegurar que no hay vehículos huérfanos
SELECT v.id, v.patente FROM vehiculo v
WHERE v.transporte_id IS NOT NULL 
  AND v.transporte_id NOT IN (SELECT id FROM transporte);

-- Listar todos los usuarios y sus balanzas asignadas
SELECT 
    u.nombre_completo,
    u.rol,
    b.nombre,
    b.codigo
FROM usuario u
LEFT JOIN usuario_balanza ub ON u.id = ub.usuario_id
LEFT JOIN balanza b ON ub.balanza_id = b.id
ORDER BY u.nombre_completo;

/* ============================================================
   FIN DE EJEMPLOS
   Nota: Ejecutar primero los datos iniciales, luego las consultas
   ============================================================ */
