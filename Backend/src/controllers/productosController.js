import pool from '../config/database.js';

export const getProductos = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, codigo, nombre, descripcion, activo, created_at
      FROM producto
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

export const getProductoById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM producto WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createProducto = async (req, res) => {
  try {
    const { codigo, nombre, descripcion } = req.body;
    if (!nombre) {
      return res.status(400).json({ success: false, error: 'El nombre es requerido' });
    }
    const result = await pool.query(
      'INSERT INTO producto (codigo, nombre, descripcion, activo) VALUES ($1, $2, $3, true) RETURNING *',
      [codigo || null, nombre, descripcion || null]
    );
    res.status(201).json({ success: true, message: 'Producto creado', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, nombre, descripcion, activo } = req.body;
    const result = await pool.query(
      `UPDATE producto SET codigo = COALESCE($1, codigo), nombre = COALESCE($2, nombre), 
       descripcion = COALESCE($3, descripcion), activo = COALESCE($4, activo), updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING *`,
      [codigo, nombre, descripcion, activo, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }
    res.json({ success: true, message: 'Producto actualizado', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteProducto = async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE producto SET activo = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }
    res.json({ success: true, message: 'Producto eliminado', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
