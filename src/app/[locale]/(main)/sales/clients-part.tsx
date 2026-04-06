'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  CheckCircle2,
  User,
  IdCard,
  MapPin,
  Briefcase,
  HandCoins,
  Home,
  Search,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import {
  createSaleAction,
  deleteSaleAction,
  getSalesListAction,
  getSalesSetupDataAction,
  registerClientAction,
  updateSaleAction,
  updateUnitStateAction,
} from './actions';

type UnitState = 1 | 2 | 3;

const unitStateOptions: Array<{ value: UnitState; label: string }> = [
  { value: 1, label: 'Disponible' },
  { value: 2, label: 'Reservado' },
  { value: 3, label: 'Vendido' },
];

interface SalesSetupData {
  currentUserId: string | null;
  clients: Array<{ id: string; fullName: string; email: string | null }>;
  units: Array<{ id: string; label: string; state: UnitState }>;
  users: Array<{ id: string; name: string; email: string | null }>;
}

interface SaleRow {
  id: string;
  userId: string;
  unitId: string;
  clientId: string;
  clientName: string;
  unitLabel: string;
  detail: string;
  paymentMethod: string;
  paymentNotes: string;
  state: UnitState;
  finalPrice: number | null;
  salesDate: string | null;
  updatedAt: string | null;
  lastUpdatedBy: { id: string; name: string | null; email: string | null };
  canUpdate: boolean;
}

interface SalesListData {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  rows: SaleRow[];
}

export default function ClientsPart() {
  const [showClientForm, setShowClientForm] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [editingSale, setEditingSale] = useState<SaleRow | null>(null);

  const [detailQuery, setDetailQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [unitFilter, setUnitFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [debouncedDetailQuery, setDebouncedDetailQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isClientSuccess, setIsClientSuccess] = useState(false);
  const [isClientLoading, setIsClientLoading] = useState(false);

  const [isSalesLoading, setIsSalesLoading] = useState(false);
  const [isSaleSubmitting, setIsSaleSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null);
  const [isSaleSuccess, setIsSaleSuccess] = useState(false);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [setupData, setSetupData] = useState<SalesSetupData | null>(null);
  const [salesListData, setSalesListData] = useState<SalesListData | null>(
    null
  );

  useEffect(() => {
    void loadSetupData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDetailQuery(detailQuery.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [detailQuery]);

  useEffect(() => {
    if (!setupData) return;
    void loadSalesList();
  }, [
    setupData,
    currentPage,
    debouncedDetailQuery,
    clientFilter,
    unitFilter,
    userFilter,
  ]);

  async function loadSetupData() {
    setIsSalesLoading(true);
    setSalesError(null);

    const result = await getSalesSetupDataAction();
    const data = 'data' in result ? result.data : null;

    if (!result.success || !data) {
      setSalesError(
        result.error ?? 'No se pudo cargar la información de ventas'
      );
      setIsSalesLoading(false);
      return;
    }

    setSetupData(data);
    setIsSalesLoading(false);
  }

  async function loadSalesList() {
    setIsSalesLoading(true);

    const result = await getSalesListAction({
      page: currentPage,
      pageSize: itemsPerPage,
      detailQuery: debouncedDetailQuery,
      clientId: clientFilter,
      unitId: unitFilter,
      userId: userFilter,
    });

    if (!result.success || !('data' in result) || !result.data) {
      setSalesError(result.error ?? 'No se pudo cargar la lista de ventas');
      setIsSalesLoading(false);
      return;
    }

    setSalesListData(result.data);
    setIsSalesLoading(false);
  }

  async function handleClientSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsClientLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const result = await registerClientAction(data);

    setIsClientLoading(false);
    if (result.success) {
      setIsClientSuccess(true);
      setTimeout(() => {
        setIsClientSuccess(false);
        setShowClientForm(false);
      }, 1400);
      await loadSetupData();
    }
  }

  async function handleSaleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaleSubmitting(true);
    setSalesError(null);

    const formData = new FormData(e.currentTarget);
    const clientId = String(formData.get('clientId') ?? '');
    const unitId = String(formData.get('unitId') ?? '');
    const state = Number(formData.get('state') ?? 2) as UnitState;
    const finalPriceRaw = String(formData.get('finalPrice') ?? '').trim();
    const paymentMethod = String(formData.get('paymentMethod') ?? '').trim();
    const paymentNotes = String(formData.get('paymentNotes') ?? '').trim();

    const result = await createSaleAction({
      clientId,
      unitId,
      state,
      finalPrice: finalPriceRaw ? Number(finalPriceRaw) : null,
      paymentMethod,
      paymentNotes,
    });

    setIsSaleSubmitting(false);

    if (!result.success) {
      setSalesError(result.error ?? 'No se pudo registrar la venta');
      return;
    }

    setIsSaleSuccess(true);
    e.currentTarget.reset();
    await Promise.all([loadSetupData(), loadSalesList()]);
    setTimeout(() => {
      setIsSaleSuccess(false);
      setShowSaleForm(false);
    }, 1400);
  }

  async function handleUpdateUnitState(
    saleId: string,
    unitId: string,
    state: UnitState
  ) {
    const result = await updateUnitStateAction(unitId, state);
    if (!result.success) {
      setSalesError(result.error ?? 'No se pudo actualizar el estado');
      return;
    }
    await Promise.all([loadSalesList(), loadSetupData()]);
  }

  async function handleDeleteSale(saleId: string) {
    const confirmed = window.confirm(
      'Esta acción eliminará la reserva y liberará la unidad. ¿Deseas continuar?'
    );
    if (!confirmed) return;

    setDeletingSaleId(saleId);
    setSalesError(null);

    const result = await deleteSaleAction(saleId);
    setDeletingSaleId(null);

    if (!result.success) {
      setSalesError(result.error ?? 'No se pudo eliminar la reserva');
      return;
    }

    await Promise.all([loadSalesList(), loadSetupData()]);
  }

  async function handleEditSaleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingSale) return;

    setIsEditSubmitting(true);
    setSalesError(null);

    const formData = new FormData(e.currentTarget);
    const finalPriceRaw = String(formData.get('finalPrice') ?? '').trim();
    const paymentMethod = String(formData.get('paymentMethod') ?? '').trim();
    const paymentNotes = String(formData.get('paymentNotes') ?? '').trim();

    const result = await updateSaleAction({
      saleId: editingSale.id,
      finalPrice: finalPriceRaw ? Number(finalPriceRaw) : null,
      paymentMethod,
      paymentNotes,
    });

    setIsEditSubmitting(false);

    if (!result.success) {
      setSalesError(result.error ?? 'No se pudo editar la reserva');
      return;
    }

    setEditingSale(null);
    await loadSalesList();
  }

  const paginatedSales = salesListData?.rows ?? [];
  const totalPages = salesListData?.totalPages ?? 1;
  const validPage = salesListData?.page ?? currentPage;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const resetFilters = useCallback(() => {
    setDetailQuery('');
    setClientFilter('all');
    setUnitFilter('all');
    setUserFilter('all');
    setCurrentPage(1);
  }, []);

  const clientOptions = useMemo(() => {
    return setupData?.clients ?? [];
  }, [setupData]);

  const unitOptions = useMemo(() => {
    return setupData?.units ?? [];
  }, [setupData]);

  const userOptions = useMemo(() => {
    return setupData?.users ?? [];
  }, [setupData]);

  const getPaginationRange = () => {
    const delta = 2;
    const range: (number | string)[] = [];
    for (
      let i = Math.max(1, validPage - delta);
      i <= Math.min(totalPages, validPage + delta);
      i++
    ) {
      range.push(i);
    }
    if (range[0] !== 1) range.unshift('...');
    if (range[range.length - 1] !== totalPages) range.push('...');
    return range;
  };

  const saleableUnits = useMemo(
    () => (setupData?.units ?? []).filter((unit) => unit.state !== 3),
    [setupData]
  );

  return (
    <section className='relative z-10 bg-white px-3 py-8 dark:bg-black sm:px-4 lg:px-6'>
      <div className='mx-auto w-full max-w-[1700px]'>
        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-black'>
          <div className='flex flex-col gap-4 border-b border-slate-100 p-5 dark:border-zinc-800 md:flex-row md:items-center md:justify-between'>
            <div>
              <h2 className='text-xl font-bold text-slate-900 dark:text-zinc-100'>
                Ventas y Reservas
              </h2>
              <p className='text-sm text-slate-500 dark:text-zinc-400'>
                Tabla principal con estado, usuario responsable y ultima
                actualizacion
              </p>
            </div>

            <div className='flex flex-wrap gap-3'>
              <button
                type='button'
                onClick={() => setShowClientForm((prev) => !prev)}
                className='inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-950'
              >
                <UserPlus size={16} /> Agregar Cliente
              </button>

              <button
                type='button'
                onClick={() => setShowSaleForm((prev) => !prev)}
                className='inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600'
              >
                <HandCoins size={16} /> Agregar Venta
              </button>
            </div>
          </div>

          {salesError && (
            <div className='mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300'>
              {salesError}
            </div>
          )}

          <div className='p-5'>
            <div className='mb-4 grid grid-cols-1 gap-3 lg:grid-cols-12'>
              <div className='relative lg:col-span-4'>
                <Search
                  size={16}
                  className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500'
                />
                <input
                  value={detailQuery}
                  onChange={(event) => {
                    setDetailQuery(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder='Filtrar texto (metodo, notas, cliente, unidad)'
                  className='h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500'
                />
              </div>

              <div className='lg:col-span-2'>
                <select
                  value={clientFilter}
                  onChange={(event) => {
                    setClientFilter(event.target.value);
                    setCurrentPage(1);
                  }}
                  className='h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100'
                >
                  <option value='all'>Todos los clientes</option>
                  {clientOptions.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className='lg:col-span-2'>
                <select
                  value={unitFilter}
                  onChange={(event) => {
                    setUnitFilter(event.target.value);
                    setCurrentPage(1);
                  }}
                  className='h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100'
                >
                  <option value='all'>Todas las unidades</option>
                  {unitOptions.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className='lg:col-span-2'>
                <select
                  value={userFilter}
                  onChange={(event) => {
                    setUserFilter(event.target.value);
                    setCurrentPage(1);
                  }}
                  className='h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100'
                >
                  <option value='all'>Todos los usuarios</option>
                  {userOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className='lg:col-span-2'>
                <button
                  type='button'
                  onClick={resetFilters}
                  className='inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-950'
                >
                  <X size={14} /> Limpiar
                </button>
              </div>
            </div>

            {isSalesLoading ? (
              <div className='rounded-xl border border-slate-200 p-6 text-sm text-slate-500 dark:border-zinc-800 dark:text-zinc-400'>
                Cargando ventas...
              </div>
            ) : (
              <>
                <div className='hidden overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800 lg:block'>
                  <table className='w-full min-w-[1350px] text-left text-sm'>
                    <thead className='bg-slate-50 text-slate-600 dark:bg-zinc-950 dark:text-zinc-300'>
                      <tr>
                        <th className='px-4 py-3 font-semibold'>Cliente</th>
                        <th className='px-4 py-3 font-semibold'>Unidad</th>
                        <th className='px-4 py-3 font-semibold'>Metodo Pago</th>
                        <th className='px-4 py-3 font-semibold'>Notas Pago</th>
                        <th className='px-4 py-3 font-semibold'>Precio</th>
                        <th className='px-4 py-3 font-semibold'>Fecha Venta</th>
                        <th className='px-4 py-3 font-semibold'>Estado</th>
                        <th className='px-4 py-3 font-semibold'>
                          Ultima Actualizacion
                        </th>
                        <th className='px-4 py-3 font-semibold'>Usuario</th>
                        <th className='px-4 py-3 font-semibold'>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSales.length === 0 && (
                        <tr>
                          <td
                            colSpan={10}
                            className='px-4 py-6 text-center text-slate-500 dark:text-zinc-400'
                          >
                            Aun no hay ventas registradas.
                          </td>
                        </tr>
                      )}

                      {paginatedSales.map((sale) => (
                        <tr
                          key={sale.id}
                          className='border-t border-slate-100 dark:border-zinc-800'
                        >
                          <td className='px-4 py-3 text-slate-800 dark:text-zinc-100'>
                            {sale.clientName}
                          </td>
                          <td className='px-4 py-3 text-slate-700 dark:text-zinc-300'>
                            {sale.unitLabel}
                          </td>
                          <td className='max-w-44 px-4 py-3 text-slate-700 dark:text-zinc-300'>
                            <span className='line-clamp-2'>
                              {sale.paymentMethod || '-'}
                            </span>
                          </td>
                          <td className='max-w-64 px-4 py-3 text-slate-700 dark:text-zinc-300'>
                            <span className='line-clamp-2'>
                              {sale.paymentNotes || '-'}
                            </span>
                          </td>
                          <td className='px-4 py-3 text-slate-700 dark:text-zinc-300'>
                            {sale.finalPrice
                              ? sale.finalPrice.toLocaleString('es-BO')
                              : '-'}
                          </td>
                          <td className='px-4 py-3 text-slate-700 dark:text-zinc-300'>
                            {sale.salesDate
                              ? new Date(sale.salesDate).toLocaleDateString(
                                  'es-BO'
                                )
                              : '-'}
                          </td>
                          <td className='px-4 py-3'>
                            <select
                              value={sale.state}
                              disabled={!sale.canUpdate}
                              onChange={(event) => {
                                const value = Number(
                                  event.target.value
                                ) as UnitState;
                                void handleUpdateUnitState(
                                  sale.id,
                                  sale.unitId,
                                  value
                                );
                              }}
                              className='h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500'
                            >
                              {unitStateOptions.map((option) => (
                                <option
                                  key={`${sale.id}-${option.value}`}
                                  value={option.value}
                                >
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            {!sale.canUpdate && (
                              <p className='mt-1 text-[11px] text-amber-700 dark:text-amber-400'>
                                Solo el propietario puede modificar.
                              </p>
                            )}
                          </td>
                          <td className='px-4 py-3 text-slate-700 dark:text-zinc-300'>
                            {sale.updatedAt
                              ? new Date(sale.updatedAt).toLocaleString('es-BO')
                              : '-'}
                          </td>
                          <td className='px-4 py-3 text-slate-700 dark:text-zinc-300'>
                            <div className='font-medium'>
                              {sale.lastUpdatedBy.name ?? 'Sin nombre'}
                            </div>
                          </td>
                          <td className='px-4 py-3'>
                            {sale.canUpdate ? (
                              <div className='flex items-center gap-2'>
                                <button
                                  type='button'
                                  onClick={() => setEditingSale(sale)}
                                  className='inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'
                                  aria-label='Editar reserva'
                                  title='Editar reserva'
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  type='button'
                                  onClick={() => void handleDeleteSale(sale.id)}
                                  disabled={deletingSaleId === sale.id}
                                  className='inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950'
                                  aria-label='Eliminar reserva'
                                  title='Eliminar reserva'
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ) : (
                              <span className='text-xs text-slate-400 dark:text-zinc-500'>
                                -
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className='space-y-3 lg:hidden'>
                  {paginatedSales.length === 0 && (
                    <div className='rounded-xl border border-slate-200 p-4 text-sm text-slate-500 dark:border-zinc-800 dark:text-zinc-400'>
                      Aun no hay ventas registradas.
                    </div>
                  )}

                  {paginatedSales.map((sale) => (
                    <div
                      key={sale.id}
                      className='rounded-xl border border-slate-200 p-4 dark:border-zinc-800'
                    >
                      <div className='mb-3 grid grid-cols-2 gap-2 text-sm'>
                        <p className='text-slate-500 dark:text-zinc-400'>
                          Cliente
                        </p>
                        <p className='text-right font-medium text-slate-800 dark:text-zinc-100'>
                          {sale.clientName}
                        </p>
                        <p className='text-slate-500 dark:text-zinc-400'>
                          Unidad
                        </p>
                        <p className='text-right text-slate-700 dark:text-zinc-300'>
                          {sale.unitLabel}
                        </p>
                        <p className='text-slate-500 dark:text-zinc-400'>
                          Metodo
                        </p>
                        <p className='text-right text-slate-700 dark:text-zinc-300'>
                          {sale.paymentMethod || '-'}
                        </p>
                        <p className='text-slate-500 dark:text-zinc-400'>
                          Notas
                        </p>
                        <p className='text-right text-slate-700 dark:text-zinc-300'>
                          {sale.paymentNotes || '-'}
                        </p>
                      </div>

                      <div className='mb-3'>
                        <select
                          value={sale.state}
                          disabled={!sale.canUpdate}
                          onChange={(event) => {
                            const value = Number(
                              event.target.value
                            ) as UnitState;
                            void handleUpdateUnitState(
                              sale.id,
                              sale.unitId,
                              value
                            );
                          }}
                          className='h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500'
                        >
                          {unitStateOptions.map((option) => (
                            <option
                              key={`${sale.id}-${option.value}`}
                              value={option.value}
                            >
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className='flex items-center justify-between'>
                        <p className='text-xs text-slate-500 dark:text-zinc-400'>
                          {sale.lastUpdatedBy.name ?? 'Sin nombre'}
                        </p>
                        {sale.canUpdate ? (
                          <div className='flex items-center gap-2'>
                            <button
                              type='button'
                              onClick={() => setEditingSale(sale)}
                              className='inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'
                              aria-label='Editar reserva'
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type='button'
                              onClick={() => void handleDeleteSale(sale.id)}
                              disabled={deletingSaleId === sale.id}
                              className='inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950'
                              aria-label='Eliminar reserva'
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ) : (
                          <span className='text-xs text-amber-700 dark:text-amber-400'>
                            Solo propietario
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
                    onClick={() => handlePageChange(validPage - 1)}
                    disabled={validPage === 1}
                    className='rounded-lg border border-slate-300 px-3 py-1 text-sm font-medium text-slate-600 transition hover:enabled:border-slate-400 hover:enabled:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:enabled:border-zinc-600 dark:hover:enabled:bg-zinc-950'
                  >
                    Anterior
                  </button>

                  {getPaginationRange().map((page, idx) => (
                    <button
                      key={idx}
                      onClick={() =>
                        typeof page === 'number' && handlePageChange(page)
                      }
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
                    onClick={() => handlePageChange(validPage + 1)}
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
          {showClientForm && (
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
                className='max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-black md:p-10'
              >
                <div className='mb-6 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-zinc-800'>
                  <h2 className='text-2xl font-bold text-slate-900 dark:text-white'>
                    Agregar Cliente
                  </h2>
                  <button
                    onClick={() => {
                      setShowClientForm(false);
                      setIsClientSuccess(false);
                    }}
                    className='rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-zinc-900'
                    aria-label='Cerrar'
                  >
                    <X
                      size={24}
                      className='text-slate-600 dark:text-zinc-300'
                    />
                  </button>
                </div>
                <form
                  onSubmit={handleClientSubmit}
                  className='grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2'
                >
                  <SectionHeader
                    icon={<User size={16} />}
                    title='Identidad del Cliente'
                    color='text-blue-600'
                  />

                  <InputField name='names' label='Nombres' required />
                  <InputField
                    name='first_last_name'
                    label='Apellido Paterno'
                    required
                  />
                  <InputField
                    name='second_last_name'
                    label='Apellido Materno'
                  />

                  <SectionHeader
                    icon={<IdCard size={16} />}
                    title='Documentacion y Contacto'
                    color='text-emerald-600'
                  />

                  <div className='flex flex-col gap-1.5'>
                    <label className='ml-1 text-[13px] font-semibold text-slate-700 dark:text-zinc-300'>
                      Tipo de Documento
                    </label>
                    <select
                      name='type_document'
                      className='h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100'
                    >
                      <option value='CI'>Cedula de Identidad</option>
                      <option value='Passport'>Pasaporte</option>
                      <option value='NIT'>NIT</option>
                    </select>
                  </div>
                  <InputField
                    name='n_document'
                    label='N de Documento'
                    type='number'
                  />
                  <InputField name='email' label='Email' type='email' />
                  <InputField name='cellphone' label='Telefono' type='number' />

                  <SectionHeader
                    icon={<Briefcase size={16} />}
                    title='Perfil de Interes'
                    color='text-indigo-600'
                  />

                  <InputField name='occupation' label='Ocupacion' />
                  <div className='flex flex-col gap-1.5'>
                    <label className='ml-1 text-[13px] font-semibold text-slate-700 dark:text-zinc-300'>
                      Genero
                    </label>
                    <select
                      name='genre'
                      className='h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100'
                    >
                      <option value='M'>Masculino</option>
                      <option value='F'>Femenino</option>
                      <option value='O'>Otro</option>
                    </select>
                  </div>
                  <InputField name='marital_status' label='Estado Civil' />

                  <div className='md:col-span-3'>
                    <InputField
                      name='location'
                      label='Direccion de Domicilio'
                      icon={<MapPin size={14} />}
                    />
                  </div>

                  <div className='mt-4 flex items-center justify-end gap-4 border-t border-slate-100 pt-6 dark:border-zinc-800 md:col-span-2'>
                    <button
                      type='button'
                      onClick={() => {
                        setShowClientForm(false);
                        setIsClientSuccess(false);
                      }}
                      className='px-6 py-2.5 text-sm font-bold text-slate-500 transition-colors hover:text-slate-800 dark:text-zinc-300 dark:hover:text-white'
                    >
                      Cancelar
                    </button>
                    <button
                      disabled={isClientLoading || isClientSuccess}
                      type='submit'
                      className={`flex items-center gap-2 rounded-xl px-10 py-3 text-sm font-bold uppercase tracking-wider shadow-lg transition-all ${
                        isClientSuccess
                          ? 'bg-emerald-500 text-white shadow-emerald-200'
                          : 'bg-slate-900 text-white shadow-slate-200 hover:bg-emerald-600'
                      }`}
                    >
                      {isClientLoading ? (
                        <span className='flex items-center gap-2'>
                          <div className='h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                          Procesando...
                        </span>
                      ) : isClientSuccess ? (
                        <>
                          <CheckCircle2 size={18} /> Registrado
                        </>
                      ) : (
                        'Guardar Cliente'
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSaleForm && (
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
                className='max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-black md:p-10'
              >
                <div className='mb-6 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-zinc-800'>
                  <h2 className='text-2xl font-bold text-slate-900 dark:text-white'>
                    Agregar Venta
                  </h2>
                  <button
                    onClick={() => {
                      setShowSaleForm(false);
                      setIsSaleSuccess(false);
                      setSalesError(null);
                    }}
                    className='rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-zinc-900'
                    aria-label='Cerrar'
                  >
                    <X
                      size={24}
                      className='text-slate-600 dark:text-zinc-300'
                    />
                  </button>
                </div>
                <form
                  onSubmit={handleSaleSubmit}
                  className='grid grid-cols-1 gap-5 md:grid-cols-3'
                >
                  <SectionHeader
                    icon={<Home size={16} />}
                    title='Datos de la Venta'
                    color='text-emerald-600'
                  />

                  <div className='flex flex-col gap-1.5'>
                    <label className='ml-1 text-[13px] font-semibold text-slate-700 dark:text-zinc-300'>
                      Cliente
                    </label>
                    <select
                      name='clientId'
                      required
                      className='h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100'
                    >
                      <option value=''>Selecciona cliente</option>
                      {(setupData?.clients ?? []).map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.fullName}
                          {client.email ? ` (${client.email})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className='flex flex-col gap-1.5'>
                    <label className='ml-1 text-[13px] font-semibold text-slate-700 dark:text-zinc-300'>
                      Unidad
                    </label>
                    <select
                      name='unitId'
                      required
                      className='h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100'
                    >
                      <option value=''>Selecciona unidad</option>
                      {saleableUnits.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.label} - {stateLabel(unit.state)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className='flex flex-col gap-1.5'>
                    <label className='ml-1 text-[13px] font-semibold text-slate-700 dark:text-zinc-300'>
                      Estado de la Unidad
                    </label>
                    <select
                      name='state'
                      defaultValue='2'
                      className='h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100'
                    >
                      {unitStateOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <InputField
                    name='finalPrice'
                    label='Precio Final'
                    type='number'
                  />
                  <InputField name='paymentMethod' label='Metodo de Pago' />

                  <div className='flex flex-col gap-1.5 md:col-span-3'>
                    <label className='ml-1 text-[13px] font-semibold text-slate-700 dark:text-zinc-300'>
                      Notas de Pago
                    </label>
                    <textarea
                      name='paymentNotes'
                      rows={3}
                      className='w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500'
                      placeholder='Detalles adicionales de la venta'
                    />
                  </div>

                  <div className='mt-4 flex items-center justify-end gap-4 border-t border-slate-100 pt-6 dark:border-zinc-800 md:col-span-3'>
                    <button
                      type='button'
                      onClick={() => {
                        setShowSaleForm(false);
                        setIsSaleSuccess(false);
                        setSalesError(null);
                      }}
                      className='px-6 py-2.5 text-sm font-bold text-slate-500 transition-colors hover:text-slate-800 dark:text-zinc-300 dark:hover:text-white'
                    >
                      Cancelar
                    </button>
                    <button
                      disabled={
                        isSalesLoading || isSaleSubmitting || isSaleSuccess
                      }
                      type='submit'
                      className={`flex items-center gap-2 rounded-xl px-10 py-3 text-sm font-bold uppercase tracking-wider shadow-lg transition-all ${
                        isSaleSuccess
                          ? 'bg-emerald-500 text-white shadow-emerald-200'
                          : 'bg-slate-900 text-white shadow-slate-200 hover:bg-emerald-600'
                      }`}
                    >
                      {isSaleSubmitting ? (
                        <span className='flex items-center gap-2'>
                          <div className='h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                          Guardando venta...
                        </span>
                      ) : isSaleSuccess ? (
                        <>
                          <CheckCircle2 size={18} /> Venta registrada
                        </>
                      ) : (
                        'Guardar Venta'
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {editingSale && (
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
                className='w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-black'
              >
                <div className='mb-5 flex items-center justify-between border-b border-slate-200 pb-3 dark:border-zinc-800'>
                  <div>
                    <h3 className='text-lg font-bold text-slate-900 dark:text-zinc-100'>
                      Editar Reserva
                    </h3>
                    <p className='text-xs text-slate-500 dark:text-zinc-400'>
                      Solo el usuario creador puede editar.
                    </p>
                  </div>
                  <button
                    type='button'
                    onClick={() => setEditingSale(null)}
                    className='rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-zinc-900'
                    aria-label='Cerrar'
                  >
                    <X
                      size={20}
                      className='text-slate-600 dark:text-zinc-300'
                    />
                  </button>
                </div>

                <form onSubmit={handleEditSaleSubmit} className='space-y-4'>
                  <div className='rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400'>
                    <p>
                      <span className='font-semibold'>Cliente:</span>{' '}
                      {editingSale.clientName}
                    </p>
                    <p>
                      <span className='font-semibold'>Unidad:</span>{' '}
                      {editingSale.unitLabel}
                    </p>
                  </div>

                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <div className='flex flex-col gap-1.5'>
                      <label className='ml-1 text-[13px] font-semibold text-slate-700 dark:text-zinc-300'>
                        Precio Final
                      </label>
                      <input
                        name='finalPrice'
                        type='number'
                        defaultValue={editingSale.finalPrice ?? ''}
                        className='h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100'
                      />
                    </div>

                    <div className='flex flex-col gap-1.5'>
                      <label className='ml-1 text-[13px] font-semibold text-slate-700 dark:text-zinc-300'>
                        Metodo de Pago
                      </label>
                      <input
                        name='paymentMethod'
                        type='text'
                        defaultValue={editingSale.paymentMethod}
                        className='h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100'
                      />
                    </div>
                  </div>

                  <div className='flex flex-col gap-1.5'>
                    <label className='ml-1 text-[13px] font-semibold text-slate-700 dark:text-zinc-300'>
                      Notas de Pago
                    </label>
                    <textarea
                      name='paymentNotes'
                      rows={3}
                      defaultValue={editingSale.paymentNotes}
                      className='w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500'
                    />
                  </div>

                  <div className='flex items-center justify-end gap-3 pt-2'>
                    <button
                      type='button'
                      onClick={() => setEditingSale(null)}
                      className='px-5 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-zinc-100'
                    >
                      Cancelar
                    </button>
                    <button
                      type='submit'
                      disabled={isEditSubmitting}
                      className='inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60'
                    >
                      {isEditSubmitting ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function stateLabel(state: UnitState) {
  return (
    unitStateOptions.find((item) => item.value === state)?.label ?? 'Disponible'
  );
}

function SectionHeader({
  icon,
  title,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
}) {
  return (
    <div className='mt-4 flex items-center gap-2 md:col-span-3'>
      <div className={`${color} bg-current/10 rounded-lg p-2`}>
        {React.cloneElement(icon as React.ReactElement)}
      </div>
      <span className={`text-sm font-bold uppercase tracking-widest ${color}`}>
        {title}
      </span>
      <div className='ml-2 h-px flex-1 bg-slate-100 dark:bg-zinc-800' />
    </div>
  );
}

interface InputFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'number' | 'email';
  required?: boolean;
  icon?: React.ReactNode;
}

function InputField({
  label,
  name,
  type = 'text',
  required = false,
  icon,
}: InputFieldProps) {
  return (
    <div className='flex flex-col gap-1.5'>
      <label className='ml-1 text-[13px] font-semibold text-slate-700 dark:text-zinc-300'>
        {label} {required && <span className='text-red-500'>*</span>}
      </label>
      <div className='relative'>
        {icon && (
          <div className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500'>
            {icon}
          </div>
        )}
        <input
          name={name}
          type={type}
          required={required}
          placeholder={`Ej: ${label}...`}
          className={`h-11 w-full rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 ${icon ? 'pl-10 pr-4' : 'px-4'}`}
        />
      </div>
    </div>
  );
}
