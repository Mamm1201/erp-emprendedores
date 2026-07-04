import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WorkOrderStatus } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

const EXPENSE_SELECT = {
  id: true,
  workOrderId: true,
  category: true,
  description: true,
  amount: true,
  expenseDate: true,
  vendorName: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByWorkOrder(workOrderId: string) {
    await this.ensureWorkOrderExists(workOrderId);
    return this.prisma.expense.findMany({
      where: { workOrderId, deletedAt: null },
      select: EXPENSE_SELECT,
      orderBy: [{ category: 'asc' }, { expenseDate: 'asc' }],
    });
  }

  async create(workOrderId: string, dto: CreateExpenseDto) {
    const workOrder = await this.ensureWorkOrderExists(workOrderId);
    this.assertEditable(workOrder.status);

    return this.prisma.expense.create({
      data: {
        workOrderId,
        category: dto.category,
        description: dto.description,
        amount: dto.amount,
        expenseDate: dto.expenseDate
          ? new Date(dto.expenseDate)
          : new Date(),
        vendorName: dto.vendorName,
      },
      select: EXPENSE_SELECT,
    });
  }

  async update(workOrderId: string, expenseId: string, dto: UpdateExpenseDto) {
    const workOrder = await this.ensureWorkOrderExists(workOrderId);
    this.assertEditable(workOrder.status);
    const expense = await this.findActiveExpense(workOrderId, expenseId);

    return this.prisma.expense.update({
      where: { id: expense.id },
      data: {
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.expenseDate !== undefined && {
          expenseDate: new Date(dto.expenseDate),
        }),
        ...(dto.vendorName !== undefined && { vendorName: dto.vendorName }),
      },
      select: EXPENSE_SELECT,
    });
  }

  async remove(workOrderId: string, expenseId: string) {
    const workOrder = await this.ensureWorkOrderExists(workOrderId);
    this.assertEditable(workOrder.status);
    const expense = await this.findActiveExpense(workOrderId, expenseId);

    const deletedAt = new Date();
    await this.prisma.expense.update({
      where: { id: expense.id },
      data: { deletedAt },
    });

    return { id: expense.id, deletedAt };
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async ensureWorkOrderExists(workOrderId: string) {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!workOrder) {
      throw new NotFoundException(
        `Orden de trabajo ${workOrderId} no encontrada.`,
      );
    }
    return workOrder;
  }

  private assertEditable(status: WorkOrderStatus) {
    if (
      status === WorkOrderStatus.COMPLETED ||
      status === WorkOrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'No se pueden modificar gastos en una orden completada o cancelada.',
      );
    }
  }

  private async findActiveExpense(workOrderId: string, expenseId: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id: expenseId, workOrderId, deletedAt: null },
      select: { id: true },
    });
    if (!expense) {
      throw new NotFoundException(`Gasto ${expenseId} no encontrado.`);
    }
    return expense;
  }
}
