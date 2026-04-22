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

const obtenerConfigGrabadora = async () => {
    try {
        const query = `
        SELECT ip,usuario,contraseña AS password
        FROM  configuracion_dispositivos
        WHERE tipo_dispositivo = 'grabadora'       
        `
        const result = await pool.query(query);
        if (!result.rows || result.rows.length === 0) {
            throw new Error("No hay configuración de grabadora");
        }
        return result.rows[0];
    } catch (error) {
        console.error("Error al obtener configuración de la grabadora:", error);
        throw error;
    }
}

const crearClienteNVR = async () => {
    const { ip, usuario, password } = await obtenerConfigGrabadora();
    const client = new DigestFetch(usuario, password);
    return {
        client,
        ip
    }
}

/*
const clientNVR = new DigestFetch("admin", "Camaras24.LC");
const NVR_IP = "192.168.52.66";
*/
// Cache de canales para no sobrecargar el NVR
let cacheCanales = null;
let ultimaDeteccion = 0;
const CACHE_DURATION = 1000 * 60 * 1; // 1 minuto (temporal para testeo rápido)

const detectarCanalesActivos = async (client, ip) => {
    const ahora = Date.now();
    if (cacheCanales && (ahora - ultimaDeteccion < CACHE_DURATION)) {
        return cacheCanales;
    }

    console.log("🔍 Detectando canales activos en NVR...");
    const maxCanales = 8;

    const probarCanal = async (ch) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        try {
            const response = await client.fetch(
                `https://${ip}/cgi-bin/snapshot.cgi?channel=${ch}`,
                { signal: controller.signal }
            );

            clearTimeout(timeout);

            if (response.ok) {
                const buffer = await response.arrayBuffer();
                if (buffer.byteLength > 1000) {
                    return ch;
                }
            }
        } catch (e) {
            // ignorar errores
        }

        return null;
    };

    const resultados = await Promise.all(
        Array.from({ length: maxCanales }, (_, i) => probarCanal(i + 1))
    );

    const activos = resultados.filter(Boolean);

    cacheCanales = activos;
    ultimaDeteccion = ahora;

    console.log(`✅ Canales detectados: ${activos.join(", ") || "ninguno"}`);

    return activos;
};

export const getConfig = async (req, res) => {
    try {
        const { client, ip } = await crearClienteNVR();
        const canales = await detectarCanalesActivos(client, ip);
        res.json({ success: true, canales });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

export const capturarTodo = async (req, res) => {
    const patente = (req.query.patente || "SIN_PATENTE").toUpperCase().trim();
    console.log(`📸 Iniciando captura para Patente: ${patente}...`);

    let client, ip;
    try {
        ({ client, ip } = await crearClienteNVR());
    } catch (error) {
        console.error("No se pudo conectar al NVR:", error.message);
        return res.json({ status: "sin_camaras", archivos: [], message: error.message });
    }

    let canales;
    try {
        canales = await detectarCanalesActivos(client, ip);
    } catch (error) {
        console.error("Error detectando canales:", error.message);
        return res.json({ status: "sin_camaras", archivos: [], message: error.message });
    }

    const patenteDir = path.join(CAPTURAS_DIR, patente);
    if (!fs.existsSync(patenteDir)) {
        fs.mkdirSync(patenteDir, { recursive: true });
    }

    const archivos = [];
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];

    for (const ch of canales) {
        console.log(`🔍 Intentando capturar Canal ${ch} para ${patente}...`);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        try {
            const response = await client.fetch(
                `https://${ip}/cgi-bin/snapshot.cgi?channel=${ch}`,
                { signal: controller.signal }
            );
            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error(`NVR respondió con status ${response.status}`);
            }

            const buffer = Buffer.from(await response.arrayBuffer());

            if (buffer.length < 5000) {
                throw new Error(`Imagen canal ${ch} dañada o vacía (${buffer.length} bytes)`);
            }

            const fileName = `${patente}_cam${ch}_${timestamp}.jpg`;
            fs.writeFileSync(path.join(patenteDir, fileName), buffer);

            archivos.push({ canal: ch, ruta: `${patente}/${fileName}` });
            console.log(`✅ Canal ${ch} capturado: ${fileName}`);
        } catch (error) {
            console.error(`❌ Error en Canal ${ch}:`, error.message);
        }
    }

    if (archivos.length === 0) {
        return res.json({
            status: "sin_camaras",
            archivos: [],
            message: "No se pudo capturar ninguna imagen de las cámaras."
        });
    }

    res.json({ status: "ok", archivos });
};


export const limpiarCache = (req, res) => {
    cacheCanales = null;
    ultimaDeteccion = 0;

    res.json({
        success: true,
        message: "Cache limpiado"
    });
};
