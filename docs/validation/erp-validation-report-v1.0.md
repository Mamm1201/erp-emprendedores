# ERP Validation Report v1.0 — STECH NODES

> **Documento de cierre de la fase de validación funcional del ERP.**
> Cierra oficialmente la fase de validación y da inicio a la fase de estabilización y preparación para producción.
>
> **Fecha:** 2026-07-16 · **Rama:** `develop` · **Método:** validación por ejecución real (backend + BD + portal), evidencia objetiva, comparación contra el Modelo de Dominio congelado (`docs/domain/domain-model-v1.0.md` v1.4).
> **Fuente viva:** el "Tablero de validación" y el "Resumen ejecutivo del backlog" en `DEVELOPMENT_CONTEXT.md` son la referencia operativa; este Report los consolida en un entregable de cierre.

---

## 1. Resumen ejecutivo

Se ejecutó un barrido de validación funcional sobre **los 10 módulos implementados** del ERP. Cada módulo se corrió con datos reales, se capturó evidencia y se comparó contra el dominio congelado y contra el flujo real de una IPS.

**Conclusión general:** el ERP está **funcionalmente operativo de extremo a extremo** — la cadena Cliente → Sede → Equipo → Cotización → OT → Acta → Cuenta de Cobro → Pago, y la cadena de mantenimiento Contrato → Plan → Visita → OT, funcionan y se reflejan correctamente (incluido el portal QR). No se encontró ninguna contradicción que obligara a reabrir el dominio.

**Sin embargo, el ERP NO está listo para la migración de datos reales ni para la salida comercial**, por **dos hallazgos de alta prioridad que rompen la propuesta de valor** ("la trazabilidad técnica viaja con el activo"):

- **OT-4** — las fechas de intervención no son retrofechables → la migración histórica desfecharía toda la trayectoria técnica.
- **MNT-1 (DT-06-B)** — el mantenimiento preventivo de contratos con varios equipos genera OTs sin activo vinculado → invisible en la Hoja de Vida / QR, justo en el escenario comercial central.

Ambos son problemas de **diseño arquitectónico** (no de implementación trivial) y quedan como la primera ronda de diseño de la fase de estabilización. Durante la validación solo se corrigieron dos contradicciones internas de muy bajo riesgo (CE-1, CE-2).

**Madurez del ERP:** núcleo funcional sólido; faltan (a) resolver 2 bloqueantes de la propuesta de valor, (b) construir la Hoja de Vida (no iniciada), (c) preparar datos reales de demo, antes de operar comercialmente.

---

## 2. Estado de todos los módulos

| Módulo | Estado | Resumen |
|--------|:------:|---------|
| Clientes | 🟡 | Funcional. Falta dirección fiscal / representante legal (CE-3) |
| Sedes | 🟢 | Sin hallazgos — el mejor cubierto |
| Equipos | 🟡 | CE-1/CE-2 **corregidos** (pend. validación visual); CE-4/CE-5/CE-6 backlog |
| Portal QR | 🟡 | Funciona y alineado con su alcance. Pendiente: datos reales de demo, prueba física, y MNT-1 aguas arriba |
| Cotización | 🟡 | Flujo OK (crear · estados · PDF · totales · snapshot). COT-1 a COT-4 backlog |
| Orden de Trabajo | 🟡 | Flujo OK (crear · estados · vínculo a equipo · reflejo QR). OT-1 a OT-4; **OT-4 bloqueante** |
| Acta Técnica | 🟡 | El mejor alineado. Firma retrofechable. ACT-1 (evidencias en PDF) backlog |
| Cuenta de Cobro | 🟡 | Ciclo económico completo (pagos parciales/total, $0, PDF). CC-1/CC-2 backlog |
| Contratos / Planes / Visitas | 🟡 | Flujo OK. **MNT-1 (DT-06-B) confirmado con evidencia** — alta prioridad |
| Dashboard | 🟡 | KPIs coherentes. Sin hallazgos. Solo pendiente recorrido visual |
| Hoja de Vida | ⬜ | **No implementada** — ítem de construcción (expediente compuesto, §5.5 del dominio) |

> **Nota sobre 🟡 vs 🟢:** el criterio de la fase es que un módulo solo pasa a 🟢 cuando además se verifica **desde la interfaz de usuario en un recorrido normal**. Todo lo validado en esta fase se hizo a nivel de API/ejecución real; **la validación visual (UI) queda pendiente de forma transversal** (el arnés de pruebas bloqueó el login automatizado; la hará el usuario). Por eso la mayoría queda 🟡 aunque funcionalmente estén completos. Sedes se mantiene 🟢 por herencia del tablero inicial.

---

## 3. Hallazgos clasificados (Categoría · Impacto · Prioridad)

| ID | Módulo | Categoría | Impacto | Prioridad | Estado |
|----|--------|-----------|---------|:---------:|:------:|
| OT-4 | Orden de Trabajo | Implementación incompleta | Migración | **Alta** | ⏳ Backlog |
| MNT-1 (DT-06-B) | Contratos/Planes/Visitas | Implementación incorrecta | Comercial + Operación + Migración | **Alta** | ⏳ Backlog |
| CC-1 | Cuenta de Cobro | Implementación incorrecta | Operación | **Alta** | ⏳ Backlog |
| CE-3 | Clientes | Implementación incompleta | Migración / Operación | Media | ⏳ Backlog |
| OT-2 | Orden de Trabajo | Implementación incorrecta | Operación / UX | Media | ⏳ Backlog (quick-win disponible) |
| COT-3 | Cotización | Implementación incompleta | Comercial / UX | Media | ⏳ Backlog |
| ACT-1 | Acta Técnica | Implementación incompleta | UX | Media | ⏳ Backlog |
| CE-5 | Equipos | Implementación incompleta | Migración (calidad de datos) | Media | ⏳ Backlog |
| OT-1 / CC-1 (RFC-4) | OT + Cuenta de Cobro | Implementación incorrecta | Arquitectura | Media | ⏳ Backlog |
| COT-1 / COT-2 | Cotización | Implementación incorrecta | Arquitectura | Baja | ⏳ Backlog |
| OT-3 (RFC-3) | Orden de Trabajo | Implementación incompleta | Arquitectura | Baja | ⏳ Backlog |
| CE-4 | Equipos | Implementación incompleta (+ descubrimiento acotado) | Migración | Baja | ⏳ Backlog |
| CE-6 | Equipos | Implementación incompleta | Migración (operación) | Baja | ⏳ Backlog |
| COT-4 / CC-2 | Cotización / Cuenta de Cobro | Implementación incompleta | Migración | Baja | ⏳ Backlog (familia OT-4) |
| CE-1 | Equipos | Implementación incorrecta | Comercial (QR) | — | ✅ **Corregido** |
| CE-2 | Equipos | Implementación incompleta | Operación | — | ✅ **Corregido** |

**Nota "descubrimiento pendiente":** ningún hallazgo requiere reabrir descubrimiento de negocio. Los únicos huecos de dominio conocidos son deliberados y ya registrados: la hipótesis diferida de "hitos del ciclo de vida del activo" (§5.5/§7 del dominio) y el detalle acotado de CE-4 (specs por tipo). No se abren mientras no haya evidencia nueva del negocio.

---

## 4. Hallazgos agrupados por impacto

### 🔴 Migración histórica (bloqueantes)
- **OT-4** — `completedAt`/`startedAt` se fijan en `now()` al transicionar; no retrofechables → toda intervención migrada quedaría "completada hoy", rompiendo la cronología de la Hoja de Vida. **Prerequisito del piloto histórico.**
- **MNT-1 (DT-06-B)** — cara de migración: los preventivos generados por plan multi-equipo no se vinculan al activo.
- Menores (baja): CE-3 (datos fiscales del cliente), CE-5 (serial no único → duplicados), CE-4 (specs por tipo), COT-4/CC-2 (retrofecha de documentos comerciales/financieros — rara vez se migran).

### 🔴 Comercial (bloquean salida / demo a IPS)
- **MNT-1 (DT-06-B)** — el preventivo recurrente de contratos multi-equipo no aparece en el QR/Hoja de Vida → rompe "el historial viaja con el equipo" en el escenario comercial central.
- **QR — datos de demo** — teléfono ficticio (`+57 (601) 000-0000`) + equipo demo vacío (sin marca/modelo/serial) → el portal subvende la propuesta de valor. Corrección barata (datos/copy).
- **QR — prueba física** — validación con teléfono real pendiente (Bloque 7).

### 🟡 Operación / experiencia de usuario
- **CC-1** — la Cuenta de Cobro copia todos los ítems de la OT → riesgo de **facturar de más** líneas cubiertas por contrato (prioridad Alta dentro de este grupo).
- **OT-2** — `type` no capturable en creación manual (todo CORRECTIVE) → OTs mal etiquetadas. Quick-win disponible.
- **COT-3** — condiciones comerciales (forma de pago, garantía) no capturables (slots PDF muertos).
- **ACT-1** — evidencias/fotos no se renderizan en el PDF del Acta.

### 🟢 Arquitectura / mejora futura
- **RFC-4** (OT-1/CC-1) — separar registro de ejecución de la facturación (precios fuera de la OT; cobertura por línea).
- **COT-1/COT-2** — "Servicio Ofertado" como unidad + cardinalidad cotización→OT (1:N).
- **OT-3 (RFC-3)** — origen comercial explícito en la OT.
- **CE-4, CE-6** — specs por tipo, carga masiva.

---

## 5. Correcciones implementadas durante la validación

| ID | Corrección | Verificación | Commit |
|----|-----------|--------------|--------|
| CE-1 | `warrantyExpiresAt` expuesto en DTOs/service/select/tipos/hook/formulario (antes incapturable pese a que el QR lo usa) | Prueba API: crear con garantía → 201; persiste; vuelve en GET | `cd8bbde` |
| CE-2 | `criticality` expuesto (antes clavada en MEDIUM) | Prueba API: crear HIGH → 201; editar a CRITICAL → 200 | `cd8bbde` |

Ambas quedan **implementadas y pendientes de validación visual** (criterio de 🟢). Fueron las únicas correcciones porque cumplían el criterio de "contradicción interna evidente y de muy bajo riesgo" (campos ya existentes en el modelo). Todo lo demás se mantuvo en backlog por disciplina de terminar el barrido antes de tocar código.

---

## 6. Backlog priorizado (orden de ataque recomendado)

**Prioridad 1 — Bloqueantes de la propuesta de valor (ronda de diseño arquitectónico):**
1. **OT-4** — habilitar fecha real de intervención (modo migración / exponer `completedAt` en el cierre). Prerequisito de la migración.
2. **MNT-1 (DT-06-B)** — decidir granularidad del preventivo multi-equipo (visita-al-equipo / N OTs por visita / OT con N intervenciones). **No diseñar hasta abrir la ronda de arquitectura** (decisión del usuario).

**Prioridad 2 — Habilitar la propuesta de valor demostrable:**
3. **Hoja de Vida** — construir el expediente compuesto de solo lectura (la semilla `findByEquipment` ya existe en backend; falta la vista interna).
4. **QR datos/demo** — teléfono real + equipo demo realista + prueba física.

**Prioridad 3 — Operación / calidad (quick-wins y medianos):**
5. **OT-2** (quick-win: exponer `type`), **CC-1** (reflejar cobertura en la Cuenta de Cobro — depende de RFC-4), **CE-3** (datos fiscales), **COT-3**, **ACT-1**, **CE-5**.

**Prioridad 4 — Arquitectura de fondo (evolución):**
6. **RFC-4** (raíz de OT-1/CC-1), **COT-1/COT-2** (Servicio Ofertado), **OT-3**, **CE-4**, **CE-6**.

---

## 7. Riesgos para salir a producción

| Riesgo | Severidad | Mitigación |
|--------|:---------:|------------|
| Migrar datos históricos con OT-4 sin resolver → toda la trayectoria técnica mal fechada | 🔴 Alta | Resolver OT-4 antes de la migración piloto |
| Operar contratos reales multi-equipo con MNT-1 → preventivos invisibles en el QR/Hoja de Vida | 🔴 Alta | Resolver MNT-1 antes de operar contratos reales |
| Demostrar el QR con datos ficticios → subvende / erosiona confianza | 🔴 Alta (comercial) | Cargar equipo demo real + teléfono real (barato) |
| Facturar de más por CC-1 (líneas cubiertas no excluidas) | 🟡 Media | Revisión manual del cobro hasta implementar cobertura (RFC-4) |
| Validación visual (UI) no ejecutada de forma sistemática | 🟡 Media | Recorrido UI por módulo antes de producción |
| Sin backups de `uploads/` (storage local) | 🟡 Media | Migrar a R2 antes de staging (ya previsto) |
| Sin CI/CD ni tests automatizados de negocio | 🟡 Media | Blindar con tests los módulos con dinero/estado antes de escalar |

---

## 8. Checklist — Migración de datos reales (Emmanuel, INDE, …)

- [ ] **Resolver OT-4** (fecha real de intervención) — sin esto la migración desfecha la Hoja de Vida.
- [ ] **Resolver MNT-1** o definir cómo se cargan los preventivos históricos multi-equipo.
- [ ] Decidir CE-3 (dirección fiscal / representante legal del cliente) si se requiere para la Cuenta de Cobro.
- [ ] Cargar clientes reales (razón social, NIT, contacto).
- [ ] Cargar sedes reales.
- [ ] Cargar equipos reales con: tipo, marca/modelo/serial, fecha de instalación, **criticidad y garantía** (ya capturables — CE-1/CE-2), ubicación.
- [ ] Verificar unicidad de seriales durante la carga (CE-5 sin constraint — revisar manualmente).
- [ ] Cargar contratos, planes y asociaciones equipo↔contrato↔plan.
- [ ] Cargar el historial de intervenciones (OT + Acta + evidencias) con sus **fechas reales** (requiere OT-4).
- [ ] Validar que el portal QR de cada equipo muestre su `lastMaintenance` correcto tras la carga.
- [ ] (Deseable) Evaluar carga masiva (CE-6) si el volumen lo amerita.

---

## 9. Checklist — Reorganización del sitio web

- [ ] Alinear el mensaje del sitio con el posicionamiento congelado (`docs/strategy/positioning-brief-v1.3.html`): trazabilidad verificable anclada al activo; STECH NODES como empresa de servicio, no de software.
- [ ] No comunicar capacidades futuras como disponibles hoy (sin predicción de fallas, sin comparativas — regla del brief).
- [ ] Mostrar el ecosistema QR como diferenciador de servicio (con demo real, no ficticia).
- [ ] Datos de contacto reales y consistentes con el ERP (`company.ts` / `styles.ts`).
- [ ] Coherencia visual con la identidad congelada (isotipo, paleta, tipografía, tagline).
- [ ] Evitar la afirmación absoluta de mercado ("ninguna empresa…") — no verificable, excluida del brief.

---

## 10. Checklist — Inicio del envío de propuestas comerciales

- [ ] Equipo demo real cargado y QR escaneable mostrando trazabilidad creíble.
- [ ] Teléfono/contacto reales en PDFs (Cotización, Acta, Cuenta de Cobro) y en el portal.
- [ ] Flujo demostrable en vivo: crear cotización → aprobar → OT → acta → cuenta de cobro (todo funcional hoy).
- [ ] Narrativa de diferenciación lista (positioning brief) — sin prometer lo no disponible.
- [ ] Al menos un QR físico impreso y probado en teléfono real (Bloque 7).
- [ ] Plantillas PDF revisadas con datos reales (sin campos ficticios ni slots vacíos).
- [ ] (Idealmente) OT-4 y MNT-1 resueltos, para que la promesa de trazabilidad sea íntegra desde la primera propuesta.

---

## Cierre

Esta fase de validación funcional queda **cerrada**. El ERP tiene un núcleo operativo sólido y un mapa completo y priorizado de lo que falta. La **fase de estabilización y preparación para producción** inicia con la ronda de diseño de los dos bloqueantes de la propuesta de valor (OT-4, MNT-1), seguida por la construcción de la Hoja de Vida y la preparación de datos reales.

*Documento generado el 2026-07-16 al cierre del barrido de validación. Fuente de detalle vivo: `DEVELOPMENT_CONTEXT.md` (Tablero de validación + Resumen ejecutivo del backlog).*
