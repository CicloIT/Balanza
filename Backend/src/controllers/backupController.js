import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import archiver from 'archiver';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rutas base
const ROOT_DIR = path.join(__dirname, '../../');
const BACKUP_DIR = path.join(ROOT_DIR, 'backups');
const CAPTURAS_DIR = path.join(ROOT_DIR, 'capturas');
const DOCUMENTOS_DIR = path.join(__dirname, '../documentos');

// Ruta a pg_dump - detectar automáticamente
let PG_DUMP_PATH = process.env.PG_DUMP_PATH;
if (!PG_DUMP_PATH) {
  // Intentar ubicaciones comunes de PostgreSQL
  const possiblePaths = [
    'C:/Program Files/PostgreSQL/18/bin/pg_dump.exe',
    'C:/Program Files/PostgreSQL/17/bin/pg_dump.exe',
    'C:/Program Files/PostgreSQL/16/bin/pg_dump.exe',
    'C:/Program Files/PostgreSQL/15/bin/pg_dump.exe',
    'C:/Program Files/PostgreSQL/14/bin/pg_dump.exe',
    '/usr/bin/pg_dump',
    '/usr/local/bin/pg_dump'
  ];
  
  for (const path of possiblePaths) {
    try {
      if (fs.existsSync(path)) {
        PG_DUMP_PATH = path;
        console.log('✅ pg_dump encontrado en:', path);
        break;
      }
    } catch (e) {
      console.log('❌ Error checking path:', path, e.message);
    }
  }
  
  if (!PG_DUMP_PATH) {
    console.log('⚠️ pg_dump no encontrado, usando comando del sistema');
    PG_DUMP_PATH = 'pg_dump'; // Asumir que está en PATH
  }
}

// Envolver en comillas si contiene espacios
const getPgDumpCommand = () => {
  return PG_DUMP_PATH.includes(' ') ? `"${PG_DUMP_PATH}"` : PG_DUMP_PATH;
};

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export const createBackup = async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + new Date().getHours() + '-' + new Date().getMinutes();
  const backupName = `Respaldo_${timestamp}`;
  const zipPath = path.join(BACKUP_DIR, `${backupName}.zip`);
  const dumpFile = path.join(BACKUP_DIR, `temp_db_${timestamp}.sql`);

  console.log(`🚀 Iniciando respaldo: ${backupName}...`);

  return new Promise((resolve, reject) => {
    // 1. Dump de la Base de Datos
    const dbPass = process.env.DB_PASSWORD || '123';
    const dbUser = process.env.DB_USER || 'postgres';
    const dbName = process.env.DB_NAME || 'balanza';
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';

    const env = { ...process.env, PGPASSWORD: dbPass };
    const dumpCmd = `${getPgDumpCommand()} -h ${dbHost} -p ${dbPort} -U ${dbUser} -F p -b -v -f "${dumpFile}" ${dbName}`;

    exec(dumpCmd, { env }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error en pg_dump:', stderr);
        return reject(new Error('Error al exportar base de datos'));
      }

      console.log('✅ Base de datos exportada. Iniciando compresión...');

      // 2. Comprimir con Archiver
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        console.log(`✅ Respaldo completado: ${zipPath} (${archive.pointer()} bytes)`);
        // Eliminar el dump temporal
        if (fs.existsSync(dumpFile)) fs.unlinkSync(dumpFile);
        
        resolve({
          success: true,
          filename: `${backupName}.zip`,
          path: zipPath,
          size: archive.pointer()
        });
      });

      archive.on('error', (err) => {
        console.error('❌ Error en compression:', err);
        reject(err);
      });

      archive.pipe(output);

      // Agregar el dump SQL
      archive.file(dumpFile, { name: 'database.sql' });

      // Agregar carpetas si existen
      if (fs.existsSync(CAPTURAS_DIR)) {
        archive.directory(CAPTURAS_DIR, 'capturas');
      }
      if (fs.existsSync(DOCUMENTOS_DIR)) {
        archive.directory(DOCUMENTOS_DIR, 'documentos');
      }

      archive.finalize();
    });
  });
};

export const handleManualBackup = async (req, res) => {
  try {
    const result = await createBackup();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listBackups = async (req, res) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.zip'))
      .map(f => {
        const stats = fs.statSync(path.join(BACKUP_DIR, f));
        return {
          filename: f,
          size: stats.size,
          date: stats.mtime
        };
      })
      .sort((a, b) => b.date - a.date);
    
    res.json({ success: true, backups: files });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const downloadBackup = (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(BACKUP_DIR, filename);

  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ error: 'Archivo no encontrado' });
  }
};
