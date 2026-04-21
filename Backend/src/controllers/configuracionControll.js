import pool from "../config/database.js";
import { reconectarBalanza } from "../services/balanzaService.js";

export const getConfiguracion = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT tipo_dispositivo, ip, puerto, usuario, contraseña, activo
            FROM configuracion_dispositivos
            WHERE activo = true
        `);

        const config = {};

        result.rows.forEach(row => {
            config[row.tipo_dispositivo] = row;
        });

        res.json({
            success: true,
            data: config
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const updateConfiguracion = async (req, res) => {
    const { tipo } = req.params;
    const { ip, puerto, usuario, contraseña, activo } = req.body;

    try {
        const result = await pool.query(`
            UPDATE configuracion_dispositivos
            SET 
                ip = COALESCE($1, ip),
                puerto = COALESCE($2, puerto),
                usuario = COALESCE($3, usuario),
                contraseña = COALESCE($4, contraseña),
                activo = COALESCE($5, activo),
                fecha_actualizacion = NOW()
            WHERE tipo_dispositivo = $6
            RETURNING *
        `, [ip, puerto, usuario, contraseña, activo, tipo.toLowerCase()]);

        if (!result.rows.length) {
            return res.status(404).json({
                success: false,
                message: "Configuración no encontrada"
            });
        }

        // Si se actualizó la balanza, reconectar el socket TCP con la nueva config
        if (tipo.toLowerCase() === 'balanza') {
            reconectarBalanza().catch(err =>
                console.error('❌ Error al reconectar balanza:', err.message)
            );
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};