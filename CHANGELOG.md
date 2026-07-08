# Changelog — ERP Emprendedores (STECH NODES)

> A partir de esta versión, toda funcionalidad nueva, corrección relevante o cambio arquitectónico debe registrarse aquí siguiendo [versionado semántico](https://semver.org/). No registrar cambios cosméticos menores (ajustes de espaciado, renombrados triviales, etc.).

---

## v1.2.0 — Hito 10-A: Evidencias en Órdenes de Trabajo y Actas Técnicas (2026-07-05)

### Correcciones de bugs

**Backend — FilesModule**
- `LocalStorageService.getUrl()` generaba `/files/serve/...` — ruta que no existía en el controlador. Corregido: `FilesService` construye ahora la URL como `${STORAGE_BASE_URL}/files/:id/download` (endpoint autenticado real).
- `GET /files/:id/download` devolvía `Content-Disposition: attachment` sin `Content-Type`. Corregido: el controlador recupera `mimeType` y `originalName` del registro y establece `Content-Type` correcto + `inline` para imágenes / `attachment` para PDFs y documentos.

**Frontend — FileAttachmentSection**
- El enlace de descarga usaba `<a href={url}>` que no puede enviar el Bearer token — descarga fallaba con 401. Corregido: reemplazado por `downloadFile()` que usa `fetch` con Bearer + `URL.createObjectURL(blob)`, el mismo patrón que `downloadPdf()` en `QuotationFormPage`.

### Nuevas funcionalidades

**Backend**
- `FilesService.getFileForDownload()` — reemplaza `getStoragePath()`, retorna `{ storagePath, mimeType, originalName }` para que el controlador sirva el archivo con headers correctos.

**Frontend**
- `FileAttachmentSection` — prop `label?: string` (default `"Adjuntos"`): el header y el estado vacío usan el label contextualizado en lugar de texto hardcodeado.
- `EvidencesCard` — nueva card para `WorkOrderDetailPage`, sigue el patrón de `ExpensesCard` / `TimelineCard`. `entityType="WORK_ORDER"`, `label="Evidencias"`, `defaultCategory="PHOTO"`. Posicionada entre `WorkOrderItemsCard` y `ServiceRecordCard`.
- `ServiceRecordCard` — sección "Evidencias del acta" al pie del acta (solo cuando el acta existe). `entityType="SERVICE_RECORD"`, `label="Evidencias del acta"`, `defaultCategory="PHOTO"`.
- `EquipmentPage` — actualizado a `label="Documentación"` y `defaultCategory="DOCUMENT"` para reflejar la naturaleza documental de los adjuntos de equipo.

### Decisiones de arquitectura

- **Un único componente `FileAttachmentSection`** contextualizado por props — no se duplicó el componente por entidad.
- **La prop `label` se interpola en el estado vacío**: `"Sin {label.toLowerCase()}."` — el texto de vacío es coherente con el contexto sin lógica extra.
- **`FileAttachmentSection` en `ServiceRecordCard` se renderiza dentro de la sección existente** (no como card separada) — el acta técnica y sus evidencias son una unidad conceptual.
- **Evolución futura documentada**: galería/thumbnails, visor inline, filtros por categoría, paginación y `SYSTEM_GENERATED` category se documentan como candidatos a hitos futuros pero no se adelantan.

### Verificación E2E (2026-07-05)

| Caso | Resultado |
|------|-----------|
| `EvidencesCard` visible en `WorkOrderDetailPage` | ✅ Label "Evidencias (0)", selector "Foto", botón "Adjuntar" |
| Dialog Equipos — label "Documentación" + default "Documento" | ✅ Texto contextualizado correcto |
| Estado vacío interpolado desde `label` | ✅ "Sin documentación." / "Sin evidencias." |
| `tsc --noEmit` backend + frontend | ✅ Sin errores |

---

## v1.1.0 — Hito 9: Motor Documental de STECH NODES (2026-07-05)

### Nuevas funcionalidades

**Backend — DocumentsModule (`/documents`)**
- `GET /documents/quotations/:id/pdf` — genera y devuelve PDF de cotización bajo demanda (sin persistencia)
- Motor Documental con arquitectura modular: `base/` (componentes reutilizables) + `templates/` (plantillas) + `dto/` (contratos de datos)
- Design System documental independiente del frontend: `styles.ts` con paleta hex, escala de espaciado y tipografía sin dependencias CSS del ERP
- Renderizado server-side con `@react-pdf/renderer` y fuente Helvetica integrada (sin embedding de TTF)
- DTO desacoplado `QuotationPdfDto` — transformación explícita en servicio, sin exponer modelo Prisma al template
- Respuesta HTTP con `Content-Disposition: inline` — el navegador muestra el PDF en lugar de forzar descarga

**Componentes base del Motor Documental**
- `DocumentHeader` — cabecera con identidad STECH NODES (nombre, tagline, contacto) + bloque de metadatos del documento (tipo, número, fechas)
- `DocumentFooter` — pie de página fijo con marca, fecha de generación y paginación "Página N de M"
- `InfoGrid` — grilla de dos columnas para datos estructurados (cliente, sede)
- `SectionTitle` — separador de sección con acento de color corporativo
- `ItemsTable` — tabla de líneas con columnas: Descripción, Cant, Precio unit, Descuento, IVA, Total línea; filas alternadas
- `TotalsBlock` — bloque de totales alineado a la derecha (subtotal, descuentos, impuestos, total destacado)
- `PageLayout` — wrapper A4 con márgenes y espacio reservado para el footer

**Plantilla Cotización**
- `QuotationDocument` — compone todos los bloques base en un documento profesional con datos reales de cotización, items, totales, notas y términos

**Frontend**
- Botón "Descargar PDF" (icono FileDown) en `QuotationFormPage` — visible solo en modo edición de cotización existente
- `downloadPdf()` — fetch autenticado del PDF como Blob, disparo automático de descarga del archivo

### Decisiones de arquitectura

- **Motor Documental, no módulo de PDFs**: la infraestructura es reutilizable para cuentas de cobro, actas técnicas, diagnósticos e informes futuros
- **Sin persistencia de PDFs**: los documentos se generan bajo demanda; FileAttachment (Hito 8) cubre el caso de persistencia cuando sea necesario
- **Design System documental independiente**: estilos en valores hex directos, desacoplados de los tokens CSS del ERP
- **Puntos de extensión documentados**: `DocumentsController` tiene comentarios con las rutas reservadas para `invoices`, `service-records` y `work-orders`
- **Preparado para crecimiento**: `DocumentHeader` y `DocumentFooter` tienen props reservadas comentadas (verificationCode, documentVersion, status)

### Verificación E2E (2026-07-05)

| Caso | Resultado |
|------|-----------|
| `GET /documents/quotations/cmr894h2200019gjh7mw2ce5v/pdf` | ✅ 200, 4791 bytes, magic bytes `%PDF` |
| PDF válido con datos reales | ✅ Número COT-2026-00001, cliente, 3 items, totales, notas, términos |
| Botón "Descargar PDF" en QuotationFormPage | ✅ Visible en modo edición, dispara descarga del PDF |
| `tsc --noEmit` backend | ✅ Sin errores (cast `as any` en `renderToBuffer`) |
| `tsc --noEmit` frontend | ✅ Sin errores |

---

## v1.0.0 — Hito 8: Módulo de gestión de evidencias (FileAttachment) (2026-07-05)

### Nuevas funcionalidades

**Backend — FilesModule (`/files`)**
- `POST /files/upload` — carga de archivos via multipart/form-data (JPEG, PNG, WEBP, HEIC, PDF; máx. 10 MB)
- `GET /files?entityType=&entityId=` — lista adjuntos de cualquier entidad, ordenados por fecha descendente
- `GET /files/:id/download` — descarga autenticada del archivo (StreamableFile)
- `DELETE /files/:id` — elimina registro de BD y archivo físico
- Validación de MIME type en el servicio (lista blanca explícita)
- Validación de existencia de la entidad referenciada antes de aceptar el upload
- Abstracción `IStorageService` / `LocalStorageService` — preparada para swap a R2/S3 sin cambios en lógica de negocio
- Almacenamiento local en `backend/uploads/<entityType>/<uuid>.<ext>`

**Base de datos**
- Enum `FileEntityType`: EQUIPMENT, WORK_ORDER, SERVICE_RECORD, CLIENT, QUOTATION, INVOICE
- Enum `FileCategory`: PHOTO, DOCUMENT, CERTIFICATE, MANUAL
- Modelo `FileAttachment` con campos `description` (VarChar 500), `takenAt` (DateTime opcional), índice compuesto `[entityType, entityId]`
- Migración: `20260705194011_add_file_attachments`

**Frontend — componente reutilizable**
- `FileAttachmentSection` — sección de adjuntos lista para insertar en cualquier página con `entityType + entityId`
- `use-files.ts` — hooks `useFiles`, `useUploadFile`, `useDeleteFile` (TanStack Query v5)
- Integración inicial: `EquipmentPage` — botón Adjuntos (Paperclip) por fila abre dialog con la sección

### Decisiones de arquitectura

- **Patrón polimórfico**: `entityType + entityId` permite adjuntar a cualquier entidad futura sin cambiar el schema
- **Enums Prisma** en lugar de String para `entityType` y `category` — validación de valores a nivel de BD
- **Nota de naming**: campo nombrado `category` (no `fileType`) para evitar confusión con `mimeType`
- **Diseño incremental**: el módulo es la base para PDF de cotizaciones, QR de equipo, portal de cliente y firmas digitales en hitos futuros

### Verificación E2E (2026-07-05)

| Caso | Resultado |
|------|-----------|
| Upload PDF de 22 bytes via curl | ✅ 201, registro creado en BD, archivo en `uploads/equipment/` |
| GET /files?entityType=EQUIPMENT&entityId=... | ✅ Array con 1 elemento, campo `url` correcto |
| DELETE /files/:id | ✅ 200, archivo físico eliminado, array vacío tras eliminar |
| Dialog UI "Adjuntos — Generador Cummins C150D6" | ✅ Abre, selector de categoría funciona, estado vacío muestra mensaje |

---

## v0.9.1 — Auditoría DT-06: corrección documental (2026-07-05)

### Contexto

Al iniciar la sesión del 2026-07-05, la deuda técnica DT-06 indicaba que el backend no validaba el estado editable antes de ejecutar `PATCH /work-orders/:id`. La auditoría del código reveló que esta validación **ya existía en el servicio** antes de que se documentara como pendiente.

### Hallazgos de la auditoría

**`backend/src/modules/work-orders/work-orders.service.ts`:**
- Constante `EDITABLE_STATUSES = new Set<WorkOrderStatus>([DRAFT, SCHEDULED])` presente en líneas 37–40.
- Método privado `findEditableWorkOrder(id)` en líneas 378–395: busca la OT, lanza `NotFoundException` si no existe, y lanza `BadRequestException` con mensaje `WorkOrder in status {X} cannot be edited` si el estado no está en `EDITABLE_STATUSES`.
- El método `update()` invoca `findEditableWorkOrder(id)` como primera operación antes de cualquier escritura.

### Verificación E2E (2026-07-05)

| Caso | HTTP | Mensaje del backend |
|------|------|---------------------|
| `PATCH` sobre OT `IN_PROGRESS` | `400 Bad Request` | `WorkOrder in status IN_PROGRESS cannot be edited` |
| `PATCH` sobre OT `COMPLETED` | `400 Bad Request` | `WorkOrder in status COMPLETED cannot be edited` |
| `PATCH` sobre OT `CANCELLED` | `400 Bad Request` | `WorkOrder in status CANCELLED cannot be edited` |
| Frontend — OT `COMPLETED` en detalle | — | Botón "Editar" ausente; solo visible "Crear cuenta de cobro" |

### Corrección

- DT-06 eliminada de la lista de deuda técnica activa en `DEVELOPMENT_CONTEXT.md`.
- Error era exclusivamente documental: la implementación era correcta y completa desde la construcción del módulo `work-orders`.

### Sin cambios de código

No se modificó ningún archivo de código fuente. Esta versión es exclusivamente una corrección de documentación respaldada por verificación E2E.

---

## v0.9.0 — Hito 7: Edición de Orden de Trabajo desde el detalle (2026-07-04)

### Añadido — Frontend

**`src/components/work-orders/WorkOrderFormFields.tsx`** (nuevo):
- Componente compartido que encapsula los 5 campos comunes de OT: `branchId` (select), `title` (input), `description` (textarea), `scheduledAt` (datetime-local), `assignedToId` (select).
- Aceptado por ambos formularios (creación y edición) mediante `UseFormRegister<any>` y `FieldErrors<WorkOrderSharedFields>`.
- Props `disabled` y `branchesDisabled` para control granular del estado de los campos.

**`src/components/work-orders/WorkOrderEditModal.tsx`** (nuevo):
- Modal de edición con pre-población automática (`buildDefaults`) desde el objeto `WorkOrder` actual.
- Doble guardia de estado: (1) el botón "Editar" solo se muestra para `DRAFT` / `SCHEDULED`; (2) `onSubmit` rechaza la mutación si el estado cambió entre apertura y envío.
- Reutiliza `useUpdateWorkOrder(id)`, `useTechnicians()` y `useBranches(clientId)` sin duplicación de lógica.
- Normaliza `scheduledAt` con `.slice(0, 16)` para compatibilidad con `<input type="datetime-local">`.
- `assignedToId || undefined` y `description || undefined` en el DTO evitan enviar strings vacíos al backend.
- Deuda técnica documentada: la validación de estado editable debe reforzarse también en el backend en un hito futuro.

**`src/components/work-orders/WorkOrderHeader.tsx`** (modificado):
- Constante `EDITABLE_STATUSES: WorkOrderStatus[] = ['DRAFT', 'SCHEDULED']`.
- Botón "Editar" (ícono `Pencil`) visible únicamente para estados editables y cuando `onEdit` prop está definido.
- Prop `onEdit?: () => void` añadida a `WorkOrderHeaderProps`.

**`src/pages/WorkOrderDetailPage.tsx`** (modificado):
- Estado `editOpen` (`useState<boolean>`) para controlar apertura del modal.
- `onEdit={() => setEditOpen(true)}` pasado a `WorkOrderHeader`.
- `<WorkOrderEditModal>` montado al final de la página.

**`src/pages/WorkOrdersPage.tsx`** (modificado):
- Campos de formulario del modal de creación reemplazados por `<WorkOrderFormFields />`.
- Import de `Textarea` eliminado (movido al interior de `WorkOrderFormFields`).

### Comportamiento verificado

| Caso | Resultado |
|------|-----------|
| OT en estado DRAFT | Botón "Editar" visible junto a "Programar" y "Cancelar" |
| OT en estado SCHEDULED | Botón "Editar" visible junto a "Iniciar" y "Cancelar" |
| OT en estado IN_PROGRESS / COMPLETED / CANCELLED | Botón "Editar" no aparece |
| Abrir modal | Todos los campos pre-populados con datos actuales de la OT |
| Editar título y guardar | `PATCH /work-orders/:id → 200`, UI refleja nuevo título inmediatamente |
| TanStack Query invalidación | GET de la OT se ejecuta automáticamente tras PATCH exitoso |

### Decisiones arquitectónicas

| Decisión | Justificación |
|----------|---------------|
| `WorkOrderFormFields` compartido | Evita duplicar 5 bloques de JSX entre creación y edición. Base para posible unificación futura de ambos flujos. |
| Doble guardia EDITABLE_STATUSES | Botón oculto como primera línea; `onSubmit` como segunda línea para cubrir stale state. Backend aún no valida esto (deuda técnica). |
| `buildDefaults` como función pura | Aísla la normalización del DTO de entrada (incluye `.slice(0, 16)` para datetime-local) y facilita el reset con `useEffect`. |
| No se modifica el backend | `PATCH /work-orders/:id` ya acepta todos los campos requeridos vía `UpdateWorkOrderDto`. Cambio exclusivamente frontend. |

---

## v0.8.0 — Hito 6: Asignación de técnico en formulario de Orden de Trabajo (2026-07-04)

### Añadido — Frontend

**`src/hooks/use-work-orders.ts`:**
- Campo `assignedToId?: string` añadido a `WorkOrderFormData` y `WorkOrderUpdateData`.

**`src/pages/WorkOrdersPage.tsx` — `WorkOrderFormModal`:**
- Import de `useTechnicians` desde `@/hooks/use-users`.
- Campo `assignedToId` añadido al esquema Zod (opcional), `defaultValues` y construcción del DTO.
- Selector nativo `<select>` "Técnico asignado" con opción "Sin asignar" y lista dinámica de técnicos activos desde `GET /users/technicians`.
- Si no hay técnicos disponibles, muestra opción deshabilitada informativa.
- Al enviar, `assignedToId` se envía como `undefined` si el campo está vacío (no como string vacío).

### Comportamiento verificado

| Caso | Resultado |
|------|-----------|
| Abrir "Nueva OT" | Selector "Técnico asignado" visible con técnicos activos |
| Crear OT sin técnico | `assignedToId` omitido, OT creada con `assignedTo: null` |
| Crear OT con técnico | `POST /work-orders → 201`, `assignedTo` persistido en DB |
| `WorkOrderInfoCard` | Muestra nombre del técnico asignado o "Sin asignar" |
| `GET /users/technicians` | Llamada autenticada (sin restricción de rol) — 200 OK |

### Decisiones arquitectónicas

| Decisión | Justificación |
|----------|---------------|
| Select nativo en lugar de componente shadcn | `Select` de shadcn no está instalado. Patrón consistente con `UsersPage` y otros selectores del proyecto. |
| `assignedToId || undefined` en onSubmit | Evita enviar string vacío al backend. Backend espera `string` o ausencia del campo. |
| `useTechnicians` reutilizado del Hito 5 | Hook ya existente con `staleTime: 5min` y `queryKey: ['users', 'technicians']`. Sin duplicación. |

---

## v0.7.1 — Hito 5.1: Hardening de permisos del frontend (2026-07-04)

### Añadido — Frontend

**`src/components/auth/RoleProtectedRoute.tsx`:**
- Componente `RoleProtectedRoute` que acepta `allowedRoles: UserRole[]`.
- Si `user.role` no está en la lista permitida, redirige a `/403` con `replace`.
- Reutilizable: cualquier ruta futura de administración anida bajo este componente.

**`src/pages/ForbiddenPage.tsx`:**
- Página de error 403 consistente con el sistema de diseño: ícono `ShieldX`, mensaje descriptivo, botón "Volver al Dashboard".
- Montada en la ruta `/403` dentro de `AppLayout` (sidebar visible, contexto de usuario activo).

**`src/App.tsx`:**
- Ruta `/403` registrada dentro de las rutas protegidas.
- Ruta `/usuarios` anidada bajo `RoleProtectedRoute allowedRoles={['ADMIN']}`.
- Cualquier usuario que navegue manualmente a `/usuarios` sin rol ADMIN es redirigido a `/403` en lugar de ver la página con datos vacíos.

### Comportamiento verificado

| Caso | Antes | Ahora |
|------|-------|-------|
| TECHNICIAN navega a `/usuarios` | Página carga, tabla vacía (UX confusa) | Redirige a `/403`, mensaje claro |
| ADMIN navega a `/usuarios` | Funcionaba | Sigue funcionando |
| TECHNICIAN no ve enlace "Usuarios" | ✅ Ya correcto | Sin cambio |
| Botón "Volver al Dashboard" en 403 | N/A | Navega a `/` correctamente |

### Decisiones arquitectónicas

| Decisión | Justificación |
|----------|---------------|
| `/403` dentro de `AppLayout` (con sidebar) | El usuario sigue autenticado; mostrar el contexto de navegación es coherente con el flujo de la app. No es un error del servidor sino una restricción de rol. |
| `RoleProtectedRoute` separado de `ProtectedRoute` | Responsabilidades distintas: `ProtectedRoute` maneja autenticación, `RoleProtectedRoute` maneja autorización. Composables e independientes. |
| Redirect a `/403` en lugar de `/` | Comunicar explícitamente "no tienes permiso" es mejor UX que una redirección silenciosa al dashboard. |

---

## v0.5.0 — Hito 4: Autenticación JWT + Roles — backend completo (2026-07-04)

> Frontend pendiente (Fase 7). El backend de auth está completamente implementado y auditado.

### Añadido — Backend

**Infraestructura de autenticación:**
- Paquetes instalados: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `@types/passport-jwt`, `bcrypt`, `@types/bcrypt`, `cookie-parser`, `@types/cookie-parser`, `helmet`, `@nestjs/throttler`.
- Variables de entorno: `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`, `COOKIE_SECURE`, `COOKIE_DOMAIN`, `COOKIE_SAME_SITE`.

**Schema y migraciones (3 nuevas, total 8 aplicadas):**
- `20260704172525_add_user_password_hash` — campo `passwordHash String?` en modelo `User`.
- `20260704172624_make_password_hash_required` — `passwordHash` convertido a `String` obligatorio tras verificar 0 NULL.
- `20260704180200_add_user_refresh_token_hash` — campo `refreshTokenHash String?` en modelo `User`.
- Seed actualizado: `bcrypt.hash()` con 12 rondas para ambos usuarios.

**`UsersModule`** — mínimo, sin controller:
- `findById(id)` — filtra `isActive: true`.
- `findByEmail(email)`.
- `storeRefreshTokenHash(userId, hash)` / `clearRefreshTokenHash(userId)`.

**`AuthModule`** — implementación completa:
- `JwtStrategy` — extrae Bearer token; llama `usersService.findById()` en cada request; rechaza usuarios inactivos.
- `JwtAuthGuard` — guard global con soporte `@Public()` vía `IS_PUBLIC_KEY` metadata.
- `@Public()` decorator — marca endpoints públicos (login, refresh).
- `@CurrentUser()` decorator — extrae `AuthUser` de `request.user`.
- `@Roles()` decorator — infraestructura lista; `RolesGuard` diferido.
- `AuthService`:
  - `validateUser()` — verifica `isActive` *antes* de `bcrypt.compare()` (evita timing attacks).
  - `login()` — emite access + refresh tokens; almacena solo el hash HMAC-SHA256 del refresh token; lo escribe en HttpOnly cookie.
  - `refresh()` — verifica firma JWT, `isActive`, `refreshTokenHash !== null`, y `timingSafeEqual` del hash.
  - `logout()` — limpia `refreshTokenHash` en DB; borra cookie.
  - `me()` — retorna `AuthUser` del contexto.
- `AuthController` — endpoints: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`.

**Seguridad implementada:**
- `helmet()` — headers de seguridad HTTP en `main.ts`.
- `ThrottlerModule` — rate limiting global 100 req/min; `ThrottlerGuard` registrado como primer `APP_GUARD`.
- `cookie-parser` — parseo de cookies HttpOnly en NestJS.
- Refresh token: HMAC-SHA256 con `JWT_REFRESH_SECRET` como clave + `timingSafeEqual` para comparación timing-safe.
- Cookie path scoped: `path: '/auth/refresh'` — el navegador solo envía la cookie a ese endpoint.
- `@Res({ passthrough: true })` en `login` y `logout` — preserva pipeline de interceptors de NestJS.

**Orden de guards en `AppModule`:**
- `ThrottlerGuard` primero → `JwtAuthGuard` segundo. Rate limiting se aplica a todas las requests, incluyendo las no autenticadas.

**Auditoría de cambios — Fase 5:**
- `quotations.service.ts` — `create()` popula `createdById`; `update()` popula `updatedById`.
- `work-orders.service.ts` — `create()` popula `createdById`; `update()` popula `updatedById`.
- `invoices.service.ts` — `create()` popula `createdById`; `createPayment()` popula `createdById`.
- `expenses.service.ts` — `create()` popula `createdById`.
- `userId` se recibe como parámetro explícito desde el controller vía `@CurrentUser()` — servicios desacoplados del contexto HTTP.

### Decisiones arquitectónicas

| Decisión | Justificación |
|---|---|
| HMAC-SHA256 en lugar de bcrypt para refresh token | bcrypt es para contraseñas (baja entropía). Tokens de alta entropía no necesitan key-stretching; HMAC-SHA256 con clave secreta es el estándar de industria. |
| `timingSafeEqual` para comparar hashes | Previene timing attacks en la comparación de refresh token hash. |
| `isActive` verificado antes de `bcrypt.compare()` | Evita bcrypt timing en usuarios desactivados. |
| `refreshTokenHash === null` verificado antes de comparar | Detecta sesión cerrada (logout) sin necesidad de tabla de sesiones. |
| Sin `passport-local` | Flujo de login implementado directamente en `AuthService`. Menos dependencias, más control. |
| Sesión única por usuario | `refreshTokenHash` se sobrescribe en cada login. Deuda técnica documentada: múltiples sesiones simultáneas requieren tabla `sessions`. |

---

## v0.6.0 — Fase 7: Auth Frontend completa (2026-07-04)

### Añadido — Frontend

**Infraestructura de autenticación:**
- `src/lib/types.ts` — `UserRole` y `AuthUser` añadidos.
- `src/lib/api.ts` — reescrito: `credentials: 'include'` en todos los requests, header `Authorization: Bearer <token>` inyectado desde variable de módulo, interceptor 401 con mutex de refresh (`_isRefreshing` + `_refreshQueue`) para evitar múltiples llamadas simultáneas a `/auth/refresh`. Nuevas exports: `setApiToken`, `getApiToken`, `setOnAuthError`.
- `src/contexts/AuthContext.tsx` — `AuthProvider`: inicialización vía `POST /auth/refresh` en mount, `login()`, `logout()` con token explícito, `clearSession()` registrada en `onAuthError`. `useAuth()` hook.
- `src/components/layout/NodeMark.tsx` — SVG extraído de `Sidebar.tsx` para reutilización.
- `src/pages/LoginPage.tsx` — formulario email+password con marca STECH NODES, llama `useAuth().login()`.
- `src/components/auth/ProtectedRoute.tsx` — loading spinner durante `isLoading`; redirect a `/login` si `user === null`; `<Outlet />` si autenticado.

**Integración en App:**
- `src/App.tsx` — `AuthProvider` envuelve `RouterProvider`; ruta `/login` añadida; rutas protegidas anidadas bajo `ProtectedRoute`.
- `src/components/layout/Sidebar.tsx` — nombre real y label de rol del usuario desde `useAuth()`; botón "Cerrar sesión" con `logout()`.

### Corregido — Frontend

**Bug crítico (descubierto en pruebas E2E):**
- `AuthContext.logout()`: el fetch a `POST /auth/logout` no enviaba el header `Authorization`, causando 401. Corregido usando `getApiToken()` para incluir el Bearer token explícitamente.

**Compatibilidad Zod v4 / @hookform/resolvers v5 (pre-existentes):**
- Eliminado `{ invalid_type_error }` de `z.number()` en `ExpensesCard`, `QuotationFormPage`, `InvoiceDetailPage`, `ServiceRecordsPage`.
- `QuotationFormPage`: resolver casteado como `zodResolver(formSchema) as Resolver<FormSchema>` para resolver conflicto de tipos input/output con campos `optional().default()`.
- `WorkOrdersPage`: añadido `const navigate = useNavigate()` en el cuerpo del componente.
- `ServiceRecordCard`: `saveField` retorna `Promise<void>` vía `.then(() => {})`.
- Eliminados imports y variables no utilizados en `InvoicesPage`, `EstadoCuentasPage`, `WorkOrderInfoCard`, `ServiceRecordsPage`.

### Decisiones arquitectónicas

| Decisión | Justificación |
|---|---|
| Token en variable de módulo (`api.ts`) | Evita dependencia circular con React; `AuthContext` llama `setApiToken()` tras login/refresh. |
| Mutex de refresh en `api.ts` | Peticiones concurrentes con 401 comparten un único refresh en curso; las demás esperan en cola y reintentan con el nuevo token. |
| `AuthProvider` envuelve `RouterProvider` | `AuthContext` no usa `useNavigate()`; el redirect lo hace `ProtectedRoute` con `<Navigate />`, evitando el problema de contexto de router. |
| `getApiToken()` en logout | `logout()` usa `fetch` directo para evitar interceptor de refresh, pero necesita el token para autenticar el endpoint `POST /auth/logout`. |

---

## v0.7.0 — Hito 5: Módulo de Usuarios CRUD (2026-07-04)

### Añadido — Backend

**`RolesGuard`** (`src/modules/auth/guards/roles.guard.ts`):
- Tercer `APP_GUARD` global en `AppModule` (orden: `ThrottlerGuard` → `JwtAuthGuard` → `RolesGuard`).
- Lee `ROLES_KEY` del reflector; si no hay `@Roles()` en el handler, deja pasar (comportamiento por defecto).
- Solo bloquea cuando el handler tiene `@Roles(...)` y el `user.role` del token no está en la lista.

**`UsersController`** (`src/modules/users/users.controller.ts`) — nuevos endpoints:

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| `GET` | `/users` | ADMIN | Lista con filtros: `role`, `isActive`, `search` |
| `GET` | `/users/technicians` | Todos (autenticados) | Técnicos activos — para selector de OT |
| `GET` | `/users/:id` | ADMIN | Detalle de usuario |
| `POST` | `/users` | ADMIN | Crear usuario con contraseña hasheada |
| `PATCH` | `/users/:id` | ADMIN | Actualizar nombre, email, rol, isActive |
| `PATCH` | `/users/:id/deactivate` | ADMIN | Desactiva usuario + limpia `refreshTokenHash` |
| `PATCH` | `/users/:id/password` | ADMIN o propio usuario | Cambio de contraseña |

**`UsersService`** — nuevos métodos:
- `findAll(query)` — filtros opcionales: `role`, `isActive`, búsqueda ILIKE en nombre/email.
- `findTechnicians()` — solo técnicos activos, proyección mínima `{id, name}`.
- `findOne(id)` — proyección pública, lanza `NotFoundException` si no existe.
- `create(dto)` — verifica email único, hashea contraseña con bcrypt 12 rondas.
- `update(id, dto)` — verifica conflicto de email contra otros usuarios.
- `deactivate(id, requestingUserId)` — previene auto-desactivación; limpia `refreshTokenHash` en la misma operación.
- `changePassword(id, dto, requestingUserId, role)` — admin no necesita contraseña actual; propio usuario sí.

**`users.constants.ts`** — `USER_PUBLIC_SELECT`: proyección Prisma que excluye `passwordHash` y `refreshTokenHash` de todas las respuestas.

**DTOs añadidos:**
- `CreateUserDto` — email, name, password (plain), role, isActive?.
- `UpdateUserDto` — todos opcionales; sin campo `password` (cambio de contraseña es endpoint separado).
- `QueryUsersDto` — role?, isActive? (boolean con `@Transform`), search?.
- `ChangePasswordDto` — currentPassword?, newPassword.

**`work-orders.constants.ts`** — `WORK_ORDER_SELECT` actualizado: añadida relación `assignedTo: { select: { id, name } }`.

**`UsersModule`** — `UsersController` registrado; `UsersService` sigue exportado para `AuthModule`.

### Añadido — Frontend

**`src/lib/types.ts`:**
- `User` — entidad pública (sin passwordHash): `id, email, name, role, isActive, createdAt`.
- `Technician` — `{id, name}` para el selector de OT.
- `WorkOrder.assignedTo: { id: string; name: string } | null` — resuelve la relación antes inexistente.

**`src/hooks/use-users.ts`** — hooks con TanStack Query:
- `useUsers(query)` — lista con filtros; `queryKey: ['users', query]`.
- `useTechnicians()` — técnicos activos; `staleTime: 5min`.
- `useUser(id)` — detalle de usuario.
- `useCreateUser()`, `useUpdateUser()`, `useDeactivateUser()`, `useChangePassword()` — mutations con `invalidateQueries(['users'])`.

**`src/pages/UsersPage.tsx`** — página completa de gestión de usuarios:
- Tabla con filtros: búsqueda, filtro por rol (select nativo), toggle activos/todos.
- Acciones por fila: editar, cambiar contraseña, desactivar.
- Tres Dialogs: creación (con contraseña inicial), edición (nombre/email/rol), cambio de contraseña (con confirmación).
- Dialog de confirmación para desactivación (muestra consecuencias).
- Formularios con React Hook Form + Zod.

**`src/components/layout/Sidebar.tsx`:**
- Enlace "Usuarios" con icono `ShieldCheck` visible **solo cuando `user.role === 'ADMIN'`**.

**`src/app.tsx`:**
- Ruta `/usuarios` → `UsersPage` añadida dentro de `ProtectedRoute`.

**`src/components/work-orders/WorkOrderInfoCard.tsx`:**
- Campo "Técnico asignado" resuelto: `workOrder.assignedTo?.name ?? 'Sin asignar'` (ya no hardcodeado).

### Decisiones arquitectónicas

| Decisión | Justificación |
|----------|---------------|
| `GET /users` restringido a ADMIN | La lista completa de usuarios (con emails) es información sensible. Solo admin la necesita. |
| `GET /users/technicians` accesible a todos los roles | El selector de técnico en OT lo necesita cualquier usuario que cree o edite una OT (COMMERCIAL, BILLING, etc.). Devuelve solo `{id, name}`. |
| `deactivate` limpia `refreshTokenHash` en la misma operación | Invalidación inmediata de sesión. El usuario no puede renovar su token tras la desactivación incluso si tenía cookie válida. |
| `changePassword` por ADMIN no requiere contraseña actual | Comportamiento estándar de ERP (admin = superusuario). El admin resetea credenciales de otros usuarios sin conocer la actual. |
| No se migra el schema | El modelo `User` tenía todos los campos desde v0.5.0. Solo se añade el CRUD y la proyección pública. |
| `RolesGuard` no afecta endpoints existentes | Sin `@Roles()` = sin restricción por rol. Todos los endpoints anteriores siguen funcionando exactamente igual. |

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
