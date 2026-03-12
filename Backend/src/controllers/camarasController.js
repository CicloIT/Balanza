import DigestFetch from "digest-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ajustar __dirname porque estamos en src/controllers
const CAPTURAS_DIR = path.join(__dirname, "../../capturas");

if (!fs.existsSync(CAPTURAS_DIR)) {
    fs.mkdirSync(CAPTURAS_DIR, { recursive: true });
}

const clientNVR = new DigestFetch("admin", "Camaras24.LC");
const NVR_IP = "192.168.52.66";

export const capturarTodo = async (req, res) => {
    const patente = (req.query.patente || "SIN_PATENTE").toUpperCase().trim();
    console.log(`📸 Iniciando captura para Patente: ${patente}...`);
    
    const patenteDir = path.join(CAPTURAS_DIR, patente);
    if (!fs.existsSync(patenteDir)) {
        fs.mkdirSync(patenteDir, { recursive: true });
    }

    const canales = [1, 2];
    const archivos = [];
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]; 

    try {
        for (const ch of canales) {
            console.log(`🔍 Intentando capturar Canal ${ch} para ${patente}...`);
            
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);

            try {
                const response = await clientNVR.fetch(
                    `https://${NVR_IP}/cgi-bin/snapshot.cgi?channel=${ch}`,
                    { signal: controller.signal }
                );
                clearTimeout(timeout);

                if (!response.ok) {
                    throw new Error(`NVR respondió con status ${response.status}`);
                }

                const buffer = Buffer.from(await response.arrayBuffer());
                
                if (buffer.length < 5000) {
                    throw new Error(`La imagen del canal ${ch} parece estar dañada o vacía (${buffer.length} bytes)`);
                }

                const fileName = `${patente}_cam${ch}_${timestamp}.jpg`;
                fs.writeFileSync(path.join(patenteDir, fileName), buffer);
                
                // Retornamos el path relativo para el frontend: patente/filename
                archivos.push(`${patente}/${fileName}`);
                console.log(`✅ Canal ${ch} capturado exitosamente: ${fileName}`);
            } catch (error) {
                console.error(`❌ Error en Canal ${ch}:`, error.message);
            }
        }

        if (archivos.length === 0) {
            return res.status(500).json({
                status: "error",
                message: "No se pudo capturar ninguna imagen de las cámaras."
            });
        }

        res.json({
            status: "ok",
            archivos
        });

    } catch (error) {
        console.error("ERROR CRÍTICO NVR:", error);
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};

