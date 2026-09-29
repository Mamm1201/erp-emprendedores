-- Linea de negocio de Suministro (SUPPLY) — docs/domain/supply-line-contract-v1.0.md
-- Aditiva: agrega un valor al enum; no modifica datos existentes.
-- Intervention.type usa el mismo enum, por lo que tambien lo hereda.
ALTER TYPE "WorkOrderType" ADD VALUE 'SUPPLY';
