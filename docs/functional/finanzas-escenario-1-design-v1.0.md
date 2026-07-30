# Módulo Finanzas — Diseño funcional (Escenario 1)

**Versión:** 1.0 · **Fecha:** 2026-07-30 · **Estado:** DISEÑO congelado — **no implementado**

Este documento consolida el diseño funcional y de experiencia del módulo Finanzas
para el Escenario 1. Es un artefacto de diseño: **ninguna de estas vistas está
implementada todavía**. Las decisiones marcadas como congeladas no se reabren salvo
contradicción objetiva del dominio.

---

## 1. Alcance del Escenario 1

Finanzas del Escenario 1 es una **capa analítica derivada y de solo lectura** sobre los
hechos económicos ya existentes (`Invoice`, `Payment`, `Expense`). Responde:
*¿cuánto facturé, cuánto cobré, cuánto me deben y cuánto costó?*

**Fuera de alcance (explícito):** contabilidad de doble partida, PUC, asientos,
impuestos/IVA/retenciones, balance general, flujo de caja completo, egreso/pago de gastos.

## 2. Decisiones de dominio congeladas (base del diseño)

- Finanzas es **derivado y de solo lectura**; no crea ni duplica hechos económicos.
- **Fuentes de verdad únicas:** ingreso = `Invoice`; cobro = `Payment`; costo directo = `Expense`.
  `ResourceUtilization` es hecho técnico y **nunca** fuente de costo.
- **`COMPLETED` congela el costo operativo** de la OT (inmutable por todas las rutas del dominio).
- **`ISSUED` consolida el ingreso** (la factura es inmutable al emitirse).
- Las métricas financieras son **derivadas**, nunca una segunda fuente de verdad.

## 3. Principio arquitectónico

> Cada concepto económico tiene una **única responsabilidad funcional y una única lógica
> de negocio autorizada**. Cualquier superficie que lo necesite **reutiliza esa lógica**,
> aunque pueda **presentarla de formas distintas según el contexto**.

Corolario operativo de diseño: **una sola lectura por concepto**; antes de crear una vista
se verifica qué capacidad ya existe y se prioriza enriquecerla o consolidarla sobre duplicarla.

## 4. Identidad

ERP para empresas de servicios técnicos, **no** software contable. **La OT es la célula
económica**; las finanzas son consecuencia de la operación. Se entra por la operación
(trabajos y clientes), no por estados contables.

## 5. Recorrido funcional

**Pulso → Atención → OT → Cartera → Cliente**, como circuito de gestión (no pantallas sueltas).
Jerarquía: Resumen (Pulso + Atención) → Detalle (OT) → Agregación (Cartera, Cliente).

## 6. Las cinco vistas

### 6.1 Pulso — entrada / pulso del negocio
Objetivo (<10s): pulso del negocio y a dónde ir. Tres bandas:
1. **Signos vitales:** Cobrado, Facturado, Margen bruto. (Cobrado/Facturado/Margen son flujos del
   período; el "por cobrar" NO es un KPI propio: lo carga el embudo.)
2. **Embudo del ciclo económico de las OT:** en ejecución → cerradas sin facturar →
   facturadas sin cobrar → cobradas. Es la firma de identidad.
3. **Atención (preview):** top de asuntos priorizados.
Firmeza: por defecto "en firme"; "en curso" separado. Período afecta flujos, no la cartera.

### 6.2 Atención — bandeja de acción
Objetivo: convertir el pulso en decisiones. Lista priorizada (default reordenable:
prioridad / mayor impacto / más antiguo — es decisión de UX, no regla de negocio).
Cada fila responde: **qué pasó → quién → cuánto dinero → qué acción**, con verbo explícito.
Alertas: facturas vencidas, OT terminadas sin facturar, verificar completitud de costos,
margen negativo. Solo dispara sobre hechos en firme. Auto-vaciable al resolverse.

### 6.3 OT — lectura económica (enriquecimiento, no pantalla nueva)
Se reutiliza el resumen económico existente de la OT (costo por categoría, facturado, margen)
y se enriquece en su lugar con: **chip de estado del ciclo** y **cobrado** (subordinado al
facturado). El margen se rotula según el estado: provisional (en ejecución) /
pendiente de facturación (cerrada sin facturar) / real (facturada+). Enlaces contextuales a
Cartera y Cliente. El detalle técnico permanece en Operaciones (solo se enlaza).

### 6.4 Cartera — hub analítico de cobro (evolución de EstadoCuentasPage)
Objetivo (<10s): ¿quién me debe, cuánto y qué tan urgente? Jerarquía riesgo → clientes →
detalle → acciones:
1. **Riesgo:** total por cobrar + vencido (%) + tira de aging global.
2. **Cliente-first con aging embebido por fila** + indicador de **concentración**
   ("Top N concentran X%", métrica de presentación del mismo rollup por cliente).
3. Enlaces a `InvoicesPage` / `PaymentsPage` (Cartera enruta, no lista facturas).
Un solo total en tres cortes (antigüedad, cliente, factura) que reconcilian.

### 6.5 Cliente (Rentabilidad) — lectura económica del cliente
Pregunta rectora: **¿vale la pena esta relación comercial?** Jerarquía:
rentabilidad (margen, héroe) → sustento (facturado 12m + nº OT + recurrencia) →
salud de cobro (cualificador, con enlace a Cartera) → acciones (sus OT · ficha).
Consume la **faceta margen** del **rollup único por cliente**; NO re-muestra la cartera.
`Cartera-por-cliente` y `Cliente-rentabilidad` son **facetas de la misma agregación**.
Frontera con la ficha CRUD: identidad (razón social, NIT, sedes, contactos) vive en la ficha;
la ficha nunca calcula economía.

## 7. Arquitectura de información

### 7.1 Distribución de indicadores (protagonista único + teasers que enlazan)
- **Cobrado / Facturado / Margen global** → protagonista **Pulso**; teaser Dashboard.
- **Por cobrar / vencido / aging / concentración** → protagonista **Cartera**; teaser Pulso (embudo) y Dashboard.
- **Margen por OT** → OT. **Margen por cliente / rentabilidad** → Cliente.
- **Costo por categoría** → OT. **Ciclo económico** → embudo (Pulso, agregado) + chip (OT, individual).
- **Alertas** → Atención; teaser en Pulso y en contexto (chip OT, marca de factura).
- **Historial de ingresos 12 meses** → PaymentsPage (recaudo); teaser opcional Dashboard.
Regla: un indicador tiene **un solo protagonista**; los teasers enlazan y **nunca recalculan**.

### 7.2 Navegación
- **Entrada:** al ERP → Dashboard; al módulo Finanzas → **Pulso**.
- **Hubs:** Pulso, Cartera, Cliente, Atención (enrutamiento).
- **Hojas / operativas:** OT (célula), Cuentas de cobro (`InvoicesPage`), Pagos (`PaymentsPage`).
- **Menú Finanzas:** Pulso · Cartera · Cuentas de cobro · Pagos. OT y Cliente se alcanzan por contexto.

### 7.3 Mapa conceptual (relaciones principales)
```
Dashboard --teaser--> Pulso
Pulso --> Atencion ; Pulso --> Cartera
Atencion --> OT
Cartera --> Cliente
OT --> Cliente ("sube") ; OT --> Cuentas de cobro / Pagos (documentos)
```
(Relaciones secundarias: OT→Cartera "facturado sin cobrar"; Cartera→superficies; Cliente→OT/Cartera/ficha.)

## 8. Estado y pendientes (para la fase de implementación)

**Deuda funcional viva (registrada como tarea):** la tarjeta de rentabilidad de la OT
(`CostSummaryCard`) calcula el ingreso con `WorkOrder.total` (estimado) en vez de `Invoice`,
incluso cuando la OT está facturada. Debe leer el ingreso de la factura cuando existe. Es la
única contradicción funcional viva (mismo concepto "margen" con dos lógicas).

**⚠ Puntos de validación (no contradicciones):**
1. **Pulso vs Dashboard:** mantener o fusionar depende de si existe un rol/flujo financiero
   diferenciado; el principio se sostiene solo si Dashboard queda como teaser-only.
2. **BillingPreparation:** correctamente ausente del recorrido analítico, pero es un **paso de
   decisión operativo** entre OT e Invoice, hoy no representado como nodo.
3. La flecha **OT → factura** elide el paso `BillingPreparation`.
4. El **mapa conceptual mezcla navegación y dependencia**; no representa la capa de datos
   (vistas ← `Invoice`/`Payment`/`Expense`) ni `BillingPreparation`.
