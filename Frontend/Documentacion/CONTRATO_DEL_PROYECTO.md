# CONTRATO DE DESARROLLO Y ENTREGA DEL SISTEMA DE BALANZAS AGROINDUSTRIALES

**Fecha:** 30 de marzo de 2026  
**Versión:** 1.0  
**Cliente:** [Nombre del Cliente]  
**Desarrollador:** [Nombre del Desarrollador/Empresa]  

## 1. OBJETO DEL CONTRATO

El presente contrato regula el desarrollo, entrega e implementación de un sistema de gestión de balanzas agroindustriales (en adelante, "el Sistema") que permitirá la administración integral de operaciones de pesaje, control de calidad y generación de reportes en tiempo real.

## 2. ALCANCE DEL PROYECTO

### 2.1 Funcionalidades Principales

El Sistema incluirá las siguientes funcionalidades principales:

#### Gestión de Operaciones de Pesaje
- Registro de pesadas de entrada y salida
- Integración en tiempo real con balanza física vía TCP/IP
- Validación automática de pesos y diferencias
- Gestión de tickets de pesaje

#### Gestión de Entidades
- **Choferes**: CRUD completo con información personal y de contacto
- **Productores**: Gestión de productores
- **Productos**: Catálogo de productos con especificaciones
- **Transportes**: Registro de empresas de transporte
- **Vehículos**: Control de patentes y características de vehículos
- **Provincias y Localidades**

#### Reportes y Analytics
- Dashboard con métricas en tiempo real
- Reportes históricos de pesadas almacenados en base de datos
- Visualización de reportes en pantalla
- Gráficos interactivos de productividad (barras, líneas)

#### Seguridad y Usuarios
- Sistema de autenticación basado en JWT
- Control de acceso basado en roles y permisos
- Gestión de usuarios con diferentes niveles de acceso

#### Integraciones
- Conexión con balanza física (protocolo TCP/IP)
- Captura de imágenes de cámaras IP
- Sistema de backups automáticos de base de datos

### 2.2 Arquitectura del Sistema

#### Backend
- **Framework:** Node.js con Express.js
- **Base de Datos:** PostgreSQL
- **Autenticación:** JWT (JSON Web Tokens)
- **WebSockets:** Para comunicación en tiempo real
- **API:** RESTful con documentación

#### Frontend
- **Framework:** React 19.2.0 con Vite
- **UI/UX:** Tailwind CSS para estilos
- **Gráficos:** Recharts para visualización de datos
- **Iconos:** Lucide React

#### Infraestructura
- **Servidor:** Node.js ejecutándose en máquina local
- **Base de Datos:** PostgreSQL local
- **Almacenamiento:** Sistema de archivos local para capturas e imágenes

## 3. TECNOLOGÍAS UTILIZADAS

### 3.1 Backend
- **Node.js:** v16+ (versión recomendada: v18+)
- **Express.js:** ^4.18.2
- **PostgreSQL:** ^8.11.3 (base de datos: PostgreSQL 14+)
- **WebSocket:** ws ^8.19.0
- **Autenticación:** jsonwebtoken (incluido en dependencias)
- **CORS:** cors ^2.8.5
- **Archivos:** multer ^2.1.1 para uploads
- **Digest Fetch:** digest-fetch ^3.1.1 para integración con balanza
- **Archiver:** archiver ^7.0.1 para backups

### 3.2 Frontend
- **React:** ^19.2.0
- **Vite:** ^7.2.4 (build tool)
- **Tailwind CSS:** ^4.1.18
- **Recharts:** ^3.8.0 (gráficos)
- **Lucide React:** ^0.563.0 (iconos)
- **ESLint:** ^9.39.1 (linting)

### 3.3 Dependencias de Desarrollo
- **Nodemon:** ^3.0.2 (hot-reload backend)
- **TypeScript types:** Para React y DOM
- **ESLint plugins:** Para React hooks y refresh

## 4. REQUISITOS DEL SISTEMA

### 4.1 Requisitos Mínimos del Servidor
- **SO:** Windows 10/11, Linux (Ubuntu 20.04+), macOS
- **CPU:** Dual-core 2.5 GHz o superior
- **RAM:** 4 GB mínimo, 8 GB recomendado
- **Almacenamiento:** 500 GB disponible
- **Red:** Conexión Ethernet o Wi-Fi para acceso local

### 4.2 Requisitos de Software
- **Node.js:** v16 o superior
- **PostgreSQL:** v14 o superior
- **Navegador Web:** Chrome 90+, Firefox 88+, Edge 90+ (para acceso web)

### 4.3 Hardware Adicional
- **Balanza Digital:** Con interfaz TCP/IP (puerto configurable)
- **Cámaras IP:** Opcional, para captura de imágenes de vehículos

## 5. ENTREGABLES

### 5.1 Código Fuente
- Repositorio completo con código backend y frontend
- Scripts de instalación y configuración
- Documentación técnica (README, API docs)

### 5.2 Base de Datos
- Datos de prueba incluidos

### 5.3 Documentación
- Manual de instalación y despliegue
- Guía de usuario
- Documentación de API REST

### 5.4 Configuración
- Archivos de configuración de ejemplo (`.env`)
- Configuración de roles y permisos predefinidos

## 6. INSTALACIÓN Y DESPLIEGUE

### 6.1 Instalación Backend
```bash
cd Backend
npm install
# Configurar .env
npm run dev  # desarrollo
npm start    # producción
```

### 6.2 Instalación Frontend
```bash
cd Frontend
npm install
npm run start 
npm run build # producción
```

### 6.3 Configuración Base de Datos
- Instalar PostgreSQL
- Ejecutar script SQL proporcionado
- Configurar credenciales en `.env`

## 7. SOPORTE Y MANTENIMIENTO

### 7.1 Período de Garantía
- Corrección de bugs críticos identificados
- Actualizaciones de seguridad

### 7.2 Soporte Incluido
- Asistencia remota para instalación inicial
- Documentación completa
- Resolución de incidencias vía email/telegram

## 8. RESPONSABILIDADES

### 8.1 Del Desarrollador
- Entregar el sistema completo y funcional
- Proporcionar documentación técnica
- Capacitación básica al personal del cliente
- Soporte durante el período de garantía

### 8.2 Del Cliente
- Proporcionar acceso al hardware y software necesario
- Configurar la red y permisos de firewall
- Realizar backups regulares de datos
- Reportar incidencias de manera oportuna

## 9. LIMITACIONES Y EXCLUSIONES

### 9.1 No Incluido
- Hardware físico (servidores, balanzas, cámaras)
- Licencias de software de terceros
- Hosting en la nube
- Desarrollo de aplicaciones móviles nativas
- Integración con sistemas ERP externos

### 9.2 Limitaciones Técnicas
- El sistema está diseñado para redes locales
- No incluye alta disponibilidad o clustering
- Backup automático limitado a base de datos

## 10. TÉRMINOS Y CONDICIONES

### 10.1 Confidencialidad
- Todo el código fuente y documentación es propiedad del cliente
- El desarrollador mantendrá confidencialidad de datos del cliente

### 10.2 Propiedad Intelectual
- El cliente obtiene derechos completos sobre el sistema desarrollado
- Licencia MIT para componentes de terceros

### 10.3 Modificaciones
- Cualquier modificación posterior al sistema tendrá costo adicional
- Se recomienda mantener versiones actualizadas de dependencias

## 11. ANEXOS

### Anexo 1: Especificaciones Técnicas Detalladas
[Referencia a documentación técnica]

---

**Firmas:**

_______________________________  
[Nombre del Cliente]  
Fecha: _______________________

_______________________________  
[Nombre del Desarrollador]  
Fecha: _______________________