# ERP Emprendedores — STECH NODES Ops

> Este archivo registra el **estado del desarrollo**. No reemplaza el CHANGELOG.
> El CHANGELOG registra qué cambió. Este archivo registra dónde estamos y hacia dónde vamos.

---

## Estado actual

**Versión:** `v2.3.0` (Bloque 6 completo — lastMaintenance en portal QR, query D-4.1, 6 tests E2E)
**Rama activa:** `develop`
**Última sesión:** 2026-07-08

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

**Versión:** `v2.3.0` (Bloque 6 completo — `lastMaintenance` en portal QR implementado y verificado)

**Estado general:** Build limpio · TypeScript 0 errores · QR Fase 1 Bloques 1–6 operativos · Portal `http://localhost:5174` corriendo · Identidad STECH NODES v1.0 integrada · Auth fullstack congelada · Motor Documental congelado

---

## Deuda técnica activa

| ID | Descripción | Severidad | Origen |
|----|-------------|-----------|--------|
| DT-01 | Botón "Cancelar" en `WorkOrderHeader` ejecuta transición sin dialog de confirmación | Baja | Hito 2 |
| DT-02 | `refreshTokenHash` se sobrescribe en cada login — sesión única por usuario | Baja-Media | Hito 4 |
| DT-03 | Refresh token no rota en cada uso de `POST /auth/refresh` | Baja | Hito 4 |
| DT-04 | `JwtPayload.role` tipado como `string` en lugar de `UserRole` | Baja | Hito 4 |
| DT-05 | `clearRefreshCookie` es método público en `AuthService` | Baja | Hito 4 |
| DT-06-B | `generateWorkOrder()` no asigna `equipmentId` en planes con N > 1 equipos. La OT preventiva queda sin activo vinculado. Solución futura (Ruta A1): cambiar la granularidad de `MaintenanceVisit` de visita-al-plan a visita-al-equipo, generando N OTs por visita. | Media | Bloque 6.1 |

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
| `maintenance-plans` | Depende de `contractId` (no clientId/branchId) |
| `maintenance-contracts` | CRUD + soft delete + numeración `CMTO-YYYY-NNNNN` |
| `maintenance-visits` | Programación + cancelación + generación OT (transacción atómica) |
| `users` | CRUD + deactivate + changePassword |
| `dashboard` | KPIs mantenimiento: activeContracts, activePlans, overdueVisits |
| `files` | Polimórfico `entityType + entityId` |
| `documents` | PDF on-demand: Cotización, Acta Técnica, Cuenta de Cobro. Congelado. |
| `public` | Portal QR público — `GET /public/equipment/:qrCode`. Sin JWT (`@Public()`). Throttle 30 req/min. DTO de salida explícito. |

### Infraestructura

- **NestJS v11** · **Prisma ORM v7** · PostgreSQL `localhost:5433` / `erp_emprendedores`
- Cliente Prisma en `src/generated/prisma/`; `moduleFormat = "cjs"`
- **12 migraciones aplicadas**; última: `20260708000001_hito_qr_phase1_qrcode_on_equipment`
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
| **Bloque 6** | Página del activo en el portal (6 estados, componentes UX/UI) | ⬜ Pendiente |
| **Bloque 7** | Integración E2E — flujo completo QR físico → portal | ⬜ Pendiente |
| **Bloque 8** | Auditoría de seguridad final y cierre de Fase 1 | ⬜ Pendiente |

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
| **E2E-I2** | `fetch` sin timeout en portal — puede colgar indefinidamente en red lenta | Diferido a Bloque 7 |
| **SEC-I2** | Throttle por IP, no global — vulnerable a ataques distribuidos | Aceptado para Fase 1 |
| **SEC-I3** | Sin validación de longitud en parámetro `qrCode` | Diferido a Bloque 7 |
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

Bloque 6: implementar historial mínimo en portal. Documento rector: `docs/strategy/qr-phase2-history-decision-v1.0.html`.

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
| Historial mínimo visible (Bloque 6) completado | ⏳ Pendiente | Requerido para demostrar promesa comercial |

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

**Credenciales de desarrollo:**
- `admin@erp.local` / `Admin2026!` · `mario@erp.local` / `Mario2026!`
- PostgreSQL: `localhost:5433` / `erp_emprendedores`
- Backend: `http://localhost:3000` | Frontend: `http://localhost:5173`

---

*Actualizado: 2026-07-08 — v2.1.0 — Ecosistema QR Fase 1, Bloques 1 y 2 cerrados: schema `qrCode` en Equipment + `PublicModule` con endpoint público, DTO explícito, CORS multi-origen, throttle. Próximo: Bloque 3 — generación y asignación del `qrCode` desde el ERP.*
