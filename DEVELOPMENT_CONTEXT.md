# ERP Emprendedores — STECH NODES Ops

> Este archivo registra el **estado del desarrollo**. No reemplaza el CHANGELOG.
> El CHANGELOG registra qué cambió. Este archivo registra dónde estamos y hacia dónde vamos.

---

## Estado actual

**Versión:** `v1.8.0` (Hito 14 — Facturación de Contratos de Mantenimiento)
**Rama activa:** `develop`
**Última sesión:** 2026-07-07

### Hitos completados

| Versión | Hito | Descripción | Estado |
|---------|------|-------------|--------|
| v0.1.0 | — | Sistema de Identidad Visual STECH NODES | ✅ Cerrado y auditado |
| v0.2.0 | Hito 1 | Gestión de Sedes | ✅ Cerrado y auditado |
| v0.3.0 | Hito 2 | Expediente de Orden de Trabajo | ✅ Cerrado y auditado |
| v0.4.0 | Hito 3 | Módulo de Costos — Expenses | ✅ Cerrado y auditado |
| v0.4.1 | Hito 3.1 | Auditoría Hito 3 + política de edición + constantes compartidas | ✅ Cerrado y auditado |
| v0.5.0 | Hito 4 | Auth JWT backend — guards, throttling, refresh token, auditoría de campos | ✅ Cerrado y auditado |
| v0.6.0 | Hito 4.1 | Auth frontend — AuthContext, api.ts, LoginPage, ProtectedRoute | ✅ Cerrado y auditado |
| v0.7.0 | Hito 5 | Módulo de Usuarios CRUD — RolesGuard, UsersController, UsersPage | ✅ Cerrado y auditado |
| v0.7.1 | Hito 5.1 | Hardening permisos frontend — RoleProtectedRoute, ForbiddenPage | ✅ Cerrado y auditado |
| v0.8.0 | Hito 6 | Asignación de técnico en formulario de OT — useTechnicians, assignedToId | ✅ Cerrado y auditado |
| v0.9.0 | Hito 7 | Edición de OT desde el detalle — WorkOrderEditModal, WorkOrderFormFields compartido, doble guardia | ✅ Cerrado y auditado |
| v0.9.1 | — | Auditoría DT-06: corrección documental | ✅ Cerrado y auditado |
| v1.0.0 | Hito 8 | Módulo de gestión de evidencias FileAttachment — upload, list, download, delete polimórfico | ✅ Cerrado y auditado |
| v1.1.0 | Hito 9 | Motor Documental — Design System documental, plantilla Cotización, endpoint PDF on-demand | ✅ Cerrado y auditado |
| v1.2.0 | Hito 10-A | Evidencias en OT y Actas — EvidencesCard, FileAttachmentSection, bug descarga corregido | ✅ Cerrado y auditado |
| v1.3.0 | Hito 10-B | Ciclo de vida Cotizaciones — transiciones de estado, PDF desde el detalle | ✅ Cerrado y auditado |
| v1.4.0 | Hito 11 | Acta Técnica PDF — ServiceRecordDocument, endpoint service-record/pdf | ✅ Cerrado y auditado |
| v1.5.0 | Hito 12 | Cierre del Ciclo de Cobro — InvoiceDocument PDF, endpoint invoices/:id/pdf | ✅ Cerrado y auditado |
| v1.6.0 | Hito 13-A | Schema de Mantenimiento Preventivo — 4 nuevas entidades, 6 enums, migración aplicada, compilación limpia | ✅ Cerrado y auditado |
| v1.7.0 | Hito 13-B | MaintenanceContract CRUD — backend + frontend completo (CMTO-YYYY-NNNNN) | ✅ Cerrado y auditado |
| v1.7.0 | Hito 13-C | MaintenanceVisit — programación, cancelación, eliminación y generación de OT en transacción atómica | ✅ Cerrado y auditado |
| v1.7.0 | Hito 13-D | Dashboard KPIs mantenimiento — contratos activos, planes activos, visitas vencidas; corrección bug upcomingVisits | ✅ Cerrado y auditado |
| v1.8.0 | Hito 14 | Facturación de Contratos — Invoice.contractId, createFromContract(), InvoiceCreatePage dual, botón "Nueva CC" en contratos activos | ✅ Cerrado y auditado |

**Estado general:** Build limpio · TypeScript 0 errores · Hito 14 cerrado · Facturación de contratos operativa · Motor Documental activo · Auth fullstack congelada

---

## Deuda técnica activa

| ID | Descripción | Severidad | Origen |
|----|-------------|-----------|--------|
| DT-01 | Botón "Cancelar" en `WorkOrderHeader` ejecuta transición sin dialog de confirmación | Baja | Hito 2 |
| DT-02 | `refreshTokenHash` se sobrescribe en cada login — sesión única por usuario | Baja-Media | Hito 4 |
| DT-03 | Refresh token no rota en cada uso de `POST /auth/refresh` | Baja | Hito 4 |
| DT-04 | `JwtPayload.role` tipado como `string` en lugar de `UserRole` | Baja | Hito 4 |
| DT-05 | `clearRefreshCookie` es método público en `AuthService` | Baja | Hito 4 |

---

## Módulos congelados (no modificar salvo bug real)

- **Subsistema de autenticación y autorización** (`auth/`, `AuthContext`, `api.ts`): Congelado. Guards, refresh token, mutex de 401, `RolesGuard` — estable y auditado.
- **Sistema de identidad visual** (`index.css` tokens, `badge.tsx` variantes, `Sidebar`): Congelado desde v0.1.0.
- **Motor Documental** (`documents/base/`, `documents/templates/`): Las 3 plantillas (Cotización, Acta Técnica, Cuenta de Cobro) están auditadas y funcionales.

---

## Arquitectura aprobada

### Reglas de estructura (no negociables)

- **Páginas = orquestadoras puras**: ninguna página contiene lógica de negocio, constantes de dominio ni JSX más allá de layout.
- **Componentes por módulo**: `src/components/<módulo>/`
- **Hooks encapsulan toda llamada HTTP**: ningún componente llama a `api.*` directamente.
- **Colores únicamente mediante design tokens**: cero colores Tailwind hardcodeados.
- **TanStack Query v5** para acceso a datos.
- **React Hook Form + Zod + zodResolver** para todos los formularios.
- **shadcn/ui** como librería de componentes base. `Select` de shadcn **no está instalado** — usar `<select>` nativo con clase `SELECT_CLASS`.
- **Soft delete** en entidades financieras con campo `deletedAt DateTime?`.
- **Prisma Decimal → string en frontend**: los campos `Decimal` se serializan como `string`. Frontend usa `parseFloat()` para cálculos.
- **Fechas `@db.Date` con `.slice(0, 10)`**: evita el problema UTC-5 (Colombia) con `parseISO`.

### Reglas de proceso (no negociables)

- **Auditoría antes y después de cada hito**.
- **CHANGELOG obligatorio** en cada cambio funcional.
- **Este archivo** debe actualizarse al cierre de cada sesión.
- **No introducir deuda técnica deliberadamente**.

---

## Estado del backend

### Módulos implementados

| Módulo | Observaciones |
|--------|---------------|
| `auth` | Completo. Congelado. |
| `clients` | CRUD + soft delete + paginación |
| `branches` | CRUD anidado bajo client |
| `quotations` | CRUD + estados + secuencia de numeración |
| `work-orders` | CRUD + transiciones de estado + items |
| `service-records` | `findByEquipment` filtra via `workOrder.equipmentId` |
| `invoices` | `workOrderId` nullable; `contractId?` (Hito 14); `createFromContract()` crea ítem automático |
| `payments` | Crear + anular pagos |
| `expenses` | CRUD + política de edición por estado OT |
| `equipment` | CRUD + soft delete |
| `maintenance-plans` | Depende de `contractId` (no clientId/branchId) |
| `maintenance-contracts` | CRUD + soft delete + numeración `CMTO-YYYY-NNNNN` |
| `maintenance-visits` | Programación + cancelación + generación OT (transacción atómica) |
| `users` | CRUD + deactivate + changePassword |
| `dashboard` | KPIs mantenimiento: activeContracts, activePlans, overdueVisits |
| `files` | Polimórfico `entityType + entityId` |
| `documents` | PDF on-demand: Cotización, Acta Técnica, Cuenta de Cobro. Congelado. |

### Infraestructura

- **NestJS v11** · **Prisma ORM v7** · PostgreSQL `localhost:5433` / `erp_emprendedores`
- Cliente Prisma en `src/generated/prisma/`; `moduleFormat = "cjs"`
- **9 migraciones aplicadas**; última: `20260706010918_hito13_maintenance_module`
- **Cadena de guards (congelada):** `ThrottlerGuard` → `JwtAuthGuard` → `RolesGuard`
- Puerto backend: 3000 | Puerto frontend: 5173

---

## Arquitectura del módulo de Mantenimiento (Hito 13)

### Nuevas entidades (13-A — CERRADO)

| Modelo | Propósito |
|--------|-----------|
| `MaintenanceContract` | Contrato comercial. Aggregate raíz del dominio mantenimiento. |
| `ContractEquipment` | M:N contrato ↔ equipo. `@@unique([contractId, equipmentId])` |
| `MaintenancePlan` | Plan técnico de frecuencia. Depende de un contrato. |
| `MaintenancePlanEquipment` | M:N plan ↔ equipo. `@@unique([planId, equipmentId])` |
| `MaintenanceVisit` | Visita programada. `PENDING → GENERATED → COMPLETED / CANCELLED`. |

**Cambios a entidades existentes:**
- `Equipment`: + `criticality EquipmentCriticality @default(MEDIUM)`, `warrantyExpiresAt DateTime? @db.Date`
- `WorkOrder`: + `type WorkOrderType @default(CORRECTIVE)`, `equipmentId String?`, back-ref `maintenanceVisit MaintenanceVisit?`
- `Invoice`: `workOrderId` nullable `@unique`; + `contractId String?`; CHECK `invoice_requires_reference`
- `ServiceRecord`: eliminado `equipmentId` (movido a `WorkOrder`)
- `MaintenancePlan`: eliminados `clientId`, `branchId`, `contractStartDate`, `contractEndDate`, `nextVisitDate`; agregados `contractId`, `startDate`

**Nuevos enums:** `EquipmentCriticality`, `WorkOrderType`, `ContractStatus`, `BillingCycle`, `ServiceHoursLevel`, `MaintenanceVisitStatus`

**Reglas de negocio invariantes:**
- `OVERDUE` no se persiste — computable: `scheduledDate < today AND status = PENDING`
- `MaintenanceVisit.workOrderId @unique` — una visita genera máximo una OT
- `Invoice` debe tener `workOrderId` OR `contractId` (CHECK constraint en PostgreSQL)
- Seed de planes comentado hasta que existan contratos (Hito 13-B)

### Roadmap Hito 13

| Sub-hito | Descripción | Estado |
|----------|-------------|--------|
| **13-A** | Schema migration — 4 entidades, 6 enums, migración PostgreSQL | ✅ CERRADO |
| **13-B** | MaintenanceContract CRUD — backend + frontend, numeración CMTO | ✅ CERRADO |
| **13-C** | MaintenanceVisit — programación, OT en transacción, cancelación | ✅ CERRADO |
| **13-D** | Dashboard KPIs mantenimiento + correcciones de auditoría | ✅ CERRADO |

**Correcciones de auditoría aplicadas al cierre del Hito 13:**
- `upcomingVisits` filtra `scheduledDate >= hoy` (antes incluía vencidas)
- `overdueVisits` filtra `plan.isActive = true` (consistencia con visitas próximas)
- `ensureQuotationAvailable` acepta solo estado `APPROVED` (CONVERTED = ya consumida)
- `useGenerateWorkOrder` invalida cache `['dashboard']` en `onSuccess`

---

## Decisiones arquitectónicas clave

| Decisión | Justificación |
|----------|---------------|
| FK circular `WorkOrder ↔ MaintenanceVisit` resuelta unidireccionalmente | Solo `MaintenanceVisit.workOrderId @unique`. WorkOrder recibe back-reference Prisma sin columna extra. |
| `OVERDUE` computado, no persistido | Evita estado desincronizado y jobs de actualización. |
| `ServiceRecord.equipmentId` eliminado | Con `WorkOrder.equipmentId` era redundante y fuente de inconsistencia. |
| `Invoice.workOrderId` nullable + CHECK constraint | Hito 13 requiere facturas por contrato. El CHECK garantiza siempre una referencia. No expresable en Prisma — añadida como SQL raw en migración. |
| Upload multipart via `fetch` nativo | `api.post` usa `JSON.stringify` — incompatible con FormData. |
| `IStorageService` / `STORAGE_SERVICE` token de inyección | Permite intercambiar `LocalStorageService` por `R2StorageService` sin tocar la lógica. |
| Archivos servidos por NestJS (`GET /files/:id/download`) | El guard de autenticación aplica a todos los archivos. |
| Select nativo en lugar de shadcn Select | `@radix-ui/react-select` no está instalado. Patrón con `SELECT_CLASS`. |

---

## Riesgos abiertos

| Riesgo | Severidad | Plan |
|--------|-----------|------|
| Storage local (`uploads/`) sin backup ni límite de disco | Baja | Migrar a Cloudflare R2 antes de staging — solo cambiar provider `STORAGE_SERVICE`. |
| Botón "Cancelar" OT sin confirmación (DT-01) | Baja | Diferido. Sin impacto grave. |

---

## Reglas para retomar el proyecto

1. **Leer `DEVELOPMENT_CONTEXT.md`** — estado actual, módulos congelados, próximo hito.
2. **Leer `CHANGELOG.md`** — versión actual y últimos cambios.
3. **Auditar el módulo a desarrollar** — revisar código real, no asumir desde memoria.
4. **No modificar módulos congelados** salvo bug funcional real.
5. **No comenzar hito sin acordar alcance** — confirmar antes de implementar.

**Credenciales de desarrollo:**
- `admin@erp.local` / `Admin2026!` · `mario@erp.local` / `Mario2026!`
- PostgreSQL: `localhost:5433` / `erp_emprendedores`
- Backend: `http://localhost:3000` | Frontend: `http://localhost:5173`

---

*Actualizado: 2026-07-07 — v1.7.0 — Hito 13 cerrado y estable (A–D): módulo de Mantenimiento Preventivo completo — contratos, planes, visitas, generación de OTs, KPIs dashboard · Auditoría post-hito aplicada (4 correcciones) · Próximo: Hito 14*
