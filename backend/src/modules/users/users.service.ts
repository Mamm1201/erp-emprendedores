import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { User, UserRole } from '../../generated/prisma/client';
import { USER_PUBLIC_SELECT } from './users.constants';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Métodos internos (usados por AuthService) ────────────────────────────

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id, isActive: true } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async storeRefreshTokenHash(userId: string, hash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash },
    });
  }

  async clearRefreshTokenHash(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  // ── CRUD público (usado por UsersController) ─────────────────────────────

  findAll(query: QueryUsersDto) {
    const { role, isActive, search } = query;
    return this.prisma.user.findMany({
      select: USER_PUBLIC_SELECT,
      where: {
        ...(role !== undefined ? { role } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ name: 'asc' }],
    });
  }

  findTechnicians() {
    return this.prisma.user.findMany({
      select: { id: true, name: true },
      where: { role: UserRole.TECHNICIAN, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      select: USER_PUBLIC_SELECT,
      where: { id },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('El email ya está registrado');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    return this.prisma.user.create({
      select: USER_PUBLIC_SELECT,
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        role: dto.role,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    if (dto.email) {
      const conflict = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id } },
      });
      if (conflict) throw new ConflictException('El email ya está registrado');
    }

    return this.prisma.user.update({
      select: USER_PUBLIC_SELECT,
      where: { id },
      data: dto,
    });
  }

  async deactivate(id: string, requestingUserId: string) {
    if (id === requestingUserId) {
      throw new ForbiddenException('No puedes desactivar tu propia cuenta');
    }
    await this.findOne(id);

    return this.prisma.user.update({
      select: USER_PUBLIC_SELECT,
      where: { id },
      data: { isActive: false, refreshTokenHash: null },
    });
  }

  async changePassword(
    id: string,
    dto: ChangePasswordDto,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const isSelf = id === requestingUserId;
    const isAdmin = requestingUserRole === UserRole.ADMIN;

    if (!isSelf && !isAdmin) {
      throw new ForbiddenException('No tienes permiso para cambiar esta contraseña');
    }

    // Si es el propio usuario (no admin cambiando contraseña ajena), verificar contraseña actual
    if (isSelf && !isAdmin) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Debes proporcionar la contraseña actual');
      }
      const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!valid) throw new UnauthorizedException('Contraseña actual incorrecta');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }
}
