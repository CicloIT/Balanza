import pool from '../config/database.js';

export const getUsuarios = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, username, nombre_completo, email, rol, activo, created_at
      FROM usuario
      WHERE activo = true
      ORDER BY nombre_completo ASC
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

export const getUsuarioById = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, username, nombre_completo, email, rol, activo, created_at
      FROM usuario
      WHERE id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createUsuario = async (req, res) => {
  try {
    const { username, password_hash, nombre_completo, email, rol } = req.body;
    if (!username || !password_hash || !nombre_completo) {
      return res.status(400).json({ success: false, error: 'Username, password y nombre son requeridos' });
    }
    const result = await pool.query(
      'INSERT INTO usuario (username, password_hash, nombre_completo, email, rol, activo) VALUES ($1, $2, $3, $4, $5, true) RETURNING id, username, nombre_completo, email, rol',
      [username, password_hash, nombre_completo, email || null, rol || 'empleado']
    );
    res.status(201).json({ success: true, message: 'Usuario creado', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_completo, email, rol, activo } = req.body;
    const result = await pool.query(
      `UPDATE usuario SET nombre_completo = COALESCE($1, nombre_completo), 
       email = COALESCE($2, email), rol = COALESCE($3, rol),
       activo = COALESCE($4, activo), updated_at = CURRENT_TIMESTAMP 
       WHERE id = $5 
       RETURNING id, username, nombre_completo, email, rol, activo`,
      [nombre_completo, email, rol, activo, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    res.json({ success: true, message: 'Usuario actualizado', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteUsuario = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE usuario SET activo = false, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING id, username, nombre_completo, email, rol`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    res.json({ success: true, message: 'Usuario eliminado', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
