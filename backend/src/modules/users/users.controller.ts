import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserRole } from '../../generated/prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthUser } from '../auth/auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** Lista todos los usuarios con filtros opcionales. Solo ADMIN. */
  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  /** Lista técnicos activos — accesible a todos los roles autenticados (selector de OT). */
  @Get('technicians')
  findTechnicians() {
    return this.usersService.findTechnicians();
  }

  /** Detalle de un usuario. Solo ADMIN. */
  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  /** Crear usuario. Solo ADMIN. */
  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  /** Actualizar datos de usuario (nombre, email, rol, isActive). Solo ADMIN. */
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  /** Desactivar usuario e invalidar sesión persistente. Solo ADMIN. */
  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  deactivate(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.deactivate(id, user.id);
  }

  /** Cambiar contraseña. ADMIN puede cambiar la de cualquiera; usuario puede cambiar la propia. */
  @Patch(':id/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @Param('id') id: string,
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: AuthUser,
  ) {
    await this.usersService.changePassword(id, dto, user.id, user.role as UserRole);
  }
}
