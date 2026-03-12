
import DigestFetch from "digest-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const user = "admin";
const pass = "Camaras24.LC";
const ip = "192.168.52.66";
const channel = 1;


async function testNVR(protocol, channel) {
    console.log(`\n--- Probando con ${protocol.toUpperCase()} - Canal ${channel} ---`);
    const client = new DigestFetch(user, pass);
    const url = `${protocol}://${ip}/cgi-bin/snapshot.cgi?channel=${channel}`;
    
    console.log(`URL: ${url}`);
    
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        
        const response = await client.fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        
        console.log(`Status: ${response.status} ${response.statusText}`);
        
        const buffer = Buffer.from(await response.arrayBuffer());
        console.log(`Recibidos ${buffer.length} bytes.`);
        
        if (buffer.length > 0) {
            const hex = buffer.slice(0, 4).toString('hex').toUpperCase();
            console.log(`Primeros 4 bytes (hex): ${hex}`);
            const isJpeg = hex.startsWith("FFD8FF");
            console.log(`¿Es JPEG válido?: ${isJpeg ? "SÍ" : "NO"}`);
            
            if (!isJpeg) {
                console.log("Contenido (leído como texto):");
                console.log(buffer.toString('utf8').substring(0, 200));
            }
        }

        if (response.ok && buffer.length > 2000) { // Un JPEG real debería ser más grande
            const testFile = path.join(__dirname, `test_snap_${protocol}_ch${channel}.jpg`);
            fs.writeFileSync(testFile, buffer);
            console.log(`Archivo guardado en: ${testFile}`);
            return true;
        } else {
            console.log("La respuesta no parece ser una imagen válida o la conexión falló.");
            return false;
        }
    } catch (error) {
        console.error(`Error capturando con ${protocol} - Canal ${channel}:`, error.message);
        return false;
    }
}

async function runTests() {
    console.log("Iniciando pruebas de conexión con NVR...");
    
    const canales = [1, 2];
    for (const ch of canales) {
        await testNVR("https", ch);
        await testNVR("http", ch);
    }
}


runTests();

