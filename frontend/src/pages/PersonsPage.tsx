import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Trash2, Pencil, ChevronRight } from 'lucide-react';

import {
  usePersons,
  useCreatePerson,
  useUpdatePerson,
  useDeletePerson,
  type CreatePersonData,
  type UpdatePersonData,
} from '@/hooks/use-persons';
import type { Person, PersonProfile, RelationshipType } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

// ─── Constantes ───────────────────────────────────────────────────────────────

export const PERSON_PROFILE_LABELS: Record<PersonProfile, string> = {
  TECHNICIAN_INTERNAL: 'Técnico interno',
  TECHNICIAN_EXTERNAL: 'Técnico externo',
  BIOMEDICAL_ENGINEER: 'Ingeniero biomédico',
  INDEPENDENT_PROFESSIONAL: 'Profesional independiente',
  CONTRACTOR: 'Contratista',
  ADMIN_STAFF: 'Personal administrativo',
  OTHER: 'Otro',
};

export const RELATIONSHIP_TYPE_LABELS: Record<RelationshipType, string> = {
  EMPLOYEE: 'Empleado',
  CONTRACTOR: 'Contratista',
  INDEPENDENT: 'Independiente',
  EXTERNAL_OTHER: 'Externo (otro)',
};

const ALL_PROFILES = Object.keys(PERSON_PROFILE_LABELS) as PersonProfile[];
const ALL_RELATIONSHIPS = Object.keys(RELATIONSHIP_TYPE_LABELS) as RelationshipType[];

// ─── Schema ───────────────────────────────────────────────────────────────────

const personSchema = z.object({
  fullName: z.string().min(1, 'El nombre es obligatorio').max(200),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  profile: z.enum(ALL_PROFILES as [PersonProfile, ...PersonProfile[]]),
  relationshipType: z.enum(ALL_RELATIONSHIPS as [RelationshipType, ...RelationshipType[]]),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

type PersonForm = z.infer<typeof personSchema>;

function toPayload(data: PersonForm): CreatePersonData {
  return {
    fullName: data.fullName,
    email: data.email || undefined,
    phone: data.phone || undefined,
    profile: data.profile,
    relationshipType: data.relationshipType,
    notes: data.notes || undefined,
  };
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function PersonsPage() {
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editPerson, setEditPerson] = useState<Person | null>(null);
  const [deletePersonState, setDeletePersonState] = useState<Person | null>(null);

  const { data, isLoading } = usePersons({ search: search || undefined });
  const persons = data?.data ?? [];

  const createPerson = useCreatePerson();
  const updatePerson = useUpdatePerson();
  const deletePerson = useDeletePerson();

  const createForm = useForm<PersonForm>({ resolver: zodResolver(personSchema) });
  const editForm = useForm<PersonForm>({ resolver: zodResolver(personSchema) });

  function handleCreate(data: PersonForm) {
    createPerson.mutate(toPayload(data), {
      onSuccess: () => {
        setCreateOpen(false);
        createForm.reset();
      },
    });
  }

  function openEdit(person: Person) {
    setEditPerson(person);
    editForm.reset({
      fullName: person.fullName,
      email: person.email ?? '',
      phone: person.phone ?? '',
      profile: person.profile,
      relationshipType: person.relationshipType,
      notes: person.notes ?? '',
    });
  }

  function handleUpdate(data: PersonForm) {
    if (!editPerson) return;
    const payload: UpdatePersonData = toPayload(data);
    updatePerson.mutate(
      { id: editPerson.id, data: payload },
      { onSuccess: () => setEditPerson(null) },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Personal</h1>
          <p className="text-sm text-muted-foreground">
            Personas que prestan servicios para STECH NODES — internas o externas, con o sin acceso al ERP
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nueva persona
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando personal...</p>
      ) : persons.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay personas registradas todavía.</p>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Perfil</th>
                <th className="px-4 py-3 text-left">Relación</th>
                <th className="px-4 py-3 text-left">Cuenta ERP</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {persons.map((person) => (
                <tr key={person.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <Link
                      to={`/personal/${person.id}`}
                      className="flex items-center gap-1 hover:underline"
                    >
                      {person.fullName}
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{PERSON_PROFILE_LABELS[person.profile]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {RELATIONSHIP_TYPE_LABELS[person.relationshipType]}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {person.user ? person.user.email : '— sin cuenta —'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(person)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletePersonState(person)}
                        title="Eliminar"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Crear */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva persona</DialogTitle>
          </DialogHeader>
          <PersonFormFields form={createForm} />
          {createPerson.error && (
            <p className="text-xs text-destructive">{createPerson.error.message}</p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              onClick={createForm.handleSubmit(handleCreate)}
              disabled={createPerson.isPending}
            >
              {createPerson.isPending ? 'Creando...' : 'Crear persona'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editar */}
      <Dialog open={!!editPerson} onOpenChange={(o) => { if (!o) setEditPerson(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar persona</DialogTitle>
          </DialogHeader>
          <PersonFormFields form={editForm} />
          {updatePerson.error && (
            <p className="text-xs text-destructive">{updatePerson.error.message}</p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              onClick={editForm.handleSubmit(handleUpdate)}
              disabled={updatePerson.isPending}
            >
              {updatePerson.isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Eliminar */}
      <Dialog
        open={!!deletePersonState}
        onOpenChange={(o) => { if (!o) setDeletePersonState(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" />
              Eliminar persona
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{deletePersonState?.fullName}</strong> dejará de
            aparecer en el listado. Su historial de acreditaciones y su participación en órdenes
            de trabajo previas se conserva sin cambios.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deletePersonState) return;
                deletePerson.mutate(deletePersonState.id, {
                  onSuccess: () => setDeletePersonState(null),
                });
              }}
              disabled={deletePerson.isPending}
            >
              {deletePerson.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Formulario compartido crear/editar ──────────────────────────────────────

function PersonFormFields({ form }: { form: ReturnType<typeof useForm<PersonForm>> }) {
  const { register, watch, setValue, formState } = form;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Nombre completo</Label>
        <Input {...register('fullName')} placeholder="Nombre y apellido" />
        {formState.errors.fullName && (
          <p className="text-xs text-destructive">{formState.errors.fullName.message}</p>
        )}
      </div>
      <div className="space-y-1">
        <Label>Email (opcional)</Label>
        <Input {...register('email')} type="email" placeholder="correo@ejemplo.com" />
        {formState.errors.email && (
          <p className="text-xs text-destructive">{formState.errors.email.message}</p>
        )}
      </div>
      <div className="space-y-1">
        <Label>Teléfono (opcional)</Label>
        <Input {...register('phone')} placeholder="300 000 0000" />
      </div>
      <div className="space-y-1">
        <Label>Perfil</Label>
        <select
          value={watch('profile') ?? ''}
          onChange={(e) => setValue('profile', e.target.value as PersonProfile, { shouldValidate: true })}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        >
          <option value="" disabled>Selecciona un perfil</option>
          {ALL_PROFILES.map((p) => (
            <option key={p} value={p}>{PERSON_PROFILE_LABELS[p]}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label>Relación con STECH NODES</Label>
        <select
          value={watch('relationshipType') ?? ''}
          onChange={(e) =>
            setValue('relationshipType', e.target.value as RelationshipType, { shouldValidate: true })
          }
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        >
          <option value="" disabled>Selecciona una relación</option>
          {ALL_RELATIONSHIPS.map((r) => (
            <option key={r} value={r}>{RELATIONSHIP_TYPE_LABELS[r]}</option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Información interna — nunca se muestra en la verificación pública de la acreditación.
        </p>
      </div>
      <div className="space-y-1">
        <Label>Notas (opcional)</Label>
        <Textarea {...register('notes')} rows={2} />
      </div>
    </div>
  );
}
