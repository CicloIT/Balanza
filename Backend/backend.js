process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import express from "express";
import DigestFetch from "digest-fetch";
import fs from "fs";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());

const client = new DigestFetch("admin", "Camaras24.LC");

const NVR_IP = "192.168.52.66";

const CAPTURAS_DIR = path.join(__dirname, "capturas");

if (!fs.existsSync(CAPTURAS_DIR)) {
    fs.mkdirSync(CAPTURAS_DIR);
}

app.use("/capturas", express.static(CAPTURAS_DIR));

app.get("/capturar-todo", async (req, res) => {

    const canales = [1, 2];

    try {

        const promesas = canales.map(async (ch) => {

            const response = await client.fetch(
                `https://${NVR_IP}/cgi-bin/snapshot.cgi?channel=${ch}`
            );

            const buffer = Buffer.from(await response.arrayBuffer());

            const fileName = `camara_${ch}_${Date.now()}.jpg`;

            fs.writeFileSync(
                path.join(CAPTURAS_DIR, fileName),
                buffer
            );

            return fileName;

        });

        const archivos = await Promise.all(promesas);

        res.json({
            status: "ok",
            archivos
        });

    } catch (error) {

        console.error("ERROR NVR:", error);

        res.status(500).json({
            error: error.message
        });

    }

});

app.listen(3000, () => console.log("Servidor corriendo en puerto 3000"));