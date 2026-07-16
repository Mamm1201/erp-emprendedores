# MASTER DOCUMENT INDEX — STECH NODES

> **Propósito de este archivo:** registrar todos los documentos que rigen el proyecto, su jerarquía de autoridad, su estado y las reglas de precedencia que resuelven cualquier conflicto entre ellos.
>
> Este índice no prescribe comportamiento por sí mismo — redirige al documento de mayor autoridad para cada dominio. Es el mapa, no el territorio.

**Versión:** 1.0  
**Fecha de creación:** 2026-07-08  
**Custodio:** Fundadores de STECH NODES  
**Actualizar cuando:** se crea, elimina o modifica el estado de cualquier documento listado aquí.

---

## Índice maestro

| Prioridad | Documento | Propósito | Tipo | Estado | Versión | Archivo |
|:---------:|-----------|-----------|:----:|:------:|:-------:|---------|
| **1** | Documento Rector Empresarial | Rector corporativo máximo. Consolida identidad, modelo de negocio, diferenciadores, visión y principios de gobierno. Base para Fondo Emprender y comunicación externa. | Normativo | Vigente | v1.0 | `docs/strategy/business-rector-v1.0.html` · PDF |
| **2** | Positioning Brief | Posicionamiento estratégico e identidad de la empresa. Define qué es STECH NODES, qué promete y qué no puede comunicar aún. | Normativo | Congelado | v1.3 | `docs/strategy/positioning-brief-v1.3.html` |
| **3** | QR Functional Design | Arquitectura funcional completa del ecosistema QR. Contrato DTO público (incluyendo `lastMaintenance`, addendum D-4 + precisión D-4.1). Reglas de negocio y decisiones técnicas. | Normativo | Congelado | v1.4 † | `docs/strategy/qr-functional-design-v1.2.html` |
| **4** | QR UX/UI | Diseño de experiencia e interfaz del portal QR. 6 principios de diseño, 6 estados de la interfaz, tokens visuales, wireframes. | Normativo | Borrador aprobado | v1.0 | `docs/strategy/qr-uxui-v1.0.html` |
| **5** | QR Phase 2 History Decision | Decisión de alcance del Bloque 6: historial mínimo demostrable en el portal. Campos permitidos, exclusiones permanentes, ruta de datos. | Normativo | Congelado | v1.0 | `docs/strategy/qr-phase2-history-decision-v1.0.html` |
| **6** | Strategic Review — Fondo Emprender | Análisis estructurado de los 5 documentos fuente con nivel de confianza por afirmación. Vacíos documentales para PITCH VERDE 2026. | Referencia | Vigente | v1.0 | `docs/strategy/strategic-review-fondo-emprender-v1.0.html` · PDF |
| **7** | QR Strategy Audit | Auditoría crítica de la hipótesis "el QR es el diferenciador". Análisis de imitabilidad, objeciones por actor, reformulación del diferenciador real. | Referencia | Vigente | v1.0 | `docs/strategy/qr-strategy-audit-v1.0.html` |
| **8** | Strategic Positioning 10Y | Posicionamiento en tres horizontes temporales (1–3, 3–6, 6–10 años). Tesis del volante estratégico, 4 capas de moat competitivo. | Referencia | Vigente | v1.0 | `docs/strategy/strategic-positioning-10y-v1.0.html` |
| — | DEVELOPMENT_CONTEXT.md | Estado actual de implementación. Hitos, deuda técnica, decisiones arquitectónicas activas, estado de la rama. | Operativo | Activo | v2.4.0 | `DEVELOPMENT_CONTEXT.md` |
| — | CHANGELOG.md | Historial cronológico de cambios funcionales, correcciones y documentación. | Operativo | Activo | — | `CHANGELOG.md` |
| — | MASTER_DOCUMENT_INDEX.md | Este archivo. Índice y reglas de precedencia. | Operativo | Activo | v1.0 | `MASTER_DOCUMENT_INDEX.md` |

† El archivo se llama `qr-functional-design-v1.2.html` pero su contenido fue actualizado a v1.4: addendum §14 (decisión D-4, 2026-07-08) + Precisión D-4.1 (corrección de fuente de datos, 2026-07-08). El número de versión canónico es v1.4.

---

## Documentos técnicos de dominio (ERP)

Pista de gobierno separada de la tabla anterior: los documentos de arriba (prioridad 1–8) gobiernan identidad corporativa, posicionamiento y el ecosistema QR. Los documentos de esta sección gobiernan el **modelo conceptual del ERP** (entidades de dominio, lenguaje ubicuo, definiciones documentales del proceso de mantenimiento) — un dominio distinto, sin relación de precedencia cruzada salvo coincidencia explícita de tema.

| Documento | Propósito | Tipo | Estado | Versión | Archivo |
|-----------|-----------|:----:|:------:|:-------:|---------|
| Modelo de Dominio STECH NODES | Lenguaje ubicuo, principios rectores (incluyendo Principio 8 — Hoja de Vida del Equipo relacional), decisiones D-07 a D-11, y definiciones documentales oficiales de Cotización, Orden de Trabajo, Acta Técnica y Cuenta de Cobro. Hoja de Vida del Equipo en descubrimiento (§5.5, no congelada). | Normativo | Congelado (parcial) | v1.3 †† | `docs/domain/domain-model-v1.0.md` |

†† El archivo se llama `domain-model-v1.0.md` pero su contenido fue actualizado a v1.3. El número de versión canónico es v1.3. (v1.1: Acta Técnica congelada, Principio 8 agregado. v1.2: Cuenta de Cobro congelada. v1.3: renombre "Historia Documental del Equipo" → "Hoja de Vida del Equipo" (lenguaje real del negocio) + descubrimiento de la Hoja de Vida en curso, no congelada.)

---

## Tipos de documento

| Tipo | Definición | ¿Prescribe? | ¿Puede ser contradicho? |
|------|------------|:-----------:|:-----------------------:|
| **Normativo** | Gobierna decisiones. Su violación invalida la acción que lo contradice. | Sí | Solo por un documento normativo de mayor prioridad, o por una decisión arquitectónica posterior explícitamente documentada. |
| **Referencia** | Informa decisiones pero no las prescribe. Puede ser contradicho por razonamiento posterior sin invalidar la acción. | No | Sí, con justificación registrada. |
| **Operativo** | Registra estado actual. No tiene autoridad prescriptiva sobre estrategia ni arquitectura. | No | No aplica — es descriptivo. |

---

## Reglas de precedencia

### Regla 1 — Jerarquía numérica

Cuando dos documentos **normativos** contienen afirmaciones incompatibles, prevalece el de **menor número de prioridad** (mayor jerarquía).

```
Prioridad 1 > Prioridad 2 > Prioridad 3 > Prioridad 4 > Prioridad 5
```

**Ejemplos concretos:**
- Si el Positioning Brief (P2) define la promesa comercial de una manera, y el QR Functional Design (P3) implica algo diferente → gana el Positioning Brief.
- Si el QR UX/UI (P4) propone mostrar un campo que el QR Functional Design (P3) excluye explícitamente → gana el QR Functional Design.

---

### Regla 2 — Excepción: decisión arquitectónica posterior explícita

Un documento de menor jerarquía **puede sustituir** un principio de un documento de mayor jerarquía si se cumplen las tres condiciones simultáneamente:

1. **La decisión está nombrada y marcada explícitamente** como sustitución (p. ej. "D-4 — decisión CONGELADA que amplía §08 del documento funcional").
2. **Tiene fecha posterior** al contenido que modifica.
3. **Está registrada en `DEVELOPMENT_CONTEXT.md`** en la tabla de decisiones arquitectónicas.

Si falta cualquiera de las tres condiciones, la excepción no es válida y prevalece la jerarquía numérica.

**Ejemplo de excepción válida:** La decisión D-4 (addendum §14 en QR Functional Design v1.3) amplía el contrato DTO más allá de lo definido en §08 del mismo documento. Está nombrada, fechada (2026-07-08) y registrada en DEVELOPMENT_CONTEXT.md → válida.

**Ejemplo de excepción inválida:** Un comentario en un PR que dice "decidimos exponer el campo `technicianName` para la demo". No está documentado formalmente → no aplica la excepción → prevalece la exclusión que establece QR Functional Design.

---

### Regla 3 — Documentos de referencia no invalidan normativos

Los documentos de **tipo Referencia** (prioridades 6–8) pueden informar una decisión pero **nunca invalidan** un documento normativo, independientemente de la fecha o el argumento.

Si un documento de referencia contradice un normativo, la contradicción es analítica (una perspectiva alternativa), no prescriptiva. Debe resolverse actualizando el documento normativo si la perspectiva alternativa se adopta formalmente.

---

### Regla 4 — Documentos operativos son descriptivos

`DEVELOPMENT_CONTEXT.md`, `CHANGELOG.md` y este `MASTER_DOCUMENT_INDEX.md` son **observadores del estado**, no prescriptores.

- Describen lo que se decidió, no lo que se debe decidir.
- Una entrada en DEVELOPMENT_CONTEXT.md que describe una implementación no valida esa implementación si contradice un documento normativo.
- Si hay discrepancia entre DEVELOPMENT_CONTEXT.md y un documento normativo, el normativo tiene razón y DEVELOPMENT_CONTEXT.md debe corregirse.

---

### Regla 5 — Orden de actualización invariable

Cuando una decisión modifica algo cubierto por un documento normativo, el orden de ejecución es:

```
1. Actualizar el documento normativo correspondiente
2. Actualizar DEVELOPMENT_CONTEXT.md
3. Implementar en código
```

**Invertir este orden invalida la decisión.** Una implementación que no tiene su decisión documentada en el documento rector correspondiente es deuda técnica de gobierno, no solo deuda técnica.

---

### Regla 6 — Coherencia mínima obligatoria con P1 y P2

Todo documento nuevo (normativo o de referencia) debe ser coherente con el Documento Rector Empresarial (P1) y el Positioning Brief (P2) antes de añadirse a este índice.

Si no puede serlo (p. ej. porque una nueva decisión cambia la promesa comercial), el orden es:
1. Actualizar P1 o P2 primero.
2. Luego crear el documento nuevo.
3. Luego registrarlo aquí.

Crear primero el documento nuevo y después "armonizarlo" con P1/P2 viola la jerarquía.

---

## Protocolo para agregar un nuevo documento

1. Identificar el **dominio** que cubre (estratégico, funcional QR, UX/UI, análisis, etc.).
2. Verificar que no existe ya un documento normativo que cubra ese dominio. Si existe, el nuevo documento podría ser un **addendum** a ese documento en lugar de uno nuevo.
3. Determinar el **tipo**: Normativo, Referencia u Operativo.
4. Asignar la **prioridad**: los nuevos documentos normativos se insertan en la posición que corresponde a su dominio; los de referencia se suman al final del grupo de referencia.
5. Verificar coherencia con P1 y P2 antes de finalizar.
6. Agregar la fila a la tabla de este índice.
7. Agregar la entrada al registro de `DEVELOPMENT_CONTEXT.md §Documentación estratégica`.
8. Registrar la creación en `CHANGELOG.md`.

---

## Protocolo para actualizar un documento existente

| Cambio | ¿Requiere actualizar este índice? | ¿Requiere actualizar DEVELOPMENT_CONTEXT.md? |
|--------|:---------------------------------:|:--------------------------------------------:|
| Corrección tipográfica o de formato | No | No |
| Cambio de contenido menor (addendum, aclaración) | No — actualizar solo la versión interna del doc | Sí — registrar la nueva versión |
| Cambio de estado (ej. Borrador → Congelado) | **Sí** | Sí |
| Cambio de versión mayor | **Sí** | Sí |
| Eliminación del documento | **Sí** — remover la fila y documentar la fecha y motivo | Sí |
| Cambio de prioridad | **Sí** — renumerar y revisar conflictos | Sí |

---

## Historial de versiones de este índice

| Versión | Fecha | Cambio |
|---------|-------|--------|
| v1.0 | 2026-07-08 | Creación inicial. 8 documentos estratégicos registrados + 3 operativos. Reglas de precedencia definidas. |
| v1.1 | 2026-07-08 | QR Functional Design actualizado a v1.4 (Precisión D-4.1). |
| v1.2 | 2026-07-15 | Nueva sección "Documentos técnicos de dominio (ERP)" — registrado `domain-model-v1.0.md`, pista de gobierno separada de la estrategia corporativa/QR. |
| v1.3 | 2026-07-15 | `domain-model-v1.0.md` actualizado a v1.1 — Acta Técnica congelada, Principio 8 agregado. |
| v1.4 | 2026-07-15 | `domain-model-v1.0.md` actualizado a v1.2 — Cuenta de Cobro congelada. |
| v1.5 | 2026-07-15 | `domain-model-v1.0.md` actualizado a v1.3 — renombre a "Hoja de Vida del Equipo" (lenguaje real del negocio) + descubrimiento en curso (no congelado). |
