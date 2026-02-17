import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import pool from './config/database.js';

// Importar rutas
import choferesRoutes from './routes/choferes.js';
import productoresRoutes from './routes/productores.js';
import productosRoutes from './routes/productos.js';
import transportesRoutes from './routes/transportes.js';
import vehiculosRoutes from './routes/vehiculos.js';
import ticketsRoutes from './routes/tickets.js';
import pesadasRoutes from './routes/pesadas.js';
import balanzasRoutes from './routes/balanzas.js';
import usuariosRoutes from './routes/usuarios.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rutas
app.use('/api/choferes', choferesRoutes);
app.use('/api/productores', productoresRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/transportes', transportesRoutes);
app.use('/api/vehiculos', vehiculosRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/pesadas', pesadasRoutes);
app.use('/api/balanzas', balanzasRoutes);
app.use('/api/usuarios', usuariosRoutes);

// Ruta de prueba
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'OK',
      message: '✅ Backend conectado a PostgreSQL',
      timestamp: result.rows[0].now,
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: '❌ Error de conexión a base de datos',
      error: error.message,
    });
  }
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path,
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Backend ejecutándose en http://localhost:${PORT}`);
  console.log(`📡 Endpoints disponibles:`);
  console.log(`   GET  /api/health              - Verificar conexión`);
  console.log(`   GET  /api/choferes            - Listar choferes`);
  console.log(`   GET  /api/productores         - Listar productores`);
  console.log(`   GET  /api/productos           - Listar productos`);
  console.log(`   GET  /api/transportes         - Listar transportes`);
  console.log(`   GET  /api/vehiculos           - Listar vehículos`);
  console.log(`   GET  /api/tickets             - Listar tickets`);
  console.log(`   GET  /api/pesadas             - Listar pesadas`);
  console.log(`   GET  /api/balanzas            - Listar balanzas`);
  console.log(`   GET  /api/usuarios            - Listar usuarios\n`);
});

export default app;
