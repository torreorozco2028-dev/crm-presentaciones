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
  X,
} from 'lucide-react';
import {
  createSaleAction,
  getSalesSetupDataAction,
  registerClientAction,
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
  sales: Array<{
    id: string;
    userId: string;
    unitId: string;
    clientName: string;
    unitLabel: string;
    state: UnitState;
    finalPrice: number | null;
    salesDate: string | null;
    updatedAt: string | null;
    lastUpdatedBy: { id: string; name: string | null; email: string | null };
    canUpdate: boolean;
  }>;
}

export default function ClientsPart() {
  const [showClientForm, setShowClientForm] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isClientSuccess, setIsClientSuccess] = useState(false);
  const [isClientLoading, setIsClientLoading] = useState(false);

  const [isSalesLoading, setIsSalesLoading] = useState(false);
  const [isSaleSubmitting, setIsSaleSubmitting] = useState(false);
  const [isSaleSuccess, setIsSaleSuccess] = useState(false);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [salesData, setSalesData] = useState<SalesSetupData | null>(null);

  useEffect(() => {
    void loadSalesData();
  }, []);

  async function loadSalesData() {
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

    setSalesData(data as any);
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
      await loadSalesData();
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
    await loadSalesData();
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

    setSalesData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        units: prev.units.map((unit) =>
          unit.id === unitId ? { ...unit, state } : unit
        ),
        sales: prev.sales.map((sale) =>
          sale.id === saleId
            ? {
                ...sale,
                state,
                updatedAt:
                  'updatedAt' in result
                    ? (result.updatedAt ?? sale.updatedAt)
                    : sale.updatedAt,
                lastUpdatedBy:
                  'updatedBy' in result && result.updatedBy
                    ? {
                        id: result.updatedBy.id,
                        name: result.updatedBy.name,
                        email: result.updatedBy.email,
                      }
                    : sale.lastUpdatedBy,
              }
            : sale
        ),
      };
    });
  }

  const filteredSales = useMemo(() => {
    if (!salesData) return [];
    if (!searchQuery.trim()) return salesData.sales;

    const query = searchQuery.toLowerCase().trim();
    return salesData.sales.filter(
      (sale) =>
        sale.clientName.toLowerCase().includes(query) ||
        sale.unitLabel.toLowerCase().includes(query) ||
        sale.id.toLowerCase().includes(query)
    );
  }, [salesData, searchQuery]);

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const validPage = Math.min(currentPage, Math.max(1, totalPages));

  const paginatedSales = useMemo(() => {
    const start = (validPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredSales.slice(start, end);
  }, [filteredSales, validPage]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setCurrentPage(1);
  }, []);

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
    () => (salesData?.units ?? []).filter((unit) => unit.state !== 3),
    [salesData]
  );

  return (
    <section className='relative z-10 bg-white px-6 py-8 dark:bg-slate-950'>
      <div className='mx-auto max-w-6xl'>
        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900'>
          <div className='flex flex-col gap-4 border-b border-slate-100 p-5 dark:border-slate-700 md:flex-row md:items-center md:justify-between'>
            <div>
              <h2 className='text-xl font-bold text-slate-900 dark:text-white'>
                Ventas y Reservas
              </h2>
              <p className='text-sm text-slate-500 dark:text-slate-400'>
                Tabla principal con estado, usuario responsable y ultima
                actualizacion
              </p>
            </div>

            <div className='flex flex-wrap gap-3'>
              <button
                type='button'
                onClick={() => setShowClientForm((prev) => !prev)}
                className='inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800'
              >
                <UserPlus size={16} /> Agregar Cliente
              </button>

              <button
                type='button'
                onClick={() => setShowSaleForm((prev) => !prev)}
                className='inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 dark:bg-emerald-700 dark:hover:bg-emerald-600'
              >
                <HandCoins size={16} /> Agregar Venta
              </button>
            </div>
          </div>

          {salesError && (
            <div className='mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400'>
              {salesError}
            </div>
          )}

          <div className='p-5'>
            <div className='mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
              <div className='relative flex-1'>
                <Search
                  size={18}
                  className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500'
                />
                <input
                  type='text'
                  placeholder='Buscar por cliente, unidad o ID...'
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className='h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500'
                />
              </div>
              {searchQuery && (
                <button
                  onClick={resetFilters}
                  className='inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                >
                  <X size={16} /> Limpiar
                </button>
              )}
            </div>

            {isSalesLoading ? (
              <div className='rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'>
                Cargando ventas...
              </div>
            ) : (
              <div className='overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700'>
                <table className='w-full min-w-[1080px] text-left text-sm'>
                  <thead className='bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400'>
                    <tr>
                      <th className='px-4 py-3 font-semibold'>Cliente</th>
                      <th className='px-4 py-3 font-semibold'>Unidad</th>
                      <th className='px-4 py-3 font-semibold'>Precio</th>
                      <th className='px-4 py-3 font-semibold'>Fecha Venta</th>
                      <th className='px-4 py-3 font-semibold'>Estado</th>
                      <th className='px-4 py-3 font-semibold'>
                        Ultima Actualizacion
                      </th>
                      <th className='px-4 py-3 font-semibold'>Usuario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSales.length === 0 && (
                      <tr className='dark:border-slate-700'>
                        <td
                          colSpan={7}
                          className='px-4 py-6 text-center text-slate-500 dark:text-slate-400'
                        >
                          Aun no hay ventas registradas.
                        </td>
                      </tr>
                    )}

                    {paginatedSales.map((sale) => (
                      <tr
                        key={sale.id}
                        className='border-t border-slate-100 dark:border-slate-700'
                      >
                        <td className='px-4 py-3 text-slate-800 dark:text-slate-200'>
                          {sale.clientName}
                        </td>
                        <td className='px-4 py-3 text-slate-700 dark:text-slate-300'>
                          {sale.unitLabel}
                        </td>
                        <td className='px-4 py-3 text-slate-700 dark:text-slate-300'>
                          {sale.finalPrice
                            ? sale.finalPrice.toLocaleString('es-BO')
                            : '-'}
                        </td>
                        <td className='px-4 py-3 text-slate-700 dark:text-slate-300'>
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
                            className='h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:disabled:bg-slate-700 dark:disabled:text-slate-500'
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
                            <p className='mt-1 text-[11px] text-amber-700 dark:text-amber-500'>
                              Solo el propietario puede modificar.
                            </p>
                          )}
                        </td>
                        <td className='px-4 py-3 text-slate-700 dark:text-slate-300'>
                          {sale.updatedAt
                            ? new Date(sale.updatedAt).toLocaleString('es-BO')
                            : '-'}
                        </td>
                        <td className='px-4 py-3 text-slate-700 dark:text-slate-300'>
                          <div className='font-medium'>
                            {sale.lastUpdatedBy.name ?? 'Sin nombre'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {filteredSales.length > itemsPerPage && (
              <div className='mt-6 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-700'>
                <div className='text-sm text-slate-600 dark:text-slate-400'>
                  Página <span className='font-semibold'>{validPage}</span> de{' '}
                  <span className='font-semibold'>{totalPages}</span>
                </div>

                <div className='flex gap-1'>
                  <button
                    onClick={() => handlePageChange(validPage - 1)}
                    disabled={validPage === 1}
                    className='rounded-lg border border-slate-300 px-3 py-1 text-sm font-medium text-slate-600 transition hover:enabled:border-slate-400 hover:enabled:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-400 dark:hover:enabled:border-slate-500 dark:hover:enabled:bg-slate-800'
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
                          ? 'border border-slate-900 bg-slate-900 text-white dark:border-slate-700 dark:bg-slate-700'
                          : page === '...'
                            ? 'cursor-default text-slate-400 dark:text-slate-600'
                            : 'border border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:bg-slate-800'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => handlePageChange(validPage + 1)}
                    disabled={validPage === totalPages}
                    className='rounded-lg border border-slate-300 px-3 py-1 text-sm font-medium text-slate-600 transition hover:enabled:border-slate-400 hover:enabled:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-400 dark:hover:enabled:border-slate-500 dark:hover:enabled:bg-slate-800'
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
              className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm dark:bg-black/60'
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className='max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-700 dark:bg-slate-900 md:p-10'
              >
                <div className='mb-6 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-700'>
                  <h2 className='text-2xl font-bold text-slate-900 dark:text-white'>
                    Agregar Cliente
                  </h2>
                  <button
                    onClick={() => {
                      setShowClientForm(false);
                      setIsClientSuccess(false);
                    }}
                    className='rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800'
                    aria-label='Cerrar'
                  >
                    <X
                      size={24}
                      className='text-slate-600 dark:text-slate-400'
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
                    <label className='ml-1 text-[13px] font-semibold text-slate-700 dark:text-slate-300'>
                      Tipo de Documento
                    </label>
                    <select
                      name='type_document'
                      className='h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800'
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
                    <label className='ml-1 text-[13px] font-semibold text-slate-700 dark:text-slate-300'>
                      Genero
                    </label>
                    <select
                      name='genre'
                      className='h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800'
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

                  <div className='mt-4 flex items-center justify-end gap-4 border-t border-slate-100 pt-6 dark:border-slate-700 md:col-span-2'>
                    <button
                      type='button'
                      onClick={() => {
                        setShowClientForm(false);
                        setIsClientSuccess(false);
                      }}
                      className='px-6 py-2.5 text-sm font-bold text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                    >
                      Cancelar
                    </button>
                    <button
                      disabled={isClientLoading || isClientSuccess}
                      type='submit'
                      className={`flex items-center gap-2 rounded-xl px-10 py-3 text-sm font-bold uppercase tracking-wider shadow-lg transition-all ${
                        isClientSuccess
                          ? 'bg-emerald-500 text-white shadow-emerald-200 dark:bg-emerald-600 dark:shadow-emerald-900/30'
                          : 'bg-slate-900 text-white shadow-slate-200 hover:bg-blue-600 dark:shadow-slate-900/50 dark:hover:bg-blue-700'
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
              className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm dark:bg-black/60'
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className='max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-700 dark:bg-slate-900 md:p-10'
              >
                <div className='mb-6 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-700'>
                  <h2 className='text-2xl font-bold text-slate-900 dark:text-white'>
                    Agregar Venta
                  </h2>
                  <button
                    onClick={() => {
                      setShowSaleForm(false);
                      setIsSaleSuccess(false);
                      setSalesError(null);
                    }}
                    className='rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800'
                    aria-label='Cerrar'
                  >
                    <X
                      size={24}
                      className='text-slate-600 dark:text-slate-400'
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
                    <label className='ml-1 text-[13px] font-semibold text-slate-700 dark:text-slate-300'>
                      Cliente
                    </label>
                    <select
                      name='clientId'
                      required
                      className='h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800'
                    >
                      <option value=''>Selecciona cliente</option>
                      {(salesData?.clients ?? []).map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.fullName}
                          {client.email ? ` (${client.email})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className='flex flex-col gap-1.5'>
                    <label className='ml-1 text-[13px] font-semibold text-slate-700 dark:text-slate-300'>
                      Unidad
                    </label>
                    <select
                      name='unitId'
                      required
                      className='h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800'
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
                    <label className='ml-1 text-[13px] font-semibold text-slate-700 dark:text-slate-300'>
                      Estado de la Unidad
                    </label>
                    <select
                      name='state'
                      defaultValue='2'
                      className='h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800'
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
                    <label className='ml-1 text-[13px] font-semibold text-slate-700 dark:text-slate-300'>
                      Notas de Pago
                    </label>
                    <textarea
                      name='paymentNotes'
                      rows={3}
                      className='w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-800'
                      placeholder='Detalles adicionales de la venta'
                    />
                  </div>

                  <div className='mt-4 flex items-center justify-end gap-4 border-t border-slate-100 pt-6 dark:border-slate-700 md:col-span-3'>
                    <button
                      type='button'
                      onClick={() => {
                        setShowSaleForm(false);
                        setIsSaleSuccess(false);
                        setSalesError(null);
                      }}
                      className='px-6 py-2.5 text-sm font-bold text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
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
                          ? 'bg-emerald-500 text-white shadow-emerald-200 dark:bg-emerald-600 dark:shadow-emerald-900/30'
                          : 'bg-slate-900 text-white shadow-slate-200 hover:bg-emerald-600 dark:shadow-slate-900/50 dark:hover:bg-emerald-700'
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
    <div className='mt-4 flex items-center gap-2 dark:text-slate-200 md:col-span-3'>
      <div className={`${color} bg-current/10 rounded-lg p-2`}>
        {React.cloneElement(icon as React.ReactElement)}
      </div>
      <span className={`text-sm font-bold uppercase tracking-widest ${color}`}>
        {title}
      </span>
      <div className='ml-2 h-px flex-1 bg-slate-100 dark:bg-slate-700' />
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
      <label className='ml-1 text-[13px] font-semibold text-slate-700 dark:text-slate-300'>
        {label} {required && <span className='text-red-500'>*</span>}
      </label>
      <div className='relative'>
        {icon && (
          <div className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500'>
            {icon}
          </div>
        )}
        <input
          name={name}
          type={type}
          required={required}
          placeholder={`Ej: ${label}...`}
          className={`h-11 w-full rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-800 ${icon ? 'pl-10 pr-4' : 'px-4'}`}
        />
      </div>
    </div>
  );
}
