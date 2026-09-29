# Línea de Suministro de equipos y periféricos — Contrato funcional v1.0

> **Tipo:** Normativo (contrato funcional de una línea de negocio del dominio).
> **Estado:** Aprobado por el usuario el 2026-09-28.
> **Implementación:** rama `feat/supply-line`.
> **Caso de referencia:** Jorge Espejo (OT-2026-00030, dos radios UHF). No es una solución exclusiva para ese caso.
> **Precedencia:** subordinado a `domain-model-v1.0.md` (§3.1 jerarquía del activo; D-6, D-08, D-09, D-11). Cambios requieren decisión formal con fecha y motivo.

---

## 1. Qué es el Suministro

STECH NODES no solo presta mantenimiento: también **vende o suministra** equipos, módulos, periféricos o componentes, a clientes ocasionales o a clientes con sedes.

| | Suministro (`SUPPLY`) | Mantenimiento |
|---|---|---|
| Significado | Entrega de un activo o de un elemento que se incorpora a un activo, **con o sin instalación**. | Intervención técnica sobre un activo existente. |
| Naturaleza de la OT | `SUPPLY` | `PREVENTIVE` (solo OTs de visitas) · `CORRECTIVE` · `INSPECTION` |
| Evidencia | Intervención `SUPPLY` sobre el Equipo que recibe lo suministrado. | Intervención del tipo de la OT. |
| QR / último mantenimiento | **No cuenta** como mantenimiento. | Cuenta (`PREVENTIVE` / `CORRECTIVE`). |

Un suministro **nunca** se registra como `CORRECTIVE`. `SUPPLY` es un único tipo: **no existe `INSTALLATION`**; la instalación forma parte del suministro.

## 2. Qué puede representar `SUPPLY`

1. Suministro de un **Equipment nuevo** (p. ej. un radio, un módulo de alarma completo para un cliente nuevo).
2. Suministro de un **periférico o módulo incorporado a un Equipment existente** (p. ej. una lámpara de pasillo que se integra al sistema `SN-0013`): la intervención `SUPPLY` queda **sobre ese Equipment existente**, sin crear otro.
3. Suministro **+ instalación**.
4. Suministro **sin instalación**.

En todos los casos **la intervención debe documentar qué se suministró o instaló y sobre qué Equipment aplica**.

## 3. Criterio operativo: ¿Equipment nuevo o parte de uno existente?

- Se registra un **Equipment nuevo** cuando lo entregado constituye una **unidad técnica mantenible** por sí misma (§3.1 del modelo de dominio: "Equipo … puede ser un módulo, un área, un piso").
- Un **periférico, componente o módulo que se integra** a un Equipment existente **no** se convierte en un Equipment nuevo: se registra como intervención `SUPPLY` sobre el Equipment que lo recibe.
- Es un **criterio operativo**: la decisión pertenece al operador según el caso técnico (mismo principio que D-6). El sistema no la impone con una regla rígida.
- Fuera de alcance: modelo de componentes (padre/hijo) y conteo de puntos de un sistema.

## 4. Sede `Principal`

- `Principal` es la **sede o ubicación de referencia** de un cliente que todavía no tiene una ubicación operativa específica (p. ej. un cliente ocasional). Garantiza que sus equipos y OTs tengan una ubicación válida.
- **Todo cliente nuevo** nace con su sede `Principal` (marcada como principal), por cualquier ruta de alta: formulario de clientes y promoción de una cuenta del CRM (en este caso, con la ciudad de la cuenta).
- **No** se crea para clientes existentes sin sede. No obliga a que un cliente tenga varias sedes. No existe un modelo adicional para distinguir "sede de referencia" de "sede operativa".

## 5. Fechas y garantía del equipo entregado

- **`Equipment.installDate`** = **fecha de entrega o puesta en servicio**, haya o no instalación. No existe un campo `deliveryDate` y el campo no se renombra.
- **`Equipment.warrantyExpiresAt`**: la ingresa el operador cuando conoce el dato real; puede quedar vacía. **No hay garantía predeterminada** y la cotización no tiene datos estructurados de garantía.
- La garantía **no** constituye una relación vigente de mantenimiento ni altera el QR.

## 6. Flujo

```
Cliente (con sede Principal si es ocasional)
 → Cotización (líneas de suministro e instalación) → Aprobada
 → Generar OT: naturaleza SUPPLY + título + sede (la de la cotización o la principal del cliente)
 → Acta: por cada unidad entregada
      · "Equipo existente" (p. ej. periférico incorporado), o
      · "Nuevo equipo" (tipo, marca, modelo, serial, fecha de entrega, garantía, observaciones)
      + intervención SUPPLY (fecha real, técnico, evidencias), sin checklist de mantenimiento
 → OT COMPLETED (sigue exigiendo ≥ 1 intervención) → Cuenta de Cobro
```

Después, el mismo Equipment puede asociarse a un contrato (`ContractEquipment`) y a un plan de mantenimiento (MNT-1) **sin duplicarse**.

## 7. Reglas

| # | Regla |
|---|---|
| S1 | La naturaleza de la OT se elige **al crearla** (manualmente o al convertir una cotización): `CORRECTIVE`, `INSPECTION` o `SUPPLY`. `PREVENTIVE` queda reservado a las OTs generadas por visitas de mantenimiento. |
| S2 | `WorkOrder.type` **no es editable** después de creada la OT. |
| S3 | Sede de una OT `SUPPLY` nueva: la indicada → la de la cotización → la sede principal del cliente (`isPrimary`, o la primera activa); sin sede resoluble se rechaza. `CORRECTIVE`/`INSPECTION` no cambian: solo la sede indicada, o ninguna. |
| S4 | La conversión Cotización → OT conserva `quotationId` y hereda las líneas de la cotización. |
| S5 | "Nuevo equipo" desde el acta solo está disponible en OTs `SUPPLY`. El equipo se crea en el cliente + sede de la OT, en la misma transacción que su intervención, con su código QR. |
| S6 | Cada intervención indica **exactamente uno**: un equipo existente o un equipo nuevo. |
| S7 | Las intervenciones `SUPPLY` no precargan el checklist estándar de mantenimiento. |
| S8 | La regla de cierre no cambia: una OT `SUPPLY` necesita ≥ 1 intervención para completarse. |
| S9 | Las intervenciones heredan la naturaleza de su OT (`SUPPLY` → intervención `SUPPLY`). |

## 8. Facturación e instalación

Se usan las estructuras existentes, sin cambios:
- **Líneas** (`WorkOrderItem`, heredadas de la cotización): p. ej. "Equipo $500.000" + "Instalación $150.000" o "Instalación $0". La línea de $0 deja constancia de que la instalación ocurrió aunque no se cobre.
- **Recursos** (`ResourceUtilization` `MATERIAL` / `LABOR`) con resolución `CHARGE` o `ABSORB` (`BillingLineResolution`).

La instalación como **actividad** se documenta en la intervención `SUPPLY`; su **valor** va por línea o por recurso.

## 9. QR y Hoja de Vida

- El suministro aparece en el historial del Equipment (intervención `SUPPLY`, API `GET /equipment/:id/service-records`).
- El QR solo considera `PREVENTIVE` / `CORRECTIVE` como mantenimiento, por lo que `SUPPLY` no altera el "último mantenimiento" ni la relación vigente. No hay relación especial de garantía.
- El PDF del acta muestra la naturaleza como "Tipo de servicio: Suministro".

## 10. Fuera de alcance (v1.0)

Componentes padre/hijo · conteo de puntos · relación `ResourceUtilization → Intervention` · `INSTALLATION` como tipo · cierre de `SUPPLY` sin intervención · garantía como relación del QR o cambios de semántica del QR · campo nuevo de fecha de entrega · garantía estructurada en la cotización · vista de Hoja de Vida en el frontend · `Principal` para clientes existentes · arreglo de la suite de Jest · unificación de las rutas de facturación · defectos D3–D6 de MNT-1.

## 11. Corrección de datos del caso de referencia

Script separado `backend/prisma/data-migrations/20260928_jorge_espejo_supply.sql` (**no ejecutado**): vincula COT-2026-00007 con OT-2026-00030 (liberándola de OT-2026-00029, que sigue `CANCELLED`), asigna la sede `Principal` a OT-2026-00030 y pasa la OT y sus dos intervenciones a `SUPPLY`. Los dos radios ya existen como Equipment: no se crean ni se modifican; `installDate`, `warrantyExpiresAt` y `occurredAt` quedan pendientes de datos reales confirmados.
