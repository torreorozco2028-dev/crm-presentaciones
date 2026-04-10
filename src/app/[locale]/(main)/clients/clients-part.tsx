'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { CheckCircle2, Pencil, Search, UserPlus, X } from 'lucide-react';
import {
  createClientAction,
  getClientsListAction,
  getClientsSetupAction,
  updateClientAction,
} from './actions';

interface ClientRow {
  id: string;
  fullName: string;
  names: string;
  firstLastName: string;
  secondLastName: string;
  typeDocument: string;
  documentNumber: number | null;
  email: string;
  cellphone: number | null;
  location: string;
  genre: string;
  maritalStatus: string;
  occupation: string;
  createdAt: string | null;
  updatedAt: string | null;
  owner: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  lastUpdatedBy: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  canUpdate: boolean;
}

interface ClientsListData {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  rows: ClientRow[];
}

interface ClientsSetupData {
  currentUserId: string;
  currentUserRole: string;
}

interface ClientFormState {
  names: string;
  first_last_name: string;
  second_last_name: string;
  type_document: string;
  n_document: string;
  email: string;
  cellphone: string;
  location: string;
  genre: string;
  marital_status: string;
  occupation: string;
}

const emptyClientForm: ClientFormState = {
  names: '',
  first_last_name: '',
  second_last_name: '',
  type_document: 'CI',
  n_document: '',
  email: '',
  cellphone: '',
  location: '',
  genre: '',
  marital_status: '',
  occupation: '',
};

export default function ClientsPart() {
  const [setupData, setSetupData] = useState<ClientsSetupData | null>(null);
  const [listData, setListData] = useState<ClientsListData | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    void loadSetup();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!setupData) return;
    void loadClients();
  }, [setupData, currentPage, debouncedSearch]);

  async function loadSetup() {
    setIsLoading(true);
    setError(null);

    const result = await getClientsSetupAction();
    if (!result.success || !('data' in result) || !result.data) {
      setError(result.error ?? 'No se pudo cargar la configuración');
      setIsLoading(false);
      return;
    }

    setSetupData(result.data);
    setIsLoading(false);
  }

  async function loadClients() {
    setIsLoading(true);
    setError(null);

    const result = await getClientsListAction({
      page: currentPage,
      pageSize: itemsPerPage,
      search: debouncedSearch,
    });

    if (!result.success || !('data' in result) || !result.data) {
      setError(result.error ?? 'No se pudo cargar la lista de clientes');
      setIsLoading(false);
      return;
    }

    setListData(result.data);
    setIsLoading(false);
  }

  async function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    setIsSubmitting(true);
    setError(null);

    const result = await createClientAction({
      names: String(formData.get('names') ?? ''),
      first_last_name: String(formData.get('first_last_name') ?? ''),
      second_last_name: String(formData.get('second_last_name') ?? ''),
      type_document: String(formData.get('type_document') ?? 'CI'),
      n_document: String(formData.get('n_document') ?? ''),
      email: String(formData.get('email') ?? ''),
      cellphone: String(formData.get('cellphone') ?? ''),
      location: String(formData.get('location') ?? ''),
      genre: String(formData.get('genre') ?? ''),
      marital_status: String(formData.get('marital_status') ?? ''),
      occupation: String(formData.get('occupation') ?? ''),
    });

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error ?? 'No se pudo registrar el cliente');
      toast.error(result.error ?? 'No se pudo registrar el cliente');
      return;
    }

    form.reset();
    setShowCreateForm(false);
    await loadClients();
    toast.success('Cliente creado correctamente');
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingClient) return;

    const formData = new FormData(e.currentTarget);

    setIsSubmitting(true);
    setError(null);

    const result = await updateClientAction({
      clientId: editingClient.id,
      names: String(formData.get('names') ?? ''),
      first_last_name: String(formData.get('first_last_name') ?? ''),
      second_last_name: String(formData.get('second_last_name') ?? ''),
      type_document: String(formData.get('type_document') ?? 'CI'),
      n_document: String(formData.get('n_document') ?? ''),
      email: String(formData.get('email') ?? ''),
      cellphone: String(formData.get('cellphone') ?? ''),
      location: String(formData.get('location') ?? ''),
      genre: String(formData.get('genre') ?? ''),
      marital_status: String(formData.get('marital_status') ?? ''),
      occupation: String(formData.get('occupation') ?? ''),
    });

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error ?? 'No se pudo editar el cliente');
      toast.error(result.error ?? 'No se pudo editar el cliente');
      return;
    }

    setEditingClient(null);
    await loadClients();
    toast.success('Cliente actualizado correctamente');
  }

  const clients = listData?.rows ?? [];
  const totalPages = listData?.totalPages ?? 1;
  const validPage = listData?.page ?? currentPage;

  const paginationRange = useMemo(() => {
    const delta = 2;
    const range: Array<number | string> = [];
    for (
      let page = Math.max(1, validPage - delta);
      page <= Math.min(totalPages, validPage + delta);
      page++
    ) {
      range.push(page);
    }
    if (range[0] !== 1) range.unshift('...');
    if (range[range.length - 1] !== totalPages) range.push('...');
    return range;
  }, [totalPages, validPage]);

  return (
    <section className='relative z-10 bg-white px-3 py-8 dark:bg-black sm:px-4 lg:px-6'>
      <div className='mx-auto w-full max-w-[1700px]'>
        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-black'>
          <div className='flex flex-col gap-4 border-b border-slate-100 p-5 dark:border-zinc-800 md:flex-row md:items-center md:justify-between'>
            <div>
              <h2 className='text-xl font-bold text-slate-900 dark:text-zinc-100'>
                Clientes
              </h2>
              <p className='text-sm text-slate-500 dark:text-zinc-400'>
                Alta, edición y listado de clientes. El creador o un admin
                pueden editar el registro, y la última modificación queda
                atribuida al usuario que la hizo.
              </p>
            </div>

            <button
              type='button'
              onClick={() => setShowCreateForm(true)}
              className='inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600'
            >
              <UserPlus size={16} /> Agregar Cliente
            </button>
          </div>

          {error && (
            <div className='mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300'>
              {error}
            </div>
          )}

          <div className='p-5'>
            <div className='mb-4 grid grid-cols-1 gap-3 lg:grid-cols-12'>
              <div className='relative lg:col-span-5'>
                <Search
                  size={16}
                  className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500'
                />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder='Buscar por nombre, email, dirección u ocupación'
                  className='h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500'
                />
              </div>
            </div>

            {isLoading ? (
              <div className='rounded-xl border border-slate-200 p-6 text-sm text-slate-500 dark:border-zinc-800 dark:text-zinc-400'>
                Cargando clientes...
              </div>
            ) : (
              <>
                <div className='hidden overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800 lg:block'>
                  <table className='w-full min-w-[1350px] text-left text-sm'>
                    <thead className='bg-slate-50 text-slate-600 dark:bg-zinc-950 dark:text-zinc-300'>
                      <tr>
                        <th className='px-4 py-3 font-semibold'>Cliente</th>
                        <th className='px-4 py-3 font-semibold'>Documento</th>
                        <th className='px-4 py-3 font-semibold'>Contacto</th>
                        <th className='px-4 py-3 font-semibold'>Ubicación</th>
                        <th className='px-4 py-3 font-semibold'>Ocupación</th>
                        <th className='px-4 py-3 font-semibold'>Creado por</th>
                        <th className='px-4 py-3 font-semibold'>
                          Última actualización
                        </th>
                        <th className='px-4 py-3 font-semibold'>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.length === 0 && (
                        <tr>
                          <td
                            colSpan={8}
                            className='px-4 py-6 text-center text-slate-500 dark:text-zinc-400'
                          >
                            Aún no hay clientes registrados.
                          </td>
                        </tr>
                      )}

                      {clients.map((item) => (
                        <tr
                          key={item.id}
                          className='border-t border-slate-100 dark:border-zinc-800'
                        >
                          <td className='px-4 py-3 text-slate-800 dark:text-zinc-100'>
                            <div className='font-medium'>{item.fullName}</div>
                            <div className='text-xs text-slate-500 dark:text-zinc-400'>
                              {item.genre || '-'} · {item.maritalStatus || '-'}
                            </div>
                          </td>
                          <td className='px-4 py-3 text-slate-700 dark:text-zinc-300'>
                            {item.typeDocument} · {item.documentNumber ?? '-'}
                          </td>
                          <td className='px-4 py-3 text-slate-700 dark:text-zinc-300'>
                            <div>{item.email || '-'}</div>
                            <div className='text-xs text-slate-500 dark:text-zinc-400'>
                              {item.cellphone ?? '-'}
                            </div>
                          </td>
                          <td className='max-w-60 px-4 py-3 text-slate-700 dark:text-zinc-300'>
                            <span className='line-clamp-2'>
                              {item.location || '-'}
                            </span>
                          </td>
                          <td className='px-4 py-3 text-slate-700 dark:text-zinc-300'>
                            {item.occupation || '-'}
                          </td>
                          <td className='px-4 py-3 text-slate-700 dark:text-zinc-300'>
                            <div>{item.owner?.name ?? 'Sin propietario'}</div>
                            <div className='text-xs text-slate-500 dark:text-zinc-400'>
                              {item.owner?.email ?? '-'}
                            </div>
                          </td>
                          <td className='px-4 py-3 text-slate-700 dark:text-zinc-300'>
                            <div>
                              {item.updatedAt
                                ? new Date(item.updatedAt).toLocaleString(
                                    'es-BO'
                                  )
                                : '-'}
                            </div>
                            <div className='text-xs text-slate-500 dark:text-zinc-400'>
                              {item.lastUpdatedBy?.name ?? 'Sin registro'}
                            </div>
                          </td>
                          <td className='px-4 py-3'>
                            {item.canUpdate ? (
                              <button
                                type='button'
                                onClick={() => setEditingClient(item)}
                                className='inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'
                                aria-label='Editar cliente'
                                title='Editar cliente'
                              >
                                <Pencil size={16} />
                              </button>
                            ) : (
                              <span className='text-xs text-amber-700 dark:text-amber-400'>
                                Solo creador o admin
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className='space-y-3 lg:hidden'>
                  {clients.length === 0 && (
                    <div className='rounded-xl border border-slate-200 p-4 text-sm text-slate-500 dark:border-zinc-800 dark:text-zinc-400'>
                      Aún no hay clientes registrados.
                    </div>
                  )}

                  {clients.map((item) => (
                    <div
                      key={item.id}
                      className='rounded-xl border border-slate-200 p-4 dark:border-zinc-800'
                    >
                      <div className='mb-3'>
                        <p className='font-medium text-slate-800 dark:text-zinc-100'>
                          {item.fullName}
                        </p>
                        <p className='text-xs text-slate-500 dark:text-zinc-400'>
                          {item.typeDocument} · {item.documentNumber ?? '-'}
                        </p>
                      </div>
                      <div className='grid grid-cols-2 gap-2 text-sm'>
                        <p className='text-slate-500 dark:text-zinc-400'>
                          Email
                        </p>
                        <p className='text-right text-slate-700 dark:text-zinc-300'>
                          {item.email || '-'}
                        </p>
                        <p className='text-slate-500 dark:text-zinc-400'>
                          Teléfono
                        </p>
                        <p className='text-right text-slate-700 dark:text-zinc-300'>
                          {item.cellphone ?? '-'}
                        </p>
                        <p className='text-slate-500 dark:text-zinc-400'>
                          Creado por
                        </p>
                        <p className='text-right text-slate-700 dark:text-zinc-300'>
                          {item.owner?.name ?? 'Sin propietario'}
                        </p>
                      </div>
                      <div className='mt-3 flex justify-end'>
                        {item.canUpdate ? (
                          <button
                            type='button'
                            onClick={() => setEditingClient(item)}
                            className='inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'
                            aria-label='Editar cliente'
                          >
                            <Pencil size={16} />
                          </button>
                        ) : (
                          <span className='text-xs text-amber-700 dark:text-amber-400'>
                            Solo el creador
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {totalPages > 1 && (
              <div className='mt-6 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-zinc-800'>
                <div className='text-sm text-slate-600 dark:text-zinc-300'>
                  Página <span className='font-semibold'>{validPage}</span> de{' '}
                  <span className='font-semibold'>{totalPages}</span>
                </div>

                <div className='flex gap-1'>
                  <button
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    disabled={validPage === 1}
                    className='rounded-lg border border-slate-300 px-3 py-1 text-sm font-medium text-slate-600 transition hover:enabled:border-slate-400 hover:enabled:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:enabled:border-zinc-600 dark:hover:enabled:bg-zinc-950'
                  >
                    Anterior
                  </button>

                  {paginationRange.map((page, index) => (
                    <button
                      key={`${page}-${index}`}
                      onClick={() => {
                        if (typeof page === 'number') setCurrentPage(page);
                      }}
                      disabled={page === '...'}
                      className={`rounded-lg px-3 py-1 text-sm font-medium transition ${
                        page === validPage
                          ? 'border border-slate-900 bg-slate-900 text-white dark:border-zinc-700 dark:bg-zinc-900'
                          : page === '...'
                            ? 'cursor-default text-slate-400 dark:text-zinc-500'
                            : 'border border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-950'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }
                    disabled={validPage === totalPages}
                    className='rounded-lg border border-slate-300 px-3 py-1 text-sm font-medium text-slate-600 transition hover:enabled:border-slate-400 hover:enabled:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:enabled:border-zinc-600 dark:hover:enabled:bg-zinc-950'
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showCreateForm && (
            <ClientModal
              title='Agregar Cliente'
              isSubmitting={isSubmitting}
              onClose={() => setShowCreateForm(false)}
              onSubmit={handleCreateSubmit}
              initialValues={emptyClientForm}
              submitLabel='Guardar Cliente'
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {editingClient && (
            <ClientModal
              title='Editar Cliente'
              isSubmitting={isSubmitting}
              onClose={() => setEditingClient(null)}
              onSubmit={handleEditSubmit}
              initialValues={{
                names: editingClient.names,
                first_last_name: editingClient.firstLastName,
                second_last_name: editingClient.secondLastName,
                type_document: editingClient.typeDocument || 'CI',
                n_document: editingClient.documentNumber?.toString() ?? '',
                email: editingClient.email,
                cellphone: editingClient.cellphone?.toString() ?? '',
                location: editingClient.location,
                genre: editingClient.genre,
                marital_status: editingClient.maritalStatus,
                occupation: editingClient.occupation,
              }}
              submitLabel='Guardar cambios'
            />
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function ClientModal({
  title,
  isSubmitting,
  onClose,
  onSubmit,
  initialValues,
  submitLabel,
}: {
  title: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  initialValues: ClientFormState;
  submitLabel: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className='max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-black md:p-10'
      >
        <div className='mb-6 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-zinc-800'>
          <h2 className='text-2xl font-bold text-slate-900 dark:text-white'>
            {title}
          </h2>
          <button
            type='button'
            onClick={onClose}
            className='rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-zinc-900'
            aria-label='Cerrar'
          >
            <X size={24} className='text-slate-600 dark:text-zinc-300' />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className='grid grid-cols-1 gap-5 md:grid-cols-2'
        >
          <ClientInput
            name='names'
            label='Nombres'
            required
            defaultValue={initialValues.names}
          />
          <ClientInput
            name='first_last_name'
            label='Apellido Paterno'
            required
            defaultValue={initialValues.first_last_name}
          />
          <ClientInput
            name='second_last_name'
            label='Apellido Materno'
            defaultValue={initialValues.second_last_name}
          />

          <div className='flex flex-col gap-1.5'>
            <label className='ml-1 text-[13px] font-semibold text-slate-700 dark:text-zinc-300'>
              Tipo de Documento
            </label>
            <select
              name='type_document'
              defaultValue={initialValues.type_document}
              className='h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100'
            >
              <option value='CI'>Cedula de Identidad</option>
              <option value='Passport'>Pasaporte</option>
              <option value='NIT'>NIT</option>
            </select>
          </div>

          <ClientInput
            name='n_document'
            label='N de Documento'
            type='number'
            defaultValue={initialValues.n_document}
          />
          <ClientInput
            name='email'
            label='Email'
            type='email'
            defaultValue={initialValues.email}
          />
          <ClientInput
            name='cellphone'
            label='Telefono'
            type='number'
            defaultValue={initialValues.cellphone}
          />
          <ClientInput
            name='occupation'
            label='Ocupacion'
            defaultValue={initialValues.occupation}
          />
          <ClientInput
            name='genre'
            label='Genero'
            defaultValue={initialValues.genre}
          />
          <ClientInput
            name='marital_status'
            label='Estado Civil'
            defaultValue={initialValues.marital_status}
          />

          <div className='md:col-span-2'>
            <ClientInput
              name='location'
              label='Direccion de Domicilio'
              defaultValue={initialValues.location}
            />
          </div>

          <div className='mt-4 flex items-center justify-end gap-4 border-t border-slate-100 pt-6 dark:border-zinc-800 md:col-span-2'>
            <button
              type='button'
              onClick={onClose}
              className='px-6 py-2.5 text-sm font-bold text-slate-500 transition-colors hover:text-slate-800 dark:text-zinc-300 dark:hover:text-white'
            >
              Cancelar
            </button>
            <button
              disabled={isSubmitting}
              type='submit'
              className='flex items-center gap-2 rounded-xl bg-slate-900 px-10 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg transition-all hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60'
            >
              {isSubmitting ? (
                <span className='flex items-center gap-2'>
                  <div className='h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                  Guardando...
                </span>
              ) : (
                <>
                  <CheckCircle2 size={18} /> {submitLabel}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function ClientInput({
  label,
  name,
  type = 'text',
  required = false,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: 'text' | 'number' | 'email';
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div className='flex flex-col gap-1.5'>
      <label className='ml-1 text-[13px] font-semibold text-slate-700 dark:text-zinc-300'>
        {label} {required && <span className='text-red-500'>*</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className='h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500'
      />
    </div>
  );
}
