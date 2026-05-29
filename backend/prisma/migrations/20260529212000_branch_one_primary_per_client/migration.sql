-- Solo una sede principal activa por cliente (defensa en profundidad)
CREATE UNIQUE INDEX "branches_one_primary_per_client_idx"
ON "branches" ("clientId")
WHERE "isPrimary" = true AND "deletedAt" IS NULL;
