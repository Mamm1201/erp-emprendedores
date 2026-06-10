# CLAUDE.md — Contexto del proyecto ERP/CMMS

## Quién y qué

**Propietario:** Mario Alejandro Márquez Moreno  
**Negocio:** Empresa de mantenimiento hospitalario (persona natural con establecimiento de comercio, Colombia)  
**Proyecto:** ERP / CMMS para gestionar clientes, cotizaciones, órdenes de trabajo, cuentas de cobro y planes de mantenimiento preventivo.

> No emite facturas; usa **Cuentas de Cobro** (`Invoice` en el modelo, prefijo `CC-`).

---

## Stack

| Capa | Tecnología |
|---|---|
| Backend | NestJS 11 · Prisma 7 · PostgreSQL 16 |
| Frontend | React 19 · Vite 8 · Tailwind CSS 4 · TanStack Query v5 · react-hook-form + Zod |
| Lenguaje | TypeScript estricto en ambos lados |

Rutas del workspace:
- Backend: `C:\Users\mmmal\ProyectosMario\erp-emprendedores\backend`
- Frontend: `C:\Users\mmmal\ProyectosMario\erp-emprendedores\frontend`
- Schema Prisma: `backend/prisma/schema.prisma`
- Prisma client generado: `backend/src/generated/prisma` (no `@prisma/client`)

---

## Flujo de negocio

```
Cliente → Cotización (DRAFT→SENT→APPROVED) → Orden de Trabajo (DRAFT→SCHEDULED→IN_PROGRESS→COMPLETED)
                                                         ↓
                                               Cuenta de Cobro (DRAFT→ISSUED→PARTIALLY_PAID→PAID | VOID)
                                                         ↓
                                                    Pago registrado
```

Reglas clave:
- Una cotización APPROVED puede convertirse en OT (estado `CONVERTED`).
- Una OT `COMPLETED` sin invoice puede generar una Cuenta de Cobro.
- `WorkOrder.invoice` es `@unique` — una OT tiene como máximo una CC.
- Soft-delete en `Client`, `Branch`, `Quotation`, `WorkOrder` vía `deletedAt`.
- `Invoice` usa `voidedAt` / `voidReason` (no `deletedAt`).
- `Payment` usa `voidedAt` / `voidReason` (void via `PATCH`, no `DELETE`, para poder enviar body).

---

## Módulos del backend (`backend/src/modules/`)

| Módulo | Archivos clave | Notas |
|---|---|---|
| `clients` | controller, service, dto | CRUD + soft-delete |
| `branches` | controller, service, dto | Pertenecen a un cliente |
| `quotations` | controller, service, dto, quotations-document.service | `nextDocumentNumber(tx, docType, prefix)` para auto-numeración |
| `work-orders` | controller, service, dto, constants | `WORK_ORDER_SELECT` incluye `invoice` |
| `invoices` | controller, service, dto, constants | `INVOICE_SELECT`, `PAYMENT_SELECT`, `recalculateInvoiceStatus` |
| `maintenance-plans` | controller, service, dto | `nextVisitDate` avanza al ejecutar OT |
| `service-records` | controller, service, dto | Acta técnica con checklist |
| `equipment` | controller, service, dto | Hoja de vida por sede |
| `dashboard` | controller, service | `GET /dashboard` con 10 queries en `Promise.all` |

### Utilidades comunes

```typescript
// backend/src/common/utils/money.util.ts
calculateLineTotals(items)   // recalcula lineSubtotal / lineTotal
sumMoney(decimals[])         // suma Decimal[] → Decimal
toMoney(n)                   // number → Decimal(12,2)
```

### Numeración de documentos

```typescript
// En cualquier servicio, dentro de una transacción:
import { nextDocumentNumber } from '../quotations/quotations-document.service';
const number = await nextDocumentNumber(tx, DocumentType.INVOICE, 'CC');
// Genera: CC-2025-001, CC-2025-002, …
```

### Regla de orden de rutas en NestJS

Las rutas literales DEBEN declararse **antes** de las parametrizadas:

```typescript
@Get('summary')   // ← primero
@Get('payments')  // ← primero
@Get(':id')       // ← al final
```

### Booleanos en query params (DTOs)

```typescript
@Transform(({ value }) => value === 'true' || value === true)
@IsBoolean()
includeVoided?: boolean;
```

---

## Módulos del frontend (`frontend/src/`)

### Páginas (`pages/`)

| Página | Ruta | Descripción |
|---|---|---|
| `DashboardPage` | `/` | KPIs, pipeline, visitas próximas, últimos pagos |
| `ClientsPage` | `/clientes` | Lista + form de clientes y sedes |
| `QuotationsPage` | `/cotizaciones` | Lista con filtros y acciones de estado |
| `QuotationFormPage` | `/cotizaciones/nueva`, `/cotizaciones/:id` | Formulario con líneas dinámicas (`useFieldArray`) |
| `WorkOrdersPage` | `/ordenes` | Lista con acciones de estado y botón "Crear CC" |
| `InvoicesPage` | `/cuentas-cobro` | Lista cuentas de cobro con resaltado vencidas |
| `InvoiceCreatePage` | `/cuentas-cobro/nueva` | Crea CC desde OT completada; acepta `?workOrderId=` |
| `InvoiceDetailPage` | `/cuentas-cobro/:id` | Detalle + registrar pago + anular |
| `PaymentsPage` | `/pagos` | Todos los pagos con filtros |
| `EstadoCuentasPage` | `/estado-cuentas` | KPIs financieros + gráfico mensual |
| `MaintenancePlansPage` | `/planes` | Planes de mantenimiento preventivo |
| `ServiceRecordsPage` | `/actas` | Actas técnicas con checklist |
| `EquipmentPage` | `/equipos` | Inventario de equipos por sede |

### Hooks (`hooks/`)

| Hook | Archivo | QueryKey |
|---|---|---|
| `useClients` | `use-clients.ts` | `['clients']` |
| `useQuotations` / `useQuotation` | `use-quotations.ts` | `['quotations']` |
| `useWorkOrders` / `useWorkOrder` | `use-work-orders.ts` | `['work-orders']` |
| `useInvoices` / `useInvoice` | `use-invoices.ts` | `['invoices']` |
| `useAllPayments` | `use-invoices.ts` | `['payments']` |
| `useFinancialSummary` | `use-invoices.ts` | `['invoices-summary']` |
| `useDashboard` | `use-dashboard.ts` | `['dashboard']` (stale 60s, refetch 5min) |
| `useMaintenancePlans` | `use-maintenance-plans.ts` | `['maintenance-plans']` |

### Utilidades

```typescript
// frontend/src/lib/money.ts
formatMoney(value: string | number): string   // formatea COP
calcLineTotal(qty, price, discount, taxRate)  // cálculo de línea

// frontend/src/lib/api.ts
api.get<T>(path, params?)
api.post<T>(path, body)
api.patch<T>(path, body)
api.delete<T>(path)

// frontend/src/lib/utils.ts
cn(...classes)   // clsx + tailwind-merge
```

### Tipos principales (`frontend/src/lib/types.ts`)

`Client`, `Branch`, `Quotation`, `QuotationItem`, `WorkOrder`, `Invoice`, `InvoiceItem`, `Payment`, `PaymentWithInvoice`, `MaintenancePlan`, `Equipment`, `ServiceRecord`, `ChecklistItem`, `DashboardData`, `FinancialSummary`, `PaginatedResponse<T>`

> Los campos `Decimal` de Prisma llegan al frontend como `string`. Usar `parseFloat()` o `formatMoney()` para mostrar.

---

## Patrones establecidos

### Selects de Prisma con type-safety

```typescript
export const INVOICE_SELECT = {
  id: true,
  number: true,
  // ...
} satisfies Prisma.InvoiceSelect;
```

### Transiciones de estado

Cada módulo define un `ALLOWED_TRANSITIONS` record y lo valida antes de cambiar el estado:

```typescript
const ALLOWED: Record<QuotationStatus, QuotationStatus[]> = {
  DRAFT: ['SENT', 'CANCELLED'],
  SENT:  ['APPROVED', 'REJECTED', 'EXPIRED'],
  // ...
};
```

### Formularios con líneas dinámicas

`useFieldArray` + `useWatch` para totales en tiempo real sin re-renders innecesarios. Patrón en `QuotationFormPage.tsx`.

### Paginación

Backend devuelve `{ data: T[], meta: { page, limit, total, totalPages } }`.  
Frontend usa `placeholderData: (prev) => prev` para paginación suave.

---

## Comandos útiles

```bash
# Backend
cd backend
npx tsc --noEmit          # verificar tipos
npm run start:dev         # arrancar en modo watch

# Frontend
cd frontend
npx tsc --noEmit          # verificar tipos
npm run dev               # Vite dev server

# Base de datos
cd backend
npx prisma migrate dev    # aplicar migraciones
npx prisma studio         # GUI de Prisma
```

---

## Git

- Rama principal de desarrollo: `develop`
- Convención de commits: `feat:`, `fix:`, `refactor:`
- Repositorio remoto en GitHub (origin)

---

## Pendientes / próximos módulos

- [ ] Autenticación (JWT + roles: ADMIN, COMMERCIAL, TECHNICIAN, BILLING) — el modelo `User` ya existe en el schema
- [ ] Módulo de Gastos (`Expense`) — modelo en schema, sin endpoint todavía
- [ ] Reportes en PDF (cotizaciones, cuentas de cobro)
- [ ] Notificaciones de planes de mantenimiento próximos a vencer
