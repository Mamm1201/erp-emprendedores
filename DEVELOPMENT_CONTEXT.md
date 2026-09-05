# ERP Emprendedores — STECH NODES Ops

> Este archivo registra el **estado del desarrollo**. No reemplaza el CHANGELOG.
> El CHANGELOG registra qué cambió. Este archivo registra dónde estamos y hacia dónde vamos.

---

## Estado actual

**Versión:** `v2.10.0` (Módulo Finanzas Escenario 1 CERRADO + `WorkOrderTechnician` CERRADO)
**Rama activa:** `develop` — **29 commits adelante de `origin/develop`, sin push**
**Última sesión:** 2026-08-02
**Fase actual:** Cierre de bloque de trabajo — proyecto estabilizado antes de abrir el siguiente. Módulo Finanzas (T-06…T-15, solo lectura/derivado sobre Operaciones+Facturación) y `WorkOrderTechnician` (ejecutores reales de la OT) quedaron **implementados, verificados y commiteados sin push**. Ver § *Módulo Finanzas — Escenario 1* y § *WorkOrderTechnician* más abajo para el detalle completo. La fase de "Operación real — primer cliente recurrente" (progreso 2026-07-25/28, abajo) sigue vigente como contexto operativo de fondo; no fue tocada por este bloque.
**Progreso 2026-07-25:**
- **Avellaneda (cliente 1):** (1) Preventivo montado completo (cliente → sede → equipo/QR → cotización COT-00001 → contrato CMTO-00001 ACTIVE $2.991.888 anual → plan cada 4 meses → 3 visitas). (2) **Primer correctivo facturado de punta a punta:** cotización (visita $90.000) → OT-00001 (visita + 4 repuestos = **$405.000**, planta SN-009 anclada) → Acta Técnica → Cuenta de Cobro **CC-2026-00001 EMITIDA $405.000**. Durante el flujo se detectaron y corrigieron CE-7, OT-6, OT-7; y se topó con **OT-8 (urgente)** que exigió workaround por API.
- **Emmanuel (cliente 2):** cliente multi-sede montado. 4 sedes: 3 bajo preventivo (Calle 126, Manzanos, Mirador) + 1 fuera de contrato (Spring, solo correctivos). **17 equipos** creados. **3 contratos independientes** (uno por sede, ANNUAL, $10.4M c/u, inicio 6-ene-2026 → 6-ene-2027, ciclo Anual, correctivo/repuestos/transporte incluidos) — decisión del usuario: contrato por sede para poder dar de baja una sin tocar las otras. **17 planes** (uno por equipo, Trimestral, por MNT-1) + **17 visitas de octubre**. Notas: (a) se corrigió un cruce de equipos entre contratos (riesgo "contratos indistinguibles"); (b) los 17 planes se crearon por API por volumen — evidencia real del costo de MNT-1 (17 planes para 3 visitas físicas).
- **OT-8 implementado (2026-07-28):** tras cerrar RFC-06 (flujo Cotización→OT→Facturación) y el modelo del contexto Operaciones (WorkOrder = Aggregate Root, Utilización de Recurso = Entity local), se implementó el concepto **Utilización de Recurso** en la OT (Prisma + backend con invariantes + frontend card "Recursos utilizados"). 100% aditivo, sin economía. Cierra la captura técnica; la facturación de adicionales espera a *Preparación de Facturación* (capa táctica abierta).
- **Preparación de Facturación — Fase 1 (2026-07-28):** modelo funcional + táctico congelados (Aggregate Root `BillingPreparation` + VO `BillingLineResolution`; resultado DERIVADO, no persistido; sin eventos — invocación directa). Fase 1 implementada y verificada E2E: migración aditiva (`20260728215337`, tablas `billing_preparations`/`billing_line_resolutions`) + backend del agregado con invariantes (OT COMPLETED, completitud al confirmar, inmutabilidad tras confirmar, pertenencia a la OT). 100% aditivo (no toca `Invoice`/`WorkOrderItem`/`Quotation`). **Fase 2 (2026-07-28): loop de facturación cerrado.** `Invoice.createFromPreparation` + endpoint `POST /invoices/from-preparation` + columna aditiva `Invoice.preparationId` (nullable/unique, migración `20260728222000`). Una preparación CONFIRMED genera la Cuenta de Cobro: solo las líneas CHARGE se facturan, ABSORB no; `workOrderId`+`preparationId` para trazabilidad; ocupa el slot 1:1 de la OT (impide doble facturación). El camino viejo (`createFromWorkOrder`) intacto. Verificado E2E. **Fase 3 (2026-07-28): frontend.** `BillingPreparationCard` en el detalle de la OT (solo visible/operable con OT `COMPLETED`): abrir preparación → decidir por elemento CHARGE/ABSORB (modal con precio/descuento/impuesto para CHARGE) → resultado económico derivado en vivo (del servidor) → confirmar (bloqueado si hay pendientes) → inmutable → "Generar Cuenta de Cobro" (`POST /invoices/from-preparation`). Solo consume APIs existentes, sin cambios de backend. Verificado end-to-end en el navegador (abrir → resolver → confirmar → generar → factura con solo las líneas CHARGE). **Pendiente:** Fase 4 (disposiciones de contrato → ataca CC-1), Fase 5 (docs). Fases 1-3 dejan el flujo Cotización→OT→Utilizaciones→Preparación→Cuenta de Cobro **usable de punta a punta en la UI**.

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
| v1.9.0 | QA Fix | Post-QA Stabilization — F-05 quotation en OT, F-06 CONVERTED automático, F-08 visita COMPLETED cascade, F-09 lineOrder=1, F-10 KPI excluye preventivas, F-11 visitas GENERATED en dashboard | ✅ Cerrado y auditado |
| v2.0.0 | Identidad | Integración completa identidad corporativa STECH NODES — Login, Sidebar, todos los PDFs, centralización de datos institucionales, routing de emails por área, notas estructuradas | ✅ Cerrado y auditado |
| v2.1.0 | QR Fase 1 — Bloque 1 | Schema: campo `qrCode String? @unique` en `Equipment`, índice, migración `20260708000001` aplicada, Prisma Client regenerado | ✅ Cerrado y auditado |
| v2.1.0 | QR Fase 1 — Bloque 2 | `PublicModule`: endpoint `GET /public/equipment/:qrCode`, DTO público explícito, CORS multi-origen (ERP + portal), throttle 30 req/min, auditoría de seguridad del payload completada | ✅ Cerrado y auditado |
| v2.1.1 | QR Fase 1 — Bloque 3 | Generación de `qrCode`: automática en `create()`, manual vía `POST .../qr-code` (ADMIN), 409 anti-regeneración. Formato: `base64url` 12 chars, `crypto.randomBytes(9)`, 72 bits entropía | ✅ Cerrado y auditado |
| v2.1.1 | QR Fase 1 — Bloque 4 | `QrCodePanel` en ERP: imagen QR on-demand (`qrcode.react`), URL configurable vía `VITE_PORTAL_URL`, descarga PNG. Columna QR en tabla. `useAssignQrCode` hook. | ✅ Cerrado y auditado |
| v2.2.0 | QR Fase 1 — Bloque 5 | `qr-portal/`: app React independiente, ruta `/e/:qrCode`, 5 estados (A/C/D/E/F), design tokens STECH NODES, mobile first, sin autenticación | ✅ Cerrado y auditado |
| v2.2.2 | QR Fase 1 — Auditoría | Auditoría completa (5 áreas). Corrección SEC-C1: soft-delete filtrado en endpoint público. Documento de decisión Bloque 6 creado. | ✅ Cerrado |
| v2.3.0 | QR Fase 1 — Bloque 6 | `lastMaintenance` en portal QR: query D-4.1 (WorkOrder.completedAt, tipo PREVENTIVE/CORRECTIVE), sección visual en móvil y desktop, null state, 6 tests E2E PASS | ✅ Cerrado |
| v2.3.1 | QR Fase 1 — Bloque 7 (código) | Timeout E2E (`AbortController` 10s) en `qr-portal` + validación de formato `qrCode` en `PublicService` (SEC-I3) | ✅ Cerrado (validación física pendiente, ver detalle en § Ecosistema QR) |
| v2.4.0 | DT-06-B — Etapa 1 | CRUD de asociación `ContractEquipment` / `MaintenancePlanEquipment` — endpoints, hooks y UI en contrato y plan | ✅ Cerrado y verificado |
| v2.5.0 | Modelo de Dominio v1.0 | Descubrimiento y congelación de dominio: lenguaje ubicuo (Sistema/Equipo/Componente/Periférico/Repuesto/Consumible), principios rectores, D-07 a D-11, definiciones documentales oficiales de Cotización y Orden de Trabajo. Sin cambios de código. | ✅ Cerrado — documentación consolidada en `docs/domain/domain-model-v1.0.md` |
| v2.5.1 | Modelo de Dominio v1.1 | Acta Técnica congelada (documenta de forma estructurada la evidencia técnica, no narra ni certifica). Principio 8 agregado (Historia Documental relacional). Corrección de lenguaje en OT (§5.2: "habilita" → "derivado de"). Sin cambios de código. | ✅ Cerrado — `docs/domain/domain-model-v1.0.md` actualizado a v1.1 |
| v2.5.2 | Modelo de Dominio v1.2 | Cuenta de Cobro congelada — "comunicar formalmente al cliente el resultado económico derivado de un servicio, contrato u otra relación comercial". Caso $0/cubierto subsumido ("resultado económico", no "obligación"). Nombre conservado en el lenguaje del negocio; la forma tributaria de emisión es asunto de implementación, a evolucionar si el negocio cambia de forma jurídica. Sin cambios de código. | ✅ Cerrado — `docs/domain/domain-model-v1.0.md` actualizado a v1.2 |
| v2.5.3 | Checkpoint descubrimiento | Hoja de Vida del Equipo — descubrimiento iniciado, **no congelada**. Nombre validado (renombre de "Historia Documental del Equipo"). Confirmado: `Equipment` es ficha del activo, no historial; Portal QR y Hoja de Vida son conceptos relacionados pero distintos; identificada la necesidad de un concepto de eventos del ciclo de vida (alcance pendiente). 4 preguntas abiertas para la próxima sesión. Sin cambios de código, sin entidades nuevas. | 🔍 En curso — ver `docs/domain/domain-model-v1.0.md` §5.5 (v1.3) |
| v2.6.0 | Modelo de Dominio v1.4 | **Hoja de Vida del Equipo congelada** como **registro técnico integral del activo** (expediente que reúne, sin poseer, identificación, información técnica, estado, cronograma vigente, historial de intervenciones y soportes). Corrección de dominio clave: no es una línea de tiempo de intervenciones sino un expediente completo. Sustentada en el problema/solución de Fondo Emprender, la experiencia en IPS y la entrevista al líder administrativo. Los **hitos del ciclo de vida del activo** quedan como **hipótesis de diseño diferida (no validada)**, fuera del alcance congelado. **Fin de la fase de descubrimiento documental del dominio.** Sin cambios de código. | ✅ Cerrado — `docs/domain/domain-model-v1.0.md` v1.4 |
| v2.7.0 | Validación — Equipos | Inicio de la **fase de validación de producto**. Auditoría funcional (ejecución real) de Clientes/Sedes/Equipos con lente de migración de datos reales → hallazgos CE-1 a CE-6. Corrección de **CE-1** (`warrantyExpiresAt` incapturable pese a que el QR lo usa — contradicción interna) y **CE-2** (`criticality` clavada en MEDIUM): ambos campos ya existían en el modelo, expuestos en DTOs/service/select + tipos/hook/formulario. Re-ejecutada la prueba API que detectó el bug → 201/200 OK. | 🟡 Implementado, **pendiente validación visual** (fricción del arnés, no defecto) |
| v2.9.0 | Módulo Finanzas — Escenario 1 (Fundación) | Contexto Finanzas **derivado y de solo lectura** sobre Operaciones/Facturación. Backend (`finance` module, T-06…T-10): rollup por cliente, receivable+aging, pulse/embudo, atención. Frontend (T-05, T-11…T-15): aviso "sin costos" en OT, Cartera, saldo/filtros en Cuentas de Cobro, histórico en Pagos, detalle+rentabilidad de cliente. 10 tareas, ciclo disciplinado análisis→validación→implementación→autoauditoría→commit en cada una. Ver § *Módulo Finanzas — Escenario 1* para el detalle completo. | ✅ Cerrado — `IMPLEMENTATION_PLAN_FINANCE_SCENARIO_1.md` (T-06…T-15 Completed) |
| v2.10.0 | `WorkOrderTechnician` — Ejecutores reales de la OT | La OT es la fuente de verdad de la ejecución (coherente con §5.2 del Modelo de Dominio, ya congelado: "Quién la ejecutó o gestionó"); el Acta Técnica y su PDF son evidencia derivada, solo leen. Relación N:N `WorkOrder↔User` (tabla `work_order_technicians`, minimalista, sin `role`/`isLead` por falta de evidencia de negocio). `assignedToId` (responsable/asignado) no cambia de semántica. Ejecutores opcionales — advertencia no bloqueante si la OT se completa sin ninguno. Ver § *WorkOrderTechnician*. | ✅ Cerrado y verificado (`nest build`/`tsc -b` limpios, migración 100% aditiva) |

**Versión:** `v2.10.0` (Módulo Finanzas Escenario 1 CERRADO + `WorkOrderTechnician` CERRADO)

**Estado general:** Build limpio · TypeScript 0 errores nuevos (baseline heredado de 9 errores pre-existentes, no relacionados con Finanzas/Técnicos — ver deuda registrada) · Módulo Finanzas Escenario 1 (Fundación) **CERRADO** · `WorkOrderTechnician` **CERRADO** · **Fase de validación de producto** (módulos previos) sin cambios desde 2026-07-16 · Modelo de Dominio v1.4 congelado (5 definiciones) · QR Fase 1 operativo · Asociación Equipos↔Contratos↔Planes operativa (DT-06-B Etapa 1) · Identidad STECH NODES v1.0 integrada · Auth fullstack congelada · Motor Documental congelado · Incremento Utilización→Preparación→Cuenta de Cobro cerrado (2026-07-28)

---

## Fase de validación de producto (referencia oficial)

> **Objetivo:** validar módulo por módulo la implementación real contra el dominio congelado y contra el flujo real de trabajo de una IPS, para poder afirmar objetivamente que el ERP está listo para **migrar datos reales** y luego iniciar la **fase comercial**.
>
> **Metodología (invariable):** (1) ejecutar el módulo; (2) compararlo con el dominio congelado; (3) compararlo con el flujo real de una IPS; (4) identificar solo diferencias reales; (5) clasificar en *implementación incorrecta* / *implementación incompleta* / *descubrimiento pendiente* (solo si el dominio realmente no responde); (6) corregir lo mínimo necesario; (7) volver a probar. **No se reabren definiciones congeladas salvo evidencia funcional objetiva de contradicción.**
>
> **Criterio de "Validado" (único para todos los módulos):** una corrección solo pasa a 🟢 **Validado** cuando además se verifica **desde la interfaz de usuario en un recorrido normal**. Mientras solo esté probada a nivel de API/código, queda 🟡 **Implementado, pendiente validación visual**.

### Tablero de validación del ERP

| Módulo | Estado | Observaciones |
|--------|--------|---------------|
| Clientes | 🟡 Validado con pendientes | CE-3 al backlog (dirección fiscal, representante legal, régimen — necesarios para migración y Cuenta de Cobro) |
| Sedes | 🟢 Validado | Sin hallazgos — el nivel mejor cubierto |
| Equipos | 🟡 Implementado, pendiente validación visual | CE-1 y CE-2 implementados y probados por API; falta recorrido UI. CE-4, CE-5, CE-6 al backlog |
| Portal QR | 🟡 Validado con pendientes | Funciona y alineado con su alcance de dominio. Pendiente: datos de contacto reales, equipo demo realista, prueba física (Bloque 7), y DT-06-B Etapa 2 (afecta `lastMaintenance`) |
| Cotización | 🟡 Validado con pendientes | Flujo funcional OK (crear · estados · PDF · totales · snapshot comercial). Pendientes al backlog: COT-1/COT-2/COT-3/COT-4. Falta recorrido visual |
| Orden de Trabajo | 🟡 Validado con pendientes | Flujo funcional OK (crear · estados · vínculo a equipo · reflejo en QR). Pendientes: OT-1/OT-2/OT-3 backlog; **OT-4 bloqueante de migración**. Falta recorrido visual |
| Acta Técnica | 🟡 Validado con pendientes | El mejor alineado. Flujo OK (crear · checklist · firma retrofechable · PDF · findByEquipment). Único pendiente: ACT-1 (evidencias en PDF). Falta recorrido visual |
| Cuenta de Cobro | 🟡 Validado con pendientes | Ciclo económico OK (crear desde OT/contrato · emitir · pago parcial/total con reconciliación · PDF · caso $0). Pendientes: CC-1 (RFC-4), CC-2 (retrofecha). Falta recorrido visual |
| Contratos / Planes / Visitas | 🟡 Validado con pendientes | Flujo OK (contrato · asociación equipos · plan · visita · OT preventiva en transacción). **MNT-1 (= DT-06-B) confirmado con evidencia N=1/N=2** — alta prioridad. Falta recorrido visual |
| Dashboard | 🟡 Validado (API), sin hallazgos | KPIs coherentes (comercial · ejecución · cobranza · mantenimiento). Solo reporting de lectura. Falta recorrido visual |
| Hoja de Vida | ⬜ No implementada | No hay validación funcional posible — la implementación no ha iniciado (expediente compuesto de solo lectura, §5.5 del dominio). Es un ítem de construcción, no de validación |

**Meta de la fase:** todos los módulos en 🟢 → el ERP se declara listo para migración de datos reales y fase comercial.

### Hallazgos de auditoría — módulo Clientes / Sedes / Equipos (2026-07-16)

Auditoría funcional por ejecución real (crear cliente/sede/equipo vía API + inspección de BD), con lente de migración de Emmanuel/INDE.

| ID | Hallazgo | Categoría | Estado |
|----|----------|-----------|--------|
| CE-1 | `warrantyExpiresAt` no capturable (create/update/form lo rechazaban con 400), pero el portal QR lo usa para el estado "contrato vencido" → estado inalcanzable. Contradicción interna. | Implementación incorrecta | ✅ Corregido (v2.7.0) — pendiente validación visual |
| CE-2 | `criticality` no capturable → clavada en `MEDIUM` para todos los activos. | Implementación incompleta | ✅ Corregido (v2.7.0) — pendiente validación visual |
| CE-3 | `Client` sin dirección fiscal, representante legal ni régimen tributario. Datos reales de IPS necesarios para migración y para la Cuenta de Cobro. | Implementación incompleta | ⏳ Backlog |
| CE-4 | Sin características técnicas por tipo de equipo (n.° de habitaciones, kVA, etc.). El dominio (Hoja de Vida §5.5) reconoce "información técnica según el tipo"; falta la capacidad y el detalle de qué campos por tipo. | Implementación incompleta (con descubrimiento acotado) | ⏳ Backlog |
| CE-5 | `serialNumber` no único — al migrar históricos podrían colarse duplicados sin aviso. | Implementación incompleta | ⏳ Backlog |
| CE-6 | Sin carga masiva — migrar decenas de equipos es uno por uno vía navegación anidada. | Implementación incompleta | ⏳ Backlog |

**Corrección aplicada (CE-1, CE-2):** ambos campos ya existían en el modelo `Equipment`; solo se expusieron de forma consistente en `create/update-equipment.dto.ts`, `equipment.service.ts`, `EQUIPMENT_SELECT`, `lib/types.ts`, `use-equipment.ts` y el formulario de `EquipmentPage.tsx` (selector Criticidad + fecha "Garantía / contrato vence").

**Revalidación (2026-07-16):** re-ejecutada la misma prueba API que detectó el bug → crear equipo con `criticality:HIGH` + `warrantyExpiresAt` → **201** (antes 400), persiste en BD y vuelve en el GET; editar a `CRITICAL` + garantía `null` → **200**. `tsc --noEmit` limpio en backend y frontend. **Pendiente:** recorrido visual del formulario (bloqueado por fricción del arnés de pruebas en el login, no por defecto del producto).

**Decisión pre-migración:** antes de cargar datos reales conviene resolver también CE-3 (dirección fiscal del cliente). CE-4/CE-5/CE-6 se reevalúan tras la **primera migración piloto**, que dará la evidencia de qué hace falta realmente.

### Hallazgos de auditoría — módulo Cotización (2026-07-16)

Validación funcional por ejecución real: crear cotización (2 ítems) → estados DRAFT→SENT→APPROVED → PDF → totales → snapshot. **Flujo sólido, sin contradicción interna.**

| ID | Hallazgo | Categoría | Estado |
|----|----------|-----------|--------|
| COT-1 | La unidad no es el "Servicio Ofertado": los ítems son líneas genéricas y la aprobación es de toda la cotización, no por servicio. Dominio §5.1: cada servicio aprobado respalda 1..N OTs. (= A-2) | Implementación incorrecta | ⏳ Backlog |
| COT-2 | `WorkOrder.quotationId @unique` → una cotización respalda 1 OT, no "una o varias". (= A-3) | Implementación incorrecta | ⏳ Backlog |
| COT-3 | Condiciones comerciales estructuradas (forma de pago, garantía) — slots del PDF mapeados a `null`. (= A-6) | Implementación incompleta | ⏳ Backlog |
| COT-4 | `issueDate` y `number` no capturables (se fijan en `now()` / autogenerado) → no se puede retrofechar/preservar el número de documentos históricos. **Baja prioridad en Cotización** (no se migran cotizaciones viejas); **crítico en OT/Acta**, donde la fecha real de intervención alimenta la Hoja de Vida. | Implementación incompleta | ⏳ Backlog (atacar en OT/Acta) |

**Correcciones realizadas:** ninguna — los pendientes son schema nuevo (COT-3) o conceptuales (COT-1/COT-2), no cumplen el criterio de "corrección mínima de bajo riesgo". Permanecen en backlog.

**Veredicto:** 🟡 Validado con pendientes. Funcionalmente listo para uso; los pendientes son evolución, no bloqueo.

### Hallazgos de auditoría — módulo Orden de Trabajo (2026-07-16)

Validación funcional por ejecución real: crear OT correctiva vinculada a equipo → estados DRAFT→SCHEDULED→IN_PROGRESS→COMPLETED → reflejo en portal QR. **Flujo sólido end-to-end (incluida la cadena OT→equipo→QR).**

| ID | Hallazgo | Categoría | Estado |
|----|----------|-----------|--------|
| OT-1 | La OT lleva precios y totales (`WorkOrderItem` con `unitPrice/discount/tax`, `total` en la OT). Dominio §5.2: registra recursos de ejecución, no factura. Raíz de RFC-4. (= A-1) | Implementación incorrecta | ⏳ Backlog |
| OT-2 | `type` no capturable en creación → toda OT nace `CORRECTIVE`. El campo y el enum existen; falta exponerlo. (= A-4) | Implementación incorrecta | ⏳ Backlog (candidato a quick-win estilo CE, diferido por decisión de barrido) |
| OT-3 | Origen comercial inferido (`quotationId`/`maintenanceVisit`), no explícito. (= A-5) | Implementación incompleta | ⏳ Backlog |
| **OT-4** | `completedAt`/`startedAt` se fijan en `now()` al transicionar — no retrofechables. Al migrar intervenciones históricas, toda OT quedaría "completada hoy"; como `completedAt` alimenta `lastMaintenance` (D-4.1) y la Hoja de Vida, **desfecha toda la trayectoria técnica migrada**. | Implementación incompleta | 🔴 **BLOQUEANTE de migración histórica** — no es quick-win (los timestamps los pone la lógica de transición; requiere diseño propio). Evaluar tras Acta/Cuenta de Cobro. |

**Correcciones realizadas:** ninguna (por decisión: terminar el barrido antes de tocar código, salvo contradicciones internas evidentes como CE-1/CE-2).

**Veredicto:** 🟡 Validado con pendientes. Funciona end-to-end; OT-4 es el pendiente de mayor peso para la migración.

### Hallazgos de auditoría — módulo Acta Técnica (2026-07-16)

Validación funcional por ejecución real: crear Acta (hallazgos + actividades + recomendaciones + firma retrofechada + 3 ítems de checklist) → PDF → `findByEquipment`. **El módulo mejor alineado con el dominio (§5.3); sin contradicción interna.**

| ID | Hallazgo | Categoría | Estado |
|----|----------|-----------|--------|
| ACT-1 | Las evidencias/fotos (`FileAttachment`) existen pero no se renderizan en el PDF del Acta. Dominio §5.3: el Acta contiene la evidencia técnica producida. (= A-7) | Implementación incompleta | ⏳ Backlog |

**Notas de migración (positivas):** `clientSignedAt` es retrofechable (la firma histórica se preserva); la fecha efectiva del Acta proviene del `completedAt` de su OT → depende de OT-4, no añade bloqueo nuevo.

**Nota de arquitectura:** `findByEquipment` (`GET /equipment/:id/service-records`) existe en el backend pero **no está expuesto en el frontend** — es la semilla de la Hoja de Vida (el historial por equipo ya es consultable por API; falta la vista interna).

**Correcciones realizadas:** ninguna. **Veredicto:** 🟡 Validado con pendientes (el más limpio; único pendiente ACT-1 + recorrido visual).

### Hallazgos de auditoría — módulo Cuenta de Cobro (2026-07-16)

Validación funcional por ejecución real: crear desde OT (copia ítems) → emitir → pago parcial → pago total (reconciliación) → PDF → caso $0. **Ciclo económico completo funcional; independiente de la OT (también crea desde contrato).**

> A partir de este módulo, cada hallazgo se clasifica en **3 dimensiones**: Categoría · Impacto · Prioridad. (Los hallazgos previos se consolidan con este esquema en el ERP Validation Report v1.0 de cierre.)

| ID | Categoría | Impacto | Prioridad | Estado | Descripción |
|----|-----------|---------|-----------|--------|-------------|
| CC-1 | Implementación incorrecta | Operación | Alta | ⏳ Backlog | La Cuenta de Cobro copia todos los ítems de la OT por defecto (`copyItemsFromWorkOrder`). Dominio §5.4: refleja una decisión de cobertura previa, no la decide. Riesgo operativo real de **facturar de más** líneas cubiertas por contrato si no se excluyen a mano. El $0 funciona, pero no se puede expresar "cubierto por contrato" (el ítem se omite, no se marca). Raíz RFC-4. |
| CC-2 | Implementación incompleta | Migración | Baja | ⏳ Backlog | `issueDate` no capturable (fijo en `now()`). Familia retrofecha (OT-4/COT-4). Baja prioridad: los documentos financieros históricos rara vez se migran. |

**Correcciones realizadas:** ninguna (RFC-4 arquitectónico; retrofecha requiere diseño propio). **Veredicto:** 🟡 Validado con pendientes.

### Hallazgos de auditoría — módulo Contratos / Planes / Visitas (2026-07-16)

Validación funcional por ejecución real: contrato → asociar 2 equipos → 2 planes (N=1 y N=2 equipos) → visitas → generar OT preventiva en transacción. **Flujo completo funcional.** Positivo: la OT generada nace `PREVENTIVE` (OT-2 solo afecta creación manual); la asociación equipo↔plan valida contra el contrato padre.

| ID | Categoría | Impacto | Prioridad | Estado | Descripción |
|----|-----------|---------|-----------|--------|-------------|
| MNT-1 (= DT-06-B Etapa 2) | Implementación incorrecta | Comercial + Operación (+ Migración) | Alta | ⏳ Backlog | Confirmado con evidencia: plan N=1 → OT con `equipmentId`; plan **N>1 → OT preventiva SIN `equipmentId`**. Esa OT no aparece en la Hoja de Vida ni en `lastMaintenance` del QR, aunque el mantenimiento ocurrió. Como los contratos reales agrupan varios equipos, **rompe la trazabilidad por activo en el preventivo recurrente** — el escenario comercial central. No es quick-win (requiere diseño: granularidad visita-al-equipo / N OTs). Comparte peso con OT-4 como bloqueante de la propuesta de valor. |

**Correcciones realizadas:** ninguna (requiere ronda de diseño, diferida hasta terminar el barrido). **Veredicto:** 🟡 Validado con pendientes.

---

### Hallazgos de operación real — carga de cliente (Avellaneda, 2026-07-25)

Primer montaje de un cliente recurrente real (Clínica Avellaneda Hernandez SAS — planta eléctrica, preventivo cada 4 meses). Surgen hallazgos por uso real del flujo comercial completo (cliente → sede → equipo → cotización → contrato → plan).

| ID | Categoría | Impacto | Prioridad | Estado | Descripción |
|----|-----------|---------|-----------|--------|-------------|
| CE-7 | Implementación incorrecta | Operación (bloqueaba registro de equipo) | — | ✅ Corregido 2026-07-25 | `CreateEquipmentDto` no aceptaba `status` (sí lo aceptaba `UpdateEquipmentDto`); el formulario compartido crear/editar siempre lo envía → registrar equipo fallaba con *"property status should not exist"*. Corregido: `status?` opcional en el DTO de creación + `status: dto.status ?? undefined` en `equipment.service.create()`. Validado por registro real desde la UI. |
| COT-5 | Descubrimiento / UX de flujo comercial | Operación + Comercial | Media | ⏳ Backlog | La cotización aprobada se deja convertir en OT de una sola vez sin advertir, incluso para clientes recurrentes que deben ir a Contrato. Además, una cotización `CONVERTED` queda en estado terminal aunque su OT se cancele → cotización varada e irreutilizable. Nada guía la bifurcación correctivo-puntual vs. contrato-recurrente. Causó limpieza manual de registros (2 cotizaciones + 1 OT). |
| MNT-2 | Inconsistencia de dominio | Operación (representación) | Baja | ⏳ Backlog | `BillingCycle` (Mensual/Trimestral/Anual) no tiene "cuatrimestral / cada 4 meses", pero `MaintenanceFrequency` sí (`EVERY_4_MONTHS`). El contrato no puede expresar con exactitud la cadencia de cobro de un cliente cada-4-meses. No bloquea: la facturación real es manual por OT. |
| OT-5 | Implementación incompleta (cara operativa de RFC-4) | Operación | Media | ⏳ Backlog | La OT preventiva generada desde una visita nace sin ítems y en $0; no hereda el precio acordado del contrato/cotización. El operador debe agregar el valor manualmente en cada visita antes de facturar, o la Cuenta de Cobro sale en $0. Riesgo de error humano recurrente. Relacionado con RFC-4 / CC-1 / OT-1. **(Sigue abierto: OT-7 solo cubre la conversión cotización→OT; la OT preventiva viene de `generateWorkOrder`, no de una cotización.)** |
| OT-6 | Implementación incorrecta | Operación (bloqueaba anclar OT al activo) | — | ✅ Corregido 2026-07-25 | No se podía asignar el equipo al **editar** una OT. `UpdateWorkOrderDto` no aceptaba `equipmentId`, `update()` no lo mapeaba, y `WorkOrderEditModal` no pasaba el prop `equipment` a los campos → el selector nunca aparecía. Como la conversión cotización→OT tampoco ponía el equipo, una OT así **no podía anclarse al activo** (rompía trazabilidad en QR/Hoja de Vida). Corregido en las 3 capas (mirror de `create`). Verificado por PATCH real (OT ↔ planta SN-009). |
| OT-7 | Implementación incorrecta | Operación (bloqueaba facturar) | — | ✅ Corregido 2026-07-25 | La conversión cotización→OT **descartaba las líneas de la cotización** (y el equipo) → la OT nacía vacía en $0 y la Cuenta de Cobro no tenía qué facturar. Causa: `convertToWorkOrder()` (frontend) solo enviaba `clientId/branchId/quotationId/title`. Corregido en **backend** (robusto): al convertir sin ítems explícitos, la OT hereda las líneas vía `copyItemsFromQuotation()`. Verificado E2E (cotización 2 líneas → OT hereda 2 líneas, total correcto). |
| OT-8 | Descubrimiento / brecha de diseño | Operación (bloqueó facturación real) | **🔴 URGENTE** | ⏳ Backlog | **No existe editor de líneas de servicio en la OT** (ni al crear ni al editar; la tarjeta `WorkOrderItemsCard` es solo lectura). Las líneas solo pueden venir de la cotización al convertir (OT-7). Consecuencia: **no se pueden agregar valores/repuestos descubiertos después de generar la cotización** — el caso más común de un correctivo (se cotiza la visita, y en campo aparecen los repuestos). **Evidencia real (2026-07-25):** bloqueó el primer correctivo de Avellaneda; hubo que agregar las 4 líneas de repuestos ($315.000) **por API** porque la UI no lo permite — un workaround NO reproducible por el usuario. Prioridad elevada de Media→Urgente: no es edge case, es el flujo normal de correctivos. Solución mínima: editor de líneas en la OT (en Borrador/Programada). Decisión de fondo en RFC-5 / RFC-4 (dónde viven los valores). |

**Nota CE-3:** verificar que Avellaneda tenga NIT cargado antes de emitir la primera Cuenta de Cobro (ya en backlog 🟡).

---

## RFC-06 — Flujo Cotización → OT → Facturación (CONGELADA — capa estratégica)

> Congelada 2026-07-26. Cierre de una discusión de dominio extensa, contrastada con SAP PM/CS, IBM Maximo, Dynamics 365 FS, ERPNext y Odoo. **Capa estratégica CONGELADA; capa táctica DELIBERADAMENTE ABIERTA** hasta analizar invariantes del contexto de Facturación.

**Concepto de negocio congelado:** existe un **paso administrativo** donde la realidad técnica (lo ejecutado en la OT) se transforma en una **decisión económica** (qué se cobra, qué se absorbe, qué cubre garantía, cómo se valoran los adicionales) **ANTES** de emitir el documento fiscal. Nombre de trabajo: **"Preparación de Facturación"** (nombre final vía ritual de lenguaje ubicuo — sin congelar).

**Flujo de negocio congelado:**
1. Cotización inmutable tras aceptación.
2. OT técnica, **sin precios de venta**.
3. OT inmutable al firmar el cliente (+ generar/enviar PDF).
4. Separación **costo** (ejecución) ≠ **precio** (decisión posterior).
5. Decisión económica **administrativa, posterior al cierre técnico** de la OT.
6. Documento fiscal **externalizado por integración** (Siigo/Alegra u otro) → **NO diseñar el dominio alrededor de la Cuenta de Cobro**.

**Contextos acotados congelados:** *Operaciones* (OT) · *Facturación* (Preparación + adaptador fiscal) · *Finanzas/Contabilidad* por **integración** (no se construye).

**Patrón de referencia:** **Patrón B** (SAP DP90→Billing Request; Maximo billing batch), simplificado para PYME. **NO** se adopta el Patrón A "cotización/orden viva" (Odoo).

**RFCs relacionadas:** RFC-04 → **ADOPTADA** · RFC-05 → **RECHAZADA**.

**🔓 ABIERTO (capa táctica — se deriva después):** si "Preparación de Facturación" es Aggregate Root / Entity / Process Manager / Domain Service + eventos, u otra forma. **Criterio acordado:** solo se introduce un Aggregate si el análisis de invariantes lo justifica; si no hay frontera de consistencia real, se evita la complejidad. Requiere análisis específico del contexto de Facturación (invariantes, responsabilidades, ciclo de vida, nombre) — **pendiente, no bloquea OT-8**.

---

## Modelo de dominio — Contexto Operaciones (CONGELADO)

> Congelado 2026-07-26. Cierra la capa **táctica** del contexto Operaciones (RFC-06 dejó abierta la de Facturación; esto es solo Operaciones). Derivado de invariantes/ciclo de vida/ownership, no de preferencias de diseño.

**Responsabilidad de la OT (post-RFC-06):** ser el **registro fiel e íntegro de una intervención técnica sobre un activo, hasta su cierre inmutable**. Fuente autoritativa de la realidad técnica. **No decide nada económico** (sin precios, costos, totales, cobro).

**Clasificación táctica:**
- **Orden de Trabajo (`WorkOrder`) → Aggregate Root.** Frontera de consistencia de la intervención.
- **Utilización de Recurso (`ResourceUtilization`) → Entity local dentro del agregado WorkOrder.** Justificación **solo desde Operaciones**: (a) debe poder **corregirse** durante la ventana editable; (b) debe poder **auditarse individualmente** (quién/cuándo por hecho); (c) **pertenece exclusivamente a una OT**; (d) se **congela junto con la OT** al cerrarse. → Requiere identidad estable → **Entity, no Value Object**.
- **Registro técnico/Acta, Checklist, Firma de cierre → Value Objects dentro del agregado.**
- **Equipo → Aggregate Root de otro contexto (Gestión de Activos), referenciado por identidad.** No poseído por la OT.
- **Recurso de catálogo → master data de contexto de soporte (Catálogo/Inventario), referenciado; existencia diferida** (hoy inline por texto).

**Invariantes del agregado `WorkOrder` (CONGELADAS):**
1. Una Utilización de Recurso pertenece a una **única** OT.
2. Una Utilización de Recurso **no puede existir sin** una OT.
3. Una OT `COMPLETED` o `CANCELLED` **no admite modificaciones** en ninguno de sus hechos técnicos.
4. El cierre de la OT **congela atómicamente** todas sus utilizaciones, checklist, acta y demás hechos técnicos.

**Utilización de Recurso — atributos mínimos (congelados):** recurso (texto libre por ahora) · categoría (material/mano de obra/gasto) · cantidad · unidad · origen (planeado/adicional en sitio) · observación (opcional) · quién/cuándo (automático). **Sin economía.**

**Ventana de edición de utilizaciones:** `DRAFT`, `SCHEDULED`, `IN_PROGRESS` (se registran durante la ejecución). Congeladas en `COMPLETED`/`CANCELLED`.

**Compatibilidad:** implementación **100% aditiva**. NO se toca `WorkOrderItem`, `Invoice`, `Quotation`, `ServiceRecord`, ni PDFs. `ResourceUtilization` **convive** con el modelo actual hasta que exista Preparación de Facturación.

---

## Modelo de dominio — Contexto Preparación de Facturación (FUNCIONAL, CONGELADO)

> Congelado 2026-07-28. Cierra la capa **funcional** del contexto Facturación (RFC-06). Capa táctica en derivación. Todo derivado de invariantes, no de preferencias. No refinar salvo contradicción objetiva durante la implementación.

**Responsabilidad exacta:** **consume** las resoluciones regladas (cobertura, precio, descuento, condiciones), **compone** el resultado económico a cobrar, y **solo decide discrecionalmente el residual** que ninguna regla resolvió. NO reconcilia, NO fija precios, NO emite el documento fiscal.

**Fronteras entre contextos (explícitas y congeladas):**
- **Comercial** es dueño de: acuerdos, coberturas, precios, políticas y demás **resoluciones regladas** (incluida la reconciliación cotización↔ejecución).
- **Operaciones** es dueño **exclusivamente** de: la realidad técnica ejecutada (Utilizaciones de Recurso, sin economía).
- **Preparación de Facturación**: consume esas resoluciones, compone el resultado económico, y **únicamente** toma decisiones discrecionales sobre el residual que ninguna regla resolvió.
- **Sistema fiscal**: únicamente **materializa el documento legal** (Cuenta de Cobro hoy, Factura Electrónica mañana) — externo/integrado.

**Hechos de negocio:** (1) se abre una preparación desde una intervención cerrada; (2) se **consultan** las disposiciones comerciales de lo ejecutado (Comercial reconcilia, Facturación consume); (3) se identifica el **residual** (sin resolución reglada); (4) se decide discrecionalmente el residual (cobrar/absorber/conceder); (5) se **compone** el resultado; (6) se confirma; (7) se entrega para emisión fiscal — o se cierra sin cobro.

**Conceptos propios:** la preparación, la decisión discrecional sobre cada elemento residual, el resultado económico, el registro **interno** (margen/absorbido). **Referenciados:** OT/Utilizaciones (Operaciones), disposiciones/cobertura/precio (Comercial), costo (interno), documento fiscal (externo), cliente.

**Invariantes (CONGELADAS):**
1. Una preparación corresponde a una **única** intervención cerrada.
2. **Completitud:** cada elemento tiene resolución = (reglada, recibida) ∪ (residual, discrecional), **sin solaparse**.
3. **No doble cobro:** lo cubierto por regla no se factura.
4. **Consistencia:** el resultado es consistente con los precios recibidos + las decisiones de inclusión (Facturación **no valora, compone**).
5. **No altera sus fuentes:** la OT y la cotización están congeladas; las lee.
6. **Inmutabilidad tras emisión.**
7. **Puede existir sin cobro** (todo absorbido/cubierto → sin documento fiscal).
8. **No-apropiación:** *Preparación de Facturación nunca modifica, revierte ni re-decide una resolución proveniente de una garantía, contrato, política o regla comercial.* Su discrecionalidad se limita al residual.

**Recibe** — de Operaciones: identificación de la intervención + Utilizaciones (recurso, categoría, cantidad, unidad, origen, observación), **sin precio ni costo**. De Comercial: **disposiciones** (cobertura, precio, descuento, condiciones) como resultado consultado. Costo: por vía interna.

**Produce** (para el sistema fiscal): conjunto de **cargos** (concepto, cantidad, unidad, precio recibido, descuento, impuesto) + total + referencias de trazabilidad. **No produce:** costo, margen, ni qué se absorbió (interno).

**Eventos** — Entra: `IntervenciónCerrada` (OT firmada, de Operaciones). Salen: `FacturaciónPreparada` (con cobro → emisión fiscal) · `PreparaciónCerradaSinCobro` (todo absorbido/cubierto).

---

## Incremento "Utilización → Preparación → Cuenta de Cobro" — ✅ CERRADO (2026-07-28)

**Estado:** Fases 1-3 implementadas, verificadas (backend E2E + UI end-to-end) y **auditadas**. Incremento **estable y cerrado**. La **Fase 4** (disposiciones de contrato → CC-1) queda como **incremento independiente futuro**, no bloqueante.

**Flujo operativo DEFINITIVO:**
`Cotización → OT → Utilizaciones de Recurso (técnico, sin economía) → Preparación de Facturación (admin: cobrar/absorber + precio; resultado derivado) → Cuenta de Cobro (solo lo cobrado)`.

**Dominio congelado** (ver secciones *Modelo de dominio — Operaciones* y *— Preparación de Facturación*): Operaciones (`WorkOrder` = Aggregate Root, Utilización = Entity local) · Facturación (Preparación = Aggregate Root, decisión por elemento = VO, resultado derivado, Domain Services consultados, **no** Process Manager). RFC-06 estratégica congelada + táctica derivada.

**Decisiones de arquitectura adoptadas:**
- Separación de contextos: Operaciones (técnica) · Comercial (reglas/precios/cobertura) · Facturación (residual + composición) · Fiscal (externo/integrado).
- OT sin economía; el precio se decide en Facturación.
- Resultado económico **DERIVADO, no persistido**; el snapshot definitivo lo conserva el documento fiscal.
- Sin infraestructura de eventos (invocación directa); domain events como concepto.
- Documento fiscal como realización enchufable (Cuenta de Cobro hoy, Factura Electrónica mañana).
- **100% aditivo**; coexistencia transitoria con `WorkOrderItem` (se retira en el futuro).

**Invariantes implementadas y verificadas:**
- *Operaciones:* utilización pertenece a una única OT · no existe sin OT · OT `COMPLETED`/`CANCELLED` inmutable · congelamiento atómico al cierre.
- *Facturación:* una prep por OT cerrada · completitud (`reglada ∪ residual`) al confirmar · no doble cobro · consistencia (compone, no valora) · no altera fuentes · inmutabilidad tras confirmar · puede existir sin cobro · **no-apropiación**.

**Artefactos:** migraciones aditivas `20260728044121` / `215337` / `222000`; backend `resource-utilizations` + `billing-preparations` + `Invoice.createFromPreparation`; frontend `ResourceUtilizationsCard` + `BillingPreparationCard`.

**Auditoría (2026-07-28):** cero contradicciones de dominio · cero violaciones de invariantes · cero regresiones (flujo viejo intacto, `CC-2026-00001` íntegra) · migraciones aditivas (sin `DROP`) · listo para Fase 4 sin refactor. Higiene: ESLint backend limpio, frontend `noUnusedLocals` limpio, sin `TODO/FIXME`, nombres consistentes.

### Deuda técnica del incremento (NO bloqueante · separada del dominio — el modelo NO se reabre)

- **M-1** 🟡 — Sin `VOID`/reapertura de una preparación `CONFIRMED`. La inmutabilidad es por diseño (inv 6), pero operativamente falta recuperación si se confirma mal y aún no hay factura. *Futuro: estado `VOID` para prep confirmada-sin-factura.*
- **M-2** 🟡 — Superposición de UI: en el detalle de la OT conviven el card de Preparación y el viejo "+ Crear cuenta de cobro". Sin riesgo de datos (`workOrderId @unique` impide doble factura). *Futuro: ocultar el camino viejo para OTs con utilizaciones.*
- **M-3** 🟢 — Guard de no-apropiación pendiente para Fase 4: `setResolution` debe rechazar sobrescribir resoluciones `RULE` (hoy inofensivo — todo `DISCRETIONARY`). Adición de Fase 4, ya provisionada por el campo `source`.
- **M-4** 🟢 — La UI factura la cantidad completa (no expone `billableQuantity`). API/dominio soportan parcial; feature diferida.
- **M-5** 🟢 — 2 endpoints válidos no consumidos por la UI actual (`GET /billing-preparations/:id`, `DELETE .../resolutions/:utilizationId`). Completitud REST, no código muerto; el `DELETE` es el "limpiar decisión" que la UI puede añadir. *Mantener.*

**Cierre operativo — análisis de aceptación del cliente (2026-07-28):** se auditó la diferencia entre *fin de ejecución técnica* (`COMPLETED`) y *aceptación del cliente*. **Veredicto: NO requiere reabrir el modelo** — es un hecho de negocio real pero **no modelado** + una **decisión de negocio pendiente**, incorporable de forma **aditiva** sin contradecir ninguna invariante congelada (las invariantes son agnósticas a qué hecho cierra la OT). La aceptación del cliente queda como **incremento futuro independiente** (ver backlog 🟢). **Este incremento (Utilización de Recurso + Preparación de Facturación + Cuenta de Cobro) queda DEFINITIVAMENTE CERRADO** — no se reabre salvo apertura explícita de un incremento nuevo.

---

## Módulo Finanzas — Escenario 1 (Fundación) — ✅ CERRADO (2026-08-02)

> Plan detallado tarea por tarea: `IMPLEMENTATION_PLAN_FINANCE_SCENARIO_1.md` (raíz del repo, T-06…T-15 todas `✅ Completed` con hash de commit). Diseño funcional previo: `docs/functional/finanzas-escenario-1-design-v1.0.md`. Este apartado resume el estado final para quien no quiera leer el plan completo.

**Principio rector (congelado, no reabrir sin evidencia real):** Finanzas es un contexto **derivado y de solo lectura** — nunca una segunda fuente de verdad. Source of truth único: **ingreso = `Invoice`**, **cobro = `Payment`**, **costo directo = `Expense`**. `ResourceUtilization` es hecho técnico, nunca fuente de costo. Reutiliza y complementa lo existente (`InvoicesService.getSummary()` sigue siendo la fuente única del receivable global); nunca duplica.

**Backend — módulo `finance` (T-06…T-10), 100% nuevo, sin tocar `InvoicesService`:**

| Endpoint | Tarea | Qué expone |
|---|---|---|
| `GET /finance/ping` | T-06 | Andamiaje/verificación del módulo (sin consumidor en frontend hoy — ver deuda) |
| `GET /finance/clients/:clientId` | T-07 | Rollup económico por cliente: facturado, costo, margen, nº OT. Fuente única que reutilizan T-08 (faceta cartera) y T-15 (faceta rentabilidad) |
| `GET /finance/receivable` | T-08 | Receivable con aging (5 tramos sobre `dueDate`), cartera por cliente, concentración Top 5. Opción C: titular tomado de `getSummary()` (intacto), detalle protegido por invariantes `Decimal.equals()` |
| `GET /finance/pulse` | T-09 | Embudo del ciclo económico de las OT + margen bruto global. **Sin consumidor en frontend hoy** (`PulsoPage` no se implementó en este escenario) |
| `GET /finance/attention` | T-10 | 4 listas de atención (vencidas, sin facturar, sin costos, margen negativo), reutilizando criterios ya definidos. **Sin consumidor en frontend hoy** |

**Frontend (T-05, T-11…T-15):**
- **T-05** — `CostSummaryCard` (OT): aviso "Sin costos registrados · verificar" en OT cerrada sin gastos, en vez de ocultar la card.
- **T-11** — **Cartera** reemplaza "Estado de cuentas" (`/estado-cuentas`, ruta intacta): riesgo → clientes → acciones, sobre `/finance/receivable`.
- **T-12** — Columna Saldo + filtros Cliente/Antigüedad en `InvoicesPage` (dominio Facturación, no Finance — autorizado modificar `InvoicesService`/DTO para esto).
- **T-13** — Histórico "Ingresos cobrados 12m" movido de Cartera a `PaymentsPage`.
- **T-14** — Ruta `/clientes/:id`: identidad de solo lectura + shell de economía.
- **T-15** — Vista de rentabilidad del cliente: margen héroe + facturado histórico + nº OT, consumiendo **exclusivamente** `GET /finance/clients/:clientId`, sin recalcular ni mezclar endpoints.

**Decisiones arquitectónicas adoptadas en este escenario:**
- Cada concepto económico tiene una única lógica de negocio autorizada; las superficies que lo necesitan la reutilizan (pueden presentarla distinto según contexto, pero no duplicarla).
- Todo el escenario opera **all-time** — `FinancePeriodQueryDto` (T-06) quedó preparado pero sin consumidor real; el filtrado por período se difirió explícitamente.
- Invariantes de suma (`Decimal.equals()`, T-08) como mecanismo para tolerar duplicación de fórmula mientras no haya evidencia suficiente para extraer una abstracción compartida.

### Deudas técnicas del escenario (NO implementar sin abrir tarea)

| Deuda | Detalle |
|---|---|
| `/finance/pulse` y `/finance/attention` sin consumidor | T-09/T-10 completos en backend; `PulsoPage` (consumidor natural) no se construyó en este escenario — es el próximo bloque candidato (`T-16`/`T-17` en el plan original). |
| `FinancePeriodQueryDto` sin uso | Ningún controlador lo usa. Consumirlo de verdad exigiría modificar las firmas ya cerradas de T-07/T-08/T-09/T-10. |
| Duplicación de "saldo = total − pagos válidos" (5 implementaciones) | `invoices.service.ts` (×2: `recalculateInvoiceStatus`, `findAll`), `work-orders.service.ts` (`findOne`), `finance.service.ts` (`getReceivable`), y **recálculo en frontend** en `InvoiceDetailPage.tsx` (`parseFloat`/`reduce`, no Decimal). Evidencia suficiente para extraer un helper único del dominio Facturación — no extraído todavía. |
| `overdueAmount` sin clamp de sobrepagos en Cartera | Inconsistente con `width()`/`barBase` del mismo archivo (`EstadoCuentasPage.tsx`), que sí clampan negativos. Bug latente, sin caso vivo en BD hoy. |
| Filtros incompatibles en `InvoicesPage` sin feedback claro | Combinar un estado no-cartera (p. ej. `PAID`) con un tramo de antigüedad da lista vacía a propósito, pero la UI no distingue esa combinación de un vacío real. |
| Aging por cliente en `/finance/receivable` | Cartera (Bloque 2) muestra clientes por saldo sin distribución por antigüedad por fila (decisión T-11: no extender el contrato de T-08). |
| Duplicación de `economicCycle` (frontend↔backend) | Misma clasificación de 4 etapas del ciclo implementada en `CostSummaryCard` (frontend, T-03) y `FinanceService.getPulse` (backend, T-09). |
| Identificador estable de etapa del ciclo | `economicCycle`/`CycleBadge` solo expone `{label,variant}` (presentación); el gate de T-05 compara por texto. |
| Navegación a `/clientes/:id` solo desde Cartera | No se agregó desde `ClientsPage` (alcance explícito del usuario en T-14). |
| Autenticación con token solo en memoria (frontend) | `_accessToken` en `api.ts` se pierde en cada recarga/navegación de la SPA — dificulta E2E y recuperación de sesión. |
| **Frontend build baseline: 9 errores TypeScript heredados** | `InvoicesPage.tsx`(1)·`LoginPage.tsx`(1)·`MaintenanceContractsPage.tsx`(3)·`MaintenancePlanDetailPage.tsx`(3)·`UsersPage.tsx`(1). **No pertenecen a Finanzas** ni fueron introducidos por este escenario — verificados como baseline constante en cada tarea (T-05…T-15). Resolver en una tarea de estabilización dedicada, separada de cualquier roadmap funcional. |

### Incrementos deliberadamente diferidos (línea base, no bugs)

Decisiones explícitas de alcance — no ausencias accidentales: **recurrencia** del cliente (nunca entró al contrato de T-07) · **cualificador de salud de cobro** en la ficha de cliente (solo enlace de navegación a Cartera, sin dato derivado) · **estado "tensión rentable-pero-mal-pagador"** (exigiría cruzar T-07 con T-08) · **estado "salvedad por contrato"** (el DTO de T-07 no distingue origen de factura, OT vs. contrato) · **filtro de OT por cliente** en el enlace "sus OT" desde la ficha de cliente (`WorkOrdersPage` no soporta ese query param hoy).

---

## WorkOrderTechnician — Ejecutores reales de la OT — ✅ CERRADO (2026-08-02)

**Principio de dominio (coherente con §5.2 del Modelo de Dominio, ya congelado 2026-07-15, que dice explícitamente que a la OT le corresponde documentar "quién la ejecutó o gestionó"):** la Orden de Trabajo es la fuente de verdad de la ejecución. El Acta Técnica y su PDF son evidencia derivada — **nunca almacenan ejecutores de forma independiente**, solo los leen desde la OT.

**Separación de conceptos (ambos en `WorkOrder`, sin fusionarse):**
- `assignedToId` (preexistente) = responsable/asignado en **planeación**. Semántica sin cambios.
- `WorkOrderTechnician` (nuevo, N:N `WorkOrder↔User`) = ejecutores reales de la intervención — quiénes estuvieron ahí, potencialmente varios, potencialmente distintos del asignado.

**Modelo de datos:** tabla `work_order_technicians` minimalista a propósito — `id`, `workOrderId`, `userId`, `createdAt`, `@@unique([workOrderId, userId])`. **Sin** `role`/`isLead` — sin evidencia de negocio que lo justifique (el "quién firma" ya lo resuelve `assignedToId`; no hay precedente de diferenciar actores por rol en ningún registro técnico del dominio, incl. `ChecklistItem`). Migración 100% aditiva — verificado que el SQL generado es solo `CREATE TABLE`/`CreateIndex`/`AddForeignKey`, sin `ALTER` sobre tablas existentes.

**Backend:** `WorkOrdersService.findOne` expone `technicians` (detalle únicamente — no entra a `WORK_ORDER_SELECT` del listado, mismo patrón que `invoice.paidTotal`). Endpoint `PATCH /work-orders/:id/technicians` reemplaza el conjunto completo (sin add/remove incremental). PDF (`documents.service.ts`/`ServiceRecordDocument.tsx`): nuevo campo `technicianNames: string[]` leído desde la OT, renderiza "Técnicos que intervinieron" en el cuerpo del informe solo si la lista no está vacía; el bloque de firma sigue usando el `technicianName` singular existente (de `assignedTo`). `ServiceRecord` no ganó ninguna columna.

**Frontend:** `TechniciansCard` (nuevo, en el detalle de OT) — checklist de técnicos reutilizando `useTechnicians()` ya existente (cero endpoint nuevo para el selector). Muestra advertencia (no bloqueante) cuando la OT está `COMPLETED` sin ejecutores registrados.

**Comportamiento (decisión explícita):** ejecutores **opcionales** en esta iteración — no bloquean la transición a `COMPLETED`. Si la operación demuestra que debe ser obligatorio, se abrirá una tarea específica para convertir la advertencia en regla de negocio.

**Deuda heredada (NO introducida por este cambio — verificada por historial de git antes de implementar):** el catálogo de usuarios con rol `TECHNICIAN` está vacío desde el origen del sistema (`findTechnicians()` con ese filtro existe desde el commit `aaef93b`, 2026-07-07; el único usuario real, Mario Márquez, tiene rol `ADMIN`, creado 2026-07-16). El selector de ejecutores aparece vacío en la práctica — **misma limitación preexistente** que ya tenía el selector de "Técnico asignado" (comparten `useTechnicians()`/`GET /users/technicians`). No es una regresión de este cambio; es falta de datos operativos (crear usuarios con rol técnico), no de arquitectura.

---

## Resumen ejecutivo del backlog — por impacto (referencia de priorización)

> Se actualiza al cierre de cada módulo. Ordena todos los hallazgos abiertos según su impacto en los objetivos del proyecto (migración histórica → salida comercial → UX → mejora futura), no por módulo. Cobertura actual: Clientes/Sedes/Equipos, Portal QR, Cotización, Orden de Trabajo, Acta Técnica, Cuenta de Cobro, Contratos/Planes/Visitas. *(Pendiente: Dashboard, Hoja de Vida.)*

### 🔴 Bloquea migración histórica
- **OT-4** — `completedAt` no retrofechable → toda intervención migrada queda con fecha de hoy y rompe la Hoja de Vida. **Prerequisito del piloto histórico.** Requiere diseño (modo migración o exponer `completedAt` en el cierre).
- **MNT-1 (DT-06-B)** — OT preventiva de plan multi-equipo sin `equipmentId` → si se migran/generan preventivos por plan, no se vinculan al activo. (También Comercial/Operación.)

### 🔴 Bloquea salida comercial (demo a IPS / propuesta de valor)
- **MNT-1 (DT-06-B)** — el preventivo recurrente de contratos multi-equipo no aparece en el QR/Hoja de Vida del activo → **rompe la promesa "el historial viaja con el equipo" en el escenario comercial central.** Alta prioridad, junto con OT-4. **Evidencia de costo real (Emmanuel, 2026-07-25):** el workaround "un plan por equipo" obligó a crear **17 planes + 17 visitas** para lo que operativamente son **3 visitas físicas** (una por sede); se tuvo que hacer por API. El costo operativo del workaround escala linealmente con el nº de equipos.
- **QR — datos** — teléfono ficticio (`+57 (601) 000-0000`) + equipo demo vacío (sin marca/modelo/serial) → el portal subvende la propuesta de valor. Corrección barata (datos/copy).
- **QR — prueba física** — validación con teléfono real pendiente (Bloque 7).

### ✅ OT-8 — RESUELTO (implementado 2026-07-28)
- **OT-8 (reformulado por RFC-06) — ✅ IMPLEMENTADO.** La OT ahora captura la **ejecución real** vía el concepto **Utilización de Recurso** (contexto Operaciones): recurso (texto), categoría (material/mano de obra/gasto), cantidad, unidad, origen (planeado/adicional en sitio), observación, quién/cuándo — **SIN economía**. Fases completas: (1) Prisma `ResourceUtilization` + enums + **migración aditiva** `20260728044121`; (2) backend (DTOs, servicio, controlador `work-orders/:id/resource-utilizations`, **invariantes del agregado** aplicadas — inmutabilidad al cierre, pertenencia a una OT, ventana editable DRAFT/SCHEDULED/IN_PROGRESS); (3) frontend card **"Recursos utilizados"** (CRUD gated por estado); (4) verificado E2E backend + visual frontend. **100% aditivo** — NO toca `WorkOrderItem`/`Invoice`/`Quotation`/`ServiceRecord`. **Nota:** cierra la **captura técnica**; el **cierre del loop de facturación** (poner precio → cobrar adicionales) espera al módulo de **Preparación de Facturación** (RFC-06, capa táctica ABIERTA — próximo bloque).

### 🟡 Afecta operación / experiencia de usuario / calidad de datos
- **CC-1** — la Cuenta de Cobro copia todos los ítems de la OT → riesgo de **facturar de más** líneas cubiertas por contrato. Impacto Operación, prioridad Alta.
- **OT-2** — `type` no capturable (todo CORRECTIVE) → OTs mal etiquetadas. Quick-win disponible.
- **CE-3** — cliente sin dirección fiscal / representante legal → afecta Cuenta de Cobro y completitud de migración.
- **COT-3** — condiciones comerciales (forma de pago, garantía) no capturables (slots PDF muertos).
- **ACT-1** — evidencias/fotos no se renderizan en el PDF del Acta.
- **CE-5** — `serialNumber` no único → riesgo de duplicados al migrar.
- **COT-5** — conversión cotización→OT sin guía + cotización `CONVERTED` varada si se cancela su OT. Trap del flujo comercial; impacto Operación/Comercial, prioridad Media.
- **OT-5** — OT preventiva nace en $0, no hereda el precio del contrato → carga manual por visita, riesgo de Cuenta de Cobro en $0. Cara operativa de RFC-4.
- **MNT-2** — `BillingCycle` sin "cada 4 meses" (inconsistente con `MaintenanceFrequency`). No bloquea (cobro manual). Prioridad Baja.
- *(OT-8 elevado a 🔴 URGENTE — ver sección arriba.)*

### 🟢 Mejora futura (arquitectura / evolución)
- **Incremento futuro — Aceptación del Cliente (contexto Operaciones).** Modelar el hecho de negocio *"aceptación / recepción del cliente"* de una intervención y su **evidencia** (firmada · tácita por silencio · remota · por apoderado), como capa **aditiva** sobre la OT. Objetivo: distinguir *fin de ejecución técnica* de *aceptación del cliente* — porque **garantía, historial del activo y facturación** dependen semánticamente de la aceptación, mientras que hoy `COMPLETED` = ejecución técnica (→ se puede facturar trabajo no aceptado). **NO modifica los agregados ni las invariantes congelados** (Operaciones/Facturación permanecen cerrados). **Decisión de negocio pendiente antes de abrirlo:** ¿la aceptación es obligatoria para cerrar toda OT, o admite formas tácita/diferida? Analizado y diferido el 2026-07-28 (veredicto: no reabre el modelo). **No abordar hasta abrir explícitamente el incremento.**
- **OT-1 / CC-1 (RFC-4) — ✅ ADOPTADA por RFC-06** — separar registro de ejecución de la facturación (precios fuera de la OT; cobertura por línea). Ya no es "mejora futura": es principio congelado del nuevo flujo.
- **RFC-5 (propuesta del usuario, 2026-07-25) — ❌ RECHAZADA por RFC-06** (se decide cotización inmutable + Patrón B; no "cotización viva"). Se conserva el registro por trazabilidad de la decisión. — **flujo "diagnostica-luego-completa" para correctivos.** Problema real: en un correctivo se cotiza la visita antes de saber qué falla; durante la visita aparecen repuestos/trabajos que no estaban cotizados. Hoy no hay forma de incorporarlos después (OT-8: la OT no tiene editor de líneas). Dos filosofías opuestas para resolverlo — es **decisión de diseño, no ajuste**: **(A) "Cotización viva"** (propuesta del usuario): la cotización se amplía tras la visita, con una fase de re-aprobación del cliente antes de convertir; la OT solo lleva descripción, los valores quedan en la cotización. Ventaja: respaldo comercial del extra. Matiz: una cotización es una oferta de un momento; mantenerla abierta mezcla oferta con ejecución. **(B) "OT viva"** (dirección del dominio / RFC-4): la cotización es solo la oferta inicial; la OT recibe las líneas reales de lo ejecutado (editor OT-8) y de ahí se factura; los valores **sí** viven en la OT. Las dos chocan en dónde viven los valores. Ligado a RFC-4 / OT-5 / OT-8. No abordar durante la fase de operación.
- **COT-1 / COT-2** — "Servicio Ofertado" como unidad + cardinalidad cotización→OT (1:N).
- **OT-3 (RFC-3)** — origen comercial explícito en la OT.
- **CE-4** — características técnicas por tipo de equipo (con descubrimiento acotado).
- **CE-6** — carga masiva para la migración (hoy uno por uno).
- **CC-2** — retrofecha de `issueDate` en Cuenta de Cobro (Migración, prioridad Baja).

*(CE-1, CE-2, CE-7, OT-6 y OT-7 ya corregidos — fuera del backlog. COT-4 = OT-4, unificado.)*

---

## Deliverable de cierre de la fase — ERP Validation Report v1.0

Al terminar la validación del último módulo se generará **`docs/validation/erp-validation-report-v1.0.md`** (o HTML), que cerrará oficialmente esta fase y abrirá la de estabilización/producción. Contenido acordado:
1. Resumen ejecutivo. 2. Estado de todos los módulos (🟢🟡🔴). 3. Hallazgos clasificados (Categoría · Impacto · Prioridad). 4. Hallazgos agrupados por impacto (Migración / Comercial / Operación / UX). 5. Correcciones implementadas durante la validación. 6. Backlog priorizado. 7. Riesgos para salir a producción. 8. Checklist de migración de datos reales. 9. Checklist de reorganización del sitio web. 10. Checklist para iniciar el envío de propuestas comerciales.

---

## Deuda técnica activa

| ID | Descripción | Severidad | Origen |
|----|-------------|-----------|--------|
| DT-01 | Botón "Cancelar" en `WorkOrderHeader` ejecuta transición sin dialog de confirmación | Baja | Hito 2 |
| DT-02 | `refreshTokenHash` se sobrescribe en cada login — sesión única por usuario | Baja-Media | Hito 4 |
| DT-03 | Refresh token no rota en cada uso de `POST /auth/refresh` | Baja | Hito 4 |
| DT-04 | `JwtPayload.role` tipado como `string` en lugar de `UserRole` | Baja | Hito 4 |
| DT-05 | `clearRefreshCookie` es método público en `AuthService` | Baja | Hito 4 |
| DT-06-B — Etapa 2 | `generateWorkOrder()` sigue sin asignar `equipmentId` cuando el plan tiene N ≠ 1 equipos asociados. Causa raíz real (Etapa 1, ✅ resuelta): no existía forma de asociar equipos a contrato/plan — ver § Asociación Equipos↔Contratos↔Planes. Con Etapa 1 cerrada, se reevaluará si `generateWorkOrder()` necesita cambios (asignación manual, Ruta A1, u otra alternativa) — pendiente de análisis, no de implementación directa. Bajo el Modelo de Dominio (§7 del documento de dominio), esto es además una causa directa de historial incompleto en la futura Hoja de Vida del Equipo. | Media | Bloque 6.1 |

---

## Módulos congelados (no modificar salvo bug real)

- **Subsistema de autenticación y autorización** (`auth/`, `AuthContext`, `api.ts`): Congelado. Guards, refresh token, mutex de 401, `RolesGuard` — estable y auditado.
- **Sistema de identidad visual** (`index.css` tokens, `NodeMark.tsx`, `Sidebar.tsx`, `LoginPage.tsx`): Congelado en v2.0.0. Isotipo Concepto C Evolucionado, paleta y tipografía aprobados. No modificar sin aprobación de dirección creativa.
- **Motor Documental** (`documents/base/`, `documents/templates/`): Las 3 plantillas (Cotización, Acta Técnica, Cuenta de Cobro) están auditadas y funcionales. Congelado en v2.0.0.
- **Datos institucionales**: Fuente única en `frontend/src/config/company.ts` (frontend) y `backend/src/modules/documents/base/styles.ts` (backend). No hardcodear valores en componentes.

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
- **`MASTER_DOCUMENT_INDEX.md`** es el índice de autoridad de todos los documentos del proyecto. Registra jerarquía, estado y reglas de precedencia. Actualizar siempre que cambie el estado o versión de un documento.
- **`docs/strategy/` es la fuente oficial de las decisiones estratégicas.** Ningún cambio de código puede modificar ni reinterpretar un principio estratégico. El orden de actualización es invariable: primero el documento rector en `docs/strategy/`, luego `DEVELOPMENT_CONTEXT.md`, solo después el código. Invertir ese orden invalida la decisión.

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
| `maintenance-plans` | Depende de `contractId` (no clientId/branchId). Sub-recurso `/equipment` (attach/detach, subconjunto del equipo del contrato) |
| `maintenance-contracts` | CRUD + soft delete + numeración `CMTO-YYYY-NNNNN`. Sub-recurso `/equipment` (attach/detach, validado contra `clientId`) |
| `maintenance-visits` | Programación + cancelación + generación OT (transacción atómica) |
| `users` | CRUD + deactivate + changePassword |
| `dashboard` | KPIs mantenimiento: activeContracts, activePlans, overdueVisits |
| `files` | Polimórfico `entityType + entityId` |
| `documents` | PDF on-demand: Cotización, Acta Técnica, Cuenta de Cobro. Congelado. |
| `public` | Portal QR público — `GET /public/equipment/:qrCode`. Sin JWT (`@Public()`). Throttle 30 req/min. DTO de salida explícito. |
| `resource-utilizations` | Sub-recurso de `work-orders` (2026-07-28). Entity local del agregado OT — hecho técnico sin economía. |
| `billing-preparations` | Aggregate Root propio (2026-07-28). Decisión económica por elemento de la OT (cobrar/absorber); resultado derivado, no persistido. |
| `finance` | **Nuevo (2026-08-02).** Solo lectura/derivado sobre Operaciones+Facturación. `GET /finance/{ping,receivable,pulse,attention,clients/:id}`. Ver § *Módulo Finanzas — Escenario 1*. |

### Infraestructura

- **NestJS v11** · **Prisma ORM v7** · PostgreSQL `localhost:5433` / `erp_emprendedores`
- Cliente Prisma en `src/generated/prisma/`; `moduleFormat = "cjs"`
- **16 migraciones aplicadas**; última: `20260802061236_add_work_order_technicians`
- **Cadena de guards (congelada):** `ThrottlerGuard` → `JwtAuthGuard` → `RolesGuard`
- `PublicModule` usa `@Public()` a nivel de controlador — exento de `JwtAuthGuard` y `RolesGuard`; sujeto a `ThrottlerGuard` con override `30 req/min`
- **CORS multi-origen:** `CORS_ORIGIN` (ERP, default `localhost:5173`) + `PORTAL_ORIGIN` (portal QR, default `localhost:5174`). Función de validación — orígenes no listados son rechazados.
- Puerto backend: 3000 | Puerto frontend ERP: 5173 | Puerto portal QR: 5174

---

## Posicionamiento estratégico oficial (v1.3 — CONGELADO)

**Documento rector:** `docs/strategy/positioning-brief-v1.3.html`
**Fecha de cierre:** 2026-07-08
**Estado:** Congelado. Fuente de verdad oficial. No modificar sin decisión estratégica formal de la dirección.

Este documento define los principios que rigen **todo** lo que STECH NODES comunica sobre sí misma. Precede y gobierna cualquier otro artefacto de comunicación del proyecto.

### Declaración de posicionamiento

> STECH NODES es una empresa de servicio técnico especializado que ancla el conocimiento técnico de los activos biomédicos al equipo físico, no a las personas que lo gestionan. El ERP y el ecosistema QR son herramientas propias que nacen de la operación — no productos que vendemos.

### Principios estratégicos congelados

1. **STECH NODES no es una empresa de tecnología.** El ERP y el QR son herramientas internas que nacen de una operación técnica real. No son el producto; son la infraestructura que hace posible la promesa.

2. **El diferenciador real es la trazabilidad verificable anclada al activo.** No el QR, no el ERP, no los datos de forma aislada. La capacidad de convertir experiencia técnica en evidencia que viaja con el equipo — no con quien lo administra.

3. **La promesa solo cubre lo que puede cumplirse desde el primer día.** Sin predicción de fallas, sin inteligencia analítica, sin comparativas entre clientes. Solo: el historial existe, es sistemático, y el cliente puede acceder a él en cualquier momento.

4. **La información técnica generada pertenece al cliente.** STECH NODES considera la continuidad del historial técnico como un principio de la relación. La política de portabilidad se desarrollará como parte de la evolución del ERP y el QR.

5. **Este documento se actualiza primero.** Ningún material de comunicación externa, desarrollo del ERP, del ecosistema QR, portafolio comercial, presentación institucional ni documento para convocatorias puede contradecir estos principios. Si la estrategia cambia, este documento se actualiza antes que cualquier otro artefacto.

### Referencia de diseño del brief

El brief completo (`docs/strategy/positioning-brief-v1.3.html`) cubre los ocho ejes del posicionamiento: qué somos, qué problema resolvemos, para quién, qué nos diferencia, papel del ERP, papel del ecosistema QR, promesa válida hoy, y capacidades futuras a construir sin comunicar aún.

---

## Documentación estratégica — `docs/strategy/`

Esta carpeta es el repositorio oficial de la documentación estratégica del proyecto. Todos los documentos aquí listados son **fuente de verdad** para sus respectivos dominios. Ningún artefacto externo puede contradecirlos.

### Registro de documentos

| Archivo | Título | Versión | Estado | Dominio |
|---------|--------|---------|--------|---------|
| `business-rector-v1.0.html` | **Documento Rector Empresarial** | v1.0 | **RECTOR PERMANENTE** | Identidad corporativa, modelo de negocio, diferenciadores, visión, principios de gobierno. Base para Fondo Emprender y comunicación externa. PDF: `business-rector-v1.0.pdf` |
| `strategic-review-fondo-emprender-v1.0.html` | Revisión estratégica — base Fondo Emprender | v1.0 | Referencia permanente | Análisis de 5 fuentes con fuente y nivel de confianza. Vacíos documentales para PITCH VERDE 2026. PDF: `strategic-review-fondo-emprender-v1.0.pdf` |
| `positioning-brief-v1.3.html` | Brief de posicionamiento estratégico | v1.3 | **CONGELADO** | Identidad, propuesta de valor, promesa comercial |
| `qr-functional-design-v1.2.html` | Diseño funcional y arquitectónico del ecosistema QR | v1.4 | **CONGELADO** | Arquitectura QR, modelo de datos Phase 1, contrato DTO con lastMaintenance (§14 addendum D-4 + Precisión D-4.1: fuente `WorkOrder.completedAt`, ruta directa sobre WorkOrder) |
| `qr-uxui-v1.0.html` | Diseño UX/UI del portal QR | v1.0 | Borrador aprobado | Experiencia de usuario, wireframes, componentes, estados |
| `qr-strategy-audit-v1.0.html` | Auditoría estratégica del ecosistema QR | v1.0 | Referencia | Hipótesis, riesgos, diferenciación, análisis competitivo |
| `strategic-positioning-10y-v1.0.html` | Posicionamiento estratégico a 10 años | v1.0 | Referencia | Ventaja competitiva, modelo de crecimiento, horizontes |
| `qr-phase2-history-decision-v1.0.html` | Decisión de Bloque 6 — historial mínimo en portal | v1.0 | **CONGELADO** | Alcance de historial público, campos permitidos, restricciones heredadas |

### Jerarquía documental

Los documentos tienen jerarquía explícita. En caso de aparente contradicción, prevalece el de mayor jerarquía:

1. **`business-rector-v1.0.html`** — rector corporativo máximo. Consolida toda la estrategia. Base para Fondo Emprender y comunicaciones externas.
2. **`positioning-brief-v1.3.html`** — rector de identidad y comunicación. Define qué es la empresa y qué promete.
3. **`qr-functional-design-v1.2.html`** — rector de todas las decisiones de arquitectura e implementación del QR.
4. **`qr-uxui-v1.0.html`** — rector de las decisiones de experiencia e interfaz del portal.
5. **`qr-strategy-audit-v1.0.html`**, **`strategic-positioning-10y-v1.0.html`** y **`strategic-review-fondo-emprender-v1.0.html`** — documentos de referencia analítica. Informan decisiones pero no las prescriben.

### Reglas de gobierno documental

- **Congelado** significa que el contenido no cambia salvo decisión estratégica formal con fecha y motivo registrados.
- **Borrador aprobado** significa que el contenido está validado y puede usarse como referencia de implementación, pero admite ajustes menores sin revisión formal.
- **Referencia** significa que el documento sirve como contexto analítico; no tiene autoridad prescriptiva sobre implementaciones.
- Cualquier nuevo documento estratégico debe agregarse a este registro antes de usarse como base de decisiones.
- Cuando un documento congelado se actualiza, el nombre de archivo incluye la nueva versión. La versión anterior se conserva en el historial de git.

### Decisiones arquitectónicas congeladas en `qr-functional-design-v1.2.html`

Los siguientes principios están congelados y no pueden modificarse sin actualizar primero el documento funcional:

1. **El QR identifica un activo técnico mantenible** — no exclusivamente un equipo físico.
2. **El QR es identificador, nunca repositorio** — el ERP es la única fuente de verdad. El QR es el canal de acceso.
3. **Phase 1: portal público sin autenticación** — maximiza la experiencia del cliente, establece el QR como diferenciador de servicio.
4. **Arquitectura Option B** — app React independiente, mismo backend NestJS vía `PublicModule` con guards separados.
5. **`PortalUser` diferido** — el modelo de acceso autenticado debe diseñarse desde la perspectiva de negocio antes de cualquier cambio de esquema.

### Auditoría de coherencia cruzada — 2026-07-08

Resultado: **los documentos son coherentes en todos los puntos sustantivos**. Se identificó una tensión menor que no requiere corrección pero sí debe conocerse:

**Coherencias confirmadas:**
- El QR como identificador, no repositorio — coherente en functional design y brief.
- El ERP como única fuente de verdad — coherente en todos los documentos.
- STECH NODES como empresa de servicio, no de software — coherente en brief y análisis de 10 años.
- El QR como interfaz de la promesa, no la promesa misma — coherente en brief, audit y functional design.
- La política de portabilidad como principio pendiente de formalizar — coherente en brief y functional design.
- Segmento objetivo (clínicas privadas y hospitales con carga regulatoria real) — coherente en brief y audit.

**Tensión menor registrada (no bloquea el desarrollo):**
`qr-functional-design-v1.2.html` contiene la afirmación: *"Ninguna empresa de mantenimiento de equipos hospitalarios en Colombia ofrece actualmente un sistema de trazabilidad por QR con historial verificable."* Esta afirmación absoluta sobre el mercado fue deliberadamente eliminada del `positioning-brief-v1.3.html` por no ser verificable objetivamente. Como el functional design es un documento de arquitectura interna (no de comunicación externa), la tensión es aceptable. Sin embargo: esta afirmación **no debe reproducirse** en materiales de comunicación externa (web, portafolio, presentaciones).

---

## Modelo de Dominio del ERP — `docs/domain/`

Pista de gobierno separada de `docs/strategy/` (identidad, posicionamiento, QR). `docs/domain/domain-model-v1.0.md` es la fuente de verdad del modelo conceptual del ERP: lenguaje ubicuo, principios rectores, decisiones D-07 a D-11, y las definiciones documentales oficiales de los artefactos del proceso de mantenimiento (Cotización, Orden de Trabajo, y las que sigan).

**Estado (2026-07-15):**
- Lenguaje ubicuo (Sistema, Equipo, Componente, Periférico, Repuesto, Consumible, Intervención Técnica, Visita, Hallazgo, Corrección) — ✅ congelado.
- Principios rectores 1 a 8 (incluyendo Principio 8 — Hoja de Vida del Equipo relacional) — ✅ congelados.
- D-07 a D-11 — ✅ congeladas.
- Cotización — ✅ definición documental oficial congelada.
- Orden de Trabajo — ✅ definición documental oficial congelada.
- Acta Técnica — ✅ definición documental oficial congelada.
- Cuenta de Cobro — ✅ definición documental oficial congelada.
- **Hoja de Vida del Equipo — ✅ definición documental oficial congelada** (§5.5). **Registro técnico integral del activo**: expediente que reúne, sin poseer, identificación, información técnica, estado, cronograma vigente, historial de intervenciones y soportes; composición de solo lectura, no se almacena como entidad. Corrección de dominio clave: no es una línea de tiempo de intervenciones. Tríada de valor: proceso *garantiza* · Hoja de Vida *representa* · QR *materializa disponibilidad* (porción pública).
  - **Hitos del ciclo de vida del activo (instalación, traslado, salida/retorno de servicio, baja):** ⏸️ **hipótesis de diseño DIFERIDA, no validada** — fuera del alcance congelado. `Equipment` es hoy ficha (estado actual), no historial. Se evolucionará el modelo solo si el desarrollo o futuras entrevistas muestran la necesidad real. NO crear entidad hasta entonces.

**Backlog derivado de la auditoría (no implementado):** RFC-1 a RFC-4, más los hallazgos de deuda técnica y mejora de UX registrados en `docs/domain/domain-model-v1.0.md §7`. Ninguno se implementa hasta que se decida explícitamente retomarlo — este commit es exclusivamente de consolidación documental.

**Regla:** cualquier cambio de código relacionado con OT, Cotización, Acta Técnica, Cuenta de Cobro o Hoja de Vida del Equipo debe ser compatible con `docs/domain/domain-model-v1.0.md`. Si una necesidad real contradice algo ya congelado ahí, se actualiza primero el documento de dominio, luego este archivo, y solo después el código — mismo orden invariable que ya rige para `docs/strategy/`.

**Próxima sesión (retomar aquí):** la fase de descubrimiento documental del dominio está **cerrada** (5 definiciones congeladas). El siguiente paso lo define el usuario: puede ser (a) el paso a **diseño técnico** del backlog priorizado (RFC-1 a RFC-4, la vista/expediente de Hoja de Vida como implementación mínima, DT-06-B Etapa 2), o (b) otro descubrimiento de dominio si aparece. No iniciar la hipótesis diferida de hitos del ciclo de vida sin evidencia nueva.

---

## Identidad corporativa STECH NODES (v2.0.0)

### Sistema Visual aprobado y congelado

| Elemento | Valor |
|----------|-------|
| Isotipo | Concepto C Evolucionado — reticle de precisión, 2 anillos + 4 marcas cardinales |
| Paleta | `#042C53` Azul Noche · `#185FA5` Azul Técnico · `#378ADD` Azul Símbolo · `#0F6E56` Verde Control |
| Tipografía | Space Grotesk (display / marca) + Inter (UI) |
| Tagline | "Operaciones técnicas, bajo control." |

### Fuentes únicas de datos institucionales

- **Backend:** `backend/src/modules/documents/base/styles.ts` → exporta `COMPANY as const`
- **Frontend:** `frontend/src/config/company.ts` → exporta `COMPANY as const`

Cualquier componente que muestre datos de la empresa **debe importar de estas fuentes**. No hardcodear.

### Routing de emails por tipo de documento

| Tipo de documento | Email |
|-------------------|-------|
| Cotizaciones, Contratos de Mantenimiento | `ventas@stechnodes.com` |
| Órdenes de Trabajo, Actas Técnicas | `soporte@stechnodes.com` |
| Cuentas de Cobro | `facturacion@stechnodes.com` |
| Comunicaciones institucionales / generales | `contacto@stechnodes.com` |

El email se pasa al `DocumentHeader` vía prop `contactEmail`. Si se omite, usa `COMPANY.emails.contacto`.

### Estructura de notas en documentos (v2.0.0)

Los documentos con sección de notas usan campos opcionales en el DTO para habilitar estructura sin romper compatibilidad:

| Campo DTO | Etiqueta en PDF | Documento |
|-----------|-----------------|-----------|
| `notes` | Notas del servicio | Cotización, Cuenta de Cobro |
| `terms` | Condiciones comerciales | Cotización |
| `paymentTerms` | Forma de pago | Cotización, Cuenta de Cobro |
| `warranty` | Garantía | Cotización, Cuenta de Cobro |
| `additionalNotes` | Observaciones adicionales | Cotización |

Los campos opcionales se muestran solo cuando tienen contenido (`null` los omite). El servicio los mapea como `null` hasta que la BD incorpore columnas dedicadas.

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

### Asociación Equipos↔Contratos↔Planes — DT-06-B Etapa 1 (2026-07-12)

**Estado:** ✅ Cerrado y verificado.

**Causa raíz identificada:** `ContractEquipment` y `MaintenancePlanEquipment` estaban completamente modeladas en el schema desde Hito 13-A, pero sin ningún CRUD de aplicación — cero endpoints, cero UI, cero seed. `generateWorkOrder()` (Bloque 6.1) consultaba `plan.planEquipment`, que siempre estaba vacío en la práctica; DT-06-B, tal como estaba documentada ("no asigna `equipmentId` en planes con N > 1 equipos"), subestimaba el alcance real del problema.

**Decisiones congeladas (sesión 2026-07-12):**
- **Un `MaintenancePlan` solo puede asociar equipos ya vinculados a su `MaintenanceContract` padre.** No existe FK que lo obligue en el schema — se aplica en `MaintenancePlansService.attachEquipment()` verificando membresía en `ContractEquipment` antes de crear el vínculo.
- **La validación de pertenencia equipo↔cliente vive en un único lugar:** `MaintenanceContractsService.resolveEquipmentForClient()` (privado). `MaintenancePlansService` no la duplica — solo verifica membresía en `ContractEquipment`, una consulta distinta y más simple que no necesita repetir la lógica de pertenencia al cliente, porque esta ya quedó garantizada cuando el equipo se asoció al contrato.
- **No se modificó el schema, las entidades ni `generateWorkOrder()`.** Etapa 1 usa exclusivamente las tablas M:N ya existentes.

**Endpoints nuevos** (patrón REST verificado contra precedentes existentes — `branches` bajo `clients`, `expenses`/`payments` bajo `work-orders`/`invoices`, `equipment` bajo `branches`):
- `GET/POST /maintenance-contracts/:id/equipment`, `DELETE /maintenance-contracts/:id/equipment/:equipmentId`
- `GET/POST /maintenance-plans/:id/equipment`, `DELETE /maintenance-plans/:id/equipment/:equipmentId`
- Duplicados (`@@unique` de Prisma) y desasociaciones inexistentes ya se manejan con el `PrismaExceptionFilter` global y `NotFoundException` respectivamente — sin código de manejo de errores adicional.

**Frontend:** `EquipmentAssociationPanel` (`frontend/src/components/maintenance/`) — componente reutilizable para contrato y plan; el nivel de contrato agrega un selector de sede (`useBranches` + `useEquipment`, ya que el listado de equipos sigue siendo por sede) y el nivel de plan filtra directamente contra los equipos del contrato. La UI solo lista equipos aún no asociados; el backend valida de forma independiente en ambos niveles.

**Verificación realizada:**
- `tsc --noEmit`: 0 errores en `backend` y `frontend`
- Backend real: asociar, listar, duplicado (409), equipo de otro cliente (400), equipo no perteneciente al contrato intentando entrar a un plan (400), desasociar en ambos niveles, desasociar inexistente (404) — todos verificados contra datos reales
- Frontend real (navegador): flujo completo en `MaintenanceContractsPage` (selector de sede → equipo → agregar → quitar) y en `MaintenancePlanDetailPage` (agregar desde el pool del contrato → quitar) — verificado end-to-end

**Próximo paso (Etapa 2, no iniciada):** con la asociación ya disponible, reevaluar `generateWorkOrder()` — determinar si de verdad requiere cambios (asignación automática cuando N=1 ya funciona; para N>1 sigue sin resolver) antes de decidir una solución. No implementar sin análisis previo.

---

## Ecosistema QR Fase 1 — estado de implementación

### Principios invariantes (del diseño funcional congelado)

1. El QR identifica un activo técnico mantenible — no exclusivamente un equipo físico.
2. El QR es identificador, nunca repositorio — el ERP es la única fuente de verdad.
3. El `qrCode` es opaco (`base64url` 12 chars, `crypto.randomBytes(9)`), no el `id` interno del equipo — evita enumeración y desacopla identificación pública de estructura interna.
4. La imagen QR se genera en cliente (React), on-demand. El backend solo almacena el código string.
5. El portal público no expone información comercial, financiera ni datos personales.
6. La información visible en el portal corresponde exclusivamente a trazabilidad técnica del activo.

### Bloques de implementación

| Bloque | Descripción | Estado |
|--------|-------------|--------|
| **Bloque 1** | Schema: `qrCode String? @unique` en `Equipment` + índice + migración | ✅ Cerrado |
| **Bloque 2** | `PublicModule`: endpoint público, DTO explícito, CORS multi-origen, throttle | ✅ Cerrado |
| **Bloque 3** | Generación y asignación de `qrCode` desde el ERP (backend + frontend) | ✅ Cerrado |
| **Bloque 4** | Generación y descarga de imagen QR desde el ERP | ✅ Cerrado |
| **Bloque 5** | Inicialización de `qr-portal/` — app React independiente | ✅ Cerrado |
| **Bloque 6** | Página del activo en el portal (6 estados, componentes UX/UI) | ✅ Cerrado |
| **Bloque 7** | Integración E2E — flujo completo QR físico → portal | 🔶 Desarrollo completado · validaciones técnicas completadas · **validación física pendiente** (ver detalle abajo) |
| **Bloque 8** | Auditoría de seguridad final y cierre de Fase 1 | ⬜ Pendiente — bloqueado hasta que se ejecute la validación física de Bloque 7 |

### Bloque 7 — Integración E2E (2026-07-12)

**Estado:** Desarrollo completado. Validaciones técnicas completadas. **Validación física E2E pendiente** — queda como prueba de aceptación diferida hasta que exista una necesidad real (piloto, demo comercial, primer cliente). No se cierra el bloque prematuramente.

**D-7.1 — Alcance del bloque (CONGELADA):** El objetivo no es desplegar a producción, sino validar el flujo completo QR físico → teléfono real → Portal → Backend. Este bloque no toma decisiones de hosting, dominio ni infraestructura permanente.

**D-7.2 — Principio de validación física (CONGELADO):** La validación E2E se realizará mediante un mecanismo temporal que permita exponer el entorno local por HTTPS sin constituir una decisión de infraestructura permanente. Cloudflare Tunnel es la herramienta propuesta para ejecutar la prueba cuando se realice — no es una decisión arquitectónica definitiva ni compromete la elección de hosting futuro.

**D-7.3 — Alcance de deuda técnica resuelta (CONGELADA):** Solo se resolvieron E2E-I2 y SEC-I3, por ser las únicas deudas asociadas explícitamente a Bloque 7 en la auditoría QR Fase 1 (§ Auditoría QR Fase 1 abajo). No se agregaron capas, patrones ni componentes adicionales.

**Cambios de código:**
- `qr-portal/src/api/client.ts` — `AbortController` con timeout de 10s (`FETCH_TIMEOUT_MS`) en `fetchEquipment()`. El `AbortError` cae en el mismo `catch` genérico existente → mismo `NetworkError`. No se diferenció mensaje de timeout vs. fallo de conexión: `NotFoundPage` no renderiza el texto del error, solo el tipo (`isNetworkError`), así que un mensaje distinto habría sido código muerto.
- `backend/src/modules/public/public.service.ts` — constante `QR_CODE_PATTERN = /^[A-Za-z0-9_-]{12}$/`, anclada al formato real de `EquipmentService.generateQrCode()` (`randomBytes(9).toString('base64url')`, `equipment.service.ts:110`). `findEquipmentByQrCode()` rechaza formato inválido con el mismo `NotFoundException('Equipment not found')` que ya usa para "no encontrado" — respuesta idéntica en ambos casos. Validación ubicada en el service (no en el controller ni como regex de ruta) para preservar la opacidad de respuesta: un regex de ruta habría hecho que Express devolviera un 404 genérico distinto (`"Cannot GET ..."`) para formato inválido, filtrando información que el diseño del portal busca ocultar. Consistente con `toPublicDto()` como única frontera ya documentada del módulo.

**Verificación realizada (2026-07-12):**
- `tsc --noEmit`: 0 errores en `backend` y `qr-portal`
- Backend real con Postgres activo — `GET /public/equipment/:qrCode` probado con 3 casos: formato corto, formato con caracteres inválidos, formato válido pero inexistente → los tres devuelven el mismo cuerpo `{"message":"Equipment not found","error":"Not Found","statusCode":404}`
- Camino feliz confirmado contra equipo real existente (`qrCode: d1Fiqw8QJzBS`) → `200` con DTO completo, sin regresión

**Pendiente para cerrar el bloque:** validación física con teléfono real vía túnel HTTPS temporal (D-7.2). Bloque 8 queda bloqueado hasta entonces.

### Portal QR — arquitectura interna (`qr-portal/`)

App React 18 + TypeScript + Vite 5 en el directorio raíz del proyecto. Independiente del ERP: sin shadcn/ui, sin Tailwind, sin código compartido. CSS puro con custom properties (mismos tokens de diseño STECH NODES). Puerto: `5174`.

| Archivo | Responsabilidad |
|---------|----------------|
| `src/api/types.ts` | `EquipmentPublicDto`, `PortalState`, `derivePortalState()` |
| `src/api/client.ts` | `fetchEquipment()`, `NotFoundError`, `NetworkError` |
| `src/index.css` | Tokens de diseño + estilos de todos los componentes |
| `src/components/` | 7 componentes: `PortalHeader`, `PortalFooter`, `NodeMark`, `StatusBadge`, `AlertBanner`, `SectionBlock`, `ContactCard` |
| `src/pages/EquipmentPage.tsx` | Estados A/C/D/E + skeleton de carga |
| `src/pages/NotFoundPage.tsx` | Estado F (QR inválido + error de red) |
| `src/App.tsx` | Router: `/e/:qrCode`, fallback → F |

### Estados del portal — Fase 1

| Estado | Condición en DTO | Badge | Alerta | Email soporte |
|--------|-----------------|-------|--------|---------------|
| **A — Activo** | `status=ACTIVE` + warranty vigente/null | Verde `ACTIVO` | Ninguna | soporte@ |
| **B — En mantenimiento** | **No implementado** — ver decisión D-B1 | — | — | — |
| **C — Fuera de servicio** | `status=INACTIVE` | Ámbar `FUERA DE SERVICIO` | Warning | soporte@ |
| **D — Contrato vencido** | `status=ACTIVE` + `warrantyExpiresAt` < hoy | Verde `ACTIVO` | Warning + fecha vencimiento | ventas@ |
| **E — Dado de baja** | `status=DECOMMISSIONED` | Gris `DADO DE BAJA` | Neutral | soporte@ |
| **F — QR inválido** | API 404 o error de red | Pantalla error | Error + datos contacto | contacto@ |

### DTO público — contrato de campos

**Campos expuestos** (`GET /public/equipment/:qrCode`):

| Campo | Origen | Propósito en portal |
|-------|--------|---------------------|
| `qrCode` | `Equipment` | Identificador de la consulta |
| `type` | `Equipment` | Tipo de activo (enum raw) |
| `brand` | `Equipment` | Identidad del equipo |
| `model` | `Equipment` | Identidad del equipo |
| `serialNumber` | `Equipment` | Trazabilidad del fabricante |
| `installDate` | `Equipment` | Fecha de instalación (YYYY-MM-DD) |
| `location` | `Equipment` | Ubicación física en la sede |
| `status` | `Equipment` | Determina estado visual del portal |
| `warrantyExpiresAt` | `Equipment` | Determina estado D (vencido) |
| `branch.name` | `Branch` | Sede a la que pertenece el activo |
| `branch.city` | `Branch` | Ciudad de la sede |

**Campos permanentemente excluidos del portal:** `id`, `branchId`, `criticality`, `notes`, `deletedAt`, `createdAt`, `updatedAt`, datos de `WorkOrder` (financieros), `ServiceRecord` (evaluaciones internas), `User` (técnicos), `Client` (datos comerciales del cliente), `Branch.contactName/Phone/email/address`.

---

## Decisión pendiente — Estado B "En mantenimiento" (D-B1)

**Estado:** Diferido por decisión estratégica (no limitación técnica). Fecha de registro: 2026-07-08.

**La razón no es técnica.** Implementar el estado B es viable técnicamente — bastaría con añadir al `PublicModule` una consulta de WorkOrders activas para el equipo. La razón por la que no se implementa en Fase 1 es de **modelo de datos y estrategia**:

Antes de exponer cualquier dato de WorkOrder o ServiceRecord en el portal público, se requiere una revisión estratégica que responda:

1. **¿Qué información necesita realmente un usuario externo cuando un equipo está en mantenimiento?**
   — ¿Solo el estado? ¿El tipo de visita (preventivo/correctivo)? ¿El técnico asignado? ¿La fecha estimada de finalización?

2. **¿Qué información NO debe exponerse bajo ninguna circunstancia?**
   — Nombre del técnico (datos personales). Costo de la visita (información comercial). Descripción interna del problema (información sensible del cliente).

3. **¿Cómo debe activarse el estado B?**
   — Opción 1: Automáticamente cuando existe una WorkOrder `IN_PROGRESS` para el equipo.
   — Opción 2: Bandera operativa manual (`isUnderMaintenance: Boolean`) en `Equipment`, independiente del estado de WorkOrders.
   — Cada opción tiene implicaciones diferentes para la sincronización automática vs. el control manual.

4. **¿La visibilidad del estado B es siempre deseable?**
   — En algunos contextos hospitalarios, informar que un equipo está en mantenimiento puede generar alarma innecesaria entre pacientes o visitantes.

**Regla hasta que D-B1 esté resuelta:** No modificar el `PublicModule`, no añadir campos de WorkOrder al `EquipmentPublicDto`, no implementar el estado B en `qr-portal/`. Cualquier cambio al DTO público requiere primero actualizar el documento `qr-functional-design-v1.2.html`.

---

## Auditoría QR Fase 1 — COMPLETADA (2026-07-08)

Auditoría realizada antes del Bloque 6. Cubrió 5 áreas: seguridad, privacidad, UX/UI, flujo E2E, preparación comercial.

### Hallazgos críticos — corregidos

| ID | Hallazgo | Corrección aplicada |
|----|----------|---------------------|
| **SEC-C1** | `PublicService` devolvía equipos soft-deleted | `where: { qrCode, deletedAt: null }` — equipos con `deletedAt != null` responden como no encontrados. `DECOMMISSIONED` (campo `status`) sigue siendo visible por diseño (D-2). |
| **UX-C1** | Sección de mantenimiento (última visita, próxima visita) no implementada en portal | Pendiente — define el Bloque 6. Ver `docs/strategy/qr-phase2-history-decision-v1.0.html`. |
| **COM-C1** | Promesa "el historial viaja con el equipo" no demostrable en portal actual | Pendiente — resuelto con Bloque 6. |

### Hallazgos importantes — pendientes de resolución antes de demo o producción

| ID | Hallazgo | Estado |
|----|----------|--------|
| **SEC-I1** | 4 variables de entorno de producción sin documentar: `CORS_ORIGIN`, `PORTAL_ORIGIN`, `VITE_PORTAL_URL`, `VITE_API_URL` | Documentadas en `.env.production.example` |
| **UX-I1** | Teléfono de contacto ficticio `+57 (601) 000-0000` hardcodeado en `company.ts` y en portal | Pendiente — requiere datos reales de STECH NODES |
| **E2E-I1** | QR generados con URL de localhost si `VITE_PORTAL_URL` no está configurada en producción | Documentado en checklist de producción |
| **E2E-I2** | `fetch` sin timeout en portal — puede colgar indefinidamente en red lenta | ✅ Resuelto — Bloque 7, `AbortController` 10s en `client.ts` |
| **SEC-I2** | Throttle por IP, no global — vulnerable a ataques distribuidos | Aceptado para Fase 1 |
| **SEC-I3** | Sin validación de longitud en parámetro `qrCode` | ✅ Resuelto — Bloque 7, regex en `public.service.ts`, mismo 404 que "no encontrado" |
| **PRV-I1** | `location` revela layout físico interno del cliente | Aceptado — misma información que etiqueta física |
| **PRV-I2** | `branch.name` revela relación comercial STECH NODES ↔ cliente | Aceptado — incluir en contrato de servicio |
| **UX-I2** | `buildEquipmentName` sin model muestra brand en lugar de vacío | Aceptado — comportamiento razonable |
| **UX-I3** | Estado E sin "Fecha de baja" — campo no en DTO | Diferido a revisión D-B1 |
| **UX-I4** | Columna desktop derecha sin contenido real | Pendiente — resuelto con Bloque 6 (historial) |

### Nuevas decisiones derivadas de la auditoría

| ID | Decisión | Estado |
|----|----------|--------|
| **D-3** | Equipos con `deletedAt != null` no son visibles en el portal público | ✅ CONGELADA — implementada en SEC-C1 |
| **D-4** | Bloque 6 = última visita de mantenimiento (fecha + tipo) como mínimo demostrable de "el historial viaja con el equipo" | ✅ CONGELADA — ver `docs/strategy/qr-phase2-history-decision-v1.0.html` |
| **D-4.1** | Precisión de fuente de datos: `lastMaintenance.date` = `WorkOrder.completedAt` (fecha efectiva de finalización); ruta directa sobre `WorkOrder` (no vía `MaintenanceVisit`) para cubrir PREVENTIVE y CORRECTIVE | ✅ CONGELADA — §14 de `qr-functional-design-v1.2.html` (v1.4). Contrato DTO sin cambios. |
| **D-5** | Información de contacto real debe configurarse antes de cualquier demo comercial | ⏳ PENDIENTE |
| **D-6** | `WorkOrder.equipmentId` es opcional en el modelo de datos y en el sistema. El sistema no puede determinar automáticamente si una intervención corresponde a un activo inventariado; esa decisión pertenece al operador. Cuando la intervención recae sobre un activo registrado, el operador debe asociarlo para preservar la trazabilidad técnica. Si `equipmentId` está presente, el sistema valida su integridad referencial con la sede (`branchId`). Las automatizaciones solo asignan el equipo automáticamente cuando existe una única opción inequívoca (plan con exactamente 1 equipo en `MaintenancePlanEquipment`). **Esta decisión sustituye cualquier regla anterior que condicionara la obligatoriedad de `equipmentId` al `WorkOrderType`. El tipo de orden no determina por sí mismo si existe un activo inventariado asociado a la intervención.** | ✅ CONGELADA — Bloque 6.1 |

### Próximo paso

Bloque 6 cerrado. Bloque 7 con código cerrado y validaciones técnicas completas — la validación física queda diferida a necesidad real de negocio (D-7.1/D-7.2). Bloque 8 (auditoría de seguridad final) queda bloqueado hasta que se ejecute esa validación física. El siguiente bloque de trabajo activo del proyecto se determina en la sección de roadmap general, no dentro del ecosistema QR.

---

## Checklist de preparación comercial — PRE-DEMO

Lista de verificación obligatoria antes de cualquier presentación a clientes, evaluadores de Fondo Emprender o jurados de PITCH VERDE.

### Portal QR

| Item | Estado | Notas |
|------|--------|-------|
| Teléfono de contacto real en `company.ts` y `backend/src/modules/documents/base/styles.ts` | ⏳ Pendiente | Actualmente `+57 (601) 000-0000` (ficticio) |
| URL de producción del portal confirmada | ⏳ Pendiente | Actualmente `localhost:5174` |
| `VITE_PORTAL_URL` configurado con URL real antes de generar QR | ⏳ Pendiente | Ver `frontend/.env.production.example` |
| Al menos un QR físico impreso y escaneado con éxito | ⏳ Pendiente | Prueba en teléfono real, no simulador |
| Portal sirve en HTTPS en el dominio de producción | ⏳ Pendiente | — |
| Historial mínimo visible (Bloque 6) completado | ✅ Listo | Implementado y verificado (v2.3.0) |

### Para Fondo Emprender / PITCH VERDE 2026

| Item | Estado | Notas |
|------|--------|-------|
| Demo en vivo funcional: ERP → asignar QR → escanear → portal | ⏳ Pendiente | Flujo completo demostrable |
| Portal muestra historial de mantenimiento (mínimo una visita) | ⏳ Pendiente | Depende de Bloque 6 |
| Equipo demo con datos realistas (no "test", "abc", etc.) | ⏳ Pendiente | Crear en ERP antes de la presentación |
| Narrativa de diferenciación preparada (positioning-brief-v1.3) | ✅ Listo | Documento congelado disponible |
| No afirmar capacidades futuras como disponibles hoy | ✅ Regla activa | Ver brief: sin predicción de fallas, sin comparativas |

---

## Decisiones arquitectónicas clave

| Decisión | Justificación |
|----------|---------------|
| FK circular `WorkOrder ↔ MaintenanceVisit` resuelta unidireccionalmente | Solo `MaintenanceVisit.workOrderId @unique`. WorkOrder recibe back-reference Prisma sin columna extra. |
| Finanzas nunca recalcula: `InvoicesService.getSummary()` como fuente única del receivable global | `finance.service.ts` (T-08) lee `getSummary()` para el titular y solo deriva el detalle (aging/por-cliente), protegido por invariantes `Decimal.equals()` — evita una segunda fórmula de negocio para el mismo concepto. |
| `WorkOrderTechnician`: la OT es la fuente de verdad de la ejecución; el Acta/PDF solo leen | Evita que un hecho de accountability (quién ejecutó) dependa de un documento opcional (el Acta no es obligatoria para completar una OT). Coherente con §5.2 del Modelo de Dominio, ya congelado. |
| `OVERDUE` computado, no persistido | Evita estado desincronizado y jobs de actualización. |
| `ServiceRecord.equipmentId` eliminado | Con `WorkOrder.equipmentId` era redundante y fuente de inconsistencia. |
| `Invoice.workOrderId` nullable + CHECK constraint | Hito 13 requiere facturas por contrato. El CHECK garantiza siempre una referencia. No expresable en Prisma — añadida como SQL raw en migración. |
| Upload multipart via `fetch` nativo | `api.post` usa `JSON.stringify` — incompatible con FormData. |
| `IStorageService` / `STORAGE_SERVICE` token de inyección | Permite intercambiar `LocalStorageService` por `R2StorageService` sin tocar la lógica. |
| Archivos servidos por NestJS (`GET /files/:id/download`) | El guard de autenticación aplica a todos los archivos. |
| Select nativo en lugar de shadcn Select | `@radix-ui/react-select` no está instalado. Patrón con `SELECT_CLASS`. |
| Portal QR con DTO de salida explícito, sin retornar entidades Prisma | Garantía contractual de qué información llega al público. El mapeo `toPublicDto()` es la única frontera. |
| `qrCode` opaco (`base64url` 12 chars, `crypto.randomBytes(9)`), no el `id` interno | Desacopla la identidad pública del equipo de su clave primaria interna. Evita enumeración secuencial. Node built-in, sin dependencia `nanoid`, sin problema CJS/ESM. |
| Regeneración de `qrCode` bloqueada en Fase 1 (`409 Conflict`) | Un `qrCode` impreso en una etiqueta física es permanente. Si se pudiera regenerar desde el ERP, todas las etiquetas previas quedarían inválidas silenciosamente. La regeneración requiere un endpoint dedicado con confirmación explícita — a diseñar en una fase futura. |
| Equipos dados de baja visibles en portal (D-2) | El portal muestra estado `DECOMMISSIONED` con datos mínimos de trazabilidad. `status=DECOMMISSIONED` es un estado operativo visible por diseño. |
| Equipos con soft-delete no visibles en portal (D-3) | `deletedAt != null` representa un registro retirado del sistema, distinto de `DECOMMISSIONED`. El endpoint filtra `deletedAt: null`. Implementado en SEC-C1 (Auditoría Fase 1). |
| Ruta pública `/e/:qrCode` (D-R1 — CONGELADA) | URL corta → QR menos denso → mejor escaneabilidad en etiquetas físicas. Irreversible tras impresión de etiquetas. Implementada en `buildPortalUrl()` y a configurar en el router del portal (Bloque 5). |
| CORS con función de validación, no array estático | Permite rechazar con mensaje claro cualquier origen no autorizado. Variables de entorno `CORS_ORIGIN` / `PORTAL_ORIGIN` configurables por ambiente. |
| `WorkOrder.equipmentId` opcional en modelo y DTO, con validación de integridad si está presente | Ver **D-6**. |

---

## Decisiones de ruta pública — CONGELADAS

| ID | Decisión | Estado | Fecha |
|----|----------|--------|-------|
| **D-R1** | Ruta pública del portal QR: `/e/:qrCode` | ✅ RESUELTA Y CONGELADA | 2026-07-08 |

**Ruta pública oficial del ecosistema QR:** `/e/:qrCode`

Ejemplo: `https://portal.stechnodes.com/e/d1Fiqw8QJzBS`

**Motivos (aprobados por dirección):**
- Reduce la longitud de la URL → QR impreso menos denso → mejor escaneabilidad en etiquetas físicas pequeñas.
- Coherente con la naturaleza del QR como interfaz de acceso rápido al activo, no una URL de navegación humana.

**Implicaciones permanentes:**
- Esta ruta está implementada en `buildPortalUrl()` (`frontend/src/pages/EquipmentPage.tsx`) y debe configurarse en el router del portal QR (Bloque 5).
- **Esta decisión es irreversible una vez impresas las primeras etiquetas físicas.** Cambiarla requeriría una migración planificada y la reimpresión de todas las etiquetas distribuidas. No modificar sin decisión estratégica formal con fecha y motivo registrados.

---

## Riesgos abiertos

| Riesgo | Severidad | Plan |
|--------|-----------|------|
| Storage local (`uploads/`) sin backup ni límite de disco | Baja | Migrar a Cloudflare R2 antes de staging — solo cambiar provider `STORAGE_SERVICE`. |
| Botón "Cancelar" OT sin confirmación (DT-01) | Baja | Diferido. Sin impacto grave. |
| `VITE_PORTAL_URL` sin configurar en producción → QR codifican localhost | Alta | Documentado en `.env.production.example`. Verificar antes de generar primeras etiquetas físicas. |
| `fetch` en portal sin timeout → cuelgue en red hospitalaria lenta | Media | Diferido a Bloque 7. Añadir `AbortController` con timeout de 10s. |
| Datos de contacto ficticios (`+57 (601) 000-0000`) en portal y PDFs | Alta (pre-demo) | Actualizar `company.ts` y backend `styles.ts` con datos reales antes de cualquier presentación. |

---

## Reglas para retomar el proyecto

1. **Leer `DEVELOPMENT_CONTEXT.md`** — estado actual, módulos congelados, próximo hito.
2. **Leer `CHANGELOG.md`** — versión actual y últimos cambios.
3. **Auditar el módulo a desarrollar** — revisar código real, no asumir desde memoria.
4. **No modificar módulos congelados** salvo bug funcional real.
5. **No comenzar hito sin acordar alcance** — confirmar antes de implementar.

**Acceso (fase de operación, desde 2026-07-16):** admin definitivo único **`mario@stechnodes.com`** (creado con `npm run bootstrap:admin`, contraseña definida por el operador vía `ADMIN_PASSWORD`, cambiable desde la app en Usuarios → Cambiar contraseña). Los usuarios de desarrollo (`admin@erp.local`, etc.) fueron eliminados. La base se limpió y las numeraciones se reiniciaron a `00001` para operar con datos reales.

**Entorno local:** PostgreSQL `localhost:5433` / `erp_emprendedores` (Docker, `restart=always`) · Backend `http://localhost:3000` · Frontend `http://localhost:5173`.

**Fase de operación real (en curso):** poblar datos maestros de Emmanuel → operar hacia adelante con trabajo real → en paralelo organizar la documentación histórica. **Migración histórica de Emmanuel = objetivo diferido a fase posterior basada en evidencia** (formato/volumen/calidad reales); se diseñará un cargador de migración acotado (resuelve OT-4/MNT-1 solo para migración, sin tocar la operación en vivo) cuando se conozcan los datos. OT-4, MNT-1 y RFC-4 permanecen congelados como backlog de arquitectura hasta tener evidencia de uso real. Workaround operativo de MNT-1: un plan de mantenimiento por equipo.

---

*Actualizado: 2026-07-16 — v2.8.0 — Fase de validación funcional CERRADA (`docs/validation/erp-validation-report-v1.0.md`). **En curso: fase de OPERACIÓN REAL.** Base limpiada y numeraciones reiniciadas; admin definitivo único `mario@stechnodes.com` (bootstrap OK); Postgres `restart=always`. El operador comenzó a poblar datos maestros — hoy en BD: 1 cliente (Emmanuel), 0 sedes, 0 equipos. Plan: poblar maestros de Emmanuel → operar hacia adelante → organizar en paralelo la documentación histórica. **Migración histórica de Emmanuel diferida** a fase posterior basada en evidencia (se diseñará un cargador acotado que resuelve OT-4/MNT-1 solo para migración, sin tocar la operación en vivo). OT-4, MNT-1 y RFC-4 congelados como backlog de arquitectura. Workaround MNT-1: un plan por equipo.*

**⏸️ PAUSA 2026-07-16 ~15:45 — retomar en ~3h.** Punto exacto: el operador está poblando los datos maestros de Emmanuel (creado el cliente; faltan sedes, equipos, contrato, plan). Al retomar: continuar la carga de maestros y comenzar a operar hacia adelante; Claude actúa como auditor de producto (corrige en el momento lo que bloquee operación/UX, el resto al backlog). Respaldos en scratchpad de la sesión (`erp_operacion_*.sql`). Servidores los gestiona el operador.

---

*Actualizado: 2026-08-02 — v2.10.0 — **Cierre de bloque de trabajo: Módulo Finanzas Escenario 1 (Fundación) CERRADO + `WorkOrderTechnician` CERRADO.** Ver § *Módulo Finanzas — Escenario 1* y § *WorkOrderTechnician* (arriba, antes de § Resumen ejecutivo del backlog) para el detalle completo — arquitectura, decisiones, deudas técnicas registradas e incrementos deliberadamente diferidos. `develop` queda **29 commits adelante de `origin/develop`, sin push**. Backend: `nest build` limpio en cada tarea. Frontend: `tsc -b` sin errores nuevos (baseline heredado de 9 errores, no relacionado, registrado como deuda de estabilización separada — no mezclar con roadmap funcional). Ambos bloques quedan tratados como incrementos cerrados: no se reabren salvo apertura explícita de una tarea nueva (mismo criterio que el incremento Utilización→Preparación→Cuenta de Cobro).*

**⏸️ CIERRE 2026-08-02 — proyecto estabilizado, sin trabajo en curso.** No hay ningún punto exacto de "continuar aquí": T-06…T-15 (Finanzas) y `WorkOrderTechnician` quedaron implementados, verificados y commiteados de punta a punta, sin tareas a medias. Antes de retomar: (1) decidir si se hace `git push` de los 29 commits pendientes de `develop`; (2) revisar si conviene abrir la tarea de estabilización del baseline TypeScript (9 errores heredados, independiente de Finanzas); (3) si el próximo bloque es `PulsoPage` (consumir `/finance/pulse` y `/finance/attention`, hoy sin UI), o crear usuarios con rol `TECHNICIAN` (el selector de ejecutores/asignado está vacío en la práctica), o un tema nuevo — ninguno de los tres está iniciado.

---

*Actualizado: 2026-09-02 — **CRM de Prospección B2B (F1.1–F1.9) implementado y consolidado** desde el cierre de arriba (2026-08-02); no reflejado todavía en las secciones estructuradas de este documento (Hitos completados, Estado del backend, etc.) — registro puntual de estado, sin reconciliar retroactivamente el resto del archivo. Modelo Account/Contact/Opportunity/Activity/Service (nuevo dominio, aislado del resto del ERP salvo el módulo `quotations`, único módulo pre-existente tocado) + integración automática `Quotation.APPROVED → Opportunity.WON` + trazabilidad `Quotation.opportunityId` + primera superficie frontend operativa (`/prospeccion`). Commits en `develop`: `3589149` (F1.1–F1.8), `04bae8e` (bloque WON), `368ab86` (trazabilidad Opportunity↔Quotation), `e495f06` (frontend F1.9) — los tres últimos pusheados a `origin/develop` junto con el commit de documentación que registra esta entrada.*

**Estado del CRM — 2026-09-02:** F1.9 es la versión actual y en uso — entra en **período de validación operativa manual** (Mario trabaja el flujo real Account→Contact→Opportunity→Activity→Quotation→WON sobre los 38 IPS ya identificados, sin ninguna asistencia de IA). **F2.1 — Modelo Comercial Asistido con agente de IA sobre este CRM — está diseñada conceptualmente (documento V2 congelado, con contrato técnico ya redactado) pero deliberadamente PAUSADA, no implementada.** Criterio exacto de reapertura: `hospital-business-os/DECISIONS.md`, Decisión 016. No iniciar F2.1 sin evidencia de esa validación y decisión explícita del usuario.

---

*Actualizado: 2026-09-04 — **`Person` + `Accreditation` (v2.11.0) implementado, probado en vivo contra Postgres real y CERRADO como incremento aislado.** Ver CHANGELOG.md v2.11.0 para el detalle completo (decisiones de dominio, archivos, pruebas). Workstream nuevo y separado del CRM de arriba — origen: necesidad real de representar personas que prestan servicios a STECH NODES sin depender de una cuenta `User` (caso concreto: biomédico independiente). Precedido de una auditoría-diagnóstico-alternativas-cierre (Fase 3.1) antes de escribir código, mismo rigor metodológico que el resto del proyecto.

**Qué se cerró:** `Person` (identidad) + `Accreditation` (registro temporal de autorización, historial completo, QR opaco) + verificación pública `GET /public/accreditation/:qrCode` (mismo patrón anti-enumeración que Equipment) + UI en el ERP (`/personal`, solo ADMIN) + página pública en `qr-portal` (`/p/:qrCode`). `equipment.service.ts` recibió un refactor mecánico (extracción de `generateOpaqueToken()` a `common/utils/`) — regresión verificada, mismo comportamiento.

**Qué queda deliberadamente fuera (no es brecha oculta, es secuenciación decidida — Estrategia "C primero", Fase 3.1):**
- La migración de `WorkOrder.assignedToId` / `WorkOrderTechnician` / `Intervention.primaryTechnicianId` hacia `Person` — hoy estos tres campos siguen apuntando a `User`, sin cambios. Se retoma solo si aparece un caso real de un externo acreditado que necesite quedar registrado como ejecutor de una OT/Intervention.
- Gestión documental de personas (EPS/ARL/certificados con vigencia), foto/biometría en el carnet, y cualquier vigencia documental que determine automáticamente el estado de acreditación — todo evaluado y descartado para esta fase por decisión explícita (evitar sobrearquitectura sin evidencia de necesidad real).

**Estado técnico:** `nest build` limpio; `tsc -b` en frontend y qr-portal sin errores nuevos (mismo baseline heredado de 9 errores en frontend, no relacionado). Sin commit todavía.

---

*Actualizado: 2026-09-04 (mismo día) — **Carnet PDF (`GET /accreditations/:id/card.pdf`) implementado, probado en vivo y CERRADO — Fase 4 completa contra el contrato aprobado.** Ver CHANGELOG.md v2.11.0 (sección "Carnet PDF imprimible") para el detalle completo. Reutiliza el pipeline `@react-pdf/renderer` ya existente (mismo motor de Cotización/Cuenta de Cobro/Acta Técnica) — nueva plantilla `AccreditationCardDocument.tsx`, sin tocar los documentos existentes. Nueva dependencia de backend: `qrcode` (equivalente Node de `qrcode.react`, ya usado en el frontend, para rasterizar el QR server-side).

**Dos correcciones reales encontradas durante la verificación, ambas resueltas antes de cerrar:** (1) las fechas de vigencia se mostraban un día atrás por conversión de zona horaria (servidor en `America/Bogota`, fechas guardadas como medianoche UTC) — corregido con `fmtDateOnly()`, acotado a este campo nuevo; (2) el texto del carnet no cambiaba según el estado (una acreditación revocada seguía diciendo "autorizada") — corregido para ser consistente con el badge VIGENTE/NO VIGENTE.

**Fase 4 (Person + Accreditation + QR + carnet) queda cerrada de punta a punta.** Único pendiente registrado, deliberado y no oculto: migración de las FK de ejecución de OT/Intervention hacia `Person` (ver arriba), diferida hasta que exista un caso real.
