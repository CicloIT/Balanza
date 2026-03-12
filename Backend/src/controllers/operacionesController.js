import pool from '../config/database.js';

export const getOperaciones = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM operacion_pesaje ORDER BY created_at DESC');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getOperacionAbiertaByPatente = async (req, res) => {
    try {
        const { patente } = req.params;
        const result = await pool.query(
            'SELECT * FROM operacion_pesaje WHERE vehiculo_patente = $1 AND abierta = true',
            [patente]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'No hay operación abierta para esta patente' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const closeOperacion = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'UPDATE operacion_pesaje SET abierta = false WHERE id = $1 RETURNING *',
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Operación no encontrada' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
