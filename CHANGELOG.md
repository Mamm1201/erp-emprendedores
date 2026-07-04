# Changelog — ERP Emprendedores (STECH NODES)

> A partir de esta versión, toda funcionalidad nueva, corrección relevante o cambio arquitectónico debe registrarse aquí siguiendo [versionado semántico](https://semver.org/). No registrar cambios cosméticos menores (ajustes de espaciado, renombrados triviales, etc.).

---

## v0.4.1 — Auditoría Hito 3: Módulo de Costos (2026-07-03)

### Corregido
- `expenses.service.ts` (`remove`): eliminado segundo `new Date()` en el valor de retorno — ahora se captura en variable antes del update y se reutiliza, garantizando que el timestamp retornado sea idéntico al almacenado en DB.
- `ExpensesCard.tsx`: fecha del gasto ahora se parsea como `expense.expenseDate.slice(0, 10)` antes de pasarla a `parseISO`, evitando que la conversión UTC→local muestre el día anterior en zonas UTC-N (Colombia, UTC-5).
- `ExpensesCard.tsx` (modo edición): campo `expenseDate` en el formulario ahora usa `.slice(0, 10)` directamente en lugar de `format(parseISO(...), 'yyyy-MM-dd')`.
- Eliminado import `ExpenseCategory` no utilizado de `expenses.service.ts`.
- Eliminado import `Badge` no utilizado de `ExpensesCard.tsx`.

### Arquitectura
- `CATEGORY_LABEL` y `CATEGORY_ORDER` movidos a `src/lib/expense-constants.ts` — eliminado acoplamiento de importación entre componentes hermanos `ExpensesCard` y `CostSummaryCard`.

### Política de edición de gastos
- Backend: `create`, `update` y `remove` verifican estado de la OT mediante `assertEditable()` — COMPLETED y CANCELLED son inmutables. Error 400 con mensaje claro.
- Frontend: `ExpensesCard` recibe `workOrderStatus`; oculta botón "Registrar gasto" y acciones editar/eliminar cuando la OT está COMPLETED o CANCELLED.

### Diferido
- **Cancelación sin confirmación** (Hito 2): botón "Cancelar" en `WorkOrderHeader` dispara inmediatamente sin dialog. Severidad baja — sin impacto en módulo de costos. Pendiente para Hito 4.

---

## v0.4.0 — Módulo de Costos de la Orden de Trabajo (2026-07-03)

### Añadido — Backend
- Módulo NestJS `expenses/` con controller, service y DTOs.
- 4 endpoints bajo `/work-orders/:workOrderId/expenses`: GET, POST, PATCH /:id, DELETE /:id.
- Eliminación lógica (soft delete) vía campo `deletedAt` — trazabilidad financiera preservada.
- Validación de negocio: no se permiten gastos en órdenes con estado `CANCELLED`.
- `ExpensesModule` registrado en `AppModule`.
- Campo `deletedAt DateTime?` añadido al modelo Prisma `Expense` + índice + cliente regenerado.
- Migración pendiente de ejecutar cuando el servidor de base de datos esté disponible: `add_expense_soft_delete`.

### Pendiente de infraestructura
Antes de desplegar el backend en cualquier entorno (desarrollo, staging, producción), ejecutar:
```bash
npx prisma migrate dev --name add_expense_soft_delete
```
Este comando aplica el campo `deletedAt DateTime?` e índice `@@index([deletedAt])` al modelo `Expense` en la base de datos. Sin esta migración, los endpoints del módulo de gastos fallarán en runtime.

### Añadido — Frontend
- Tipos `Expense` y `ExpenseCategory` en `types.ts`.
- `use-expenses.ts` — `useExpenses`, `useCreateExpense`, `useUpdateExpense`, `useDeleteExpense`, con invalidaciones independientes de `useWorkOrder`.
- `ExpensesCard` — tabla agrupada por categoría con subtotales, acciones hover (editar/eliminar), total de costos.
- `ExpenseFormModal` integrado en `ExpensesCard` — patrón ERP consistente con el resto de modales.
- `DeleteConfirmDialog` con mensaje de trazabilidad ("el registro se conservará en el historial").
- `CostSummaryCard` — panel de rentabilidad lateral: ingreso (facturado o estimado), desglose de costos por categoría, margen bruto y porcentaje.
- Color del margen por umbral: ≥40% `node-teal`, 20–39% `amber-signal`, <20% o pérdida `alert-red`.
- Indicador "Ingreso estimado" cuando no hay factura emitida, con nota explicativa.
- Integración en `WorkOrderDetailPage`: `ExpensesCard` en columna principal, `CostSummaryCard` en columna lateral.

### Arquitectura
- Gastos completamente desacoplados de WorkOrder: `useExpenses` e `useWorkOrder` son queries independientes con invalidaciones separadas.
- `CATEGORY_LABEL` y `CATEGORY_ORDER` definidos en `ExpensesCard` (movidos a `expense-constants.ts` en v0.4.1).
- `CostSummaryCard` retorna `null` cuando no hay gastos — no ocupa espacio visual hasta que hay datos.

---

## v0.3.0 — Expediente de Orden de Trabajo (2026-07-03)

### Añadido
- Ruta `/ordenes/:id` — página de detalle de Orden de Trabajo.
- Nuevos componentes reutilizables en `src/components/work-orders/`:
  - `WorkOrderHeader` — número, badge de estado y acciones de ciclo de vida contextuales.
  - `WorkOrderInfoCard` — datos generales (fechas, cliente, sede, técnico, cotización origen).
  - `WorkOrderItemsCard` — tabla de líneas de servicio con totales (subtotal, descuento, IVA, total).
  - `ServiceRecordCard` — acta técnica con campos de texto guardables y checklist interactivo por ítem.
- `TimelineCard` y `InvoiceSideCard` integrados en la página como componentes de columna lateral.
- `useWorkOrder(id)` — query de detalle individual con `staleTime: 30s`.
- `useUpdateWorkOrder(id)` — mutación para edición parcial de OT.
- `WorkOrderUpdateData` — interfaz exportada desde `use-work-orders.ts`.
- `WorkOrderItem` — tipo añadido a `types.ts`; `WorkOrder.items?` extendido.
- `useUpdateWorkOrderStatus` ahora invalida también `['work-orders', id]` al completar.
- Número de OT en `WorkOrdersPage` navega a `/ordenes/:id`.

### Corregido (auditoría post-implementación)
- `TimelineCard` e `InvoiceSideCard` extraídos a `src/components/work-orders/` propios — `WorkOrderDetailPage` ahora es un orquestador puro sin lógica embebida.
- `WorkOrderInfoCard`: ícono `Building2` para Cliente (antes usaba `MapPin` igual que Sede).
- `WorkOrderInfoCard`: `assignedToId` y `quotationId` ya no muestran UUIDs crudos al operador.
- `ServiceRecordCard`: errores genuinos de API (5xx) diferenciados del 404 — no se muestra "Crear acta" ante fallos de red.
- `SaveableTextarea`: tipo de `onSave` corregido a `Promise<void>`.

### Arquitectura
- Layout de detalle: header + grid `lg:col-span-2` (main) / `col-span-1` (lateral).
- Diseño responsive desde el primer commit: mobile-first, optimizado para escritorio.
- Puntos de integración preparados para: gastos, PDF, archivos, comentarios, auditoría.
- 6 componentes en `src/components/work-orders/`: `WorkOrderHeader`, `WorkOrderInfoCard`, `WorkOrderItemsCard`, `ServiceRecordCard`, `TimelineCard`, `InvoiceSideCard`.

---

## v0.2.0 — Gestión de Sedes (2026-07-03)

### Añadido
- CRUD completo de sedes integrado al módulo de Clientes mediante patrón expand-in-table.
- Nuevos componentes reutilizables en `src/components/branches/`:
  - `BranchList` — listado con estados loading / error / vacío / poblado.
  - `BranchFormModal` — crear y editar sedes con Zod + react-hook-form.
  - `BranchDeleteDialog` — confirmación de eliminación con protección de sede principal.
- Nuevas mutaciones en `src/hooks/use-branches.ts`: `useCreateBranch`, `useUpdateBranch`, `useDeleteBranch`.
- Exportada la interfaz `BranchFormData` desde el hook.

### Corregido
- `ClientsPage.tsx`: fragmento de lista reemplazado de `<>` a `<React.Fragment key={...}>` para eliminar advertencia de React sobre `key` en listas.
- `BranchFormModal.tsx`: checkbox `isPrimary` ahora tiene `id`/`htmlFor` explícitos, consistente con el resto del formulario.

### Arquitectura
- Regla establecida: los sub-componentes de cada módulo van en `src/components/<módulo>/`. La página actúa únicamente como orquestadora.

---

## v0.1.0 — Sistema de Identidad Visual STECH NODES (2026-07-03)

### Añadido
- Bloque `@theme` en `index.css` con 11 tokens de color y 2 variables de tipografía del sistema STECH NODES.
- Mapeo de tokens semánticos a variables de shadcn/ui (`:root`).
- Sidebar siempre en modo oscuro (`Deep Space #030D18`); infraestructura `.dark {}` preparada pero no activada.
- Componentes `NodeMark` (SVG) y `BrandHeader` en `Sidebar.tsx`. Dirección visual congelada como baseline.
- Variantes semánticas en `badge.tsx` (`success`, `warning`, `danger`, `info`) migradas a design tokens STECH NODES.

### Cambiado
- Eliminados colores Tailwind hardcodeados en: `DashboardPage`, `EstadoCuentasPage`, `InvoiceDetailPage`, `InvoicesPage`, `QuotationFormPage`, `QuotationsPage`, `WorkOrdersPage`, `ServiceRecordsPage`. Reemplazados por `hsl(var(--...))` o tokens de diseño (`text-node-teal`, `text-amber-signal`, etc.).

### Arquitectura
- Política establecida: ninguna pantalla, componente o módulo nuevo debe usar colores Tailwind hardcodeados. Toda referencia de color debe pasar por los design tokens registrados en `@theme`.
