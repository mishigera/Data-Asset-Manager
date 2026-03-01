# WhatsApp Inbox Multiagente

Sistema de gestión de mensajería de WhatsApp diseñado para equipos, permitiendo que múltiples agentes atiendan un solo número de teléfono de forma organizada, con trazabilidad y métricas de desempeño.

## 🚀 Características Principales

- **Panel de Control Multiagente**: Interfaz tipo "Inbox" de 3 paneles para una gestión fluida de conversaciones.
- **Gestión de Roles (RBAC)**:
  - **ADMIN**: Control total, gestión de usuarios y configuración.
  - **SUPERVISOR**: Supervisión de chats, reasignación y acceso a métricas.
  - **AGENT**: Atención de chats asignados, envío de mensajes y notas.
  - **READONLY**: Solo visualización para auditoría.
- **Notas Internas**: Colaboración entre agentes mediante notas privadas en el perfil del contacto.
- **Etiquetado Dinámico**: Organización de contactos mediante tags personalizados.
- **Dashboard de Métricas**: Visualización en tiempo real de mensajes enviados, tiempos de respuesta y chats cerrados por agente.
- **Arquitectura Escalable**: Construido sobre PostgreSQL y listo para integrarse con WhatsApp Cloud API.

## 🛠️ Stack Tecnológico

- **Frontend**: React.js, Tailwind CSS, Lucide Icons, Radix UI.
- **Backend**: Node.js con Express.
- **Base de Datos**: PostgreSQL con Drizzle ORM.
- **Autenticación**: Passport.js con sesiones persistentes.
- **Estado y Consultas**: TanStack Query (React Query) para sincronización de datos.

## 📦 Instalación y Configuración

1. **Clonar el proyecto** en tu entorno de Replit.
2. **Base de Datos**: El proyecto utiliza la base de datos integrada de Replit. Asegúrate de que esté aprovisionada.
3. **Scripts disponibles**:
   - `npm run dev`: Inicia el servidor de desarrollo y el cliente.
   - `npm run db:push`: Sincroniza el esquema de Drizzle con la base de datos.

## 👥 Usuarios de Prueba (Seed)

El sistema incluye datos iniciales para pruebas:
- **Administrador**: `admin@example.com` / `admin123`
- **Agente**: `agent@example.com` / `agent123`

---
*Desarrollado con Replit Agent.*
