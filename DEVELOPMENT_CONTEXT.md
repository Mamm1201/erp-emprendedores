# ERP Emprendedores — STECH NODES Ops

> Este archivo registra el **estado del desarrollo**. No reemplaza el CHANGELOG.
> El CHANGELOG registra qué cambió. Este archivo registra dónde estamos y hacia dónde vamos.

---

## Estado actual

**Versión:** `v0.4.1`
**Rama activa:** `develop`
**Última sesión:** 2026-07-04

### Hitos completados

| Hito | Descripción | Estado |
|------|-------------|--------|
| v0.1.0 | Sistema de Identidad Visual STECH NODES | ✅ Cerrado y auditado |
| v0.2.0 | Gestión de Sedes (Hito 1) | ✅ Cerrado y auditado |
| v0.3.0 | Expediente de Orden de Trabajo (Hito 2) | ✅ Cerrado y auditado |
| v0.4.0 | Módulo de Costos — Expenses (Hito 3) | ✅ Cerrado y auditado |
| v0.4.1 | Auditoría Hito 3 + política de edición + constantes compartidas | ✅ Cerrado y auditado |

**Estado general:** Build limpio · TypeScript sin errores · Arquitectura validada · Sin deuda técnica deliberada

---

## Arquitectura aprobada

### Reglas de estructura (no negociables)

- **Páginas = orquestadoras puras**: ninguna página contiene lógica de negocio, constantes de dominio ni JSX más allá de layout. Solo importa componentes y les pasa props.
- **Componentes por módulo**: `src/components/<módulo>/` — cada módulo tiene su propio directorio.
- **Hooks encapsulan toda llamada HTTP**: ningún componente llama a `api.*` directamente. Toda comunicación con el backend pasa por hooks en `src/hooks/use-<módulo>.ts`.
- **Colores únicamente mediante design tokens**: cero colores Tailwind hardcodeados. Todo color pasa por `hsl(var(--...))` o clases de token (`text-node-teal`, `text-amber-signal`, etc.).
- **TanStack Query v5** para acceso a datos: `queryKey`, `staleTime`, `enabled`, `invalidateQueries`.
- **React Hook Form + Zod + zodResolver** para todos los formularios.
- **shadcn/ui** como librería de componentes base.
- **Soft delete** en entidades financieras con campo `deletedAt DateTime?`.
- **Prisma Decimal → string en frontend**: los campos `Decimal` de Prisma se serializan automáticamente como `string` por NestJS (`JSON.stringify` invoca `Decimal.toJSON()`). Los tipos en `types.ts` los declaran como `string` y el frontend usa `parseFloat()` para cálculos.

### Reglas de proceso (no negociables)

- **Auditoría obligatoria antes de cada hito**: no se escribe código sin revisar primero el estado del módulo que se va a desarrollar.
- **Auditoría obligatoria después de cada hito**: no se cierra un hito sin revisión técnica de lo implementado.
- **CHANGELOG obligatorio**: todo cambio funcional, arquitectónico o fix relevante debe registrarse en `CHANGELOG.md` siguiendo versionado semántico.
- **Este archivo (DEVELOPMENT_CONTEXT) obligatorio**: debe actualizarse al cierre de cada sesión de trabajo.
- **No introducir deuda técnica deliberadamente**.
- **No romper arquitectura existente salvo justificación técnica explícita**.

---

## Estado del backend

### Módulos implementados y funcionales

| Módulo | Endpoints principales | Observaciones |
|--------|----------------------|---------------|
| `clients` | CRUD + soft delete + paginación | Completo |
| `branches` | CRUD anidado bajo client | Completo |
| `quotations` | CRUD + estados + secuencia de numeración | Completo |
| `work-orders` | CRUD + transiciones de estado + items | Completo |
| `service-records` | CRUD + checklist items | Completo |
| `invoices` | CRUD + estados + anulación | Completo |
| `payments` | Crear + anular pagos sobre invoice | Completo |
| `expenses` | CRUD + soft delete + política de edición por estado OT | Completo |
| `equipment` | CRUD + soft delete | Completo |
| `maintenance-plans` | CRUD + próximas visitas | Completo |
| `dashboard` | KPIs + pipeline + pagos recientes + próximas visitas | Completo |

### Módulos pendientes (no iniciados)

- **`auth`** — JWT, bcrypt, login, refresh tokens
- **`users`** — CRUD de usuarios del sistema, asignación de roles
- Servicio de generación de PDF (cotizaciones, cuentas de cobro, actas)
- Servicio de carga de archivos (fotos de equipos, documentos firmados)

### Infraestructura backend

- **NestJS** con `ValidationPipe` global (whitelist, forbidNonWhitelisted, transform)
- **Prisma ORM** con PostgreSQL — cliente generado en `src/generated/prisma/`
- `PrismaExceptionFilter` registrado globalmente
- CORS configurado para `http://localhost:5173` (desarrollo) vía `CORS_ORIGIN` env var
- Puerto configurable vía `PORT` env var (default: 3000)
- **Sin autenticación actualmente** — todos los endpoints son públicos

---

## Estado del frontend

### Páginas implementadas y funcionales

| Ruta | Componente | Estado |
|------|-----------|--------|
| `/` | `DashboardPage` | ✅ KPIs, pipeline, alertas, próximas visitas |
| `/clientes` | `ClientsPage` | ✅ CRUD clientes + sedes expand-in-table |
| `/cotizaciones` | `QuotationsPage` | ✅ Lista paginada + filtros |
| `/cotizaciones/nueva` | `QuotationFormPage` | ✅ Formulario completo con items |
| `/cotizaciones/:id` | `QuotationFormPage` | ✅ Edición |
| `/ordenes` | `WorkOrdersPage` | ✅ Lista + filtros + acciones de estado |
| `/ordenes/:id` | `WorkOrderDetailPage` | ✅ Expediente completo (8 componentes) |
| `/cuentas-cobro` | `InvoicesPage` | ✅ Lista paginada |
| `/cuentas-cobro/nueva` | `InvoiceCreatePage` | ✅ Creación desde OT |
| `/cuentas-cobro/:id` | `InvoiceDetailPage` | ✅ Detalle + pagos |
| `/pagos` | `PaymentsPage` | ✅ Lista de pagos recibidos |
| `/estado-cuentas` | `EstadoCuentasPage` | ✅ Resumen financiero |
| `/actas` | `ServiceRecordsPage` | ✅ Lista de actas |
| `/planes` | `MaintenancePlansPage` | ✅ Planes de mantenimiento |
| `/equipos` | `EquipmentPage` | ✅ Inventario de equipos |

### Componentes reutilizables creados

- `src/components/branches/` — `BranchList`, `BranchFormModal`, `BranchDeleteDialog`
- `src/components/work-orders/` — `WorkOrderHeader`, `WorkOrderInfoCard`, `WorkOrderItemsCard`, `ServiceRecordCard`, `ExpensesCard`, `CostSummaryCard`, `TimelineCard`, `InvoiceSideCard`
- `src/components/layout/` — `AppLayout`, `Sidebar` (con NodeMark y BrandHeader)
- `src/components/ui/` — shadcn/ui + variantes semánticas de Badge

### Constantes y utilidades compartidas

- `src/lib/types.ts` — todos los tipos del dominio
- `src/lib/expense-constants.ts` — `CATEGORY_LABEL` y `CATEGORY_ORDER` para gastos
- `src/lib/money.ts` — `formatMoney()`, `calcLineTotal()`
- `src/lib/api.ts` — cliente HTTP (`api.get/post/patch/delete`)

### Notas de implementación del frontend

- **Sin login ni protección de rutas** — toda la aplicación es accesible sin autenticación
- El nombre de usuario en el sidebar está hardcodeado como "Mario A. Márquez"
- `assignedToId` en OTs siempre muestra "Sin asignar" — no hay endpoint de usuarios para cargar la lista de técnicos

---

## Pendientes técnicos

### CRÍTICO — ejecutar antes de usar el backend con base de datos real

```bash
# Desde el directorio backend/
npx prisma migrate dev --name add_expense_soft_delete
```

**Por qué**: el campo `deletedAt DateTime?` y su índice fueron añadidos al modelo `Expense` en el schema de Prisma y el cliente fue regenerado (`npx prisma generate`), pero la migración de base de datos no fue aplicada porque el servidor PostgreSQL no estaba disponible durante el desarrollo. Sin esta migración, los endpoints del módulo de gastos fallarán en runtime con errores de columna inexistente.

**Verificar antes de ejecutar**: que PostgreSQL esté corriendo y que `DATABASE_URL` en `.env` apunte a la base de datos correcta.

### MENOR — deuda de UX diferida

- Botón "Cancelar" en `WorkOrderHeader.tsx` ejecuta la transición de estado inmediatamente sin dialog de confirmación. Fue clasificado como severidad baja y diferido. Pendiente para Hito 4 o posterior.

---

## Próximo hito aprobado

### Hito 4 — Autenticación JWT + Roles

**Estado de aprobación:** ✅ Aprobado — pendiente de implementación

**Decisión tomada en sesión 2026-07-04** después de comparación objetiva entre:
- Opción A: PDF primero → Auth después
- Opción B: Auth primero → PDF después

**Se eligió Opción B (Auth primero)** por las siguientes razones:

| Razón | Detalle |
|-------|---------|
| Elimina retrofitting | Auth como cross-cutting concern afecta todos los controllers. Implementarlo primero evita aplicar guards sobre 12+ módulos en lugar de 10. |
| Desbloquea módulo de usuarios | Sin auth no hay entidad "usuario autenticado" y por tanto no se puede implementar la asignación de técnicos a OTs. |
| Desbloquea auditoría de cambios | La trazabilidad "quién hizo qué" requiere identidad de usuario. |
| Desbloquea comentarios internos | Los comentarios en OTs requieren autoría. |
| Prepara para despliegue productivo | El sistema actualmente no puede desplegarse en red pública. Auth es el desbloqueador. |
| Evita deuda técnica acumulada | Cada hito construido antes de Auth sobre API abierta es código que debe retrofitearse. |

**Alcance esperado del Hito 4 (a definir en sesión de planificación):**

- Backend: `AuthModule` (JWT access + refresh tokens, bcrypt), `UsersModule` (CRUD), guards globales, decoradores `@CurrentUser` y `@Roles`
- Backend: aplicar `JwtGuard` a todos los controllers existentes
- Frontend: pantalla de login, almacenamiento seguro de token, interceptor de renovación, guards de ruta en React Router
- Frontend: sidebar con usuario real obtenido del token

**⚠️ IMPORTANTE: NO comenzar el Hito 4 sin realizar primero la auditoría del módulo de autenticación.**

---

## Decisiones arquitectónicas clave

| Decisión | Justificación |
|----------|---------------|
| Gastos bloqueados en OT COMPLETED/CANCELLED | Integridad financiera: costos deben estar fijos antes de facturar. Si hay error, el coordinador reabre la OT. |
| Cálculo de margen usa `workOrder.total` siempre | `invoice.total` no está embebido en WorkOrder. Cuando la factura está confirmada, los totales coinciden (mismos items). Documentado con comentario en `CostSummaryCard`. |
| `ExpenseFormModal` como modal, no formulario inline | Consistencia con el patrón ERP establecido en otros módulos (BranchFormModal, WorkOrderFormModal). |
| `CostSummaryCard` retorna `null` sin gastos | No ocupa espacio visual hasta que haya datos reales. |
| Soft delete en `Expense` | Trazabilidad financiera: los gastos eliminados se preservan en historial aunque no aparecen en cálculos activos. |
| `CATEGORY_LABEL` y `CATEGORY_ORDER` en `expense-constants.ts` | Evita acoplamiento de importación entre `ExpensesCard` y `CostSummaryCard` (componentes hermanos). Única fuente de verdad. |
| Fechas de gasto con `.slice(0, 10)` antes de `parseISO` | El backend devuelve `DateTime @db.Date` como ISO string completo (`T00:00:00.000Z`). Sin el slice, `parseISO` interpreta UTC midnight y en zonas UTC-N (Colombia, UTC-5) muestra el día anterior. |
| Auditoría antes y después de cada hito | Establece la calidad como requisito de proceso, no como validación ad-hoc. Previene deuda técnica acumulada. |

---

## Riesgos pendientes

| Riesgo | Severidad | Plan de mitigación |
|--------|-----------|-------------------|
| API completamente abierta (sin auth) | **Alta** | Hito 4 resuelve esto |
| Migración `add_expense_soft_delete` no aplicada | **Alta** | Ejecutar antes de usar en producción |
| Sin PDF de documentos | **Media** | Hito 5 (después de Auth) |
| Sin módulo de usuarios/técnicos | **Media** | Hito post-Auth |
| Sin carga de archivos | **Baja-Media** | Requiere decisión de infraestructura de storage |
| Botón "Cancelar" OT sin confirmación | **Baja** | Diferido, no es bloqueador |

---

## Reglas para retomar el proyecto

Al iniciar cualquier nueva sesión de desarrollo, seguir este orden **sin excepciones**:

1. **Leer `DEVELOPMENT_CONTEXT.md`** — entender el estado actual, decisiones tomadas y el próximo hito aprobado.

2. **Leer `CHANGELOG.md`** — verificar la versión actual y los últimos cambios registrados.

3. **Auditar el módulo que se va a desarrollar** — revisar el estado real del código, no asumir nada desde la memoria o el contexto anterior.

4. **No modificar arquitectura ya aprobada** — salvo justificación técnica explícita acordada con el Tech Lead. Las reglas de la sección "Arquitectura aprobada" son el contrato del proyecto.

5. **No comenzar un nuevo hito sin revisar dependencias** — el mapa de dependencias está en el análisis del 2026-07-04. Verificar que los prerequisitos estén resueltos.

6. **Mantener el nivel de calidad aplicado hasta v0.4.1** — auditoría antes, implementación limpia, auditoría después, registro en CHANGELOG, actualización de este archivo al cierre de sesión.

---

*Actualizado al cierre de sesión: 2026-07-04*
