-- ============================================================================
-- Consolidacion de Clinica Emmanuel: 17 planes por equipo -> 3 planes por sede
-- Contrato funcional v1.0, seccion 9.
--
-- NO es una migracion de Prisma (no vive en prisma/migrations). Se ejecuta a
-- mano, una sola vez, DESPUES de aplicar la migracion
-- 20260928120000_maintenance_visits_by_branch y ANTES de reabrir la app:
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f prisma/data-migrations/20260928_emmanuel_consolidation.sql
--
-- Que hace, por contrato (Mirador, Manzanos, Calle 126):
--   1. Crea 1 plan por sede: trimestral, ancla 01-ene-2026, con los equipos
--      de los planes viejos del contrato.
--   2. Crea 1 visita de octubre por sede con esos equipos programados. La
--      fecha tentativa es la menor de las visitas viejas de octubre.
--      Caso 5b: si octubre ya se ejecuto con UNA OT por sede (visita vieja
--      CLOSED con OT), esa OT pasa a la visita nueva con sus intervenciones.
--   3. Borra las visitas viejas de octubre, dejando copia completa de cada
--      fila (y de sus equipos) en migration_log.
--   4. Desactiva los planes viejos y da de baja logica sus equipos. Las
--      visitas de julio NO se tocan: quedan en los planes viejos como historia.
--
-- Todo en una transaccion. Cualquier guarda que falle aborta sin cambios.
-- Idempotente: una segunda ejecucion aborta en la guarda de "ya consolidado".
-- ============================================================================

BEGIN;

DO $$
DECLARE
  contract_numbers CONSTANT text[] := ARRAY['CMTO-2026-00002', 'CMTO-2026-00003', 'CMTO-2026-00004'];
  anchor           CONSTANT date   := DATE '2026-01-01';
  oct_start        CONSTANT date   := DATE '2026-10-01';
  oct_end          CONSTANT date   := DATE '2026-10-31';
  op               CONSTANT text   := 'maintenance-v1.0:emmanuel-consolidation';

  c              record;
  v_branch       text;
  n              int;
  new_plan_id    text;
  new_visit_id   text;
  old_closed     record;
  v_sched        date;
  v_status       "MaintenanceVisitStatus";
  v_compliance   "VisitCompliance";
  consolidated   int := 0;
BEGIN
  FOR c IN
    SELECT mc.id, mc.number
      FROM maintenance_contracts mc
     WHERE mc.number = ANY (contract_numbers) AND mc."deletedAt" IS NULL
     ORDER BY mc.number
  LOOP
    -- ── Guardas por contrato ──────────────────────────────────────────────
    -- C-G1: el contrato existe y sus planes activos son todos trimestrales,
    --       de 1 equipo y de una sola sede.
    SELECT count(DISTINCT p."branchId") INTO n
      FROM maintenance_plans p WHERE p."contractId" = c.id AND p."isActive";
    IF n <> 1 THEN RAISE EXCEPTION 'C-G1 %: % sedes entre planes activos (se esperaba 1)', c.number, n; END IF;
    SELECT min(p."branchId") INTO v_branch
      FROM maintenance_plans p WHERE p."contractId" = c.id AND p."isActive";

    SELECT count(*) INTO n FROM maintenance_plans p
     WHERE p."contractId" = c.id AND p."isActive"
       AND (p.frequency <> 'QUARTERLY'
            OR (SELECT count(*) FROM maintenance_plan_equipment pe
                 WHERE pe."planId" = p.id AND pe."removedAt" IS NULL) <> 1);
    IF n > 0 THEN
      RAISE EXCEPTION 'C-G1 %: % plan(es) activos no son trimestrales de 1 equipo (ya consolidado?)', c.number, n;
    END IF;

    -- C-G2: los planes viejos solo tienen visitas de julio (CLOSED) y octubre.
    SELECT count(*) INTO n FROM maintenance_visits v
      JOIN maintenance_plans p ON p.id = v."planId"
     WHERE p."contractId" = c.id AND p."isActive"
       AND NOT (v."periodStart" = DATE '2026-07-01' AND v.status = 'CLOSED')
       AND v."periodStart" <> oct_start;
    IF n > 0 THEN RAISE EXCEPTION 'C-G2 %: % visita(s) inesperadas en los planes viejos', c.number, n; END IF;

    -- C-G3: ninguna visita de octubre en curso (OT abierta).
    SELECT count(*) INTO n FROM maintenance_visits v
      JOIN maintenance_plans p ON p.id = v."planId"
     WHERE p."contractId" = c.id AND p."isActive"
       AND v."periodStart" = oct_start AND v.status NOT IN ('PENDING', 'CLOSED');
    IF n > 0 THEN RAISE EXCEPTION 'C-G3 %: % visita(s) de octubre en curso o canceladas; cerrar la OT primero', c.number, n; END IF;

    -- C-G4: como maximo UNA visita de octubre cerrada, y si existe tiene OT
    --       (caso 5b: una OT por sede).
    SELECT count(*) INTO n FROM maintenance_visits v
      JOIN maintenance_plans p ON p.id = v."planId"
     WHERE p."contractId" = c.id AND p."isActive"
       AND v."periodStart" = oct_start AND v.status = 'CLOSED';
    IF n > 1 THEN
      RAISE EXCEPTION 'C-G4 %: % visitas de octubre cerradas (una OT por equipo); no se puede unificar en 1 visita = 1 OT', c.number, n;
    END IF;

    SELECT v.id, v."workOrderId", v."closedAt" INTO old_closed
      FROM maintenance_visits v
      JOIN maintenance_plans p ON p.id = v."planId"
     WHERE p."contractId" = c.id AND p."isActive"
       AND v."periodStart" = oct_start AND v.status = 'CLOSED';

    IF old_closed.id IS NOT NULL THEN
      IF old_closed."workOrderId" IS NULL THEN
        RAISE EXCEPTION 'C-G4 %: visita de octubre cerrada sin OT', c.number;
      END IF;
      -- C-G5: la OT tiene exactamente una intervencion COMPLETED por cada
      --       equipo del contrato (no se inventan motivos de no atencion) y
      --       ninguna anticipada (requeriria justificacion por equipo).
      SELECT count(*) INTO n
        FROM maintenance_plans p
        JOIN maintenance_plan_equipment pe ON pe."planId" = p.id AND pe."removedAt" IS NULL
       WHERE p."contractId" = c.id AND p."isActive"
         AND (SELECT count(*) FROM interventions i
               WHERE i."workOrderId" = old_closed."workOrderId"
                 AND i."equipmentId" = pe."equipmentId"
                 AND i.status = 'COMPLETED') <> 1;
      IF n > 0 THEN RAISE EXCEPTION 'C-G5 %: % equipo(s) sin intervencion unica en la OT de octubre', c.number, n; END IF;

      SELECT count(*) INTO n FROM interventions i
       WHERE i."workOrderId" = old_closed."workOrderId" AND i.status = 'COMPLETED'
         AND (i."occurredAt" - interval '5 hours')::date < oct_start;  -- fecha local Bogota (UTC-5)
      IF n > 0 THEN RAISE EXCEPTION 'C-G5 %: % intervencion(es) anticipadas; requieren nota por equipo, resolver a mano', c.number, n; END IF;
    END IF;

    -- ── 1. Plan por sede ─────────────────────────────────────────────────
    new_plan_id := gen_random_uuid()::text;
    INSERT INTO maintenance_plans (id, "contractId", "branchId", frequency, "firstPeriodStart", "isActive", notes, "updatedAt")
    VALUES (new_plan_id, c.id, v_branch, 'QUARTERLY', anchor, true,
            'Plan por sede (consolidacion v1.0 de planes por equipo)', CURRENT_TIMESTAMP);

    INSERT INTO maintenance_plan_equipment (id, "planId", "equipmentId")
    SELECT gen_random_uuid()::text, new_plan_id, pe."equipmentId"
      FROM maintenance_plans p
      JOIN maintenance_plan_equipment pe ON pe."planId" = p.id AND pe."removedAt" IS NULL
     WHERE p."contractId" = c.id AND p."isActive" AND p.id <> new_plan_id;

    INSERT INTO migration_log (id, operation, "sourceTable", "sourceId", "targetTable", "targetId", detail)
    SELECT gen_random_uuid()::text, op || ':plan', 'maintenance_plans', p.id, 'maintenance_plans', new_plan_id,
           jsonb_build_object('contract', c.number, 'oldPlan', to_jsonb(p))
      FROM maintenance_plans p
     WHERE p."contractId" = c.id AND p."isActive" AND p.id <> new_plan_id;

    -- ── 2. Visita de octubre por sede ────────────────────────────────────
    SELECT min(v."scheduledDate") INTO v_sched
      FROM maintenance_visits v JOIN maintenance_plans p ON p.id = v."planId"
     WHERE p."contractId" = c.id AND p."isActive" AND p.id <> new_plan_id
       AND v."periodStart" = oct_start;
    v_sched := COALESCE(v_sched, oct_start);

    -- Copia completa de las visitas viejas de octubre y sus equipos, antes
    -- de liberar la OT (caso 5b) o borrarlas.
    new_visit_id := gen_random_uuid()::text;
    INSERT INTO migration_log (id, operation, "sourceTable", "sourceId", "targetTable", "targetId", detail)
    SELECT gen_random_uuid()::text, op || ':visit', 'maintenance_visits', v.id, 'maintenance_visits', new_visit_id,
           jsonb_build_object('contract', c.number,
                              'oldVisit', to_jsonb(v),
                              'oldVisitEquipment', (SELECT coalesce(jsonb_agg(to_jsonb(m)), '[]'::jsonb)
                                                      FROM maintenance_visit_equipment m WHERE m."visitId" = v.id))
      FROM maintenance_visits v JOIN maintenance_plans p ON p.id = v."planId"
     WHERE p."contractId" = c.id AND p."isActive" AND p.id <> new_plan_id
       AND v."periodStart" = oct_start;

    IF old_closed.id IS NOT NULL THEN
      -- Caso 5b: liberar la OT de la visita vieja (workOrderId es unico).
      UPDATE maintenance_visits SET "workOrderId" = NULL WHERE id = old_closed.id;
      v_status := 'CLOSED';
      -- R9: todos atendidos (C-G5) y ninguno anticipado; FULFILLED si todas
      -- las fechas reales caen dentro del periodo.
      SELECT CASE WHEN bool_and((i."occurredAt" - interval '5 hours')::date <= oct_end) THEN 'FULFILLED' ELSE 'NOT_FULFILLED' END::"VisitCompliance"
        INTO v_compliance
        FROM interventions i
       WHERE i."workOrderId" = old_closed."workOrderId" AND i.status = 'COMPLETED'
         AND i."equipmentId" IN (SELECT pe."equipmentId" FROM maintenance_plan_equipment pe WHERE pe."planId" = new_plan_id);
    ELSE
      v_status := 'PENDING';
      v_compliance := NULL;
    END IF;

    -- ── 3. Borrar visitas viejas de octubre (copia ya en migration_log) ──
    -- Antes de crear la visita nueva: sus equipos (cascade) pueden tener
    -- ligadas las intervenciones de la OT (interventionId es unico).
    DELETE FROM maintenance_visits v
     USING maintenance_plans p
     WHERE p.id = v."planId" AND p."contractId" = c.id AND p."isActive" AND p.id <> new_plan_id
       AND v."periodStart" = oct_start;

    INSERT INTO maintenance_visits (id, "planId", "periodStart", "periodEnd", "scheduledDate", status, compliance,
                                    "workOrderId", "closedAt", notes, "updatedAt")
    VALUES (new_visit_id, new_plan_id, oct_start, oct_end, v_sched, v_status, v_compliance,
            old_closed."workOrderId", old_closed."closedAt",
            'Visita por sede (consolidacion v1.0)', CURRENT_TIMESTAMP);

    -- Equipos programados de la visita nueva.
    INSERT INTO maintenance_visit_equipment (id, "visitId", "equipmentId", origin, status, "interventionId", "updatedAt")
    SELECT gen_random_uuid()::text, new_visit_id, pe."equipmentId", 'SCHEDULED',
           CASE WHEN old_closed.id IS NULL THEN 'PENDING' ELSE 'ATTENDED' END::"VisitEquipmentStatus",
           CASE WHEN old_closed.id IS NULL THEN NULL ELSE
             (SELECT i.id FROM interventions i
               WHERE i."workOrderId" = old_closed."workOrderId"
                 AND i."equipmentId" = pe."equipmentId" AND i.status = 'COMPLETED') END,
           CURRENT_TIMESTAMP
      FROM maintenance_plan_equipment pe
     WHERE pe."planId" = new_plan_id AND pe."removedAt" IS NULL;

    -- Caso 5b: intervenciones de la OT sobre equipos no programados -> ADDED.
    IF old_closed.id IS NOT NULL THEN
      INSERT INTO maintenance_visit_equipment (id, "visitId", "equipmentId", origin, status, "interventionId", "updatedAt")
      SELECT gen_random_uuid()::text, new_visit_id, i."equipmentId", 'ADDED', 'ATTENDED', i.id, CURRENT_TIMESTAMP
        FROM interventions i
       WHERE i."workOrderId" = old_closed."workOrderId" AND i.status = 'COMPLETED'
         AND i."equipmentId" NOT IN (SELECT pe."equipmentId" FROM maintenance_plan_equipment pe WHERE pe."planId" = new_plan_id);
    END IF;

    -- ── 4. Desactivar planes viejos (conservan julio) ────────────────────
    UPDATE maintenance_plan_equipment pe
       SET "removedAt" = CURRENT_TIMESTAMP
      FROM maintenance_plans p
     WHERE pe."planId" = p.id AND p."contractId" = c.id AND p."isActive" AND p.id <> new_plan_id
       AND pe."removedAt" IS NULL;

    UPDATE maintenance_plans p
       SET "isActive" = false,
           notes = concat_ws(E'\n', p.notes, 'Consolidado en plan por sede ' || new_plan_id || ' (v1.0)'),
           "updatedAt" = CURRENT_TIMESTAMP
     WHERE p."contractId" = c.id AND p."isActive" AND p.id <> new_plan_id;

    consolidated := consolidated + 1;
    RAISE NOTICE '% consolidado: plan %, visita de octubre % (%)', c.number, new_plan_id, new_visit_id, v_status;
  END LOOP;

  -- Guarda final: se consolidaron exactamente los contratos esperados.
  IF consolidated <> array_length(contract_numbers, 1) THEN
    RAISE EXCEPTION 'C-G6: se consolidaron % de % contratos esperados', consolidated, array_length(contract_numbers, 1);
  END IF;
END $$;

COMMIT;
