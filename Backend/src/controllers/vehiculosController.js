import pool from '../config/database.js';

export const getVehiculos = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.id, v.patente, v.tipo_vehiculo, v.activo, v.observaciones, v.created_at,
             t.id as transporte_id, t.nombre as transporte_nombre
      FROM vehiculo v
      LEFT JOIN transporte t ON v.transporte_id = t.id
      WHERE v.activo = true
      ORDER BY v.patente ASC
    `);
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getVehiculoById = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, t.nombre as transporte_nombre
      FROM vehiculo v
      LEFT JOIN transporte t ON v.transporte_id = t.id
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
    const { patente, tipo_vehiculo, transporte_id, observaciones } = req.body;
    if (!patente || !tipo_vehiculo) {
      return res.status(400).json({ success: false, error: 'Patente y tipo_vehiculo son requeridos' });
    }
    const result = await pool.query(
      'INSERT INTO vehiculo (patente, tipo_vehiculo, transporte_id, observaciones, activo) VALUES ($1, $2, $3, $4, true) RETURNING *',
      [patente, tipo_vehiculo, transporte_id || null, observaciones || null]
    );
    res.status(201).json({ success: true, message: 'Vehículo creado', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateVehiculo = async (req, res) => {
  try {
    const { id } = req.params;
    const { patente, tipo_vehiculo, transporte_id, observaciones, activo } = req.body;
    const result = await pool.query(
      `UPDATE vehiculo SET patente = COALESCE($1, patente), tipo_vehiculo = COALESCE($2, tipo_vehiculo), 
       transporte_id = COALESCE($3, transporte_id), observaciones = COALESCE($4, observaciones),
       activo = COALESCE($5, activo), updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *`,
      [patente, tipo_vehiculo, transporte_id, observaciones, activo, id]
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
