# Modelo de Dominio STECH NODES — v1.2 †

> **Tipo:** Normativo (técnico/arquitectura de dominio — no corporativo).
> **Estado:** Congelado parcialmente. Ver §6 para el detalle de qué está cerrado y qué sigue en descubrimiento.
> **Fecha de creación:** 2026-07-15 · **Última actualización:** 2026-07-15 — Cuenta de Cobro congelada (§5.4). Las cuatro definiciones documentales del proceso (Cotización, OT, Acta Técnica, Cuenta de Cobro) quedan cerradas; solo resta la Historia Documental del Equipo.
> **Precedencia:** Este documento gobierna el modelo conceptual del ERP (entidades de dominio, lenguaje ubicuo, definiciones documentales de los artefactos del proceso de mantenimiento). No gobierna posicionamiento ni comunicación externa — eso corresponde a `docs/strategy/positioning-brief-v1.3.html` y `docs/strategy/business-rector-v1.0.html`, que tienen prioridad sobre cualquier término de este documento si llegaran a tocar el mismo tema.
> **Regla de actualización:** cambios a las secciones marcadas como congeladas requieren una decisión de dominio formal, con fecha y motivo, igual que las decisiones de `docs/strategy/`. Las secciones marcadas como pendientes se pueden completar sin reabrir lo ya congelado.
>
> † El archivo se llama `domain-model-v1.0.md` pero su contenido fue actualizado a v1.2. El número de versión canónico es v1.2. (v1.1: Acta Técnica congelada. v1.2: Cuenta de Cobro congelada.)

---

## 1. Propósito y alcance

Este documento consolida el modelo conceptual de negocio de STECH NODES descubierto y congelado durante la sesión de modelado de dominio de 2026-07-15, previo a cualquier decisión de implementación. Cubre:

- El lenguaje ubicuo del dominio de mantenimiento técnico (activos, actividades, documentos del proceso).
- Los principios rectores que gobiernan el ERP como sistema de trazabilidad documental.
- Las decisiones operativas congeladas D-07 a D-11.
- Las definiciones documentales oficiales de **Cotización**, **Orden de Trabajo**, **Acta Técnica** y **Cuenta de Cobro**.
- El estado de lo que aún está pendiente de definir (Historia Documental del Equipo).
- El backlog de mejoras de arquitectura/implementación derivado de la auditoría del ERP contra este modelo, explícitamente **no implementado** en esta etapa.

---

## 2. Principios rectores del dominio

1. **Toda ejecución técnica nace de un servicio autorizado por STECH NODES.**
2. **Como política de empresa** (no como regla universal del dominio), todo servicio autorizado debe tener un respaldo comercial — normalmente una Cotización, incluso por valor $0, o derivada posteriormente en un Contrato.
3. **El Contrato no es el centro del modelo.** Es una modalidad comercial entre otras para prestar servicios recurrentes — no el contenedor jerárquico de la operación.
4. **La Orden de Trabajo es el soporte documental obligatorio de toda ejecución técnica.** Su función es demostrar que el servicio fue ejecutado, independientemente de que exista reparación, hallazgos, cobro o contrato.
5. **El Acta Técnica es evidencia técnica opcional**, según el tipo de servicio.
6. **La Cuenta de Cobro es un documento financiero independiente**, que puede existir o no según el origen del servicio y su cobertura.
7. **El objetivo del ERP no es administrar contratos ni órdenes de trabajo.** El objetivo es garantizar la trazabilidad documental de cada Equipo durante toda su vida útil. Contratos y OTs son mecanismos al servicio de ese fin, no el fin en sí mismo.
8. **La Historia Documental del Equipo es relacional, no unitaria.** No reside en un único documento. Se construye a partir de la relación cronológica entre los documentos generados durante el ciclo de vida del Equipo, siendo la Orden de Trabajo el punto de anclaje de cada intervención, y el Acta Técnica la fuente principal de evidencia técnica cuando el tipo de servicio la requiera.

---

## 3. Lenguaje ubicuo

### 3.1 Jerarquía del activo

| Término | Definición |
|---|---|
| **Sistema** | Categoría tecnológica instalada (llamado de enfermería convencional, llamado IP, alertas de código, planta eléctrica). No tiene identidad propia — es una clasificación, no una entidad con ciclo de vida. |
| **Equipo** | La unidad técnica mantenible sobre la que se programa, ejecuta y certifica un mantenimiento. **No es necesariamente un dispositivo físico individual** — puede ser un módulo, un área, un piso o una planta completa. Su identidad es estable frente a cambios de tecnología. Un Sistema puede materializarse en uno o varios Equipos dentro de la misma sede (relación uno-a-muchos, no 1:1). |
| **Componente** | Parte interna no orientada al usuario, integrante de un Equipo (tarjetas, fuente, cableado, adaptadores). No es un activo independiente. |
| **Periférico** | Dispositivo terminal de interacción con la persona, integrante de un Equipo (mandos, lámparas, pantalla). No es un activo independiente. Su reemplazo puede tener implicaciones contractuales distintas (ej. daño por terceros, no cubierto). |
| **Repuesto** | Parte de reemplazo instalada durante una intervención. Sin vida propia como unidad. |
| **Consumible** | Elemento que se gasta y repone rutinariamente (filtros, aceite, baterías). No es un activo independiente. |

### 3.2 Proceso de mantenimiento

| Término | Definición |
|---|---|
| **Visita Técnica** | Desplazamiento físico de un técnico a una sede, en una fecha — puede cubrir uno o varios Equipos. Concepto logístico, no documental. |
| **Intervención Técnica** | Unidad de trabajo real, acotada a un Equipo — lo que se ejecuta y certifica. Secuencia: inspección → hallazgo → corrección → prueba → entrega. |
| **Hallazgo** | Observación registrada durante la inspección de un Equipo. |
| **Corrección** | Acción tomada en respuesta a un hallazgo. Subtipos: **Ajuste** (sin reemplazo de partes) y **Reemplazo** (con sustitución de Componente/Periférico/Repuesto/Consumible). |
| **Cobertura contractual** | Clasificación de cada Corrección (no de la OT completa) como cubierta o no por el contrato vigente. Grano fino: una misma intervención puede tener correcciones cubiertas y no cubiertas simultáneamente. |
| **Servicio Ofertado** | Unidad real dentro de una Cotización. Cada servicio aprobado constituye el respaldo comercial de una o varias Órdenes de Trabajo, según su naturaleza. |

### 3.3 Documentos del proceso

| Documento | Rol | Estado |
|---|---|---|
| **Cotización** | Respaldo comercial de un Servicio Ofertado. | ✅ Definición oficial congelada — §5.1 |
| **Orden de Trabajo (OT)** | Soporte documental obligatorio de la ejecución. Documento raíz de la ejecución operativa. | ✅ Definición oficial congelada — §5.2 |
| **Acta Técnica** | Documenta de forma estructurada la evidencia técnica generada durante la intervención. Opcional según tipo de servicio. | ✅ Definición oficial congelada — §5.3 |
| **Cuenta de Cobro** | Documento financiero que comunica formalmente al cliente el resultado económico de un servicio, contrato u otra relación comercial. Independiente de la OT. | ✅ Definición oficial congelada — §5.4 |
| **Historia Documental del Equipo** | El producto real del ERP — ensamblado a partir de todos los documentos anteriores asociados a las OTs de un Equipo, no una propiedad de ninguno de ellos individualmente. | ⏳ Próxima definición pendiente (último concepto de dominio antes del diseño) |

---

## 4. Decisiones operativas congeladas — D-07 a D-11

**D-07.** La Orden de Trabajo (OT) es el soporte documental obligatorio de toda ejecución técnica realizada por STECH NODES.

**D-08.** Una OT puede originarse desde múltiples procesos comerciales u operativos. Su origen no modifica el ciclo de vida de la OT.
Ejemplos de origen: Contrato de mantenimiento, Plan de mantenimiento, Cotización aprobada, Servicio puntual, Correctivo, Solicitud interna, cualquier otro origen futuro. Todos desembocan en el mismo ciclo operativo.

**D-09.** Una OT puede finalizar aunque no exista: reparación, hallazgos, acta técnica, cuenta de cobro, facturación. La OT documenta la ejecución del servicio, no el resultado del servicio.
Ejemplos: revisión sin novedad, diagnóstico, prueba funcional, mantenimiento preventivo, mantenimiento correctivo, visita de inspección, garantía.

**D-10.** El Acta Técnica es un documento opcional según el tipo de servicio. Cuando existe, representa la evidencia técnica de la ejecución realizada.

**D-11.** La Cuenta de Cobro es independiente de la existencia de la OT. Puede ser: valor cero, cubierta por contrato, parcialmente facturada, totalmente facturada, o no generar cobro.

---

## 5. Definiciones documentales oficiales

### 5.1 Cotización — CONGELADA

Documento comercial mediante el cual STECH NODES formaliza una propuesta de servicio, suministro o solución para obtener la aprobación del cliente.

Contiene el alcance comercial de los servicios ofertados, sus condiciones, valores y estado de aprobación. Puede hacer referencia a equipos, sistemas o ubicaciones cuando esa información ya es conocida, pero su existencia no depende de identificar un activo específico.

La unidad principal de una cotización son los **servicios ofertados**. Cada servicio aprobado constituye el respaldo comercial para una o varias Órdenes de Trabajo, dependiendo de la naturaleza del servicio.

La Cotización no contiene evidencia técnica ni resultados de ejecución. Su función termina cuando el servicio es aprobado, rechazado o vence.

Dentro de la Historia Documental del Equipo, la Cotización actúa únicamente como respaldo comercial de la intervención; no aporta evidencia técnica del activo.

### 5.2 Orden de Trabajo — CONGELADA

**Propósito.** Formalizar y dejar constancia verificable de que una intervención técnica fue efectivamente ejecutada, sin importar su origen comercial, su resultado técnico, o si generó cobro. Es el punto donde un respaldo comercial (un Servicio aprobado, o cualquier otro origen autorizado) deja de ser una autorización y se convierte en un hecho operativo real.

**Qué representa realmente.** Es el documento operativo que respalda la ejecución de un servicio: qué se ejecutó, sobre qué activo, cuándo, y con qué desenlace (completada o cancelada) dentro de su ciclo de ejecución. No representa el contenido técnico de lo ocurrido — eso es el Acta cuando existe — ni la decisión de facturación — eso es la Cuenta de Cobro. Es el nexo documental obligatorio entre el respaldo comercial y las consecuencias técnicas/financieras, sin ser ninguna de las dos cosas.

**Qué le corresponde documentar:**
- Qué servicio se ejecutó y cuál fue su respaldo comercial de origen.
- Sobre qué Equipo, cuando se conoce.
- El ciclo temporal de la ejecución: programación, inicio, finalización.
- Quién la ejecutó o gestionó.
- Su estado de avance dentro del ciclo de ejecución.
- Los recursos utilizados durante la intervención —materiales, repuestos, periféricos, componentes, consumibles u otros— como parte del registro de ejecución del servicio. Su registro no determina su facturación; esa decisión pertenece posteriormente a la Cuenta de Cobro.

**Qué NO le corresponde documentar:**
- El detalle técnico de lo encontrado y lo hecho — hallazgos, correcciones, recomendaciones. Eso pertenece al Acta Técnica.
- La decisión de qué se cobra, a quién y por cuánto. Eso pertenece a la Cuenta de Cobro.
- El resultado cualitativo del servicio ("quedó bien", "requiere seguimiento"). Cuando ese resultado se documenta, vive en el Acta — nunca en la OT.

**Qué aporta a la Historia Documental del Equipo.** Aporta la entrada cronológica verificable de que una intervención ocurrió sobre el Equipo: cuándo, con qué origen, y qué se ejecutó. Es el punto de anclaje temporal de la Historia — cada ejecución realizada sobre un Equipo queda representada por una Orden de Trabajo. Otros documentos podrán asociarse posteriormente a esa misma entrada, sin que la OT necesite anticipar ni reflejar cuáles.

**Relación con el Servicio aprobado, el Acta Técnica y la Cuenta de Cobro.** Con el Servicio aprobado: la OT es su materialización operativa — nace de él, pero una vez que existe, su ciclo de vida ya no depende del origen que la generó. Como documento, la OT es la **raíz de la ejecución operativa**: a partir de ella pueden asociarse otros documentos que resulten de esa ejecución o se relacionen con ella — el Acta Técnica cuando el tipo de servicio lo amerita, la Cuenta de Cobro cuando corresponda, y cualquier otro documento que en el futuro forme parte del proceso (evidencias, certificados, u otros). La OT no depende de ninguno de ellos para completarse, ni su definición queda limitada a los que existen hoy.

**Inicio y fin de la responsabilidad.** Comienza en el instante en que un servicio autorizado se convierte en una obligación operativa concreta de intervenir. Termina cuando la ejecución se da por finalizada — completada o cancelada. Su responsabilidad es sobre la ejecución en sí, no sobre lo que esa ejecución produzca después: esos son procesos documentales posteriores, derivados de la ejecución registrada por la OT, que esta no gobierna.

> **La Orden de Trabajo documenta que la intervención ocurrió; el Acta Técnica documenta la evidencia técnica generada durante esa intervención.**

### 5.3 Acta Técnica — CONGELADA

**Propósito.** El Acta Técnica documenta de forma estructurada la evidencia técnica generada durante una intervención, de manera que pase a formar parte de la Historia Documental del Equipo. No existe para narrar una historia ni para certificar frente al cliente — eso puede ocurrir como consecuencia, pero no es su razón de ser dentro del dominio.

**Qué representa realmente.** Es el documento que registra, de forma estructurada, la evidencia técnica generada durante una intervención realizada sobre un Equipo. Contiene toda la evidencia técnica que el tipo de servicio produzca durante la intervención — la implementación decidirá cuáles son esos tipos. Puede detallar múltiples elementos internos del Equipo —componentes, periféricos, módulos internos, repuestos, consumibles— sin que eso cambie la unidad documental: sigue siendo el registro de una intervención sobre un Equipo.

**Qué le corresponde documentar.** Toda la evidencia técnica que el tipo de servicio produzca durante la intervención. La implementación decidirá cuáles son esos tipos de evidencia.

**Qué NO le corresponde documentar:**
- El origen comercial que autorizó la intervención — pertenece a la OT.
- La decisión de qué se cobra, a quién y por cuánto. Eso pertenece a la Cuenta de Cobro.
- El hecho de que la ejecución ocurrió, sus fechas y su estado de avance — ya lo documenta la OT.

**Qué aporta a la Historia Documental del Equipo.** Toda la evidencia técnica real de cada intervención, documentada de forma estructurada, cuando existe. Si la OT aporta la entrada cronológica de que algo ocurrió, el Acta aporta la evidencia que le da sustancia a esa entrada.

**Relación con la Orden de Trabajo, el Servicio aprobado y la Cuenta de Cobro.**
```
Servicio aprobado
        │
        ▼
Orden de Trabajo
        │
        ├────────► Acta Técnica (cuando el tipo de servicio lo requiera)
        │
        ├────────► Cuenta de Cobro (cuando corresponda)
        │
        └────────► Otros documentos futuros
```
La Acta Técnica deriva de una Orden de Trabajo y documenta técnicamente la ejecución registrada por ella. La OT sigue siendo el documento raíz de la ejecución, pero no "habilita" ni "autoriza" el Acta — la relación es de derivación documental, no de permiso. Con el Servicio aprobado/Cotización: sin relación directa — ese respaldo comercial es responsabilidad exclusiva de la OT. Con la Cuenta de Cobro: sin relación de dependencia entre ambas; ambas derivan de la misma OT de forma independiente.

**Inicio y fin de su responsabilidad.** Comienza cuando la intervención empieza a generar evidencia técnica que documentar. Termina cuando la intervención concluye y esa documentación queda cerrada.

> **La Orden de Trabajo documenta que la intervención ocurrió; el Acta Técnica documenta la evidencia técnica generada durante esa intervención.**

### 5.4 Cuenta de Cobro — CONGELADA

> **Nota sobre forma de emisión (no reabre el dominio).** "Cuenta de Cobro" es el nombre del documento en el lenguaje del negocio hoy — el que se usa con clientes, con el contador y dentro del ERP. Es el lenguaje ubicuo del dominio actual. Los requisitos tributarios de su emisión (hoy como Cuenta de Cobro de persona natural con establecimiento) son un asunto de implementación. Si en el futuro STECH NODES cambia de forma jurídica (p. ej. SAS) y debe emitir Factura Electrónica, el modelo se evolucionará en ese momento según la nueva realidad del negocio — no se anticipa un concepto abstracto ahora.

**Propósito.** Comunicar formalmente al cliente el resultado económico derivado de un servicio, contrato u otra relación comercial, dejando constancia documental para su gestión administrativa, financiera y tributaria.

**Qué representa realmente.** Es el documento que comunica formalmente el resultado económico que corresponde al cliente por un servicio, contrato u otra relación comercial. Ese resultado puede ser un valor a pagar, un valor parcial, un valor cero o un valor totalmente cubierto por contrato — todos son resultados económicos válidos, formalizados por el mismo documento. No decide ese resultado (se determinó antes, durante o después, en la gestión comercial u operativa), no es evidencia técnica, y no es el registro de que el servicio se ejecutó.

**Qué le corresponde documentar:**
- El resultado económico que corresponde al cliente y su origen (el servicio, contrato o relación comercial que lo genera).
- El valor de ese resultado, en los términos ya determinados por la gestión comercial u operativa.
- La constancia formal de emisión: a quién se comunica y con qué referencia de origen.

**Qué NO le corresponde documentar:**
- La decisión de qué se cobra ni la interpretación de la cobertura contractual — ocurren antes, en la gestión del servicio. El documento refleja el resultado, no lo produce.
- La evidencia técnica de la intervención — pertenece al Acta.
- El hecho de que el servicio se ejecutó, sus fechas y su estado — pertenece a la OT.
- El registro del pago recibido — es un evento posterior que opera sobre este documento.

**Qué aporta a la Historia Documental del Equipo.** Aporta el cierre económico de una intervención cuando el resultado deriva de un servicio ejecutado sobre un Equipo específico. Cuando deriva de un vencimiento contractual o de una relación comercial no atribuible a un activo concreto, no aporta a la historia de ningún Equipo individual — es un hecho de la relación comercial completa. Su aporte a la Historia del Equipo es condicional al origen.

**Relación con los demás documentos.**
- **Cotización / Servicio aprobado**: puede derivar de un servicio cotizado y aprobado, como su consecuencia económica.
- **Orden de Trabajo**: cuando el resultado nace de una ejecución puntual, deriva de la OT que la registró — pero no siempre hay una OT detrás (el cobro por vencimiento contractual no nace de una ejecución). Relación posible, no obligatoria — a diferencia del Acta, que siempre cuelga de una OT.
- **Acta Técnica**: sin relación de dependencia; ambas pueden derivar de la misma OT de forma independiente.
- **Pago**: evento posterior que opera sobre este documento para saldarlo. El documento no gobierna el pago; lo hace posible al dejar el resultado establecido y trazable.

**Inicio y fin de su responsabilidad.** Comienza cuando existe un resultado económico ya determinado que corresponde comunicar formalmente al cliente, sin importar en qué momento se determinó. Termina cuando ese resultado queda formalizado y disponible para su gestión posterior (conciliación, pago, contabilización). No se extiende a esa gestión: la habilita, no la ejecuta.

---

## 6. Estado de la fase de descubrimiento

| Documento / concepto | Estado |
|---|---|
| Lenguaje ubicuo (Sistema, Equipo, Componente, Periférico, Repuesto, Consumible, Intervención, Visita, Hallazgo, Corrección) | ✅ Congelado |
| D-07 a D-11 | ✅ Congeladas |
| Cotización | ✅ Definición documental oficial congelada |
| Orden de Trabajo | ✅ Definición documental oficial congelada |
| Acta Técnica | ✅ Definición documental oficial congelada |
| Cuenta de Cobro | ✅ Definición documental oficial congelada |
| Historia Documental del Equipo | ⏳ Próxima definición pendiente — último concepto de dominio antes del diseño |

---

## 7. Backlog derivado — no implementado en esta etapa

Hallazgos de la auditoría de consistencia (ERP actual vs. este modelo) y de la revisión módulo por módulo. Registrados como trabajo pendiente; **ninguno se implementa en este commit.**

| ID | Descripción | Clasificación |
|---|---|---|
| RFC-1 | Ampliar `WorkOrderType` para cubrir tipos de servicio no representados hoy (diagnóstico; evaluar si "prueba funcional" se absorbe en `INSPECTION`). | Cambio de arquitectura |
| RFC-2 | Separar "naturaleza del servicio" de "condición de cobertura" como dos dimensiones distintas (no mezclar "garantía" con "diagnóstico" en una sola clasificación). | Cambio de arquitectura |
| RFC-3 | Introducir un campo explícito de origen comercial en la OT, en vez de inferirlo por presencia de relaciones opcionales (`quotationId`, `maintenanceVisit`). | Cambio de arquitectura |
| RFC-4 | Cobertura y naturaleza a nivel de `WorkOrderItem` (actividad/suministro, cobertura, facturación parcial). Modelo conceptual de negocio ya definido en esta sesión — sin diseño técnico ni schema todavía. | Cambio de arquitectura (en definición conceptual) |
| — | `CreateWorkOrderDto` no expone el campo `type` — toda OT manual recibe `CORRECTIVE` por defecto, sin importar su naturaleza real. | Deuda técnica |
| — | OTs históricas y futuras (hasta que se resuelva RFC-1) quedan mal etiquetadas como `CORRECTIVE` por defecto. | Deuda técnica |
| — | Generación de Cuenta de Cobro copia todos los ítems de la OT por defecto — riesgo de facturar por error algo cubierto por contrato. | Mejora de UX |
| — | No existe endpoint ni vista interna de historial completo de OTs por Equipo (el único mecanismo existente, `service-records.findByEquipment`, solo cubre Actas, y no está expuesto en el frontend del ERP). | Mejora de UX / Cambio de arquitectura |
| DT-06-B — Etapa 2 | `generateWorkOrder()` no asigna `equipmentId` cuando el plan de mantenimiento tiene más de un equipo asociado. Pendiente de análisis funcional y técnico (ver `DEVELOPMENT_CONTEXT.md`). Cobra más peso ahora bajo el criterio de trazabilidad del activo (punto 7): es una causa directa de historial incompleto para contratos multi-equipo. | Pendiente de análisis (no es deuda técnica todavía — requiere decisión de diseño) |

---

*Documento vivo dentro de su alcance congelado. Las secciones ✅ no se modifican sin una decisión de dominio formal, fechada y registrada aquí. Las secciones ⏳ se completan a medida que avanza el descubrimiento, sin reabrir lo ya cerrado.*
