import pool from '../config/database.js';

export const getPesadas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.ticket_id, p.tipo, p.peso, p.fecha_hora, p.operario_id, p.observaciones, p.created_at
      FROM pesada p
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
      SELECT p.id, p.ticket_id, p.tipo, p.peso, p.fecha_hora, p.operario_id, p.observaciones, p.created_at
      FROM pesada p
      WHERE p.ticket_id = $1
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
  try {
    const { ticket_id, tipo, peso, operario_id, observaciones } = req.body;

    // Validaciones
    if (!ticket_id || !tipo || !peso || !operario_id) {
      return res.status(400).json({ success: false, error: 'Campos requeridos: ticket_id, tipo, peso, operario_id' });
    }

    if (!['BRUTO', 'TARA'].includes(tipo)) {
      return res.status(400).json({ success: false, error: 'Tipo debe ser BRUTO o TARA' });
    }

    if (peso <= 0) {
      return res.status(400).json({ success: false, error: 'El peso debe ser positivo' });
    }

    // Verificar que el ticket existe
    const ticketCheck = await pool.query('SELECT id FROM ticket WHERE id = $1', [ticket_id]);
    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Ticket no encontrado' });
    }

    const result = await pool.query(
      `INSERT INTO pesada (ticket_id, tipo, peso, operario_id, observaciones)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [ticket_id, tipo, peso, operario_id, observaciones || null]
    );

    res.status(201).json({
      success: true,
      message: 'Pesada registrada exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
    const { peso, observaciones } = req.body;

    if (peso && peso <= 0) {
      return res.status(400).json({ success: false, error: 'El peso debe ser positivo' });
    }

    const result = await pool.query(
      `UPDATE pesada SET 
       peso = COALESCE($1, peso),
       observaciones = COALESCE($2, observaciones)
       WHERE id = $3 RETURNING *`,
      [peso, observaciones, id]
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
    
    // Obtener ticket_id antes de borrar
    const pesada = await pool.query('SELECT ticket_id FROM pesada WHERE id = $1', [id]);
    if (pesada.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Pesada no encontrada' });
    }

    // Borrar la pesada
    await pool.query('DELETE FROM pesada WHERE id = $1', [id]);

    // Si el ticket estaba cerrado, volver a abrir
    const ticketId = pesada.rows[0].ticket_id;
    await pool.query(
      "UPDATE ticket SET estado = 'ABIERTO' WHERE id = $1 AND estado = 'CERRADO'",
      [ticketId]
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
    const result = await pool.query('SELECT * FROM v_pesadas_agrupadas ORDER BY ticket_id DESC');
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
