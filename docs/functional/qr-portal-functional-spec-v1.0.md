# Especificación funcional del Portal QR — V1

> **Estado:** referencia oficial única del Portal QR.
> **Versión:** 1.0 · **Fecha:** 2026-07-23 · **Proyecto:** `erp-emprendedores` (portal en `qr-portal/`).
> **Regla de gobierno:** cualquier evolución funcional del Portal QR se hace **modificando este documento**. No se crean documentos funcionales paralelos.
> **Alcance de este documento:** qué información expone el portal, para qué sirve, qué pregunta de auditoría responde, de dónde proviene y si entra en la V1.
> **Fuera de alcance:** estrategia, UX/UI y arquitectura técnica (ver §8).

---

## 1. Propósito funcional

El Portal QR **facilita el proceso de auditoría y la consulta del expediente técnico de un activo crítico**, poniendo a disposición inmediata —en el punto físico donde está el equipo— la información técnica relevante de ese activo.

Cuatro precisiones que delimitan el propósito:

1. **No reemplaza la documentación institucional** ni la carpeta física. La complementa.
2. **El QR es únicamente el medio de acceso.** El valor no está en el código: está en la información asociada al activo.
3. **El contenido lo determinan las preguntas reales** que necesita responder un auditor o un responsable institucional durante una inspección — no los campos disponibles en la base de datos.
4. **La primera validación es con Emmanuel** y la evolución posterior se decide con evidencia de uso.

**Perfil objetivo de la V1:** el responsable administrativo/institucional que atiende una auditoría (perfil validado: Alejandro, Clínica Emmanuel). No es el paciente, no es el visitante, no es el técnico en campo.

---

## 2. Alcance de la V1

Existen **dos objetivos distintos**, y la V1 resuelve solo el primero.

| | Objetivo 1 — **Portal útil** *(V1)* | Objetivo 2 — **Reemplazo de la carpeta física** *(posterior)* |
|---|---|---|
| **Qué logra** | Responder al instante, frente al activo, si el equipo tiene mantenimiento, con qué continuidad y bajo qué programa | Ser la fuente de evidencia entregable al auditor |
| **Valor** | Consolidación + velocidad + menos papel | Custodia y entrega del documento probatorio |
| **Contenido determinante** | Identificación + historial de intervenciones + cronograma | Soportes y certificados documentales |
| **Estado** | **Alcance de la V1** | **Diferido** |

**Respaldo de evidencia:** la entrevista sustenta que centralizar y consultar rápido es valioso (*"disminuiría el uso de papel"* — reducir, no eliminar). **No** sustenta que el portal deba sustituir la carpeta. Esa distinción es la que fija el corte de la V1.

**Disparador para abrir el Objetivo 2:** que el uso real —no un supuesto— evidencie la necesidad de los soportes en el portal.

---

## 3. Principios de diseño funcional

| # | Principio |
|---|---|
| **PF-1** | **La pregunta manda sobre el campo.** Un dato entra solo si responde una pregunta real de auditoría. La disponibilidad en la base de datos no es justificación. |
| **PF-2** | **El QR es medio, no producto.** Ninguna decisión funcional se toma para "lucir el QR"; se toma para llegar antes a la información del activo. |
| **PF-3** | **Complementariedad, no sustitución.** La V1 se diseña asumiendo que la carpeta física sigue existiendo. |
| **PF-4** | **Solo hechos registrados.** Todo dato expuesto corresponde a un hecho ocurrido y registrado en el ERP. Nada calculado, interpretado, proyectado ni predicho. |
| **PF-5** | **Proyección gobernada del expediente.** El portal expone un subconjunto explícito y cerrado de la Hoja de Vida; el expediente interno contiene información que nunca llega al portal. Son dos proyecciones distintas sobre el mismo Equipo. |
| **PF-6** | **La ausencia se muestra como ausencia.** Si no hay historial, el portal lo dice; nunca se rellena, se estima ni se omite el vacío. |
| **PF-7** | **La evolución se decide con evidencia de uso**, no con anticipación de necesidades. |

---

## 4. Matriz funcional del contenido

Prioridad: **V1** = entra en la primera implementación · **Diferida** = decisión posterior con evidencia · **Excluida** = permanentemente fuera del portal.

### 4.1 Identificación del activo

| Información | Propósito | Pregunta de auditoría que responde | Fuente en el ERP | Prioridad | Observaciones |
|---|---|---|---|---|---|
| Tipo de equipo | Nombrar el activo en lenguaje reconocible | ¿Qué activo estoy inspeccionando? | `Equipment.type` | **V1** | Ya expuesto |
| Marca y modelo | Correlacionar con el inventario institucional | ¿Coincide con lo declarado en el inventario? | `Equipment.brand`, `Equipment.model` | **V1** | Ya expuesto |
| Número de serie | Anclar el registro al objeto físico | ¿Este registro corresponde exactamente a **este** equipo? | `Equipment.serialNumber` | **V1** | Dato de anclaje: sin él, todo lo demás es inverificable |
| Ubicación (sede + ubicación interna) | Situar el activo | ¿Está donde el inventario dice que está? | `Equipment.location`, `Branch.name`, `Branch.city` | **V1** | Ya expuesto |
| Fecha de instalación | Contextualizar antigüedad del activo | ¿Desde cuándo está en servicio? | `Equipment.installDate` | **V1** | Ya expuesto; se conserva por costo cero |

### 4.2 Historial de intervenciones — núcleo de la V1

| Información | Propósito | Pregunta de auditoría que responde | Fuente en el ERP | Prioridad | Observaciones |
|---|---|---|---|---|---|
| **Historial completo de intervenciones** (lista cronológica) | Demostrar continuidad del mantenimiento | ¿Este equipo tiene mantenimiento y con qué continuidad en el tiempo? | `WorkOrder` filtradas por `equipmentId`, `status = COMPLETED`, `type ∈ {PREVENTIVE, CORRECTIVE}`, `deletedAt = null`; orden por `completedAt desc` | **V1** | **Es el cambio central de la V1.** Hoy el portal expone un único registro (D-4). Sustituye a "último mantenimiento" como dato aislado |
| Fecha de cada intervención | Fechar el hecho | ¿Cuándo se intervino? | `WorkOrder.completedAt` | **V1** | Fuente de fecha ya congelada en D-4.1: `completedAt` se escribe garantizado en `IN_PROGRESS → COMPLETED` |
| Tipo de cada intervención | Distinguir programado de reactivo | ¿Fue mantenimiento preventivo programado o una corrección? | `WorkOrder.type` | **V1** | `INSPECTION` excluido (decisión congelada D-4.1) |
| Última intervención como resumen | Lectura inmediata sin recorrer la lista | ¿Cuándo fue el último mantenimiento? | Derivado: primer elemento del historial | **V1** | Deja de ser un titular independiente; pasa a ser el encabezado del historial |
| Descripción de la intervención | Explicar qué se hizo | ¿Qué se hizo en esa intervención? | `WorkOrder.title`, `WorkOrder.description` | **Diferida** | Texto operativo libre, no depurado para lectura externa. Requiere criterio editorial antes de publicarse |
| Hallazgos, actividades y recomendaciones | Detalle técnico del acta | ¿Qué se encontró y qué se recomendó? | `ServiceRecord.findings`, `.activitiesPerformed`, `.recommendations` | **Diferida** | Contenido técnico interno; publicarlo cambia la naturaleza del canal (ver §7, decisión de canal) |
| Checklist de verificación | Probar que se siguió un protocolo | ¿Se verificó bajo un protocolo definido? | `ChecklistItem` (vía `ServiceRecord`) | **Diferida** | — |

### 4.3 Cronograma de mantenimiento

| Información | Propósito | Pregunta de auditoría que responde | Fuente en el ERP | Prioridad | Observaciones |
|---|---|---|---|---|---|
| Periodicidad del plan | Mostrar que el activo está sujeto a un programa | ¿Existe un programa de mantenimiento y con qué frecuencia? | `MaintenancePlan.frequency` vía `MaintenancePlanEquipment` | **V1** | Nombrado explícitamente por el perfil objetivo. **Depende de MNT-1** (§7) |
| Próxima visita programada | Demostrar vigencia del programa | ¿Hay mantenimiento programado hacia adelante? | `MaintenanceVisit.scheduledDate` (`status = PENDING`) del plan del equipo | **V1** | Solo si el dato es confiable; ver dependencia MNT-1 |
| Cobertura contractual vigente | Indicar respaldo contractual | ¿El activo está cubierto por un contrato vigente? | `ContractEquipment` + `MaintenanceContract.status`, `.endDate` | **Diferida** | La relación comercial no pertenece a este canal; `MaintenanceContract` contiene valores económicos permanentemente excluidos |

### 4.4 Estado y cobertura del activo

| Información | Propósito | Pregunta de auditoría que responde | Fuente en el ERP | Prioridad | Observaciones |
|---|---|---|---|---|---|
| Estado operativo | Declarar si el activo está en servicio | ¿Está operativo? | `Equipment.status` | **V1 — se conserva sin inversión** | Ya expuesto. Sin respaldo en la entrevista; se mantiene por costo cero, no por evidencia. `DECOMMISSIONED` permanece visible por diseño |
| Vencimiento de garantía / contrato | Señalar cobertura vigente | ¿Está bajo garantía o cobertura? | `Equipment.warrantyExpiresAt` | **V1 — se conserva sin inversión** | Ya expuesto. Hipótesis sin respaldo en la entrevista; no se invierte en desarrollarlo |

### 4.5 Soportes documentales — frontera del Objetivo 2

| Información | Propósito | Pregunta de auditoría que responde | Fuente en el ERP | Prioridad | Observaciones |
|---|---|---|---|---|---|
| Soportes y certificados por intervención | Entregar el documento probatorio | ¿Existe el documento que respalda ese mantenimiento? | `FileAttachment` (`entityType ∈ {WORK_ORDER, SERVICE_RECORD}`, `category ∈ {CERTIFICATE, DOCUMENT, PHOTO}`) | **Diferida — Objetivo 2** | **Es la línea exacta que separa "portal útil" de "reemplazo de la carpeta física".** Hoy la carpeta cubre esta necesidad sin fricción |

---

## 5. Exclusiones explícitas de la V1

### 5.1 Se retira del portal actual

| Elemento | Motivo |
|---|---|
| Tarjeta de contacto de soporte | No responde ninguna pregunta de auditoría. El perfil objetivo consulta evidencia; no solicita servicio desde el portal |
| "Último mantenimiento" como dato aislado y titular | Absorbido por el historial (§4.2). Deja de existir como elemento independiente |

### 5.2 Excluido permanentemente del portal

Se mantiene el contrato de exclusión ya congelado en `EquipmentPublicDto`:

- Identificadores internos (`id`, `branchId`, `clientId`).
- **Criticidad del activo** (`Equipment.criticality`) — clasificación interna de riesgo.
- **Notas internas** (`Equipment.notes`, `WorkOrder`/`ServiceRecord` notes internas).
- **Cualquier dato económico** — valores, precios, totales, ítems de OT, contratos, cuentas de cobro.
- **Identidad de personas** — técnico asignado, creador, firmante (`User`).
- **Datos comerciales o de contacto** del cliente y de la sede.
- Marcas de auditoría interna (`createdAt`, `updatedAt`, `deletedAt`).

### 5.3 No se aborda en la V1

- Sustitución de la carpeta física (Objetivo 2).
- Cualquier forma de analítica, comparación, tendencia o predicción — prohibido por el posicionamiento congelado y por **PF-4**.
- Interacción del usuario con el portal (solicitudes, reportes, formularios).

---

## 6. Riesgos conocidos

Solo riesgos capaces de invalidar la V1 o de producir conclusiones falsas en la validación.

| # | Riesgo | Por qué es crítico |
|---|---|---|
| **R-1** | **Sesgo del cliente fundacional.** Emmanuel tiene vínculo personal y lealtad con STECH NODES | Su reacción será favorable casi con independencia del producto. Un "sí, me sirve" de Emmanuel **no generaliza**. Es el principal riesgo de falso positivo |
| **R-2** | **Historial incompleto o incorrecto al momento de validar** (por MNT-1 o por datos históricos aún no cargados) | El portal se vería vacío o equivocado y se concluiría "no aporta valor" cuando el problema son **los datos, no el producto**. Falso negativo. Riesgo agravado: mostrar a un auditor un historial que contradiga la realidad |
| **R-3** | **Validar en seco**, preguntando "¿te serviría?" fuera de un momento real de consulta o auditoría | Devolvería otra preferencia declarada — exactamente la evidencia que ya existe. La validación solo es concluyente **en uso real** |
| **R-4** | **Ampliar el contenido sin resolver antes el canal de acceso** (§7, D-QR-V1-01) | Un historial completo en un canal anónimo queda visible para cualquiera que escanee (paciente, visitante), lo que contradice la razón por la que el portal público se acotó al mínimo |

### Supuestos aún no verificados (registro explícito)

No son riesgos de ejecución, pero no deben afirmarse como hechos:

- **Que el portal efectivamente facilita una auditoría** — nadie lo ha usado en una auditoría real.
- **Que el auditor lo acepta o lo valora** — toda la evidencia proviene del lado auditado, no del auditor.
- **Que la preferencia declarada se traduce en uso** — *"sería de gran ayuda"* es intención, no conducta observada.
- **Que el cronograma hace falta en el portal** — la entrevista lo declara indispensable *para la auditoría*, no *en el portal*.

---

## 7. Dependencias conocidas

| # | Dependencia | Impacto sobre la V1 |
|---|---|---|
| **D-QR-V1-01** | **Decisión de canal de acceso — pendiente y bloqueante.** ¿El historial completo se expone en el canal público anónimo actual, o requiere acceso institucional diferenciado? | El mismo contenido tiene implicaciones opuestas según el canal. El acceso autenticado (`PortalUser`) está congelado y diferido. **Sin esta decisión no puede iniciarse la implementación** |
| **MNT-1** | Los preventivos generados desde planes multi-equipo no quedan vinculados al activo | Sin corregirlo, el **historial** (§4.2) y el **cronograma** (§4.3) pueden mostrarse incompletos. Es una condición de **integridad de datos**, no una funcionalidad |
| **MIG-1** | La carga histórica de Emmanuel (desde 2022) está diferida por decisión | Sin datos históricos, el historial será corto y el valor de consulta no será observable en la validación. Ver **R-2** |
| **D-4 / D-4.1** | El contrato público vigente fija `lastMaintenance` como **un solo registro** | El historial completo **cambia el contrato del DTO público congelado**. Debe actualizarse la documentación antes de implementar (§8) |

---

## 8. Impacto sobre la documentación congelada

### 8.1 Documentos que deben actualizarse antes de implementar

Se respeta el orden de actualización establecido: **documento funcional → `DEVELOPMENT_CONTEXT.md` → código**.

| Documento | Acción requerida |
|---|---|
| `docs/strategy/qr-functional-design-v1.2.html` | **Queda superado funcionalmente por esta especificación.** Marcar como histórico y remitir aquí. Su contenido de casos de uso, alcance y decisión D-4 está consolidado en §2, §4 y §5 |
| `docs/strategy/qr-phase2-history-decision-v1.0.html` | **Superado.** Su decisión central (última visita = mínimo demostrable) queda reemplazada por el historial completo (§4.2). Marcar como histórico; conserva valor como registro de por qué se empezó por un solo registro |
| `DEVELOPMENT_CONTEXT.md` | Registrar esta especificación como referencia oficial del Portal QR; registrar **D-QR-V1-01** como decisión pendiente bloqueante; vincular **MNT-1** y **MIG-1** como dependencias de la V1 |
| `MASTER_DOCUMENT_INDEX.md` | Añadir esta especificación como documento normativo del Portal QR |

### 8.2 Documentos que se conservan sin cambio

| Documento | Motivo |
|---|---|
| `docs/strategy/qr-strategy-audit-v1.0.html` | Documento **estratégico**, no funcional. Sustenta PF-2 (el QR es medio, no producto). No se solapa con esta especificación |
| `docs/strategy/qr-uxui-v1.0.html` | Documento **visual**. Fuera del alcance de esta especificación |
| `docs/domain/domain-model-v1.0.md` | El dominio no cambia. Esta especificación define una **proyección** del expediente, no una redefinición de la Hoja de Vida (§PF-5) |

### 8.3 Reconciliación de redacción con el dominio

El dominio congelado (§5.5) afirma que el portal *"no consume una Hoja de Vida… son dos proyecciones separadas"*. El propósito congelado del Portal QR lo describe como *medio de acceso al expediente del activo*. Ambas se reconcilian así, sin modificar el dominio:

> El Portal QR expone una **proyección pública gobernada** del expediente técnico del activo. Es un medio de acceso a **parte** del expediente, no al expediente completo. La Hoja de Vida interna nunca se diseña como "lo que el portal consume".

Esta redacción es la que rige (**PF-5**).

---

## 9. Transición a implementación

Esta especificación cierra la definición funcional del Portal QR. Para pasar a implementación falta **una sola decisión**: **D-QR-V1-01 (canal de acceso)**.

Resuelta esa decisión, la secuencia es:
1. Actualizar los documentos de §8.1.
2. Corregir **MNT-1** (condición de integridad del historial y del cronograma).
3. Implementar el contenido marcado **V1** en §4.
4. Validar con Emmanuel **en un momento real de consulta**, atendiendo R-1, R-2 y R-3.

Cualquier evolución posterior se hace **modificando este documento**.
