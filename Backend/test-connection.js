import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function testConnection() {
  try {
    console.log('🔍 Intentando conectar a PostgreSQL...');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Puerto: ${process.env.DB_PORT}`);
    console.log(`   Usuario: ${process.env.DB_USER}`);
    console.log(`   BD: ${process.env.DB_NAME}`);
    console.log('');

    const result = await pool.query('SELECT NOW(), version()');
    console.log('✅ ¡Conexión exitosa!');
    console.log(`   Timestamp: ${result.rows[0].now}`);
    console.log(`   PostgreSQL: ${result.rows[0].version}`);
    
    // Verificar tablas
    console.log('\n📋 Verificando tablas...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log(`   Total de tablas: ${tables.rows.length}`);
    tables.rows.forEach(row => {
      console.log(`     - ${row.table_name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('\nDetalles del error:');
    console.error(error);
    process.exit(1);
  }
}

testConnection();
