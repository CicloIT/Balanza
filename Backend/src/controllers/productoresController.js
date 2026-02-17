import pool from '../config/database.js';

export const getProductores = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, codigo, nombre, cuit, activo, created_at
      FROM productor
      WHERE activo = true
      ORDER BY nombre ASC
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

export const getProductorById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM productor WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Productor no encontrado' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createProductor = async (req, res) => {
  try {
    const { codigo, nombre, cuit } = req.body;
    if (!nombre) {
      return res.status(400).json({ success: false, error: 'El nombre es requerido' });
    }
    const result = await pool.query(
      'INSERT INTO productor (codigo, nombre, cuit, activo) VALUES ($1, $2, $3, true) RETURNING *',
      [codigo || null, nombre, cuit || null]
    );
    res.status(201).json({ success: true, message: 'Productor creado', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateProductor = async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, nombre, cuit, activo } = req.body;
    const result = await pool.query(
      `UPDATE productor SET codigo = COALESCE($1, codigo), nombre = COALESCE($2, nombre), 
       cuit = COALESCE($3, cuit), activo = COALESCE($4, activo), updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING *`,
      [codigo, nombre, cuit, activo, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Productor no encontrado' });
    }
    res.json({ success: true, message: 'Productor actualizado', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteProductor = async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE productor SET activo = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Productor no encontrado' });
    }
    res.json({ success: true, message: 'Productor eliminado', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
