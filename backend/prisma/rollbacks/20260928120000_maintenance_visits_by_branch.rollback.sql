-- ============================================================================
-- ROLLBACK de "Programacion preventiva por sede — v1.0"
-- Valido SOLO mientras el codigo nuevo no haya escrito datos del modelo v1.0
-- (visitas por sede, equipos conciliados, compliance). Despues de eso, el
-- punto de seguridad es el respaldo pg_dump tomado antes de migrar.
-- Restaura startDate y windowEnd originales desde migration_log.
-- ============================================================================

BEGIN;

DO $$
DECLARE n int;
BEGIN
  -- R-G1: no hay datos creados por el modelo nuevo fuera del relleno.
  SELECT count(*) INTO n FROM maintenance_visit_equipment mve
  WHERE NOT EXISTS (SELECT 1 FROM migration_log l
                     WHERE l.operation = 'maintenance-v1.0:visit-equipment-backfill'
                       AND l."targetId" = mve.id);
  IF n > 0 THEN RAISE EXCEPTION 'R-G1: % equipo(s) de visita creados despues de migrar; usar respaldo', n; END IF;

  SELECT count(*) INTO n FROM maintenance_visits WHERE compliance IS NOT NULL OR "cancelReason" IS NOT NULL;
  IF n > 0 THEN RAISE EXCEPTION 'R-G2: % visita(s) con datos v1.0; usar respaldo', n; END IF;
END $$;

-- 6/7. Equipos de visita
DROP TABLE "maintenance_visit_equipment";

-- 5. Intervention
DROP INDEX "interventions_id_equipmentId_key";
ALTER TABLE "interventions" ALTER COLUMN "occurredAt" DROP NOT NULL;

-- 4. MaintenanceVisit
ALTER TABLE "maintenance_visits" DROP CONSTRAINT "maintenance_visits_compliance_chk";
ALTER TABLE "maintenance_visits" DROP CONSTRAINT "maintenance_visits_period_chk";
DROP INDEX "maintenance_visits_planId_periodStart_key";
DROP INDEX "maintenance_visits_status_periodEnd_idx";
CREATE INDEX "maintenance_visits_planId_scheduledDate_idx" ON "maintenance_visits"("planId", "scheduledDate");
CREATE INDEX "maintenance_visits_status_scheduledDate_idx" ON "maintenance_visits"("status", "scheduledDate");

ALTER TABLE "maintenance_visits" ALTER COLUMN "periodEnd" DROP NOT NULL;
UPDATE "maintenance_visits" v
   SET "periodEnd" = (SELECT (l.detail->>'oldWindowEnd')::date FROM migration_log l
                       WHERE l.operation = 'maintenance-v1.0:visit-windowEnd-replaced'
                         AND l."sourceId" = v.id);
ALTER TABLE "maintenance_visits" RENAME COLUMN "periodEnd" TO "windowEnd";
ALTER TABLE "maintenance_visits" RENAME COLUMN "closedAt"  TO "completedAt";
ALTER TABLE "maintenance_visits" DROP COLUMN "periodStart";
ALTER TABLE "maintenance_visits" DROP COLUMN "compliance";
ALTER TABLE "maintenance_visits" DROP COLUMN "cancelReason";

-- 3. MaintenancePlanEquipment
ALTER TABLE "maintenance_plan_equipment" DROP COLUMN "removedAt";

-- 2. MaintenancePlan
ALTER TABLE "maintenance_plans" DROP CONSTRAINT "maintenance_plans_branchId_fkey";
ALTER TABLE "maintenance_plans" DROP CONSTRAINT "maintenance_plans_firstPeriodStart_day1_chk";
DROP INDEX "maintenance_plans_branchId_idx";
UPDATE "maintenance_plans" p
   SET "firstPeriodStart" = (l.detail->>'oldStartDate')::date
  FROM migration_log l
 WHERE l.operation = 'maintenance-v1.0:plan-backfill' AND l."sourceId" = p.id;
ALTER TABLE "maintenance_plans" DROP COLUMN "branchId";
ALTER TABLE "maintenance_plans" RENAME COLUMN "firstPeriodStart" TO "startDate";

-- 1. Enums
DROP TYPE "NotAttendedReason";
DROP TYPE "VisitEquipmentStatus";
DROP TYPE "VisitEquipmentOrigin";
DROP TYPE "VisitCompliance";
ALTER TYPE "MaintenanceVisitStatus" RENAME VALUE 'CLOSED'      TO 'COMPLETED';
ALTER TYPE "MaintenanceVisitStatus" RENAME VALUE 'IN_PROGRESS' TO 'GENERATED';

-- Bitacora de esta migracion
DELETE FROM migration_log WHERE operation LIKE 'maintenance-v1.0:%';

COMMIT;

-- Despues (fuera de SQL): marcar la migracion como revertida en Prisma:
--   npx prisma migrate resolve --rolled-back <nombre_de_la_migracion>
