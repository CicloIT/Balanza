import pool from '../config/database.js';

export const getBalanzas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.id, b.codigo, b.nombre, b.direccion, b.activa, b.created_at,
             l.id as localidad_id, l.nombre as localidad_nombre,
             p.id as provincia_id, p.nombre as provincia_nombre
      FROM balanza b
      LEFT JOIN localidad l ON b.localidad_id = l.id
      LEFT JOIN provincia p ON l.provincia_id = p.id
      WHERE b.activa = true
      ORDER BY b.nombre ASC
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

export const getBalanzaById = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, l.nombre as localidad_nombre, p.nombre as provincia_nombre
      FROM balanza b
      LEFT JOIN localidad l ON b.localidad_id = l.id
      LEFT JOIN provincia p ON l.provincia_id = p.id
      WHERE b.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Balanza no encontrada' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createBalanza = async (req, res) => {
  try {
    const { codigo, nombre, direccion, localidad_id } = req.body;
    if (!codigo || !nombre || !localidad_id) {
      return res.status(400).json({ success: false, error: 'Código, nombre y localidad son requeridos' });
    }
    const result = await pool.query(
      'INSERT INTO balanza (codigo, nombre, direccion, localidad_id, activa) VALUES ($1, $2, $3, $4, true) RETURNING *',
      [codigo, nombre, direccion || null, localidad_id]
    );
    res.status(201).json({ success: true, message: 'Balanza creada', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateBalanza = async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, nombre, direccion, localidad_id, activa } = req.body;
    const result = await pool.query(
      `UPDATE balanza SET codigo = COALESCE($1, codigo), nombre = COALESCE($2, nombre), 
       direccion = COALESCE($3, direccion), localidad_id = COALESCE($4, localidad_id),
       activa = COALESCE($5, activa), updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *`,
      [codigo, nombre, direccion, localidad_id, activa, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Balanza no encontrada' });
    }
    res.json({ success: true, message: 'Balanza actualizada', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteBalanza = async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE balanza SET activa = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Balanza no encontrada' });
    }
    res.json({ success: true, message: 'Balanza eliminada', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
