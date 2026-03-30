process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import DigestFetch from "digest-fetch";
import fs from "fs";
import path from "path";
import dotenv from 'dotenv';
import pool from './config/database.js';
import net from 'net';
import http from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from "url";

// Importar rutas
import choferesRoutes from './routes/choferes.js';
import productoresRoutes from './routes/productores.js';
import productosRoutes from './routes/productos.js';
import transportesRoutes from './routes/transportes.js';
import vehiculosRoutes from './routes/vehiculos.js';
import ticketsRoutes from './routes/tickets.js';
import pesadasRoutes from './routes/pesadas.js';
import usuariosRoutes from './routes/usuarios.js';
import provinciasRoutes from './routes/provincias.js';
import localidadesRoutes from './routes/localidades.js';
import operacionesRoutes from './routes/operaciones.js';
import metricasRoutes from './routes/metricas.js';
import camarasRoutes from './routes/camaras.js';
import reportesRoutes from './routes/reporte.js';
import backupRoutes from './routes/backups.js';
import { createBackup } from './controllers/backupController.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Crear servidor HTTP y WebSocket
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Configuración de la balanza
const BALANZA_IP = process.env.BALANZA_IP || '127.0.0.1';
const BALANZA_PORT = parseInt(process.env.BALANZA_PORT) || 3000;

// Estado de la balanza
let scaleBuffer = Buffer.alloc(0);
let lastWeight = null;
let isScaleConnected = false;

// Función de broadcast para WebSockets
function broadcast(msg) {
  wss.clients.forEach(ws => {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
  });
}

// Conexión a la balanza
const client = new net.Socket();

function connectToBalanza() {
  console.log(`📡 Intentando conectar a la balanza en ${BALANZA_IP}:${BALANZA_PORT}...`);
  client.connect(BALANZA_PORT, BALANZA_IP);
}

client.on('connect', () => {
  console.log('✅ Conectado a la balanza');
  isScaleConnected = true;
  broadcast({ type: 'STATUS', status: 'CONNECTED' });
});

client.on('data', (data) => {
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
        console.log('⚖️ Peso actualizado:', weight);
        broadcast({ type: 'WEIGHT', weight, ts: Date.now() });
      }
    }
  }
});

client.on('error', (err) => {
  console.error('❌ Error en la conexión con la balanza:', err.message);
  isScaleConnected = false;
  broadcast({ type: 'STATUS', status: 'DISCONNECTED', error: err.message });
});

client.on('close', () => {
  if (isScaleConnected) {
    console.log('⚠️ Conexión con la balanza cerrada. Reintentando...');
  }
  isScaleConnected = false;
  broadcast({ type: 'STATUS', status: 'DISCONNECTED' });
  setTimeout(connectToBalanza, 5000);
});

// Iniciar conexión inicial
connectToBalanza();

// Manejar conexiones WebSocket entrantes
wss.on('connection', (ws) => {
  console.log('🔌 Nuevo cliente WebSocket conectado');
  // Enviar estado actual al conectar
  ws.send(JSON.stringify({
    type: 'STATUS',
    status: isScaleConnected ? 'CONNECTED' : 'DISCONNECTED',
    currentWeight: lastWeight
  }));
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Rutas API
app.use('/api/choferes', choferesRoutes);
app.use('/api/productores', productoresRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/transportes', transportesRoutes);
app.use('/api/vehiculos', vehiculosRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/pesadas', pesadasRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/provincias', provinciasRoutes);
app.use('/api/localidades', localidadesRoutes);
app.use('/api/operaciones', operacionesRoutes);
app.use('/api/metricas', metricasRoutes);
app.use('/api/camaras', camarasRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/backup', backupRoutes);

const CAPTURAS_DIR = path.join(__dirname, "../capturas");
if (!fs.existsSync(CAPTURAS_DIR)) {
  fs.mkdirSync(CAPTURAS_DIR, { recursive: true });
}
app.use("/capturas", express.static(CAPTURAS_DIR));

const DOCUMENTOS_DIR = path.join(__dirname, "documentos");
if (!fs.existsSync(DOCUMENTOS_DIR)) {
  fs.mkdirSync(DOCUMENTOS_DIR, { recursive: true });
}
app.use("/documentos", express.static(DOCUMENTOS_DIR));

// Servir el frontend build
const FRONTEND_DIR = path.join(__dirname, "../../Frontend/dist");
if (fs.existsSync(FRONTEND_DIR)) {
  app.use(express.static(FRONTEND_DIR));
}

// Ruta de prueba
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'OK',
      message: '✅ Backend conectado a PostgreSQL',
      timestamp: result.rows[0].now,
      scale: {
        connected: isScaleConnected,
        lastWeight,
        config: { ip: BALANZA_IP, port: BALANZA_PORT }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: '❌ Error de conexión a base de datos',
      error: error.message,
    });
  }
});

// Manejo de rutas no encontradas y errores al FINAL
app.use((req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/capturas') || req.path.startsWith('/documentos')) {
    res.status(404).json({
      error: 'Ruta no encontrada',
      path: req.path,
    });
  } else {
    // Para SPA, servir index.html
    if (fs.existsSync(path.join(FRONTEND_DIR, 'index.html'))) {
      res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
    } else {
      res.status(404).send('Frontend no disponible');
    }
  }
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message,
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Backend ejecutándose en http://0.0.0.0:${PORT}`);
  console.log(`🌐 Accesible desde la red local en: http://[TU_IP_LOCAL]:${PORT}`);
  console.log(`📡 Endpoints disponibles:`);
  console.log(`   GET  /api/health              - Verificar conexión`);
  console.log(`   GET  /api/choferes            - Listar choferes`);
  console.log(`   GET  /api/productores         - Listar productores`);
  console.log(`   GET  /api/productos           - Listar productos`);
  console.log(`   GET  /api/transportes         - Listar transportes`);
  console.log(`   GET  /api/vehiculos           - Listar vehículos`);
  console.log(`   GET  /api/tickets             - Listar tickets`);
  console.log(`   GET  /api/pesadas             - Listar pesadas`);
  console.log(`   GET  /api/usuarios            - Listar usuarios`);
  console.log(`   GET  /api/camaras             - Captura NVR`);
  console.log(`   GET  /api/reportes            - Listar reportes\n`);
  
  // Tarea programada semanal para backup (Domingo a las 00:00)
  // Check cada hora si es Domingo y hora 0.
  setInterval(async () => {
    const ahora = new Date();
    // 0 es Domingo, hora 3 AM (para no interferir con el uso)
    if (ahora.getDay() === 0 && ahora.getHours() === 3) {
      console.log('⏰ Iniciando backup automático semanal...');
      try {
        await createBackup();
      } catch (err) {
        console.error('❌ Falló el backup automático:', err.message);
      }
    }
  }, 1000 * 60 * 60); // Cada hora
});

export default app;
