import pool from '../config/database.js';

// Obtener todos los choferes
export const getChoferes = async (req, res) => {
  try {
    const query = `
      SELECT id, codigo, apellido_nombre, tipo_documento, nro_documento,cuit,nacionalidad, activo, created_at
      FROM chofer
      WHERE activo = true
      ORDER BY apellido_nombre ASC
    `;
    const result = await pool.query(query);
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Obtener un chofer por ID
export const getChoferById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = 'SELECT * FROM chofer WHERE id = $1';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Chofer no encontrado',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Crear un nuevo chofer
export const createChofer = async (req, res) => {
  try {
    const { codigo, apellido_nombre, tipo_documento, nro_documento, cuit, nacionalidad } = req.body;

    // Validación básica
    if (!apellido_nombre) {
      return res.status(400).json({
        success: false,
        error: 'El nombre del chofer es requerido',
      });
    }

    const query = `
      INSERT INTO chofer (codigo, apellido_nombre, tipo_documento, nro_documento, cuit, nacionalidad, activo)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING *
    `;
    const values = [codigo || null, apellido_nombre, tipo_documento || null, nro_documento || null, cuit || null, nacionalidad || null];
    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: 'Chofer creado exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Actualizar un chofer
export const updateChofer = async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, apellido_nombre, tipo_documento, nro_documento, cuit, nacionalidad, activo } = req.body;

    const query = `
      UPDATE chofer
      SET codigo = COALESCE($1, codigo),
          apellido_nombre = COALESCE($2, apellido_nombre),
          tipo_documento = COALESCE($3, tipo_documento),
          nro_documento = COALESCE($4, nro_documento),
          cuit = COALESCE($5, cuit),
          nacionalidad = COALESCE($6, nacionalidad),
          activo = COALESCE($7, activo),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `;
    const values = [codigo, apellido_nombre, tipo_documento, nro_documento, cuit, nacionalidad, activo, id];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Chofer no encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Chofer actualizado exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Eliminar (desactivar) un chofer
export const deleteChofer = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      UPDATE chofer
      SET activo = false,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Chofer no encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Chofer eliminado exitosamente (soft delete)',
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
