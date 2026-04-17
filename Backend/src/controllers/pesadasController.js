import pool from '../config/database.js';
import { hasPermission, PERMISSIONS } from '../config/rolesConfig.js';

export const getPesadas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        op.vehiculo_patente,
        op.abierta as operacion_abierta,
        c.apellido_nombre  AS chofer,
        prod.nombre        AS producto,
        ptr.nombre         AS productor,
        tr.nombre          AS transporte
      FROM pesada p
      JOIN operacion_pesaje op ON p.operacion_id = op.id
      LEFT JOIN chofer    c   ON p.chofer_id    = c.id
      LEFT JOIN producto  prod ON p.producto_id  = prod.id
      LEFT JOIN productor ptr  ON p.productor_id = ptr.id
      LEFT JOIN transporte tr  ON p.transporte_id = tr.id
      ORDER BY p.fecha_hora DESC
      LIMIT 200
    `);
    res.json({ success: true, data: result.rows, count: result.rows.length });
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
      transporte_id, producto_id, balancero, nro_remito, es_manual, fotos
    } = req.body;

    // ─── Validaciones ─────────────────────────────────────────
    if (!vehiculo_patente || !tipo || !peso) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos (patente, tipo, peso)'
      });
    }

    if (!['BRUTO', 'TARA'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo debe ser BRUTO o TARA'
      });
    }

    if (peso <= 0) {
      return res.status(400).json({
        success: false,
        error: 'El peso debe ser positivo'
      });
    }

    // ─── Permiso pesada manual ───────────────────────────────
    if (es_manual === 'true' || es_manual === true) {
      const userRol = req.user?.rol;
      if (!hasPermission(userRol, PERMISSIONS.PESAJE_MANUAL)) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          success: false,
          error: 'No tiene permiso para cargar peso manualmente.',
          code: 'MANUAL_WEIGHT_FORBIDDEN',
          requiredPermission: PERMISSIONS.PESAJE_MANUAL,
          currentRole: userRol
        });
      }
    }

    // ─── Buscar o crear operación ────────────────────────────
    let operacionResult = await client.query(
      'SELECT id FROM operacion_pesaje WHERE vehiculo_patente = $1 AND abierta = true',
      [vehiculo_patente]
    );

    let operacion_id;

    if (operacionResult.rows.length === 0) {
      // 👉 Ahora SIEMPRE crea operación (TARA o BRUTO)
      const newOp = await client.query(
        'INSERT INTO operacion_pesaje (vehiculo_patente) VALUES ($1) RETURNING id',
        [vehiculo_patente]
      );
      operacion_id = newOp.rows[0].id;
    } else {
      operacion_id = operacionResult.rows[0].id;
    }

    // ─── Evitar duplicados ───────────────────────────────────
    const pesadaExist = await client.query(
      'SELECT id FROM pesada WHERE operacion_id = $1 AND tipo = $2',
      [operacion_id, tipo]
    );

    if (pesadaExist.rows.length > 0) {
      throw new Error(`Ya existe una pesada de tipo ${tipo} para esta operación`);
    }

    // ─── Insertar pesada ─────────────────────────────────────
    const result = await client.query(
      `INSERT INTO pesada (
        operacion_id, tipo, peso, chofer_id, productor_id, 
        transporte_id, producto_id, vehiculo_patente, balancero, nro_remito, ruta, fotos
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        operacion_id,
        tipo,
        peso,
        chofer_id || null,
        productor_id || null,
        transporte_id || null,
        producto_id || null,
        vehiculo_patente,
        balancero || null,
        nro_remito || null,
        req.file ? `documentos/${req.file.filename}` : null,
        fotos ? (typeof fotos === 'string' ? fotos : JSON.stringify(fotos)) : null
      ]
    );

    // ─── Verificar si ya están BRUTO y TARA ──────────────────
    const pesadas = await client.query(
      'SELECT tipo, peso FROM pesada WHERE operacion_id = $1',
      [operacion_id]
    );

    const tipos = pesadas.rows.map(p => p.tipo);

    let neto = null;

    if (tipos.includes('BRUTO') && tipos.includes('TARA')) {
      const bruto = pesadas.rows.find(p => p.tipo === 'BRUTO')?.peso;
      const tara = pesadas.rows.find(p => p.tipo === 'TARA')?.peso;

      neto = bruto - tara;

      // 👉 cerrar operación
      await client.query(
        'UPDATE operacion_pesaje SET abierta = false WHERE id = $1',
        [operacion_id]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Pesada registrada exitosamente',
      data: result.rows[0],
      neto // 👈 útil para frontend
    });

  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({
      success: false,
      error: error.message
    });
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

    // Si se intenta modificar el peso, verificar permiso de carga manual
    if (peso !== undefined && peso !== null) {
      const userRol = req.user?.rol;
      if (!hasPermission(userRol, PERMISSIONS.PESAJE_MANUAL)) {
        return res.status(403).json({
          success: false,
          error: 'No tiene permiso para modificar el peso manualmente.',
          code: 'MANUAL_WEIGHT_FORBIDDEN',
          requiredPermission: PERMISSIONS.PESAJE_MANUAL,
          currentRole: userRol
        });
      }
    }

    const result = await pool.query(
      `UPDATE pesada SET 
       peso = COALESCE($1, peso),
       balancero = COALESCE($2, balancero),
       ruta = COALESCE($3, ruta)
       WHERE id = $4 RETURNING *`,
      [peso, balancero, req.file ? `documentos/${req.file.filename}` : null, id]
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

export const updatePdfByOperacion = async (req, res) => {
  try {
    const { operacionId } = req.params;
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se envió ningún archivo PDF' });
    }

    const result = await pool.query(
      `UPDATE pesada SET 
       ruta = $1
       WHERE operacion_id = $2 RETURNING *`,
      [`documentos/${req.file.filename}`, operacionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'No se encontraron pesadas para esta operación' });
    }

    res.json({
      success: true,
      message: 'PDF asociado a la operación exitosamente',
      data: result.rows,
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
    const limit  = Math.min(parseInt(req.query.limit  ?? 20, 10), 100); // max 100 por página
    const page   = Math.max(parseInt(req.query.page   ?? 1,  10), 1);
    const offset = (page - 1) * limit;

    // Total de operaciones (para saber si hay más páginas)
    const countResult = await pool.query('SELECT COUNT(*) FROM operacion_pesaje');
    const total = parseInt(countResult.rows[0].count, 10);

    console.log(`[API /pesadas/agrupadas] Req: Page=${page}, Limit=${limit}, Offset=${offset}`);
    
    const result = await pool.query(`
      SELECT op.id as id, op.id as operacion_id, op.vehiculo_patente,
             MAX(CASE WHEN p.tipo::text = 'BRUTO' THEN p.peso END) as bruto,
             MAX(CASE WHEN p.tipo::text = 'TARA'  THEN p.peso END) as tara,
             MAX(p.neto) as neto,
             MIN(p.fecha_hora) as fecha_entrada,
             MAX(p.fecha_hora) as fecha_salida,
             op.abierta,
             MAX(c.apellido_nombre) as chofer,
             MAX(prod.nombre)       as producto,
             MAX(ptr.nombre)        as productor,
             MAX(tr.nombre)         as transporte,
             MAX(p.balancero)       as balancero,
             MAX(p.nro_remito)      as nro_remito,
             MAX(p.ruta)            as ruta,
             jsonb_agg(p.fotos) filter (where p.fotos is not null) as todas_fotos
      FROM operacion_pesaje op
      LEFT JOIN pesada    p    ON op.id = p.operacion_id
      LEFT JOIN chofer    c    ON p.chofer_id    = c.id
      LEFT JOIN producto  prod ON p.producto_id  = prod.id
      LEFT JOIN productor ptr  ON p.productor_id = ptr.id
      LEFT JOIN transporte tr  ON p.transporte_id = tr.id
      GROUP BY op.id, op.vehiculo_patente, op.abierta
      ORDER BY op.id DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    const hasMore = (result.rows.length === limit) && (offset + result.rows.length < total);
    console.log(`[API /pesadas/agrupadas] Result: Rows=${result.rows.length}, Total=${total}, hasMore=${hasMore}`);


    res.json({
      success: true,
      data:    result.rows,
      count:   result.rows.length,
      total,
      page,
      limit,
      hasMore,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPesadaActivaByPatente = async (req, res) => {
  try {
    const { patente } = req.params;
    const result = await pool.query(`
      SELECT 
        p.*,
        c.apellido_nombre  AS chofer_nombre,
        prod.nombre        AS producto_nombre,
        ptr.nombre         AS productor_nombre,
        tr.nombre          AS transporte_nombre
      FROM pesada p
      JOIN operacion_pesaje op ON p.operacion_id = op.id
      LEFT JOIN chofer    c   ON p.chofer_id    = c.id
      LEFT JOIN producto  prod ON p.producto_id  = prod.id
      LEFT JOIN productor ptr  ON p.productor_id = ptr.id
      LEFT JOIN transporte tr  ON p.transporte_id = tr.id
      WHERE op.vehiculo_patente = $1 
      AND op.abierta = true
      ORDER BY p.fecha_hora DESC
      LIMIT 1
    `, [patente]);

    if (result.rows.length === 0) {
      return res.json({ success: true, data: null });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
