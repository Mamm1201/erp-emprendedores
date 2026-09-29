import { Prisma } from '../../generated/prisma/client';

// Sede de referencia de un cliente sin ubicacion operativa especifica (p. ej.
// un cliente ocasional de Suministro). Garantiza que sus equipos y OTs tengan
// una ubicacion valida — docs/domain/supply-line-contract-v1.0.md.
export const PRINCIPAL_BRANCH_NAME = 'Principal';

/**
 * C1 — crea la sede `Principal` (marcada como principal) de un cliente recien
 * dado de alta. Se usa en TODAS las rutas de alta de cliente, dentro de la
 * misma transaccion que crea el cliente. No aplica a clientes existentes.
 */
export function createPrincipalBranch(
  tx: Prisma.TransactionClient,
  clientId: string,
  city?: string | null,
) {
  return tx.branch.create({
    data: {
      clientId,
      name: PRINCIPAL_BRANCH_NAME,
      city: city ?? null,
      isPrimary: true,
    },
    select: { id: true },
  });
}
