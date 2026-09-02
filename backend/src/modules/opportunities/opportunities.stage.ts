import { BadRequestException } from '@nestjs/common';
import { OpportunityStage } from '../../generated/prisma/client';

// Orden lineal exacto del pipeline — tal como esta declarado en
// schema.prisma / Contrato de Diseño Fase 0. No reinterpretar el orden.
// WON y LOST son terminales, fuera de la secuencia lineal: WON nunca es
// una transicion manual (solo via Quotation.APPROVED, fase futura); LOST
// es alcanzable desde cualquier etapa no terminal.
const STAGE_ORDER: OpportunityStage[] = [
  OpportunityStage.IDENTIFIED,
  OpportunityStage.RESEARCHING,
  OpportunityStage.CONTACTED,
  OpportunityStage.CONVERSING,
  OpportunityStage.MEETING_DIAGNOSIS,
  OpportunityStage.QUOTED,
  OpportunityStage.NEGOTIATING,
];

const TERMINAL_STAGES: OpportunityStage[] = [
  OpportunityStage.WON,
  OpportunityStage.LOST,
];

export function isTerminalStage(stage: OpportunityStage): boolean {
  return TERMINAL_STAGES.includes(stage);
}

export function assertStageTransition(
  current: OpportunityStage,
  next: OpportunityStage,
): void {
  if (current === next) {
    return;
  }

  if (isTerminalStage(current)) {
    throw new BadRequestException(
      `Cannot transition Opportunity from terminal stage ${current}`,
    );
  }

  if (next === OpportunityStage.WON) {
    throw new BadRequestException(
      'WON cannot be set manually — it is only reached automatically when a linked Quotation is APPROVED',
    );
  }

  if (next === OpportunityStage.LOST) {
    return;
  }

  const currentIndex = STAGE_ORDER.indexOf(current);
  const nextIndex = STAGE_ORDER.indexOf(next);

  if (nextIndex <= currentIndex) {
    throw new BadRequestException(
      `Cannot transition Opportunity from ${current} to ${next}: backward transitions are not allowed`,
    );
  }
}
