# Backend — ERP Mantenimiento Hospitalario

API REST construida con NestJS 11, Prisma 7 y PostgreSQL 16.

## Variables de entorno

Copiar `.env.example` a `.env` y ajustar si es necesario:

```bash
cp .env.example .env
```

| Variable | Descripción | Default |
|---|---|---|
| `DATABASE_URL` | Cadena de conexión PostgreSQL | `postgresql://erp_user:erp_dev_password@localhost:5433/erp_emprendedores` |
| `PORT` | Puerto del servidor | `3000` |
| `CORS_ORIGIN` | URL del frontend permitida | `http://localhost:5173` |

## Scripts disponibles

```bash
npm run start:dev        # Servidor en modo watch (desarrollo)
npm run start:prod       # Servidor en modo producción (requiere build previo)
npm run build            # Compila TypeScript a dist/

npm run db:migrate       # Aplica migraciones pendientes
npm run db:generate      # Regenera el cliente Prisma
npm run db:seed          # Carga datos de DEMOSTRACIÓN — ver advertencia abajo
npm run seed:crm-catalog # Carga el catálogo de servicios del CRM — seguro en cualquier entorno
npm run db:studio        # Abre Prisma Studio (GUI de la BD) en http://localhost:5555
npm run db:validate      # Valida el schema.prisma sin aplicar cambios
```

### ⚠️ `db:seed` — solo para bases de desarrollo/prueba vacías

`npm run db:seed` (`prisma/seed.ts`) inserta clientes, sedes y equipos **ficticios** pensados únicamente para levantar un entorno local vacío. **Nunca debe ejecutarse contra una base con datos reales del ERP**: hace upsert de clientes por nombre (`legalName`, ej. "Clínica Emmanuel") — si esa base ya tiene un cliente real con ese nombre, el script reutiliza esa fila real y le agrega sedes ficticias que no coinciden con la operación real.

Por eso exige, sin valores por defecto:

| Variable | Descripción |
|---|---|
| `SEED_CONFIRM` | Debe valer exactamente `RUN_ON_TEST_DB` — confirmación deliberada de que la base es de desarrollo/prueba |
| `SEED_ADMIN_PASSWORD` | Contraseña del usuario admin de demostración (mínimo 8 caracteres) |
| `SEED_TECH_PASSWORD` | Contraseña del usuario técnico de demostración (mínimo 8 caracteres) |

```bash
SEED_CONFIRM=RUN_ON_TEST_DB SEED_ADMIN_PASSWORD='...' SEED_TECH_PASSWORD='...' npm run db:seed
```

Sin estas variables, el script aborta sin escribir nada. Es distinto de `npm run seed:crm-catalog` (`prisma/seed-crm-catalog.ts`): ese solo inserta el catálogo de servicios del CRM (configuración, no datos de negocio simulados) y es seguro de ejecutar en cualquier entorno, incluido producción.

## Estructura de módulos

```
src/modules/
├── clients/             CRUD de clientes (IPS)
├── branches/            CRUD de sedes (anidado bajo clients)
├── quotations/          Cotizaciones con items de línea
├── work-orders/         Órdenes de trabajo + transiciones de status
├── equipment/           Hojas de vida de equipos por sede
├── maintenance-plans/   Planes de mantenimiento preventivo
└── service-records/     Actas técnicas + checklist de visita
```

## Endpoints principales

### Clientes
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/clients` | Listar clientes (búsqueda con `?search=`) |
| POST | `/clients` | Crear cliente |
| GET | `/clients/:id` | Ver cliente |
| PATCH | `/clients/:id` | Actualizar cliente |
| DELETE | `/clients/:id` | Soft-delete |

### Sedes
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/clients/:clientId/branches` | Listar sedes de un cliente |
| POST | `/clients/:clientId/branches` | Crear sede |
| PATCH | `/clients/:clientId/branches/:id` | Actualizar sede |
| DELETE | `/clients/:clientId/branches/:id` | Soft-delete |

### Equipos
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/clients/:clientId/branches/:branchId/equipment` | Listar equipos de una sede |
| POST | `/clients/:clientId/branches/:branchId/equipment` | Registrar equipo |
| PATCH | `.../equipment/:id` | Actualizar equipo (incluye `status`) |
| DELETE | `.../equipment/:id` | Soft-delete |

### Planes de mantenimiento
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/maintenance-plans` | Listar planes (`?clientId=`, `?isActive=true`) |
| GET | `/maintenance-plans/upcoming?days=30` | **Próximas visitas** — dashboard principal |
| POST | `/maintenance-plans` | Crear plan |
| PATCH | `/maintenance-plans/:id` | Actualizar (`nextVisitDate`, `isActive`, etc.) |

### Órdenes de trabajo
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/work-orders` | Listar (`?clientId=`, `?status=`, `?assignedToId=`) |
| POST | `/work-orders` | Crear OT |
| PATCH | `/work-orders/:id` | Editar OT (solo en DRAFT/SCHEDULED) |
| PATCH | `/work-orders/:id/status` | Cambiar status |
| DELETE | `/work-orders/:id` | Soft-delete (solo DRAFT) |

**Transiciones de status válidas:**
```
DRAFT → SCHEDULED → IN_PROGRESS → COMPLETED
                 ↘              ↘
               CANCELLED       CANCELLED
```
Al pasar a `COMPLETED`, el sistema recalcula automáticamente el `nextVisitDate` del plan de mantenimiento activo para esa sede.

### Actas técnicas
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/work-orders/:workOrderId/service-record` | Crear acta (genera checklist automático si hay `equipmentId`) |
| GET | `/work-orders/:workOrderId/service-record` | Ver acta de una OT |
| PATCH | `/work-orders/:workOrderId/service-record` | Actualizar hallazgos/recomendaciones |
| PATCH | `/work-orders/:workOrderId/service-record/checklist/:itemId` | Marcar ítem del checklist |
| GET | `/equipment/:equipmentId/service-records` | Historial de un equipo |

### Cotizaciones
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/quotations` | Listar cotizaciones |
| POST | `/quotations` | Crear cotización con ítems |
| PATCH | `/quotations/:id` | Editar cotización |
| PATCH | `/quotations/:id/status` | Cambiar status (DRAFT→SENT→APPROVED→CONVERTED) |

## Frecuencias de mantenimiento

| Valor | Descripción | Clientes actuales |
|---|---|---|
| `QUARTERLY` | Trimestral (cada 3 meses) | Clínica Emmanuel |
| `EVERY_4_MONTHS` | Cuatrimestral (cada 4 meses) | INDE, Clínica Avellaneda |
| `MONTHLY` | Mensual | — |
| `BIANNUAL` | Semestral | — |
| `ANNUAL` | Anual | — |

## Tipos de equipo con checklist predeterminado

Al crear una acta técnica con `equipmentId`, se generan automáticamente los ítems de verificación:

| Tipo | Ítems generados |
|---|---|
| `NURSE_CALL` | Alimentación central, pulsadores, indicadores, audio, cableado, limpieza |
| `MEDICAL_ALERT` | Alimentación, señales por código, indicadores y paneles, cableado, limpieza |
| `GENERATOR` | Aceite, refrigerante, batería, prueba de carga, filtro de aire, fugas |
| `UPS` | Prueba de batería, tiempo de respaldo, temperatura, alarmas, conexiones |
| `ELECTRICAL` | Tablero principal, breakers, tensión en circuitos críticos, tierra, cableado |
