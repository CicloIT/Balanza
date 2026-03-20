import pool from './src/config/database.js';

/**
 * Script para resetear la base de datos balanza.
 * Elimina todos los datos de las tablas y reinicia los contadores de ID.
 * Recrea el usuario admin/admin.
 * 
 * Uso: node reset_db.js
 */
async function resetDatabase() {
  const tables = [
    'ticket', 'ticket_operacion', 'reporte', 'provincia', 'localidad', 'usuario',
    'ticket_old', 'pesada', 'operacion_pesaje', 'chofer', 'productor', 'producto',
    'vehiculo', 'transporte'
  ];

  console.log('⏳ Limpiando base de datos...');

  try {
    // Truncar con cascada para manejar relaciones
    await pool.query(`TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE`);
    
    // Insertar admin por defecto
    await pool.query(
      "INSERT INTO usuario (username, password_hash, rol, localidad_id, activo) VALUES ($1, $2, $3, $4, $5)",
      ['admin', 'admin', 'admin', null, true]
    );
    
    console.log('✅ Base de datos reseteada con éxito.');
    console.log('👤 Usuario admin/admin recreado.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al resetear la base de datos:', error);
    process.exit(1);
  }
}

resetDatabase();
