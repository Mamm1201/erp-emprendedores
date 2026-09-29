# Pruebas de integración — Línea de Suministro (SUPPLY)

Contrato: `docs/domain/supply-line-contract-v1.0.md`.

Ejecutan los servicios reales de NestJS (build de `nest build`) contra una **base desechable**. No usan Jest (la suite de Jest tiene fallos preexistentes, fuera de este alcance).

**Salvaguarda:** el script aborta si la base no se llama `erp_it_*`. Nunca debe apuntar a la base real.

## Cómo ejecutarlas

```bash
cd backend
npm run build

# 1. Base desechable (copia de una base de desarrollo) con todas las migraciones aplicadas
createdb erp_it_supply
pg_restore --no-owner -d erp_it_supply <respaldo.dump>
DATABASE_URL=postgresql://USER:PASS@HOST:PORT/erp_it_supply npx prisma migrate deploy

# 2. Pruebas (el resto de variables de entorno — JWT, etc. — como en .env)
DATABASE_URL=postgresql://USER:PASS@HOST:PORT/erp_it_supply node test/integration/supply/supply.integration.cjs

# 3. Borrar la base desechable
dropdb erp_it_supply
```

Requisitos de datos: al menos un usuario activo y un equipo `NURSE_CALL` existente (para los casos de regresión del correctivo y del periférico incorporado).

## Qué cubren

- C1: alta de cliente (formulario y CRM) crea la sede `Principal`.
- Naturaleza: `PREVENTIVE` rechazado al crear/convertir; `SUPPLY` aceptado y expuesto; OT sin tipo sigue `CORRECTIVE`.
- Conversión cotización → OT `SUPPLY`: `quotationId`, líneas (incluida instalación $0) y sede resuelta.
- Resolución automática de sede solo en `SUPPLY` (cotización → principal); `CORRECTIVE`/`INSPECTION` conservan la sede indicada o ninguna.
- OT `SUPPLY` sin sede resoluble → rechazada.
- Acta `SUPPLY`: equipos nuevos (cliente + sede, QR, fecha de entrega, garantía opcional), intervenciones `SUPPLY` sin checklist.
- Validaciones: equipo existente **o** nuevo; "Nuevo equipo" solo en `SUPPLY`.
- Periférico incorporado: intervención `SUPPLY` sobre el equipo existente, sin crear otro.
- Regresión: correctivo conserva el checklist.
- Cierre: `SUPPLY` sin intervención no se completa (regla sin cambios); cuenta de cobro con instalación $0.
- QR: `SUPPLY` no cuenta como último mantenimiento. Hoja de Vida (API): la entrega aparece en el historial.
- El equipo vendido entra después a contrato y plan sin duplicarse.
