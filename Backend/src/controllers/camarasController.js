import DigestFetch from "digest-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ajustar __dirname porque estamos en src/controllers
const CAPTURAS_DIR = path.join(__dirname, "../../capturas");

if (!fs.existsSync(CAPTURAS_DIR)) {
    fs.mkdirSync(CAPTURAS_DIR, { recursive: true });
}

// ─── Canales fijos para cada marca ────────────────────────────────────────────
const CANALES_HIKVISION = [400, 500, 1800];
const MAX_CANALES_DAHUA = 8;

// ─── Construir URL de snapshot según marca ────────────────────────────────────
const buildSnapshotUrl = (ip, marca, canal) => {
    if (marca === "hikvision") {
        return `http://${ip}/ISAPI/Streaming/channels/${canal}/picture`;
    }
    // Dahua (default)
    return `https://${ip}/cgi-bin/snapshot.cgi?channel=${canal}`;
};

// ─── Obtener configuración de la grabadora desde la BD ────────────────────────
const obtenerConfigGrabadora = async () => {
    try {
        const query = `
        SELECT ip, usuario, contraseña AS password, marca
        FROM  configuracion_dispositivos
        WHERE tipo_dispositivo = 'grabadora'       
        `;
        const result = await pool.query(query);
        if (!result.rows || result.rows.length === 0) {
            throw new Error("No hay configuración de grabadora");
        }
        return result.rows[0];
    } catch (error) {
        console.error("Error al obtener configuración de la grabadora:", error);
        throw error;
    }
};

const crearClienteNVR = async () => {
    const { ip, usuario, password, marca } = await obtenerConfigGrabadora();
    const client = new DigestFetch(usuario, password);
    return { client, ip, marca: marca || 'dahua' };
};

// ─── Cache de canales separada por marca ──────────────────────────────────────
const cacheCanales = { dahua: null, hikvision: null };
const ultimaDeteccion = { dahua: 0, hikvision: 0 };
const CACHE_DURATION = 1000 * 60 * 1; // 1 minuto

const detectarCanalesActivos = async (client, ip, marca = "dahua") => {
    // Hikvision: canales fijos, sin auto-detección
    if (marca === "hikvision") {
        console.log(`📷 Hikvision: usando canales fijos ${CANALES_HIKVISION.join(", ")}`);
        return CANALES_HIKVISION;
    }

    // Dahua: auto-detección con cache
    const ahora = Date.now();
    if (cacheCanales.dahua && (ahora - ultimaDeteccion.dahua < CACHE_DURATION)) {
        return cacheCanales.dahua;
    }

    console.log("🔍 Detectando canales activos en NVR Dahua...");

    const probarCanal = async (ch) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        try {
            const url = buildSnapshotUrl(ip, "dahua", ch);
            const response = await client.fetch(url, { signal: controller.signal });
            clearTimeout(timeout);

            if (response.ok) {
                const buffer = await response.arrayBuffer();
                if (buffer.byteLength > 1000) return ch;
            }
        } catch (e) {
            // ignorar errores de timeout/conexión
        }
        return null;
    };

    const resultados = await Promise.all(
        Array.from({ length: MAX_CANALES_DAHUA }, (_, i) => probarCanal(i + 1))
    );

    const activos = resultados.filter(Boolean);
    const finalActivos = activos.length > 0 ? activos : [1];

    cacheCanales.dahua = finalActivos;
    ultimaDeteccion.dahua = ahora;

    console.log(`✅ Canales Dahua detectados: ${finalActivos.join(", ")}`);
    return finalActivos;
};

// ─── Endpoints ────────────────────────────────────────────────────────────────

export const getConfig = async (req, res) => {
    try {
        const { client, ip, marca } = await crearClienteNVR();
        const canales = await detectarCanalesActivos(client, ip, marca.toLowerCase());
        res.json({ success: true, canales, marca });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

export const capturarTodo = async (req, res) => {
    const patente = (req.query.patente || "SIN_PATENTE").toUpperCase().trim();

    const patenteDir = path.join(CAPTURAS_DIR, patente);
    if (!fs.existsSync(patenteDir)) {
        fs.mkdirSync(patenteDir, { recursive: true });
    }

    const { client, ip, marca: dbMarca } = await crearClienteNVR();
    const marca = dbMarca.toLowerCase();

    console.log(`📸 Iniciando captura para Patente: ${patente} | Grabadora: ${marca.toUpperCase()}...`);

    const canales = await detectarCanalesActivos(client, ip, marca);
    const archivos = [];
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];

    try {
        for (const ch of canales) {
            console.log(`🔍 Intentando capturar Canal ${ch} para ${patente} [${marca.toUpperCase()}]...`);

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);

            try {
                const url = buildSnapshotUrl(ip, marca, ch);
                const response = await client.fetch(url, { signal: controller.signal });
                clearTimeout(timeout);

                if (!response.ok) {
                    throw new Error(`Grabadora respondió con status ${response.status}`);
                }

                const buffer = Buffer.from(await response.arrayBuffer());

                if (buffer.length < 5000) {
                    throw new Error(`La imagen del canal ${ch} parece estar dañada o vacía (${buffer.length} bytes)`);
                }

                const fileName = `${patente}_cam${ch}_${timestamp}.jpg`;
                fs.writeFileSync(path.join(patenteDir, fileName), buffer);

                archivos.push({ canal: ch, ruta: `${patente}/${fileName}` });
                console.log(`✅ Canal ${ch} capturado exitosamente: ${fileName}`);
            } catch (error) {
                clearTimeout(timeout);
                console.error(`❌ Error en Canal ${ch}:`, error.message);
            }
        }

        if (archivos.length === 0) {
            return res.status(500).json({
                status: "error",
                message: "No se pudo capturar ninguna imagen de las cámaras."
            });
        }

        res.json({ status: "ok", archivos, marca });

    } catch (error) {
        console.error("ERROR CRÍTICO NVR:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};

export const limpiarCache = (req, res) => {
    const marca = (req.query.marca || "all").toLowerCase();

    if (marca === "dahua" || marca === "all") {
        cacheCanales.dahua = null;
        ultimaDeteccion.dahua = 0;
    }
    if (marca === "hikvision" || marca === "all") {
        cacheCanales.hikvision = null;
        ultimaDeteccion.hikvision = 0;
    }

    res.json({ success: true, message: `Cache limpiado (${marca})` });
};
