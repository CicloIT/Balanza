import pool from './Backend/src/config/database.js';

async function check() {
  try {
    const result = await pool.query('SELECT id, username, rol, activo FROM usuario;');
    console.log('USUARIOS:');
    console.table(result.rows);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

check();
