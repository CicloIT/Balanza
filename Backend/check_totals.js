import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: String(process.env.DB_PASSWORD || '123'),
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'balanza',
});

async function check() {
  try {
    const ops = await pool.query('SELECT COUNT(*) FROM operacion_pesaje');
    const pes = await pool.query('SELECT COUNT(*) FROM pesada');
    const grouped = await pool.query(`
      SELECT COUNT(*) FROM (
        SELECT op.id FROM operacion_pesaje op
        LEFT JOIN pesada p ON op.id = p.operacion_id
        GROUP BY op.id
      ) as t
    `);

    console.log('--- Database Totals ---');
    console.log('Total operacion_pesaje:', ops.rows[0].count);
    console.log('Total pesada:', pes.rows[0].count);
    console.log('Total grouped operations (current query logic):', grouped.rows[0].count);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
