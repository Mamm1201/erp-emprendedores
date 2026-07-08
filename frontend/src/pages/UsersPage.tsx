import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, ShieldCheck, UserX, KeyRound, Pencil } from 'lucide-react';

import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeactivateUser,
  useChangePassword,
  type CreateUserData,
  type UpdateUserData,
  type ChangePasswordData,
} from '@/hooks/use-users';
import type { User, UserRole } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

// ─── Constantes ───────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  COMMERCIAL: 'Comercial',
  TECHNICIAN: 'Técnico',
  BILLING: 'Facturación',
};

const ALL_ROLES: UserRole[] = ['ADMIN', 'COMMERCIAL', 'TECHNICIAN', 'BILLING'];

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  role: z.enum(['ADMIN', 'COMMERCIAL', 'TECHNICIAN', 'BILLING'] as const),
});

const updateSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  email: z.string().email('Email inválido'),
  role: z.enum(['ADMIN', 'COMMERCIAL', 'TECHNICIAN', 'BILLING'] as const),
});

const passwordSchema = z
  .object({
    newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type CreateForm = z.infer<typeof createSchema>;
type UpdateForm = z.infer<typeof updateSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

// ─── RoleSelect — nativo sin shadcn/ui Select ────────────────────────────────

function RoleSelect({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (v: UserRole) => void;
  id?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as UserRole)}
      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <option value="" disabled>
        Selecciona un rol
      </option>
      {ALL_ROLES.map((r) => (
        <option key={r} value={r}>
          {ROLE_LABEL[r]}
        </option>
      ))}
    </select>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [showInactive, setShowInactive] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deactivateUser, setDeactivateUser] = useState<User | null>(null);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);

  const { data: users = [], isLoading } = useUsers({
    role: roleFilter === 'ALL' ? undefined : roleFilter,
    isActive: showInactive ? undefined : true,
    search: search || undefined,
  });

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deactivate = useDeactivateUser();
  const changePassword = useChangePassword();

  // ── Formulario de creación ─────────────────────────────────────────────────

  const createForm = useForm<CreateForm>({ resolver: zodResolver(createSchema) });

  function handleCreate(data: CreateForm) {
    createUser.mutate(data as CreateUserData, {
      onSuccess: () => {
        setCreateOpen(false);
        createForm.reset();
      },
    });
  }

  // ── Formulario de edición ──────────────────────────────────────────────────

  const editForm = useForm<UpdateForm>({ resolver: zodResolver(updateSchema) });

  function openEdit(user: User) {
    setEditUser(user);
    editForm.reset({ name: user.name, email: user.email, role: user.role });
  }

  function handleUpdate(data: UpdateForm) {
    if (!editUser) return;
    updateUser.mutate(
      { id: editUser.id, data: data as UpdateUserData },
      { onSuccess: () => setEditUser(null) },
    );
  }

  // ── Formulario de contraseña ───────────────────────────────────────────────

  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  function handleChangePassword(data: PasswordForm) {
    if (!passwordUser) return;
    const payload: ChangePasswordData = { newPassword: data.newPassword };
    changePassword.mutate(
      { id: passwordUser.id, data: payload },
      {
        onSuccess: () => {
          setPasswordUser(null);
          passwordForm.reset();
        },
      },
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Usuarios</h1>
          <p className="text-sm text-muted-foreground">Gestión de acceso y roles del sistema</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo usuario
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserRole | 'ALL')}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
        >
          <option value="ALL">Todos los roles</option>
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABEL[r]}</option>
          ))}
        </select>
        <Button
          variant={showInactive ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setShowInactive((p) => !p)}
        >
          {showInactive ? 'Mostrando todos' : 'Solo activos'}
        </Button>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando usuarios...</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay usuarios con los filtros seleccionados.</p>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Rol</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{ROLE_LABEL[user.role]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.isActive ? 'default' : 'destructive'}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(user)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPasswordUser(user)}
                        title="Cambiar contraseña"
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      {user.isActive && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeactivateUser(user)}
                          title="Desactivar"
                          className="text-destructive hover:text-destructive"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Dialog: Crear usuario ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input {...createForm.register('name')} placeholder="Juan García" />
              {createForm.formState.errors.name && (
                <p className="text-xs text-destructive">{createForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input {...createForm.register('email')} type="email" placeholder="juan@empresa.com" />
              {createForm.formState.errors.email && (
                <p className="text-xs text-destructive">{createForm.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Contraseña inicial</Label>
              <Input {...createForm.register('password')} type="password" placeholder="Mínimo 8 caracteres" />
              {createForm.formState.errors.password && (
                <p className="text-xs text-destructive">{createForm.formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Rol</Label>
              <RoleSelect
                value={createForm.watch('role') ?? ''}
                onChange={(v) => createForm.setValue('role', v, { shouldValidate: true })}
              />
              {createForm.formState.errors.role && (
                <p className="text-xs text-destructive">{createForm.formState.errors.role.message}</p>
              )}
            </div>
            {createUser.error && (
              <p className="text-xs text-destructive">{createUser.error.message}</p>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? 'Creando...' : 'Crear usuario'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Editar usuario ── */}
      <Dialog open={!!editUser} onOpenChange={(o) => { if (!o) setEditUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input {...editForm.register('name')} />
              {editForm.formState.errors.name && (
                <p className="text-xs text-destructive">{editForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input {...editForm.register('email')} type="email" />
              {editForm.formState.errors.email && (
                <p className="text-xs text-destructive">{editForm.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Rol</Label>
              <RoleSelect
                value={editForm.watch('role') ?? ''}
                onChange={(v) => editForm.setValue('role', v, { shouldValidate: true })}
              />
            </div>
            {updateUser.error && (
              <p className="text-xs text-destructive">{updateUser.error.message}</p>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={updateUser.isPending}>
                {updateUser.isPending ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Cambiar contraseña ── */}
      <Dialog
        open={!!passwordUser}
        onOpenChange={(o) => {
          if (!o) {
            setPasswordUser(null);
            passwordForm.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                Cambiar contraseña — {passwordUser?.name}
              </span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4">
            <div className="space-y-1">
              <Label>Nueva contraseña</Label>
              <Input
                {...passwordForm.register('newPassword')}
                type="password"
                placeholder="Mínimo 8 caracteres"
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-xs text-destructive">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Confirmar contraseña</Label>
              <Input
                {...passwordForm.register('confirmPassword')}
                type="password"
                placeholder="Repite la contraseña"
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            {changePassword.error && (
              <p className="text-xs text-destructive">{changePassword.error.message}</p>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={changePassword.isPending}>
                {changePassword.isPending ? 'Guardando...' : 'Cambiar contraseña'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Confirmar desactivación ── */}
      <Dialog
        open={!!deactivateUser}
        onOpenChange={(o) => { if (!o) setDeactivateUser(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <UserX className="h-4 w-4" />
              Desactivar usuario
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{deactivateUser?.name}</strong> perderá acceso al
            sistema de inmediato y su sesión activa quedará invalidada. Esta acción puede revertirse
            editando el usuario.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deactivateUser) return;
                deactivate.mutate(deactivateUser.id, {
                  onSuccess: () => setDeactivateUser(null),
                });
              }}
              disabled={deactivate.isPending}
            >
              {deactivate.isPending ? 'Desactivando...' : 'Desactivar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
