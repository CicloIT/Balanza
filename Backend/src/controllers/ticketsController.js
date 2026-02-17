import pool from '../config/database.js';

export const getTickets = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT tp.* FROM v_ticket_pesos tp
      ORDER BY tp.numero_ticket DESC
      LIMIT 100
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

export const getTicketById = async (req, res) => {
  try {
    const result = await pool.query('SELECT td.* FROM v_ticket_detalle td WHERE td.id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Ticket no encontrado' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getTicketsByEstado = async (req, res) => {
  try {
    const { estado } = req.params;
    const result = await pool.query(`
      SELECT tp.* FROM v_ticket_pesos tp
      WHERE tp.estado = $1
      ORDER BY tp.fecha_hora_entrada DESC
    `, [estado]);
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createTicket = async (req, res) => {
  try {
    const {
      balanza_id,
      chofer_id,
      productor_id,
      transporte_id,
      producto_id,
      vehiculo_id,
      operario_id,
      nro_remito,
      observaciones,
    } = req.body;

    // Validaciones
    if (!balanza_id || !chofer_id || !productor_id || !transporte_id || !producto_id || !vehiculo_id || !operario_id) {
      return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
    }

    const result = await pool.query(
      `INSERT INTO ticket (
        balanza_id, chofer_id, productor_id, transporte_id, producto_id, vehiculo_id, operario_id,
        nro_remito, observaciones, estado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ABIERTO')
      RETURNING *`,
      [balanza_id, chofer_id, productor_id, transporte_id, producto_id, vehiculo_id, operario_id, nro_remito || null, observaciones || null]
    );

    res.status(201).json({
      success: true,
      message: 'Ticket creado exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, observaciones, nro_remito } = req.body;

    const result = await pool.query(
      `UPDATE ticket SET 
       estado = COALESCE($1, estado),
       observaciones = COALESCE($2, observaciones),
       nro_remito = COALESCE($3, nro_remito),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [estado, observaciones, nro_remito, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Ticket no encontrado' });
    }

    res.json({
      success: true,
      message: 'Ticket actualizado exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const closeTicket = async (req, res) => {
  try {
    const { id } = req.params;

    // Actualizar estado a CERRADO
    const result = await pool.query(
      `UPDATE ticket SET 
       estado = 'CERRADO',
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Ticket no encontrado' });
    }

    res.json({
      success: true,
      message: 'Ticket cerrado exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getTicketsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'startDate y endDate son requeridos' });
    }

    const result = await pool.query(`
      SELECT tp.* FROM v_ticket_pesos tp
      WHERE tp.fecha_hora_entrada >= $1::DATE
        AND tp.fecha_hora_entrada < $2::DATE + INTERVAL '1 day'
      ORDER BY tp.fecha_hora_entrada DESC
    `, [startDate, endDate]);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
