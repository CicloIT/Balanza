# 🚜 Sistema de Balanzas - Guía de Ejecución

## 📋 Requisitos Previos

- **Node.js** v14+
- **PostgreSQL** 12+
- **npm** o **yarn**

---

## 🗄️ 1. Configuración de la Base de Datos

### 1.1 Crear la base de datos

```bash
createdb balanza_db
```

### 1.2 Ejecutar el script SQL

```bash
psql -U postgres -d balanza_db -f balanza_db_improved.sql
```

Este script creará:
- Tablas (usuario, chofer, transporte, vehiculo, ticket, pesada, etc.)
- Tipos ENUM (rol_enum, estado_ticket_enum, tipo_pesada_enum)
- Índices para optimización
- Vistas de consulta (v_ticket_pesos, v_ticket_detalle, v_pesadas_agrupadas)
- Triggers para validación automática

---

## 🖥️ 2. Configuración del Backend

### 2.1 Navegar al directorio del backend

```bash
cd Backend
```

### 2.2 Instalar dependencias

```bash
npm install
```

### 2.3 Crear archivo .env

Crear un archivo `.env` en la raíz de `Backend/`:

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=balanza_db
DB_USER=postgres
DB_PASSWORD=tu_contraseña

# Servidor
PORT=3000
NODE_ENV=development
```

### 2.4 Ejecutar el backend

```bash
# Desarrollo (con auto-reload)
npm run dev

# Producción
npm start
```

El backend estará disponible en: **http://localhost:3000**

Verificar conexión: **http://localhost:3000/api/health**

---

## 💻 3. Configuración del Frontend

### 3.1 Navegar al directorio del frontend

```bash
cd Frontend
```

### 3.2 Instalar dependencias

```bash
npm install
```

### 3.3 Configurar la URL del backend (si es necesario)

En `Frontend/src/hooks/useGestionAPI.js`, verificar que:

```javascript
const API_BASE_URL = 'http://localhost:3000';
```

Sea la URL correcta de tu backend.

### 3.4 Ejecutar el frontend

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build
```

El frontend estará disponible en: **http://localhost:5173** (o el puerto que Vite indique)

---

## 📂 Estructura de Carpetas

```
Balanza/
├── Backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controllers/
│   │   │   ├── choferesController.js
│   │   │   ├── productoresController.js
│   │   │   ├── productosController.js
│   │   │   ├── transportesController.js
│   │   │   ├── vehiculosController.js
│   │   │   ├── ticketsController.js
│   │   │   ├── pesadasController.js
│   │   │   └── usuariosController.js
│   │   ├── routes/
│   │   └── server.js
│   └── package.json
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ActionBar.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── InputField.jsx
│   │   │   ├── ModalForm.jsx
│   │   │   ├── PesadaForm.jsx
│   │   │   └── TablaItems.jsx
│   │   ├── config/
│   │   │   ├── choferesConfig.js
│   │   │   ├── productoresConfig.js
│   │   │   ├── productosConfig.js
│   │   │   ├── transportesConfig.js
│   │   │   └── vehiculosConfig.js
│   │   ├── context/
│   │   │   └── ThemeContext.jsx
│   │   ├── hooks/
│   │   │   ├── useGestion.js (antigua, local)
│   │   │   ├── useGestionAPI.js (nueva, con API)
│   │   │   └── useTheme.js
│   │   ├── App.jsx
│   │   ├── GestionApp.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
├── balanza_db_improved.sql
├── GUIA_IMPLEMENTACION.md
└── README.md
```

---

## 🔌 Endpoints API

### Choferes
- `GET /api/choferes` - Obtener todos
- `GET /api/choferes/:id` - Obtener por ID
- `POST /api/choferes` - Crear
- `PUT /api/choferes/:id` - Actualizar
- `DELETE /api/choferes/:id` - Eliminar (soft delete)

### Productores
- `GET /api/productores` - Obtener todos
- `GET /api/productores/:id` - Obtener por ID
- `POST /api/productores` - Crear
- `PUT /api/productores/:id` - Actualizar
- `DELETE /api/productores/:id` - Eliminar

### Productos
- `GET /api/productos` - Obtener todos
- `GET /api/productos/:id` - Obtener por ID
- `POST /api/productos` - Crear
- `PUT /api/productos/:id` - Actualizar
- `DELETE /api/productos/:id` - Eliminar

### Transportes
- `GET /api/transportes` - Obtener todos
- `GET /api/transportes/:id` - Obtener por ID
- `POST /api/transportes` - Crear
- `PUT /api/transportes/:id` - Actualizar
- `DELETE /api/transportes/:id` - Eliminar

### Vehículos
- `GET /api/vehiculos` - Obtener todos
- `GET /api/vehiculos/:id` - Obtener por ID
- `POST /api/vehiculos` - Crear
- `PUT /api/vehiculos/:id` - Actualizar
- `DELETE /api/vehiculos/:id` - Eliminar

### Tickets
- `GET /api/tickets` - Obtener todos
- `GET /api/tickets/:id` - Obtener por ID
- `GET /api/tickets/estado/:estado` - Obtener por estado
- `POST /api/tickets` - Crear
- `PUT /api/tickets/:id` - Actualizar
- `POST /api/tickets/:id/close` - Cerrar ticket

### Pesadas
- `GET /api/pesadas` - Obtener todas
- `GET /api/pesadas/:id` - Obtener por ID
- `GET /api/pesadas/ticket/:ticketId` - Obtener pesadas de un ticket
- `POST /api/pesadas` - Crear
- `PUT /api/pesadas/:id` - Actualizar
- `DELETE /api/pesadas/:id` - Eliminar

---

## 🛠️ Troubleshooting

### "Error: connect ECONNREFUSED 127.0.0.1:5432"
- Verificar que PostgreSQL está corriendo
- Verificar credenciales en `.env`

### "CORS error"
- El backend tiene CORS habilitado, pero verificar que el frontend use la URL correcta

### "Tablas no encontradas"
- Ejecutar nuevamente: `psql -U postgres -d balanza_db -f balanza_db_improved.sql`

### Puerto 3000 ya en uso
- Cambiar `PORT` en el `.env` del backend
- O matar el proceso: `lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9`

---

## 📝 Notas Importantes

1. **Datos de Ejemplo**: El script SQL incluye comentarios con datos de ejemplo. Descomenta si necesitas datos iniciales.

2. **IDs Hard-coded**: Actualmente, en PesadaForm hay IDs hard-coded:
   - `balanza_id: 1`
   - `operario_id: 1`
   
   Estos deberían obtenerse de un contexto de autenticación en una versión futura.

3. **Validaciones**: 
   - Las pesadas requieren al menos un BRUTO y un TARA
   - El peso debe ser positivo
   - Los campos requeridos se validan tanto en frontend como en backend

4. **Soft Delete**: Los registros se desactivan con `activo = false`, no se eliminar físicamente.

---

## 🎯 Próximos Pasos

1. Añadir sistema de autenticación (JWT)
2. Implementar módulo de reportes y analítica
3. Añadir soporte para múltiples balanzas
4. Sistema de permisos por usuario
5. Exportar reportes a PDF/Excel

---

¡Listo! El sistema está configurado y listo para usar. 🚀
