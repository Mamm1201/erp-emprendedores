# Plan de implementación — Finanzas Escenario 1

**Fecha:** 2026-07-30 · **Base de diseño:** `docs/functional/finanzas-escenario-1-design-v1.0.md`
**Estado:** backlog técnico listo para implementar. Nada implementado aún.

Regla transversal: Finanzas es **derivado y de solo lectura**. Todos los endpoints nuevos
son de lectura; ninguno modifica `Invoice`, `Payment`, `Expense`, `WorkOrder` ni sus
invariantes. Fuentes de verdad: ingreso=`Invoice`, cobro=`Payment`, costo=`Expense`.

---

## 0. Inventario de reutilización (lo que YA existe)

| Pieza | Qué hace hoy | Reutilización |
|---|---|---|
| `invoices.service.getSummary()` | byStatus, overdue{count,total}, totalReceivable, partiallyPaidAmount, paidThisMonth, paidLastMonth, revenueByMonth | Base de Cartera y Pulso; **extender**, no reescribir |
| `GET /invoices/summary` · `useFinancialSummary()` | alimenta `EstadoCuentasPage` | Base de Cartera |
| `EstadoCuentasPage.tsx` | resumen financiero (por cobrar, vencidas, cobrado, por estado, 12m) | **Evoluciona → Cartera** |
| `InvoicesPage.tsx` · `useInvoices` | listado de cuentas de cobro, filtro estado, marca de vencida | Superficie operativa; +columna saldo |
| `PaymentsPage.tsx` · `useAllPayments` | listado de pagos | Superficie operativa; recibe el histórico 12m |
| `CostSummaryCard.tsx` | ingreso/costo/margen por OT | **Se enriquece** (estado ciclo + cobrado + fix ingreso) |
| `work-orders.service.findOne` | detalle OT con `invoice{id,number,status}` | **Extender** select (invoice.total + pagado) |
| `dashboard.service` | conteos por estado (cotización/OT/factura), pagos, visitas vencidas | Teasers del Dashboard |
| `expenses.service` · `useExpenses` | gastos por OT | Costo por OT y por cliente |
| `Sidebar.tsx` | menú | Reagrupar Finanzas |

**No existe hoy (hay que crear):** aging por antigüedad, cartera por cliente, rollup
económico por cliente, conteos del embudo del ciclo, listas de atención, margen global,
saldo por factura expuesto, y las vistas Pulso / Atención / Cliente.

---

## 1. Fundación backend — módulo de lectura `finance`

Nuevo módulo NestJS **de solo lectura** (`modules/finance`) que compone sobre los
repositorios existentes. Concentra las derivaciones analíticas para no inflar `invoices`.
Reutiliza `getSummary` donde aplica.

### Servicios / derivaciones nuevas
| Derivación | Lógica (solo lectura) | Consumidores |
|---|---|---|
| **Aging de cartera** | facturas ISSUED/PARTIALLY_PAID agrupadas por antigüedad de `dueDate` (corriente/1-30/31-60/60+), sobre saldo (total − pagado) | Cartera |
| **Cartera por cliente** | receivable agrupado por `clientId` + su tramo de aging + concentración (top-N / total) | Cartera, Cliente(faceta cobro) |
| **Rollup económico por cliente** (ÚNICO, compartido) | por `clientId`: facturado (Σ Invoice ISSUED+), costo (Σ Expense vía OT→cliente), margen, nº OT, recurrencia (de `MaintenanceContract`), salud de cobro (por cobrar + vencido) | Cliente, Cartera-por-cliente |
| **Embudo del ciclo** | conteos+Σ por etapa: en ejecución (WO IN_PROGRESS), cerradas sin facturar (WO COMPLETED sin Invoice ISSUED+), facturadas sin cobrar (Invoice ISSUED/PARTIALLY_PAID), cobradas (Invoice PAID) | Pulso |
| **Margen global del período** | Σ Invoice (facturado) − Σ Expense (costo) por período | Pulso |
| **Listas de atención** | vencidas (reusa filtro de overdue), OT terminadas sin facturar, OT cerradas sin costos, OT margen negativo | Atención, Pulso(preview) |

### Endpoints nuevos (todos GET, solo lectura)
- `GET /finance/pulse?period=` → signos vitales (cobrado, facturado, margen global) + embudo + preview de atención.
- `GET /finance/attention` → listas de atención priorizables.
- `GET /finance/receivable` → total + aging + por cliente + concentración (extiende/compone `getSummary`).
- `GET /finance/clients/:clientId` → rollup económico del cliente.

### DTOs nuevos
- `FinancePeriodQueryDto` (period: mes/trimestre/año/rango; filtro opcional cliente).
- DTOs de respuesta (interfaces de lectura): `PulseDto`, `AttentionItemDto`, `ReceivableDto` (con `AgingBucketDto`, `ClientReceivableDto`), `ClientFinanceDto`.

**Verificación de la fundación:** cada endpoint responde con cifras que reconcilian con
`getSummary` (p. ej. Σ aging = totalReceivable; Σ cartera-por-cliente = totalReceivable).

---

## 2. OT — enriquecimiento + fix de ingreso (deuda registrada)

Aislado, de mayor valor y menor riesgo. **Primera tarea.**

**Backend**
- Extender `work-orders.service.findOne` (y `WORK_ORDER_SELECT`) para exponer
  `invoice.total` y el **pagado** de la factura (Σ payments no anulados) — hoy solo trae
  `{id,number,status}`.

**Frontend — `CostSummaryCard.tsx`**
- **Fix ingreso:** usar `invoice.total` (no `workOrder.total`) cuando hay factura emitida.
- Añadir **chip de estado del ciclo** (en ejecución / cerrada sin facturar / facturada sin
  cobrar / cobrada).
- Añadir **cobrado** subordinado al facturado (`Cobrado $Y · saldo $Z`).
- **Margen por estado:** provisional / pendiente de facturación / real.
- Reemplazar el `return null` cuando no hay gastos por aviso **"sin costos registrados · verificar"**.
- Enlaces contextuales a Cartera y Cliente.

**Reutiliza:** `useWorkOrder`, `useExpenses`, `CostSummaryCard`. **Hooks:** ninguno nuevo
si `findOne` ya trae `invoice.total`+pagado.

**Verificación:** en una OT facturada con precio distinto al estimado, el margen mostrado
cambia y coincide con `Invoice.total − Σ Expense`.

---

## 3. Cartera — evolución de `EstadoCuentasPage`

**Backend:** `GET /finance/receivable` (aging + por cliente + concentración) — sección 1.

**Frontend**
- `EstadoCuentasPage.tsx` → **Cartera**: titular de riesgo (total + vencido + tira aging),
  bloque cliente-first con aging embebido + concentración, enlaces a listados.
- **Quitar** de esta página el "cobrado del mes / mes anterior" e "ingresos 12 meses".
- `InvoicesPage.tsx`: **+columna saldo** (total − pagado) y filtro/entrada por antigüedad y cliente.
- `PaymentsPage.tsx`: **recibe** el histórico "ingresos cobrados 12 meses".

**Hooks:** `useFinancialSummary` → extender o `useReceivable` nuevo. **Reutiliza:** la página,
el hook y el listado existentes.

**Verificación:** Σ aging = totalReceivable; click en tramo/cliente → `InvoicesPage` filtrado.

---

## 4. Cliente (Rentabilidad)

**Backend:** `GET /finance/clients/:clientId` (rollup único) — sección 1. **Debe ser el mismo
rollup que consume Cartera-por-cliente** (construir una vez).

**Frontend**
- Vista de lectura económica del cliente (margen héroe → sustento → salud de cobro → acciones).
- **Decisión de ubicación (pendiente de IA):** hoy no existe detalle de cliente, solo
  `ClientsPage` (listado). Opciones: crear `ClientDetailPage` con facetas identidad(CRUD) +
  economía, o una vista de rentabilidad enlazada. Requiere ruta `/clientes/:id`.
- `ClientsPage`: enlace a la lectura económica.

**Hooks:** `useClientFinance(clientId)` nuevo. **Reutiliza:** el rollup compartido.

**Verificación:** margen del cliente = Σ(facturado de sus OT) − Σ(costo de sus OT); la faceta
"por cobrar" coincide con la de Cartera para ese cliente.

---

## 5. Pulso (vista nueva)

**Backend:** `GET /finance/pulse` (signos vitales + embudo + preview atención) — sección 1.

**Frontend**
- `PulsoPage.tsx` nueva: 3 bandas (signos vitales Cobrado/Facturado/Margen · embudo del ciclo ·
  preview de atención). Toggle firmeza, selector de período (flujos sí, cartera no).
- Ruta `/finanzas` o `/pulso` (entrada del módulo).

**Hooks:** `useFinancePulse()` nuevo. **Reutiliza:** `getSummary` (parte), embudo, atención.

**Verificación:** las etapas del embudo suman el total de OT activas; los signos vitales
coinciden con `getSummary`/margen global.

---

## 6. Atención (vista nueva)

**Backend:** `GET /finance/attention` — sección 1.

**Frontend**
- `AtencionPage.tsx` nueva: bandeja priorizada (default reordenable: prioridad/impacto/antigüedad),
  filas con qué pasó→quién→cuánto→acción. El mismo dato alimenta el preview del Pulso.

**Hooks:** `useAttention()` nuevo. **Reutiliza:** los mismos hechos; sin cálculo nuevo.

**Verificación:** cada alerta solo aparece sobre hechos en firme; al resolver la condición
(en otra pantalla) la alerta desaparece.

---

## 7. Arquitectura de información / navegación

**Frontend (último, cuando las vistas existan)**
- `Sidebar.tsx`: agrupar Finanzas — **Pulso (entrada)** · Cartera (renombrar "Estado de
  cuentas" manteniendo `/estado-cuentas` o migrar a `/cartera`) · Cuentas de cobro · Pagos.
- Rutas nuevas: Pulso, Atención, `/clientes/:id` (economía). OT y Cliente se alcanzan por contexto.
- `Dashboard`: sección financiera → **teasers** que enlazan a Pulso/Cartera (no recalcular).

**Verificación:** no hay dos protagonistas del mismo indicador; teasers enlazan al protagonista.

---

## 8. Dependencias entre tareas

```
[2] OT fix/enriquecimiento  ── independiente ──> se puede hacer ya
[1] Fundación backend finance ──> desbloquea [3][4][5][6]
        │  rollup por cliente (único) ──> [4] Cliente  y  [3] Cartera(por cliente)
        │  aging/receivable ──────────> [3] Cartera
        │  embudo + margen global ────> [5] Pulso
        │  listas de atención ────────> [6] Atención  y preview de [5]
[3][4][5][6] vistas ──> [7] IA/navegación (al final)
```

## 9. Orden recomendado de implementación

1. **OT — fix ingreso + enriquecimiento** (§2). Aislado, alto valor, cierra la deuda viva.
2. **Fundación backend `finance`** (§1), empezando por el **rollup por cliente** (compartido) y **receivable/aging**.
3. **Cartera** (§3). Máxima reutilización, bajo riesgo.
4. **Cliente** (§4). Reusa el rollup ya hecho; decidir ubicación de la vista.
5. **Pulso** (§5).
6. **Atención** (§6).
7. **IA / navegación + Dashboard teasers** (§7).

## 10. Riesgos técnicos

- **Fix de ingreso (OT):** exponer `invoice.total`+pagado en el detalle; verificar que ningún
  otro consumidor dependía del comportamiento viejo (`workOrder.total` como ingreso).
- **Rollup por cliente duplicado:** debe ser **una sola** implementación (Cartera y Cliente lo
  comparten); riesgo de dos agregaciones divergentes si no se disciplina.
- **Rendimiento:** aging, receivable-por-cliente y rollup deben resolverse con `groupBy`/
  `aggregate` únicos, evitando N+1.
- **Firmeza:** todas las derivaciones excluyen DRAFT y VOID (como ya hace `totalReceivable`).
- **Atribución por contrato parcial:** el enlace OT→visita→contrato falta en las OT de sede
  retroactivas; el agregado por cliente puede estar completo aunque el desglose por contrato no.
- **Vista de Cliente sin hogar:** no existe detalle de cliente; crear ruta/página añade
  superficie — confirmar ubicación antes.
- **Reestructura de navegación:** el Sidebar/rutas se usan en toda la app → riesgo de
  regresión; hacerlo al final y verificar.
- **Reconciliación:** cada nueva cifra debe cuadrar con `getSummary` (test de reconciliación).

## 11. Backlog ejecutable

**Tamaños:** XS (<1h) · S (~½ día) · M (~1-2 días) · L (>2 días / varias piezas).
**Clasificación:** Fundación · Feature · Refactor · UX · IA/Navegación · Deuda técnica.
**Estado inicial de todas las tareas:** `Pending`.

### T-01 — Exponer `invoice.total` y pagado en el detalle de OT
- **Objetivo:** que el detalle de la OT entregue el total facturado real y lo pagado, para que la card lea el ingreso de la factura.
- **Archivos:** `backend/src/modules/work-orders/work-orders.service.ts` (`findOne` select), `work-orders.constants.ts` (WORK_ORDER_SELECT); `frontend/src/lib/types.ts` (tipo `WorkOrder.invoice`).
- **Dependencias:** —
- **Tamaño:** S · **Clasificación:** Fundación
- **Criterio de aceptación:** `GET /work-orders/:id` devuelve `invoice.total` y el pagado (Σ payments no anulados); reconcilia con la factura.
- **Estado:** Pending

### T-02 — `CostSummaryCard` lee el ingreso de la factura (fix deuda)
- **Objetivo:** corregir el cálculo de ingreso/margen para usar `invoice.total` cuando hay factura emitida, no `workOrder.total`.
- **Archivos:** `frontend/src/components/work-orders/CostSummaryCard.tsx`.
- **Dependencias:** T-01
- **Tamaño:** S · **Clasificación:** Deuda técnica
- **Criterio de aceptación:** en una OT facturada con precio distinto al estimado, el margen = `Invoice.total − Σ Expense`.
- **Estado:** Pending

### T-03 — Chip de estado del ciclo económico en la card
- **Objetivo:** enmarcar la lectura con el estado del ciclo (en ejecución / cerrada sin facturar / facturada sin cobrar / cobrada).
- **Archivos:** `frontend/src/components/work-orders/CostSummaryCard.tsx` (+ helper de derivación de estado).
- **Dependencias:** T-01
- **Tamaño:** S · **Clasificación:** UX
- **Criterio de aceptación:** los 4 estados renderizan con el rótulo correcto según status de OT + factura.
- **Estado:** Pending

### T-04 — Cobrado subordinado + margen por estado
- **Objetivo:** mostrar cobrado/saldo bajo el facturado y rotular el margen según firmeza (provisional / pendiente de facturación / real).
- **Archivos:** `frontend/src/components/work-orders/CostSummaryCard.tsx`.
- **Dependencias:** T-01
- **Tamaño:** S · **Clasificación:** UX
- **Criterio de aceptación:** en cada estado del ciclo el margen muestra el rótulo de firmeza correcto y el cobrado solo aparece con factura emitida.
- **Estado:** Pending

### T-05 — Aviso "sin costos · verificar" en vez de ocultar la card
- **Objetivo:** que una OT cerrada sin gastos muestre el aviso de completitud en lugar de `return null`.
- **Archivos:** `frontend/src/components/work-orders/CostSummaryCard.tsx`.
- **Dependencias:** —
- **Tamaño:** XS · **Clasificación:** UX
- **Criterio de aceptación:** OT COMPLETED sin gastos muestra el aviso; el resto conserva el comportamiento.
- **Estado:** ✅ Completed (`7c2ddf3`) — gate por `cycle.label` (economicCycle); validado visualmente en 3 escenarios.

### T-06 — Módulo de lectura `finance` + DTO de período
- **Objetivo:** crear el módulo NestJS de solo lectura que aloja las derivaciones analíticas, componiendo sobre repositorios existentes.
- **Archivos:** `backend/src/modules/finance/` (module, controller, service), `dto/finance-period-query.dto.ts`; registrar en `app.module.ts`.
- **Dependencias:** —
- **Tamaño:** S · **Clasificación:** Fundación
- **Criterio de aceptación:** el módulo carga; un endpoint ping responde; `FinancePeriodQueryDto` valida period/rango/cliente.
- **Estado:** ✅ Completed (`93539d8`) — enum mínimo (CURRENT_MONTH/LAST_12_MONTHS/CUSTOM), sin @Roles, ping 401 sin token; 200 autenticado pendiente de sesión válida.

### T-07 — Rollup económico por cliente (único, compartido)
- **Objetivo:** una sola agregación por cliente: facturado, costo, margen, nº OT, recurrencia, salud de cobro.
- **Archivos:** `backend/src/modules/finance/finance.service.ts`, `finance.controller.ts` (`GET /finance/clients/:clientId`), `dto/client-finance.dto.ts`.
- **Dependencias:** T-06
- **Tamaño:** M · **Clasificación:** Fundación
- **Criterio de aceptación:** margen = Σ(facturado de sus OT) − Σ(costo de sus OT); la faceta "por cobrar" coincide con la de Cartera; resuelto con `groupBy`/`aggregate` únicos.
- **Estado:** ✅ Completed (`fa9f5df`) — facturado por `Invoice.clientId` (incl. contrato, caveat documentado); costo Σ gastos de sus OT (incl. canceladas, asimetría intencional); margen; nº OT no canceladas. Salud de cobro diferida a T-08 (opción c); all-time. Lógica verificada contra BD.

### T-08 — Receivable + aging + cartera por cliente
- **Objetivo:** exponer el receivable con distribución por antigüedad, por cliente y concentración.
- **Archivos:** `backend/src/modules/finance/finance.service.ts`, `finance.controller.ts` (`GET /finance/receivable`), `dto/receivable.dto.ts`; reutiliza `invoices.service.getSummary`.
- **Dependencias:** T-06
- **Tamaño:** M · **Clasificación:** Fundación
- **Criterio de aceptación:** Σ tramos de aging = `totalReceivable`; Σ cartera-por-cliente = `totalReceivable`; excluye DRAFT/VOID.
- **Estado:** ✅ Completed (`d3d5aed`) — Opción C: titular de `getSummary` (intacto), detalle en FinanceService protegido por invariantes `Decimal.equals()`; aging por dueDate, Top 5, sin clamp. Verificado contra BD (Σ=783.900).

### T-09 — Embudo del ciclo + margen global (endpoint Pulso)
- **Objetivo:** conteos/Σ por etapa del ciclo económico y margen global del período.
- **Archivos:** `backend/src/modules/finance/finance.service.ts`, `finance.controller.ts` (`GET /finance/pulse`), `dto/pulse.dto.ts`.
- **Dependencias:** T-06
- **Tamaño:** M · **Clasificación:** Fundación
- **Criterio de aceptación:** las etapas suman las OT activas; margen global = Σ facturado − Σ costo del período; signos vitales cuadran con `getSummary`.
- **Estado:** ✅ Completed (`a36af57`) — all-time; embudo lente OT (excluye canceladas, reglas = economicCycle), margen bruto (facturado firme de byStatus − costo directo), signos vitales de getSummary. SIN invariante embudo↔getSummary (contrato). Verificado contra BD.

### T-10 — Listas de atención
- **Objetivo:** derivar las listas accionables (vencidas, terminadas sin facturar, cerradas sin costos, margen negativo).
- **Archivos:** `backend/src/modules/finance/finance.service.ts`, `finance.controller.ts` (`GET /finance/attention`), `dto/attention.dto.ts`.
- **Dependencias:** T-06
- **Tamaño:** M · **Clasificación:** Fundación
- **Criterio de aceptación:** cada lista contiene solo hechos en firme (vencidas ISSUED+; sin costos/margen sobre OT COMPLETED); sin borradores.
- **Estado:** ✅ Completed (`dff983b`) — 4 listas (overdue=getSummary.overdue; completedNotInvoiced=etapa Cerrada sin facturar T-09; completedNoCost=condición T-05; negativeMargin mejor-ingreso opción b + firmness). As-of-now, sin límite. Verificado contra BD.

### T-11 — Cartera (evolución de `EstadoCuentasPage`)
- **Objetivo:** convertir la página en el hub de cartera (titular de riesgo + cliente-first con aging embebido + concentración).
- **Archivos:** `frontend/src/pages/EstadoCuentasPage.tsx`, `frontend/src/hooks/use-invoices.ts` (extender `useFinancialSummary` o `useReceivable`).
- **Dependencias:** T-08
- **Tamaño:** L · **Clasificación:** UX
- **Criterio de aceptación:** lectura <10s; jerarquía riesgo→clientes→acciones; cifras cuadran; ya no muestra cobrado/12m.
- **Estado:** ✅ Completed (`a954629`) — frontend-only sobre `/finance/receivable` (hook `use-finance.ts`). 3 bloques (riesgo/clientes/acciones); título+menú "Cartera", ruta intacta. Opción (a): clientes por saldo sin aging por fila (incremento backend diferido). Se quitó recaudo/12m/por-estado.

### T-12 — Columna saldo + filtros en `InvoicesPage`
- **Objetivo:** mostrar el saldo pendiente por factura y permitir filtrar por antigüedad/cliente.
- **Archivos:** `frontend/src/pages/InvoicesPage.tsx`, `frontend/src/hooks/use-invoices.ts` (exponer pagado por factura).
- **Dependencias:** T-08
- **Tamaño:** S · **Clasificación:** Feature
- **Criterio de aceptación:** columna saldo = total − pagado; filtro por antigüedad y cliente funciona.
- **Estado:** ✅ Completed (`b9a5d3b`) — dominio Facturación (autorizado); paidTotal en findAll + filtro aging (5 tramos, solo ISSUED/PARTIALLY_PAID). Verificado: nest build, tsc -b sin errores nuevos, lógica contra BD real. Validación visual no ejecutada (limitación de herramienta, no bloqueante).

### T-13 — Mover histórico 12 meses a `PaymentsPage`
- **Objetivo:** reubicar la tendencia de ingresos cobrados 12m (recaudo) a su superficie.
- **Archivos:** `frontend/src/pages/PaymentsPage.tsx`, `frontend/src/pages/EstadoCuentasPage.tsx` (quitar).
- **Dependencias:** —
- **Tamaño:** S · **Clasificación:** Refactor
- **Criterio de aceptación:** el histórico ya no aparece en Cartera y sí en Pagos; usa `revenueByMonth` de `getSummary`.
- **Estado:** ✅ Completed (`3d469ff`) — solo PaymentsPage.tsx; EstadoCuentasPage.tsx no requería cambios (T-11 ya lo había quitado). Reutiliza useFinancialSummary() y el render tal cual, sin endpoint nuevo.

### T-14 — Ruta y shell de detalle de cliente (`/clientes/:id`)
- **Objetivo:** crear la ruta/página de detalle con facetas identidad (CRUD) + economía.
- **Archivos:** `frontend/src/pages/ClientDetailPage.tsx` (nuevo), routing (`App.tsx`/router), `frontend/src/pages/ClientsPage.tsx` (enlace).
- **Dependencias:** —
- **Tamaño:** S · **Clasificación:** Feature
- **Criterio de aceptación:** `/clientes/:id` navegable; muestra identidad y un contenedor para economía.
- **Estado:** Pending

### T-15 — Vista de rentabilidad del cliente
- **Objetivo:** la lectura económica del cliente (margen héroe → sustento → salud de cobro → acciones).
- **Archivos:** `frontend/src/pages/ClientDetailPage.tsx` o componente `ClientFinanceCard.tsx`, `frontend/src/hooks/use-finance.ts` (`useClientFinance`).
- **Dependencias:** T-07, T-14
- **Tamaño:** M · **Clasificación:** Feature
- **Criterio de aceptación:** jerarquía margen→sustento→salud; consume el rollup único; no re-muestra la cartera.
- **Estado:** Pending

### T-16 — `PulsoPage` (vista nueva)
- **Objetivo:** la entrada de Finanzas: signos vitales + embudo del ciclo + preview de atención.
- **Archivos:** `frontend/src/pages/PulsoPage.tsx` (nuevo), `frontend/src/hooks/use-finance.ts` (`useFinancePulse`), routing.
- **Dependencias:** T-09, T-10
- **Tamaño:** L · **Clasificación:** Feature
- **Criterio de aceptación:** las 3 bandas renderizan; cifras coinciden con `GET /finance/pulse`.
- **Estado:** Pending

### T-17 — Toggle firmeza + selector de período en Pulso
- **Objetivo:** conmutar en firme / en curso y elegir período (flujos responden; cartera no).
- **Archivos:** `frontend/src/pages/PulsoPage.tsx`.
- **Dependencias:** T-16
- **Tamaño:** S · **Clasificación:** UX
- **Criterio de aceptación:** el "por cobrar" no cambia con el período; el toggle separa lo en curso sin sumarlo a lo firme.
- **Estado:** Pending

### T-18 — `AtencionPage` (vista nueva)
- **Objetivo:** la bandeja de acción priorizada (reordenable), con filas qué→quién→cuánto→acción.
- **Archivos:** `frontend/src/pages/AtencionPage.tsx` (nuevo), `frontend/src/hooks/use-finance.ts` (`useAttention`), routing.
- **Dependencias:** T-10
- **Tamaño:** M · **Clasificación:** Feature
- **Criterio de aceptación:** filas con las 4 partes y acción explícita; orden reordenable (prioridad/impacto/antigüedad); solo hechos en firme.
- **Estado:** Pending

### T-19 — Reagrupar Sidebar + rutas de Finanzas
- **Objetivo:** grupo Finanzas con Pulso (entrada), Cartera, Cuentas de cobro, Pagos; rutas nuevas.
- **Archivos:** `frontend/src/components/layout/Sidebar.tsx`, routing.
- **Dependencias:** T-11, T-16, T-18
- **Tamaño:** M · **Clasificación:** IA/Navegación
- **Criterio de aceptación:** la navegación existente no se rompe; Finanzas queda agrupada con Pulso como entrada.
- **Estado:** Pending

### T-20 — Dashboard: sección financiera como teasers
- **Objetivo:** que el Dashboard muestre teasers financieros que enlazan a Pulso/Cartera, sin recalcular.
- **Archivos:** `frontend/src/pages/DashboardPage.tsx`.
- **Dependencias:** T-11, T-16
- **Tamaño:** S · **Clasificación:** IA/Navegación
- **Criterio de aceptación:** los teasers leen las mismas fuentes y enlazan al protagonista; no hay segundo cálculo.
- **Estado:** Pending

---

## 12. Tablero resumen del backlog

| ID | Tarea | Tam. | Clasificación | Dep. | Estado |
|---|---|---|---|---|---|
| T-01 | Exponer invoice.total + pagado en OT | S | Fundación | — | ✅ Completed (`29eeb9d`) |
| T-02 | CostSummaryCard lee ingreso de factura | S | Deuda técnica | T-01 | ✅ Completed (`181d08b`) |
| T-03 | Chip de estado del ciclo | S | UX | T-01 | ✅ Completed (`8598977`) |
| T-04 | Cobrado + margen por estado | S | UX | T-01 | ✅ Completed (`07e19a5`) |
| T-05 | Aviso "sin costos · verificar" | XS | UX | — | ✅ Completed (`7c2ddf3`) |
| T-06 | Módulo `finance` + DTO período | S | Fundación | — | ✅ Completed (`93539d8`) |
| T-07 | Rollup por cliente (compartido) | M | Fundación | T-06 | ✅ Completed (`fa9f5df`) |
| T-08 | Receivable + aging + por cliente | M | Fundación | T-06 | ✅ Completed (`d3d5aed`) |
| T-09 | Embudo + margen global (pulse) | M | Fundación | T-06 | ✅ Completed (`a36af57`) |
| T-10 | Listas de atención | M | Fundación | T-06 | ✅ Completed (`dff983b`) |
| T-11 | Cartera (evolución EstadoCuentas) | L | UX | T-08 | ✅ Completed (`a954629`) |
| T-12 | Saldo + filtros en InvoicesPage | S | Feature | T-08 | ✅ Completed (`b9a5d3b`) |
| T-13 | Mover 12m a PaymentsPage | S | Refactor | — | ✅ Completed (`3d469ff`) |
| T-14 | Ruta/shell detalle de cliente | S | Feature | — | Pending |
| T-15 | Vista rentabilidad del cliente | M | Feature | T-07, T-14 | Pending |
| T-16 | PulsoPage | L | Feature | T-09, T-10 | Pending |
| T-17 | Firmeza + período en Pulso | S | UX | T-16 | Pending |
| T-18 | AtencionPage | M | Feature | T-10 | Pending |
| T-19 | Reagrupar Sidebar + rutas | M | IA/Navegación | T-11, T-16, T-18 | Pending |
| T-20 | Dashboard teasers | S | IA/Navegación | T-11, T-16 | Pending |
