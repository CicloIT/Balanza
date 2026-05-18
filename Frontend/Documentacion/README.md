# 🚀 Backend - Sistema de Balanzas

Backend API REST en Node.js + Express + PostgreSQL para el sistema de gestión de balanzas agroindustriales.

## 📋 Requisitos Previos

- **Node.js** v16+ 
- **PostgreSQL** 14+
- **npm** o **yarn**

## 🔧 Instalación

### 1. Clonar o descargar el proyecto

```bash
cd Backend
npm install
```

### 2. Configurar variables de entorno

Crear archivo `.env` con las siguientes variables:

```env
DB_USER=postgres
DB_PASSWORD=123
DB_HOST=localhost
DB_PORT=5432
DB_NAME=Balanza

NODE_ENV=development
PORT=3000
```

> **Nota**: Estos valores deben coincidir con tu instalación de PostgreSQL

### 3. Crear la base de datos

Asegúrate de haber ejecutado el script SQL `balanza_db_improved.sql` en PostgreSQL:

```bash
psql -U postgres -d Balanza -f ../balanza_db_improved.sql
```

## 🚀 Iniciar el servidor

### Modo Desarrollo (con hot-reload)

```bash
npm run dev
```

### Modo Producción

```bash
npm start
```

El servidor estará disponible en `http://localhost:3000`

## 📡 Endpoints Disponibles

### Health Check
```
GET /api/health
```
Verificar conexión a la base de datos.

### Choferes
```
GET    /api/choferes           - Listar choferes activos
GET    /api/choferes/:id       - Obtener chofer por ID
POST   /api/choferes           - Crear nuevo chofer
PUT    /api/choferes/:id       - Actualizar chofer
DELETE /api/choferes/:id       - Eliminar (desactivar) chofer
```

### Productores
```
GET    /api/productores        - Listar productores activos
GET    /api/productores/:id    - Obtener productor por ID
POST   /api/productores        - Crear nuevo productor
PUT    /api/productores/:id    - Actualizar productor
DELETE /api/productores/:id    - Eliminar productor
```

### Productos
```
GET    /api/productos          - Listar productos activos
GET    /api/productos/:id      - Obtener producto por ID
POST   /api/productos          - Crear nuevo producto
PUT    /api/productos/:id      - Actualizar producto
DELETE /api/productos/:id      - Eliminar producto
```

### Transportes (Empresas)
```
GET    /api/transportes        - Listar transportes activos
GET    /api/transportes/:id    - Obtener transporte por ID
POST   /api/transportes        - Crear nuevo transporte
PUT    /api/transportes/:id    - Actualizar transporte
DELETE /api/transportes/:id    - Eliminar transporte
```

### Vehículos (Patentes)
```
GET    /api/vehiculos          - Listar vehículos activos
GET    /api/vehiculos/:id      - Obtener vehículo por ID
POST   /api/vehiculos          - Crear nuevo vehículo
PUT    /api/vehiculos/:id      - Actualizar vehículo
DELETE /api/vehiculos/:id      - Eliminar vehículo
```

### Balanzas
```
GET    /api/balanzas           - Listar balanzas activas
GET    /api/balanzas/:id       - Obtener balanza por ID
POST   /api/balanzas           - Crear nueva balanza
PUT    /api/balanzas/:id       - Actualizar balanza
DELETE /api/balanzas/:id       - Eliminar balanza
```

### Usuarios
```
GET    /api/usuarios           - Listar usuarios activos
GET    /api/usuarios/:id       - Obtener usuario por ID
POST   /api/usuarios           - Crear nuevo usuario
PUT    /api/usuarios/:id       - Actualizar usuario
DELETE /api/usuarios/:id       - Eliminar usuario
```

### Tickets (Operaciones)
```
GET    /api/tickets            - Listar últimos 100 tickets
GET    /api/tickets/:id        - Obtener ticket detallado
GET    /api/tickets/estado/:estado  - Listar tickets por estado (ABIERTO, CERRADO, ANULADO)
GET    /api/tickets/fecha/rango?startDate=2024-02-10&endDate=2024-02-11  - Por rango de fechas
POST   /api/tickets            - Crear nuevo ticket
PUT    /api/tickets/:id        - Actualizar ticket
POST   /api/tickets/:id/cerrar - Cerrar ticket
```

### Pesadas
```
GET    /api/pesadas            - Listar últimas 200 pesadas
GET    /api/pesadas/:id        - Obtener pesada por ID
GET    /api/pesadas/ticket/:ticketId  - Listar pesadas de un ticket
GET    /api/pesadas/agrupadas  - Ver pesadas agrupadas por ticket
POST   /api/pesadas            - Registrar nueva pesada (BRUTO o TARA)
PUT    /api/pesadas/:id        - Actualizar pesada
DELETE /api/pesadas/:id        - Eliminar pesada
```

## 📝 Ejemplos de Uso

### Crear un chofer

```bash
curl -X POST http://localhost:3000/api/choferes \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "CHO-001",
    "apellido_nombre": "García, Juan Carlos",
    "tipo_documento": "DNI",
    "nro_documento": "12345678",
    "nacionalidad": "Argentino"
  }'
```

### Crear un ticket

```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "balanza_id": 1,
    "chofer_id": 1,
    "productor_id": 1,
    "transporte_id": 1,
    "producto_id": 1,
    "vehiculo_id": 1,
    "operario_id": 1,
    "nro_remito": "REM-2024-001",
    "observaciones": "Remisión normal"
  }'
```

### Registrar pesada BRUTO

```bash
curl -X POST http://localhost:3000/api/pesadas \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": 1,
    "tipo": "BRUTO",
    "peso": 25500.50,
    "operario_id": 1
  }'
```

### Registrar pesada TARA

```bash
curl -X POST http://localhost:3000/api/pesadas \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": 1,
    "tipo": "TARA",
    "peso": 8500.00,
    "operario_id": 1
  }'
```

### Cerrar ticket

```bash
curl -X POST http://localhost:3000/api/tickets/1/cerrar
```

### Consultar tickets abiertos

```bash
curl http://localhost:3000/api/tickets/estado/ABIERTO
```

### Obtener detalle de un ticket con pesos

```bash
curl http://localhost:3000/api/tickets/1
```

## 🗂️ Estructura de Carpetas

```
Backend/
├── src/
│   ├── config/
│   │   └── database.js          # Configuración de conexión a PostgreSQL
│   │
│   ├── controllers/             # Lógica de negocio
│   │   ├── choferesController.js
│   │   ├── productoresController.js
│   │   ├── productosController.js
│   │   ├── transportesController.js
│   │   ├── vehiculosController.js
│   │   ├── ticketsController.js
│   │   ├── pesadasController.js
│   │   ├── balanzasController.js
│   │   └── usuariosController.js
│   │
│   ├── routes/                  # Definición de endpoints
│   │   ├── choferes.js
│   │   ├── productores.js
│   │   ├── productos.js
│   │   ├── transportes.js
│   │   ├── vehiculos.js
│   │   ├── tickets.js
│   │   ├── pesadas.js
│   │   ├── balanzas.js
│   │   └── usuarios.js
│   │
│   └── server.js                # Punto de entrada de la aplicación
│
├── package.json                 # Dependencias del proyecto
├── .env                        # Variables de entorno (no versionado)
├── .gitignore                  # Archivos ignorados por git
└── README.md                   # Este archivo
```

## 🔐 Notas de Seguridad

⚠️ **IMPORTANTE**: El backend actual está configurado para desarrollo local. Para producción:

1. **Variables de entorno**: Usa variables seguras, nunca hardcodees credenciales
2. **Contraseñas**: Implementa hash (bcrypt) para passwords
3. **Autenticación**: Agrega JWT o similar para proteger endpoints
4. **CORS**: Restringe orígenes permitidos
5. **Rate Limiting**: Implementa límite de peticiones
6. **SQL Injection**: Ya está protegido con prepared statements (pg)
7. **HTTPS**: Usa HTTPS en producción

## 🐛 Troubleshooting

### Error: "connect ECONNREFUSED 127.0.0.1:5432"

PostgreSQL no está ejecutándose. Verifica:

```bash
# En Windows
pg_isready -h localhost -p 5432

# En Linux
sudo systemctl status postgresql
```

### Error: "database \"Balanza\" does not exist"

La base de datos no existe. Crea con:

```bash
createdb -U postgres Balanza
psql -U postgres -d Balanza -f ../balanza_db_improved.sql
```

### Error: "password authentication failed"

Verifica credenciales en `.env`:

```env
DB_USER=postgres
DB_PASSWORD=123    # <-- Debe coincidir con tu contraseña
```

### Puerto 3000 ya en uso

Cambia el puerto en `.env`:

```env
PORT=3001
```

## 📚 Documentación Relacionada

- [Análisis de Base de Datos](../ANALISIS_BD_MEJORADA.md)
- [Ejemplos de Consultas SQL](../ejemplos_consultas.sql)
- [Guía de Implementación](../GUIA_IMPLEMENTACION.md)

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Crea una rama feature (`git checkout -b feature/AmazingFeature`)
2. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
3. Push a la rama (`git push origin feature/AmazingFeature`)
4. Abre un Pull Request

## 📄 Licencia

MIT

---

**Versión**: 1.0.0  
**Última actualización**: Febrero 2024
