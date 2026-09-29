-- ============================================================================
-- Correccion de datos — caso Jorge Espejo (suministro de 2 radios UHF)
-- Contrato: docs/domain/supply-line-contract-v1.0.md (§11)
--
-- NO es una migracion de Prisma. Se ejecuta a mano, UNA sola vez, DESPUES de
-- aplicar la migracion 20260928200000_add_supply_work_order_type:
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f prisma/data-migrations/20260928_jorge_espejo_supply.sql
--
-- Que hace:
--   1. OT-2026-00029: quotationId -> NULL (sigue CANCELLED).
--   2. OT-2026-00030: quotationId -> COT-2026-00007, sede -> Principal,
--      type -> SUPPLY.
--   3. Las 2 intervenciones de OT-2026-00030: type -> SUPPLY.
--
-- Que NO hace (pendiente de datos reales confirmados — no se inventan):
--   - no crea ni modifica los 2 Equipment (ya existen);
--   - no toca installDate, warrantyExpiresAt ni occurredAt.
--
-- Una transaccion; cualquier guarda que falle aborta sin cambios. Idempotente:
-- una segunda ejecucion aborta en la guarda J-G2. Valores previos en migration_log.
-- ============================================================================

BEGIN;

DO $$
DECLARE
  op        CONSTANT text := 'supply-v1.0:jorge-espejo';
  v_client  text;
  v_quote   text;
  v_ot29    record;
  v_ot30    record;
  v_branch  text;
  n         int;
BEGIN
  -- J-G0: la migracion SUPPLY debe estar aplicada.
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
                  WHERE t.typname = 'WorkOrderType' AND e.enumlabel = 'SUPPLY') THEN
    RAISE EXCEPTION 'J-G0: falta el valor SUPPLY en WorkOrderType (aplicar la migracion primero)';
  END IF;

  -- J-G1: cliente inequivoco (exactamente uno) y cotizacion.
  SELECT count(*) INTO n FROM clients WHERE "legalName" = 'Jorge Espejo' AND "deletedAt" IS NULL;
  IF n <> 1 THEN RAISE EXCEPTION 'J-G1: se esperaba exactamente 1 cliente Jorge Espejo activo (hay %)', n; END IF;
  SELECT id INTO v_client FROM clients WHERE "legalName" = 'Jorge Espejo' AND "deletedAt" IS NULL;

  SELECT id INTO v_quote FROM quotations
   WHERE number = 'COT-2026-00007' AND "clientId" = v_client AND status = 'CONVERTED' AND "deletedAt" IS NULL;
  IF v_quote IS NULL THEN RAISE EXCEPTION 'J-G1: COT-2026-00007 no encontrada, de otro cliente o no CONVERTED'; END IF;

  SELECT id, status, "quotationId", "clientId" INTO v_ot29 FROM work_orders WHERE number = 'OT-2026-00029';
  SELECT id, status, "quotationId", "clientId", "branchId", type INTO v_ot30 FROM work_orders WHERE number = 'OT-2026-00030';

  -- J-G2: estado exacto esperado (tambien impide una segunda ejecucion).
  IF v_ot29.id IS NULL OR v_ot29."clientId" <> v_client OR v_ot29.status <> 'CANCELLED'
     OR v_ot29."quotationId" IS DISTINCT FROM v_quote THEN
    RAISE EXCEPTION 'J-G2: OT-2026-00029 no esta CANCELLED y ligada a COT-2026-00007 (¿ya aplicado?)';
  END IF;
  IF v_ot30.id IS NULL OR v_ot30."clientId" <> v_client OR v_ot30.status <> 'COMPLETED'
     OR v_ot30."quotationId" IS NOT NULL OR v_ot30."branchId" IS NOT NULL OR v_ot30.type <> 'CORRECTIVE' THEN
    RAISE EXCEPTION 'J-G2: OT-2026-00030 no esta en el estado esperado (COMPLETED, sin cotizacion, sin sede, CORRECTIVE)';
  END IF;

  -- J-G3: sede Principal del cliente (unica).
  SELECT count(*) INTO n FROM branches WHERE "clientId" = v_client AND name = 'Principal' AND "deletedAt" IS NULL;
  IF n <> 1 THEN RAISE EXCEPTION 'J-G3: se esperaba exactamente 1 sede Principal (hay %)', n; END IF;
  SELECT id INTO v_branch FROM branches WHERE "clientId" = v_client AND name = 'Principal' AND "deletedAt" IS NULL;

  -- J-G4: exactamente 2 intervenciones CORRECTIVE en OT-00030, sobre equipos de la sede Principal.
  SELECT count(*) INTO n FROM interventions i JOIN equipment e ON e.id = i."equipmentId"
   WHERE i."workOrderId" = v_ot30.id AND i.type = 'CORRECTIVE' AND e."branchId" = v_branch;
  IF n <> 2 OR (SELECT count(*) FROM interventions WHERE "workOrderId" = v_ot30.id) <> 2 THEN
    RAISE EXCEPTION 'J-G4: OT-2026-00030 no tiene exactamente 2 intervenciones CORRECTIVE sobre equipos de Principal';
  END IF;

  -- ── Registro de valores previos ─────────────────────────────────────────
  INSERT INTO migration_log (id, operation, "sourceTable", "sourceId", "targetTable", "targetId", detail)
  VALUES
    (gen_random_uuid()::text, op || ':work-order', 'work_orders', v_ot29.id, 'work_orders', v_ot29.id,
     jsonb_build_object('number', 'OT-2026-00029', 'quotationId', jsonb_build_object('old', v_ot29."quotationId", 'new', NULL))),
    (gen_random_uuid()::text, op || ':work-order', 'work_orders', v_ot30.id, 'work_orders', v_ot30.id,
     jsonb_build_object('number', 'OT-2026-00030',
                        'quotationId', jsonb_build_object('old', NULL, 'new', v_quote),
                        'branchId',    jsonb_build_object('old', NULL, 'new', v_branch),
                        'type',        jsonb_build_object('old', 'CORRECTIVE', 'new', 'SUPPLY')));

  INSERT INTO migration_log (id, operation, "sourceTable", "sourceId", "targetTable", "targetId", detail)
  SELECT gen_random_uuid()::text, op || ':intervention', 'interventions', i.id, 'interventions', i.id,
         jsonb_build_object('workOrder', 'OT-2026-00030', 'equipmentId', i."equipmentId",
                            'type', jsonb_build_object('old', i.type, 'new', 'SUPPLY'))
    FROM interventions i WHERE i."workOrderId" = v_ot30.id;

  -- ── Cambios ─────────────────────────────────────────────────────────────
  -- workOrders.quotationId es unico: primero se libera de la OT cancelada.
  UPDATE work_orders SET "quotationId" = NULL, "updatedAt" = CURRENT_TIMESTAMP WHERE id = v_ot29.id;
  UPDATE work_orders
     SET "quotationId" = v_quote, "branchId" = v_branch, type = 'SUPPLY', "updatedAt" = CURRENT_TIMESTAMP
   WHERE id = v_ot30.id;
  UPDATE interventions SET type = 'SUPPLY', "updatedAt" = CURRENT_TIMESTAMP WHERE "workOrderId" = v_ot30.id;

  RAISE NOTICE 'Jorge Espejo corregido: COT-2026-00007 -> OT-2026-00030 (SUPPLY, sede Principal); 2 intervenciones SUPPLY';
END $$;

COMMIT;
