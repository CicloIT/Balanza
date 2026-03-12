import pool from '../config/database.js';

export const getPesadas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, op.vehiculo_patente, op.abierta as operacion_abierta
      FROM pesada p
      JOIN operacion_pesaje op ON p.operacion_id = op.id
      ORDER BY p.fecha_hora DESC
      LIMIT 200
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

export const getPesadasByTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const result = await pool.query(`
      SELECT p.*
      FROM pesada p
      WHERE p.operacion_id = (
        SELECT op.id 
        FROM operacion_pesaje op
        JOIN pesada p2 ON op.id = p2.operacion_id
        JOIN ticket t ON p2.id = t.pesada_id
        WHERE t.id = $1
      )
      ORDER BY p.tipo DESC, p.fecha_hora ASC
    `, [ticketId]);
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createPesada = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const {
      vehiculo_patente, tipo, peso, chofer_id, productor_id,
      transporte_id, producto_id, balancero, nro_remito
    } = req.body;

    // Validaciones
    if (!vehiculo_patente || !tipo || !peso) {
      return res.status(400).json({ success: false, error: 'Faltan campos requeridos (patente, tipo, peso)' });
    }

    if (!['BRUTO', 'TARA'].includes(tipo)) {
      return res.status(400).json({ success: false, error: 'Tipo debe ser BRUTO o TARA' });
    }

    if (peso <= 0) {
      return res.status(400).json({ success: false, error: 'El peso debe ser positivo' });
    }

    // Buscar operación abierta
    let operacionResult = await client.query(
      'SELECT id FROM operacion_pesaje WHERE vehiculo_patente = $1 AND abierta = true',
      [vehiculo_patente]
    );

    let operacion_id;

    if (operacionResult.rows.length === 0) {
      if (tipo === 'TARA') {
        throw new Error('No se puede registrar TARA sin una pesada de BRUTO previa abierta');
      }
      // Crear nueva operación
      const newOp = await client.query(
        'INSERT INTO operacion_pesaje (vehiculo_patente) VALUES ($1) RETURNING id',
        [vehiculo_patente]
      );
      operacion_id = newOp.rows[0].id;
    } else {
      operacion_id = operacionResult.rows[0].id;

      // Verificar que no exista ya una pesada del mismo tipo para esta operación
      const pesadaExist = await client.query(
        'SELECT id FROM pesada WHERE operacion_id = $1 AND tipo = $2',
        [operacion_id, tipo]
      );
      if (pesadaExist.rows.length > 0) {
        throw new Error(`Ya existe una pesada de tipo ${tipo} para esta operación`);
      }
    }

    const result = await client.query(
      `INSERT INTO pesada (
        operacion_id, tipo, peso, chofer_id, productor_id, 
        transporte_id, producto_id, vehiculo_patente, balancero, nro_remito
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        operacion_id, tipo, peso,
        chofer_id || null, productor_id || null,
        transporte_id || null, producto_id || null,
        vehiculo_patente, balancero || null,
        nro_remito || null
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Pesada registrada exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
};

export const getPesadaById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pesada WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Pesada no encontrada' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updatePesada = async (req, res) => {
  try {
    const { id } = req.params;
    const { peso, balancero } = req.body;

    if (peso && peso <= 0) {
      return res.status(400).json({ success: false, error: 'El peso debe ser positivo' });
    }

    const result = await pool.query(
      `UPDATE pesada SET 
       peso = COALESCE($1, peso),
       balancero = COALESCE($2, balancero)
       WHERE id = $3 RETURNING *`,
      [peso, balancero, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Pesada no encontrada' });
    }

    res.json({
      success: true,
      message: 'Pesada actualizada exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deletePesada = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener operacion_id antes de borrar
    const pesada = await pool.query('SELECT operacion_id FROM pesada WHERE id = $1', [id]);
    if (pesada.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Pesada no encontrada' });
    }

    const operacionId = pesada.rows[0].operacion_id;

    // Borrar la pesada
    await pool.query('DELETE FROM pesada WHERE id = $1', [id]);

    // Reabrir la operación si se borró una de sus pesadas
    await pool.query(
      "UPDATE operacion_pesaje SET abierta = true WHERE id = $1",
      [operacionId]
    );

    res.json({
      success: true,
      message: 'Pesada eliminada exitosamente',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPesadasAgrupadas = async (req, res) => {
  try {
    // Usamos la vista definida en el SQL si existe, o una consulta manual
    const result = await pool.query(`
      SELECT op.id as operacion_id, op.vehiculo_patente, 
             MAX(CASE WHEN p.tipo = 'BRUTO' THEN p.peso END) as bruto,
             MAX(CASE WHEN p.tipo = 'TARA' THEN p.peso END) as tara,
             MAX(p.neto) as neto,
             MIN(p.fecha_hora) as fecha_entrada,
             MAX(p.fecha_hora) as fecha_salida,
             op.abierta
      FROM operacion_pesaje op
      LEFT JOIN pesada p ON op.id = p.operacion_id
      GROUP BY op.id, op.vehiculo_patente, op.abierta
      ORDER BY op.created_at DESC
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
