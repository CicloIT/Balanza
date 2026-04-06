import net from 'net';
import pool from '../config/database.js';

// ─── Estado interno ───────────────────────────────────────────────────────────
let scaleBuffer = Buffer.alloc(0);
let lastWeight = null;
let isScaleConnected = false;
let client = null;
let reconnectTimer = null;
let broadcastFn = null;   // inyectado desde server.js
let currentIp = null;
let currentPort = null;
let destroying = false;   // para no reintentar si destruimos a propósito

// ─── Obtener config desde la BD ──────────────────────────────────────────────
const obtenerConfigBalanza = async () => {
    const result = await pool.query(`
        SELECT ip, puerto
        FROM configuracion_dispositivos
        WHERE tipo_dispositivo = 'balanza' AND activo = true
        LIMIT 1
    `);
    if (!result.rows.length) throw new Error('No hay configuración de balanza en la base de datos');
    const { ip, puerto } = result.rows[0];
    if (!ip || !puerto) throw new Error('La configuración de balanza no tiene IP o puerto definidos');
    return { ip, puerto: parseInt(puerto) };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const broadcast = (msg) => {
    if (broadcastFn) broadcastFn(msg);
};

const cancelReconnect = () => {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
};

// ─── Crear y conectar socket ──────────────────────────────────────────────────
const crearSocket = () => {
    const socket = new net.Socket();

    socket.on('connect', () => {
        console.log(`✅ Balanza conectada en ${currentIp}:${currentPort}`);
        isScaleConnected = true;
        broadcast({ type: 'STATUS', status: 'CONNECTED' });
    });

    socket.on('data', (data) => {
        scaleBuffer = Buffer.concat([scaleBuffer, data]);
        let idx;
        while ((idx = scaleBuffer.indexOf('\r\n')) !== -1) {
            const frame = scaleBuffer.slice(0, idx + 2);
            scaleBuffer = scaleBuffer.slice(idx + 2);
            const clean = frame.toString('ascii').replace(/[\x02\x03]/g, '').trim();
            const m = clean.match(/\d+/);
            if (m) {
                const weight = parseInt(m[0]);
                if (weight !== lastWeight) {
                    lastWeight = weight;
                    console.log('⚖️  Peso actualizado:', weight);
                    broadcast({ type: 'WEIGHT', weight, ts: Date.now() });
                }
            }
        }
    });

    socket.on('error', (err) => {
        console.error('❌ Error en la conexión con la balanza:', err.message);
        isScaleConnected = false;
        broadcast({ type: 'STATUS', status: 'DISCONNECTED', error: err.message });
    });

    socket.on('close', () => {
        isScaleConnected = false;
        broadcast({ type: 'STATUS', status: 'DISCONNECTED' });
        if (!destroying) {
            console.log(`⚠️  Conexión con la balanza cerrada. Reintentando en 5 s...`);
            cancelReconnect();
            reconnectTimer = setTimeout(() => conectar(), 5000);
        }
    });

    return socket;
};

// ─── Conectar ─────────────────────────────────────────────────────────────────
const conectar = async () => {
    try {
        const { ip, puerto } = await obtenerConfigBalanza();
        currentIp = ip;
        currentPort = puerto;

        // Destruir socket previo si existe
        if (client) {
            destroying = true;
            client.destroy();
            client = null;
            destroying = false;
        }
        cancelReconnect();

        client = crearSocket();
        console.log(`📡 Intentando conectar a la balanza en ${ip}:${puerto}...`);
        client.connect(puerto, ip);
    } catch (err) {
        console.error('❌ No se pudo obtener la config de la balanza:', err.message);
        // Reintentar en 10 s si falla la consulta a BD
        cancelReconnect();
        reconnectTimer = setTimeout(() => conectar(), 10000);
    }
};

// ─── Reconectar (llamado cuando se actualiza la config) ───────────────────────
export const reconectarBalanza = async () => {
    console.log('🔄 Reconectando balanza con nueva configuración...');
    destroying = true;
    if (client) {
        client.destroy();
        client = null;
    }
    destroying = false;
    cancelReconnect();
    scaleBuffer = Buffer.alloc(0);
    lastWeight = null;
    await conectar();
};

// ─── Getters de estado (para el health endpoint) ──────────────────────────────
export const getEstadoBalanza = () => ({
    connected: isScaleConnected,
    lastWeight,
    config: { ip: currentIp, port: currentPort }
});

// ─── Inicializar el servicio ──────────────────────────────────────────────────
export const inicializarBalanza = (broadcastCallback) => {
    broadcastFn = broadcastCallback;
    conectar();
};
