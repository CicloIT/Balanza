import pool from '../config/database.js';

export const getVehiculos = async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit  ?? 50, 10), 100);
    const page   = Math.max(parseInt(req.query.page   ?? 1,  10), 1);
    const offset = (page - 1) * limit;

    // Total de vehículos activos
    const countResult = await pool.query('SELECT COUNT(*) FROM vehiculo WHERE activo = true');
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await pool.query(`
      SELECT v.id, v.patente, v.patente_acoplado, v.tipo_vehiculo, v.activo, v.observaciones, v.created_at
      FROM vehiculo v
      WHERE v.activo = true
      ORDER BY v.patente ASC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const hasMore = (result.rows.length === limit) && (offset + result.rows.length < total);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      total,
      page,
      limit,
      hasMore
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getVehiculoById = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*
      FROM vehiculo v
      WHERE v.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Vehículo no encontrado' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createVehiculo = async (req, res) => {
  try {
    const { patente, patente_acoplado, tipo_vehiculo, observaciones } = req.body;
    if (!patente || !tipo_vehiculo) {
      return res.status(400).json({ success: false, error: 'Patente y tipo_vehiculo son requeridos' });
    }
    const result = await pool.query(
      'INSERT INTO vehiculo (patente, patente_acoplado, tipo_vehiculo, observaciones, activo) VALUES ($1, $2, $3, $4, true) RETURNING *',
      [patente, patente_acoplado || null, tipo_vehiculo, observaciones || null]
    );
    res.status(201).json({ success: true, message: 'Vehículo creado', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateVehiculo = async (req, res) => {
  try {
    const { id } = req.params;
    const { patente, patente_acoplado, tipo_vehiculo, observaciones, activo } = req.body;
    const result = await pool.query(
      `UPDATE vehiculo SET patente = COALESCE($1, patente), patente_acoplado = COALESCE($2, patente_acoplado), 
       tipo_vehiculo = COALESCE($3, tipo_vehiculo), observaciones = COALESCE($4, observaciones),
       activo = COALESCE($5, activo), updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *`,
      [patente, patente_acoplado, tipo_vehiculo, observaciones, activo, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Vehículo no encontrado' });
    }
    res.json({ success: true, message: 'Vehículo actualizado', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteVehiculo = async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE vehiculo SET activo = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Vehículo no encontrado' });
    }
    res.json({ success: true, message: 'Vehículo eliminado', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getVehiculosParaSelect = async (req, res) => {
  try {
    console.log("--- Intentando cargar lista para select ---");
    
    const result = await pool.query(`
      SELECT id, patente 
      FROM vehiculo 
      WHERE activo = true 
      ORDER BY patente ASC
    `);

    console.log("Datos obtenidos de la DB:", result.rows.length, "registros");
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    // ESTE LOG ES EL MÁS IMPORTANTE
    console.error('ERROR CRÍTICO EN getVehiculosParaSelect:', error);
    
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack // Esto te dirá la línea exacta del error
    });
  }
};