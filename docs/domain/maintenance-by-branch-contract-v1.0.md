# Programación preventiva por sede — Contrato funcional v1.0

> **Tipo:** Normativo (contrato funcional de un módulo del dominio).
> **Estado:** Congelado — aprobado por el usuario el 2026-09-28. Cierra **MNT-1 (DT-06-B)**.
> **Implementación:** rama `feat/maintenance-visits-by-branch` (pendiente de despliegue).
> **Artefactos:** migración `backend/prisma/migrations/20260928120000_maintenance_visits_by_branch/`, rollback `backend/prisma/rollbacks/20260928120000_maintenance_visits_by_branch.rollback.sql`, consolidación de Emmanuel `backend/prisma/data-migrations/20260928_emmanuel_consolidation.sql`, reglas en `backend/src/modules/maintenance-visits/maintenance-visits.domain.ts`.
> **Precedencia:** subordinado a `domain-model-v1.0.md` (principio 7: el objetivo del ERP es la trazabilidad documental de cada Equipo). Cambios a este contrato requieren una decisión formal con fecha y motivo.

---

## 1. Problema que resuelve

La operación real de STECH NODES es **una visita física por sede** que atiende varios equipos. El modelo anterior obligaba, para conservar la trazabilidad por equipo, a crear **un plan y una visita por equipo** (Emmanuel: 17 planes y 17 visitas para 3 visitas físicas).

Desde 2026-08-28 la trazabilidad vive en `Intervention` (una por equipo), no en `WorkOrder.equipmentId`. Por eso se puede **programar por sede sin perder el historial por equipo**.

## 2. Modelo

```
Contrato
 └─ MaintenancePlan (1 sede · frecuencia · período ancla · equipos)
     └─ MaintenanceVisit (sede + período = LA OBLIGACIÓN; 1 o más jornadas)
         ├─ MaintenanceVisitEquipment (equipos programados + conciliación)
         │        └─ 0..1 Intervention
         └─ 0..1 WorkOrder (contenedor de ejecución; 1 visita = 1 OT)
                  └─ 1..N Intervention ── Equipment ── ChecklistItem / FileAttachment
```

- **La trazabilidad vive solo en `Intervention`.** La visita registra qué se programó y qué pasó en el período; la intervención no conoce la visita. QR y Hoja de Vida no cambian.
- **Una visita no es una jornada:** es la obligación de una sede en un período. Puede ejecutarse en varias jornadas dentro de una única OT abierta.

## 3. Fechas — un concepto por campo

| Campo | Significado | ¿Afecta el cumplimiento? |
|---|---|---|
| `MaintenancePlan.firstPeriodStart` | Día 1 del mes ancla del ciclo | Define los períodos |
| `MaintenanceVisit.periodStart` / `periodEnd` | Ventana válida = mes calendario de la obligación. Inmutables | **Sí** |
| `MaintenanceVisit.scheduledDate` | Fecha tentativa de planificación; puede estar fuera del período (se avisa) | **No** |
| `Intervention.occurredAt` | **Única** fecha real de ejecución, por equipo. No puede ser futura; editable con la OT abierta, congelada al cerrarla. `createdAt` queda como auditoría | **Sí** |
| `MaintenanceVisit.closedAt` | Conciliación de la obligación (administrativo) | No |
| `WorkOrder.completedAt` | Cierre de la OT (administrativo) | No |

No existe `executedAt` en la visita: su ejecución real es el rango de `occurredAt` de sus intervenciones. Las fechas reales se comparan en **hora local de Colombia (UTC−5)**.

## 4. Reglas

| # | Regla |
|---|---|
| R1 | Un plan pertenece a una sede; sus equipos son de esa sede y del contrato. |
| R2 | Una visita por plan y período (`@@unique([planId, periodStart])`). |
| R3 | Al generarse, la visita copia los equipos activos del plan como `SCHEDULED / PENDING`. |
| R4 | Cambios en el plan (equipos, ancla, frecuencia) solo afectan visitas `PENDING`, sin OT y cuyo período no ha empezado. |
| R5 | Un equipo es `ATTENDED` solo con una intervención `COMPLETED` registrada en la OT de esa visita. |
| R6 | Una intervención cubre como máximo un equipo de una visita: la de la OT donde se registra. |
| R7 | **Anticipada:** un equipo programado con `occurredAt < periodStart` exige `earlyExecutionNote` en su elemento. Sigue siendo del período original y puede convivir con atenciones dentro de la ventana. |
| R8 | **Tardía:** `occurredAt > periodEnd` es válida y sigue siendo del período original. |
| R9 | **Cumplimiento:** `FULFILLED` ⇔ todos los `SCHEDULED` están `ATTENDED` con `occurredAt ≤ periodEnd` y los anticipados tienen nota. En otro caso `NOT_FULFILLED`. Se calcula y **congela al cerrar**. Los `ADDED` no cuentan. El cierre administrativo tardío no lo altera. |
| R10 | **Parcial** = `NOT_FULFILLED`, conservando el detalle por equipo. |
| R11 | Para cerrar, ningún equipo puede quedar `PENDING`. |
| R12 | Una visita `CLOSED` es inmutable; `compliance` es nulo solo en `CANCELLED` y en visitas legado. |
| R13 | Una intervención solo puede ser de un equipo de la sede de la OT. |
| R14 | Se pueden agregar o anular intervenciones mientras la OT no esté `COMPLETED` ni `CANCELLED`. Anular nunca borra. |
| R15 | Una OT ligada a una visita solo puede cancelarse si no tiene intervenciones `COMPLETED`. |
| H1 | La OT de una visita no se elimina; solo se cancela. |
| H2 | Al cancelar la OT se libera `workOrderId` (sin historial de intentos en v1.0). |

**Equipo dado de baja:** si estaba programado al iniciar el período y se da de baja durante el período, queda `NOT_ATTENDED` con motivo `DECOMMISSIONED` y la visita queda `NOT_FULFILLED` (regla estricta). Si la baja ocurre antes de iniciar un período `PENDING`, R4 lo excluye de esa visita.

## 5. Estados

**Visita (guardado):** `PENDING` → *generar OT* → `IN_PROGRESS` → *completar OT* → `CLOSED` + `compliance`.
`IN_PROGRESS` → *cancelar OT* (R15) → `PENDING`. `PENDING` → *cerrar sin ejecución* (todos `NOT_ATTENDED`) → `CLOSED · NOT_FULFILLED`. `PENDING` → *cancelar* (la obligación desaparece, con motivo) → `CANCELLED`.

**Equipo de la visita:** `PENDING ⇄ ATTENDED` (intervención completada / anulada) · `PENDING ⇄ NOT_ATTENDED` (motivo + nota / revertir). Origen `SCHEDULED` o `ADDED`.

**Plazo (derivado, nunca guardado, solo visitas abiertas; gana la primera que se cumpla):**
1. Todos los programados atendidos con `occurredAt ≤ periodEnd` → **Ejecutada · cierre pendiente**.
2. Hoy > `periodEnd` → **Vencida**.
3. Hoy ≥ `periodEnd − 6` (octubre: desde el 25) → **Por vencer**.
4. En otro caso → **Pendiente**.

El plazo **nunca** se mide contra `scheduledDate`.

## 6. Generación de visitas

- Períodos = `firstPeriodStart + k × paso` (1 / 3 / 4 / 6 / 12 meses).
- Se incluyen los meses entre el mes de inicio del contrato (incluido) y el mes de fin (excluido), con `periodEnd ≥ fecha de generación`.
- Se generan al crear o activar el plan y al cambiar la vigencia del contrato; idempotente (R2).
- **La ejecución real nunca desplaza el ciclo** (octubre ejecutado el 28 → el siguiente sigue siendo enero). Queda descartada la regla antigua `nextVisitDate = ejecución + frecuencia`.

## 7. Casos especiales

| Caso | Tratamiento |
|---|---|
| Anticipada | R7; puede mezclarse con atenciones en ventana; aporta a `FULFILLED`. |
| Tardía | R8; `NOT_FULFILLED` permanente; el equipo conserva su fecha real. |
| Parcial | R10. |
| No ejecutada | "Vencida" hasta cerrar sin ejecución → `NOT_FULFILLED`. **No se cancela.** |
| Reprogramación dentro del período | Misma visita: cambiar `scheduledDate` o atender en otra jornada. |
| Después del período | Misma visita, tardía; nunca se traslada al período siguiente. |
| Pendiente al llegar el período siguiente | Se registra en la OT del período siguiente; la visita vieja cierra el equipo `NOT_ATTENDED` / `ATTENDED_NEXT_PERIOD` (R6). |
| Equipo no programado | `ADDED / ATTENDED`, sin efecto en el cumplimiento. |
| Equipo de otra sede | Rechazado (R13). |

## 8. Migración de datos existentes

- **Esquema:** migración estructural con guardas (G1–G7) y registro en `migration_log`. Visitas de julio → `CLOSED`, período julio, `compliance` nulo (legado), sin equipos por visita. Avellaneda: ancla 01-ago-2026; la visita de agosto se liga a su intervención real.
- **Emmanuel (separado):** 3 planes por sede en los contratos actuales (trimestral, ancla 01-ene-2026, 6/4/7 equipos) y 3 visitas de octubre. Las 17 visitas `PENDING` de octubre se borran con copia completa en `migration_log`; los 17 planes viejos se desactivan con baja lógica de equipos y conservan julio. Si octubre ya se ejecutó con una OT por sede, esa OT pasa a la visita nueva.
- **Fuera de alcance:** el hueco de julio (intervenciones históricas por equipo) corresponde a MIG-1 con evidencia. No se fabrican intervenciones.
