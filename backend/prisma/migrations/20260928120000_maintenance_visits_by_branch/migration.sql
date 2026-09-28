-- ============================================================================
-- Programacion preventiva por sede — Contrato funcional v1.0
-- Migracion ESCRITA A MANO (no usar el SQL que genera `prisma migrate diff`:
-- ese SQL borra startDate/completedAt/windowEnd con sus datos y falla al
-- convertir los valores de enum GENERATED/COMPLETED).
--
-- Todo corre en UNA transaccion: si cualquier guarda o sentencia falla, no
-- queda ningun cambio aplicado.
-- ============================================================================

BEGIN;

-- ─── 0. Guardas: supuestos sobre los datos existentes ───────────────────────
-- Si alguno no se cumple, la migracion aborta sin tocar nada.
DO $$
DECLARE n int;
BEGIN
  -- G1: cada plan tiene equipos de exactamente UNA sede (branchId derivable).
  SELECT count(*) INTO n FROM maintenance_plans p
  WHERE (SELECT count(DISTINCT e."branchId")
           FROM maintenance_plan_equipment pe
           JOIN equipment e ON e.id = pe."equipmentId"
          WHERE pe."planId" = p.id) <> 1;
  IF n > 0 THEN RAISE EXCEPTION 'G1: % plan(es) sin una unica sede derivable', n; END IF;

  -- G2: la sede derivada pertenece al cliente del contrato del plan.
  SELECT count(*) INTO n FROM maintenance_plans p
  JOIN maintenance_contracts c ON c.id = p."contractId"
  WHERE EXISTS (SELECT 1 FROM maintenance_plan_equipment pe
                  JOIN equipment e ON e.id = pe."equipmentId"
                  JOIN branches b ON b.id = e."branchId"
                 WHERE pe."planId" = p.id AND b."clientId" <> c."clientId");
  IF n > 0 THEN RAISE EXCEPTION 'G2: % plan(es) con sede de otro cliente', n; END IF;

  -- G3: no hay dos visitas del mismo plan en el mismo mes (R2).
  SELECT count(*) INTO n FROM (
    SELECT 1 FROM maintenance_visits
    GROUP BY "planId", date_trunc('month', "scheduledDate") HAVING count(*) > 1) d;
  IF n > 0 THEN RAISE EXCEPTION 'G3: % par(es) plan/mes duplicados', n; END IF;

  -- G4: ninguna intervencion sin fecha real (H6).
  SELECT count(*) INTO n FROM interventions WHERE "occurredAt" IS NULL;
  IF n > 0 THEN RAISE EXCEPTION 'G4: % intervencion(es) sin occurredAt', n; END IF;

  -- G5: no hay visitas en curso (GENERATED); el relleno no las contempla.
  SELECT count(*) INTO n FROM maintenance_visits WHERE status = 'GENERATED';
  IF n > 0 THEN RAISE EXCEPTION 'G5: % visita(s) GENERATED; cerrar o cancelar antes', n; END IF;

  -- G6: toda visita CLOSED con OT tiene exactamente una intervencion
  --     COMPLETED por cada equipo de su plan (para ligarla como ATTENDED).
  SELECT count(*) INTO n
  FROM maintenance_visits v
  JOIN maintenance_plan_equipment pe ON pe."planId" = v."planId"
  WHERE v.status = 'COMPLETED' AND v."workOrderId" IS NOT NULL
    AND (SELECT count(*) FROM interventions i
          WHERE i."workOrderId" = v."workOrderId"
            AND i."equipmentId" = pe."equipmentId"
            AND i.status = 'COMPLETED') <> 1;
  IF n > 0 THEN RAISE EXCEPTION 'G6: % equipo(s) de visitas cerradas sin intervencion unica', n; END IF;
END $$;

-- ─── 1. Enums ───────────────────────────────────────────────────────────────
-- Renombre seguro (PostgreSQL >= 10): cambia la etiqueta, conserva las filas.
ALTER TYPE "MaintenanceVisitStatus" RENAME VALUE 'GENERATED' TO 'IN_PROGRESS';
ALTER TYPE "MaintenanceVisitStatus" RENAME VALUE 'COMPLETED' TO 'CLOSED';

CREATE TYPE "VisitCompliance"      AS ENUM ('FULFILLED', 'NOT_FULFILLED');
CREATE TYPE "VisitEquipmentOrigin" AS ENUM ('SCHEDULED', 'ADDED');
CREATE TYPE "VisitEquipmentStatus" AS ENUM ('PENDING', 'ATTENDED', 'NOT_ATTENDED');
CREATE TYPE "NotAttendedReason"    AS ENUM ('IN_USE', 'OUT_OF_SERVICE', 'DECOMMISSIONED', 'NO_ACCESS', 'CLIENT_REQUEST', 'ATTENDED_NEXT_PERIOD', 'OTHER');

-- ─── 2. MaintenancePlan: sede + ancla del ciclo ─────────────────────────────
ALTER TABLE "maintenance_plans" RENAME COLUMN "startDate" TO "firstPeriodStart";
ALTER TABLE "maintenance_plans" ADD COLUMN "branchId" TEXT;

-- Ancla = mes de la primera visita del plan; si no tiene visitas, mes del
-- valor anterior. Se registra el valor anterior en migration_log.
CREATE TEMP TABLE _plan_backfill ON COMMIT DROP AS
SELECT p.id,
       p."firstPeriodStart" AS old_start,
       COALESCE(
         (SELECT date_trunc('month', min(v."scheduledDate"))::date
            FROM maintenance_visits v WHERE v."planId" = p.id),
         date_trunc('month', p."firstPeriodStart")::date) AS new_anchor,
       (SELECT min(e."branchId")
          FROM maintenance_plan_equipment pe
          JOIN equipment e ON e.id = pe."equipmentId"
         WHERE pe."planId" = p.id) AS branch_id
FROM maintenance_plans p;

-- G7: cada visita existente cae en un periodo del ciclo (ancla + k*paso).
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n
  FROM maintenance_visits v
  JOIN maintenance_plans p ON p.id = v."planId"
  JOIN _plan_backfill b ON b.id = p.id
  WHERE ((EXTRACT(YEAR FROM age(date_trunc('month', v."scheduledDate"), b.new_anchor)) * 12
        + EXTRACT(MONTH FROM age(date_trunc('month', v."scheduledDate"), b.new_anchor)))::int
        % CASE p.frequency WHEN 'MONTHLY' THEN 1 WHEN 'QUARTERLY' THEN 3
                           WHEN 'EVERY_4_MONTHS' THEN 4 WHEN 'BIANNUAL' THEN 6
                           WHEN 'ANNUAL' THEN 12 END) <> 0;
  IF n > 0 THEN RAISE EXCEPTION 'G7: % visita(s) fuera del ciclo de su plan', n; END IF;
END $$;

INSERT INTO "migration_log" ("id", "operation", "sourceTable", "sourceId", "targetTable", "targetId", "detail")
SELECT gen_random_uuid()::text, 'maintenance-v1.0:plan-backfill',
       'maintenance_plans', b.id, 'maintenance_plans', b.id,
       jsonb_build_object('oldStartDate', b.old_start,
                          'firstPeriodStart', b.new_anchor,
                          'branchId', b.branch_id,
                          'branchSource', 'equipment')
FROM _plan_backfill b;

UPDATE "maintenance_plans" p
   SET "firstPeriodStart" = b.new_anchor,
       "branchId"         = b.branch_id
  FROM _plan_backfill b
 WHERE b.id = p.id;

ALTER TABLE "maintenance_plans" ALTER COLUMN "branchId" SET NOT NULL;
ALTER TABLE "maintenance_plans"
  ADD CONSTRAINT "maintenance_plans_firstPeriodStart_day1_chk"
  CHECK (EXTRACT(DAY FROM "firstPeriodStart") = 1);
CREATE INDEX "maintenance_plans_branchId_idx" ON "maintenance_plans"("branchId");
ALTER TABLE "maintenance_plans" ADD CONSTRAINT "maintenance_plans_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── 3. MaintenancePlanEquipment: baja logica ───────────────────────────────
ALTER TABLE "maintenance_plan_equipment" ADD COLUMN "removedAt" TIMESTAMP(3);

-- ─── 4. MaintenanceVisit: periodo, cierre, cumplimiento ─────────────────────
ALTER TABLE "maintenance_visits" RENAME COLUMN "windowEnd"   TO "periodEnd";
ALTER TABLE "maintenance_visits" RENAME COLUMN "completedAt" TO "closedAt";
ALTER TABLE "maintenance_visits" ADD COLUMN "periodStart"  DATE;
ALTER TABLE "maintenance_visits" ADD COLUMN "compliance"   "VisitCompliance";
ALTER TABLE "maintenance_visits" ADD COLUMN "cancelReason" TEXT;

-- Registrar TODO windowEnd previo no nulo (el periodo lo reemplaza); el
-- rollback lo restaura desde aqui.
INSERT INTO "migration_log" ("id", "operation", "sourceTable", "sourceId", "targetTable", "targetId", "detail")
SELECT gen_random_uuid()::text, 'maintenance-v1.0:visit-windowEnd-replaced',
       'maintenance_visits', v.id, 'maintenance_visits', v.id,
       jsonb_build_object('oldWindowEnd', v."periodEnd",
                          'periodEnd', (date_trunc('month', v."scheduledDate") + interval '1 month - 1 day')::date)
FROM "maintenance_visits" v
WHERE v."periodEnd" IS NOT NULL;

-- Periodo = mes calendario de la fecha tentativa existente.
UPDATE "maintenance_visits"
   SET "periodStart" = date_trunc('month', "scheduledDate")::date,
       "periodEnd"   = (date_trunc('month', "scheduledDate") + interval '1 month - 1 day')::date;

ALTER TABLE "maintenance_visits" ALTER COLUMN "periodStart" SET NOT NULL;
ALTER TABLE "maintenance_visits" ALTER COLUMN "periodEnd"   SET NOT NULL;

ALTER TABLE "maintenance_visits"
  ADD CONSTRAINT "maintenance_visits_period_chk"
  CHECK (EXTRACT(DAY FROM "periodStart") = 1 AND "periodStart" <= "periodEnd");
ALTER TABLE "maintenance_visits"
  ADD CONSTRAINT "maintenance_visits_compliance_chk"
  CHECK ("compliance" IS NULL OR "status" = 'CLOSED');

DROP INDEX "maintenance_visits_planId_scheduledDate_idx";
DROP INDEX "maintenance_visits_status_scheduledDate_idx";
CREATE UNIQUE INDEX "maintenance_visits_planId_periodStart_key" ON "maintenance_visits"("planId", "periodStart");
CREATE INDEX "maintenance_visits_status_periodEnd_idx" ON "maintenance_visits"("status", "periodEnd");

-- ─── 5. Intervention: fecha real obligatoria + clave para FK compuesta ──────
ALTER TABLE "interventions" ALTER COLUMN "occurredAt" SET NOT NULL;
CREATE UNIQUE INDEX "interventions_id_equipmentId_key" ON "interventions"("id", "equipmentId");

-- ─── 6. MaintenanceVisitEquipment ───────────────────────────────────────────
CREATE TABLE "maintenance_visit_equipment" (
    "id"                 TEXT NOT NULL,
    "visitId"            TEXT NOT NULL,
    "equipmentId"        TEXT NOT NULL,
    "origin"             "VisitEquipmentOrigin" NOT NULL DEFAULT 'SCHEDULED',
    "status"             "VisitEquipmentStatus" NOT NULL DEFAULT 'PENDING',
    "interventionId"     TEXT,
    "notAttendedReason"  "NotAttendedReason",
    "notAttendedNote"    TEXT,
    "earlyExecutionNote" TEXT,
    "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"          TIMESTAMP(3) NOT NULL,
    CONSTRAINT "maintenance_visit_equipment_pkey" PRIMARY KEY ("id"),
    -- Coherencia estado <-> intervencion / motivo (R5, 4.2).
    CONSTRAINT "maintenance_visit_equipment_status_chk" CHECK (
         ("status" = 'PENDING'      AND "interventionId" IS NULL     AND "notAttendedReason" IS NULL     AND "notAttendedNote" IS NULL)
      OR ("status" = 'ATTENDED'     AND "interventionId" IS NOT NULL AND "notAttendedReason" IS NULL     AND "notAttendedNote" IS NULL)
      OR ("status" = 'NOT_ATTENDED' AND "interventionId" IS NULL     AND "notAttendedReason" IS NOT NULL AND length(btrim("notAttendedNote")) > 0)
    ),
    -- La nota de anticipacion solo tiene sentido en un equipo atendido (R7).
    CONSTRAINT "maintenance_visit_equipment_early_chk" CHECK (
      "earlyExecutionNote" IS NULL OR "status" = 'ATTENDED'
    )
);

CREATE UNIQUE INDEX "maintenance_visit_equipment_interventionId_key" ON "maintenance_visit_equipment"("interventionId");
CREATE UNIQUE INDEX "maintenance_visit_equipment_visitId_equipmentId_key" ON "maintenance_visit_equipment"("visitId", "equipmentId");
CREATE UNIQUE INDEX "maintenance_visit_equipment_interventionId_equipmentId_key" ON "maintenance_visit_equipment"("interventionId", "equipmentId");
CREATE INDEX "maintenance_visit_equipment_equipmentId_idx" ON "maintenance_visit_equipment"("equipmentId");
CREATE INDEX "maintenance_visit_equipment_visitId_status_idx" ON "maintenance_visit_equipment"("visitId", "status");

ALTER TABLE "maintenance_visit_equipment" ADD CONSTRAINT "maintenance_visit_equipment_visitId_fkey"
  FOREIGN KEY ("visitId") REFERENCES "maintenance_visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "maintenance_visit_equipment" ADD CONSTRAINT "maintenance_visit_equipment_equipmentId_fkey"
  FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- H3: la intervencion ligada debe ser del mismo equipo.
ALTER TABLE "maintenance_visit_equipment" ADD CONSTRAINT "maintenance_visit_equipment_interventionId_equipmentId_fkey"
  FOREIGN KEY ("interventionId", "equipmentId") REFERENCES "interventions"("id", "equipmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── 7. Relleno de equipos programados ──────────────────────────────────────
-- 7a. Visitas PENDING: foto de los equipos activos del plan (R3).
-- 7b. Visitas CLOSED con OT: equipo ATTENDED ligado a su intervencion real
--     (G6 garantiza que existe exactamente una). compliance queda NULL (legado).
-- 7c. Visitas CLOSED sin OT (julio): SIN equipos — legado, no se inventa
--     atencion por equipo sin intervencion que la respalde.
CREATE TEMP TABLE _visit_equipment_backfill ON COMMIT DROP AS
SELECT gen_random_uuid()::text AS id,
       v.id AS visit_id,
       pe."equipmentId" AS equipment_id,
       CASE WHEN v.status = 'CLOSED' THEN 'ATTENDED' ELSE 'PENDING' END::"VisitEquipmentStatus" AS status,
       CASE WHEN v.status = 'CLOSED' THEN
         (SELECT i.id FROM interventions i
           WHERE i."workOrderId" = v."workOrderId"
             AND i."equipmentId" = pe."equipmentId"
             AND i.status = 'COMPLETED')
       END AS intervention_id
FROM maintenance_visits v
JOIN maintenance_plan_equipment pe ON pe."planId" = v."planId" AND pe."removedAt" IS NULL
WHERE v.status = 'PENDING'
   OR (v.status = 'CLOSED' AND v."workOrderId" IS NOT NULL);

INSERT INTO "maintenance_visit_equipment"
  ("id", "visitId", "equipmentId", "origin", "status", "interventionId", "updatedAt")
SELECT id, visit_id, equipment_id, 'SCHEDULED', status, intervention_id, CURRENT_TIMESTAMP
FROM _visit_equipment_backfill;

INSERT INTO "migration_log" ("id", "operation", "sourceTable", "sourceId", "targetTable", "targetId", "detail")
SELECT gen_random_uuid()::text, 'maintenance-v1.0:visit-equipment-backfill',
       'maintenance_visits', b.visit_id, 'maintenance_visit_equipment', b.id,
       jsonb_build_object('equipmentId', b.equipment_id, 'status', b.status, 'interventionId', b.intervention_id)
FROM _visit_equipment_backfill b;

COMMIT;
