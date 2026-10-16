'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import {
  getSalesControlAction,
  getSalesControlBuildingsAction,
} from '../control-actions';
import SaleControlPanel from '@/components/sale-control-panel';
import { createSaleAction, getSalesSetupDataAction } from '../actions';

type ControlData = Extract<
  Awaited<ReturnType<typeof getSalesControlAction>>,
  { success: true }
>['data'];
type Row = ControlData['rows'][number];

const STATE_LABEL: Record<number, string> = {
  1: 'Disponible',
  2: 'Reservado',
  3: 'Vendido',
};
const STATE_ROW: Record<number, string> = {
  1: '',
  2: 'bg-amber-50 dark:bg-amber-950/20',
  3: 'bg-emerald-50 dark:bg-emerald-950/20',
};

const money = (value: number | null) =>
  value == null
    ? '-'
    : value.toLocaleString('es-BO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
type MoneyValue = { bob: number | null; usd: number | null } | null;
// Muestra el monto en bolivianos y en dolares; la moneda sin TC queda marcada.
function Both({ value, quiet }: { value: MoneyValue; quiet?: boolean }) {
  if (!value) return <>-</>;
  return (
    <div className='leading-tight'>
      <div>
        {value.bob == null ? (
          quiet ? null : (
            <Missing />
          )
        ) : (
          `Bs ${money(value.bob)}`
        )}
      </div>
      <div className='text-xs text-slate-500 dark:text-zinc-400'>
        {value.usd == null ? (
          quiet ? null : (
            <Missing />
          )
        ) : (
          `$ ${money(value.usd)}`
        )}
      </div>
    </div>
  );
}
function Missing() {
  return <span className='text-amber-600'>sin TC</span>;
}
const pct = (value: number | null) => (value == null ? '-' : `${value}%`);
const normalize = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const inputCls =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100';

export default function ControlPart() {
  const [buildings, setBuildings] = useState<{ id: string; title: string }[]>(
    []
  );
  const [buildingId, setBuildingId] = useState('');
  const [data, setData] = useState<ControlData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [editing, setEditing] = useState<Row | null>(null);
  const [dragging, setDragging] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });

  // Arrastrar con el mouse desplaza la tabla; si hubo arrastre no se abre la fila.
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || !scrollRef.current)
      return;
    drag.current = {
      active: true,
      startX: e.clientX,
      startLeft: scrollRef.current.scrollLeft,
      moved: false,
    };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active || !scrollRef.current) return;
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) > 5) {
      d.moved = true;
      setDragging(true);
    }
    if (d.moved) scrollRef.current.scrollLeft = d.startLeft - dx;
  };
  const endDrag = () => {
    drag.current.active = false;
    setDragging(false);
  };
  const [loading, startLoading] = useTransition();

  const load = useCallback((id: string) => {
    if (!id) return;
    startLoading(async () => {
      const res = await getSalesControlAction(id);
      if (res.success) {
        setData(res.data);
        setError(null);
      } else {
        setError(res.error ?? 'Error');
      }
    });
  }, []);

  useEffect(() => {
    getSalesControlBuildingsAction().then((res) => {
      if (!res.success) return setError(res.error ?? 'Error');
      setBuildings(res.data);
      if (res.data[0]) setBuildingId(res.data[0].id);
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(buildingId), 400);
    return () => clearTimeout(timer);
  }, [buildingId, load]);

  const rows = useMemo(() => {
    const q = normalize(query.trim());
    return (data?.rows ?? []).filter((row) => {
      if (stateFilter !== 'all' && String(row.state) !== stateFilter)
        return false;
      if (!q) return true;
      return normalize(
        [
          row.unitNumber,
          row.floor,
          row.modelName,
          row.sale?.clientName,
          row.sale?.sellerAgency,
        ].join(' ')
      ).includes(q);
    });
  }, [data, query, stateFilter]);

  const totals = useMemo(() => {
    const sum = (pick: (r: Row) => MoneyValue) => ({
      bob: rows.reduce((acc, r) => acc + (pick(r)?.bob ?? 0), 0),
      usd: rows.reduce((acc, r) => acc + (pick(r)?.usd ?? 0), 0),
    });
    return {
      total: sum((r) => r.totalCost),
      paid: sum((r) => r.paid),
      balance: sum((r) => r.balance),
    };
  }, [rows]);

  const th =
    'whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500 dark:text-zinc-400';
  const td =
    'whitespace-nowrap px-3 py-2 text-sm text-slate-800 dark:text-zinc-200';

  return (
    <div className='mx-auto max-w-[1600px] px-3 pb-10 sm:px-5'>
      <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h1 className='text-xl font-bold text-slate-900 dark:text-zinc-100'>
            Control de ventas
          </h1>
          <p className='text-sm text-slate-500 dark:text-zinc-400'>
            Una fila por unidad: costo, anticipo, aportes y saldo.
          </p>
        </div>
        <Link
          href='/admin/sales'
          className='text-sm font-medium text-emerald-600 hover:underline'
        >
          ← Volver a ventas
        </Link>
      </div>

      {error && (
        <div className='mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
          {error}
        </div>
      )}

      <div className='mb-4 grid grid-cols-1 gap-3 md:grid-cols-12'>
        <select
          value={buildingId}
          onChange={(e) => setBuildingId(e.target.value)}
          className={`${inputCls} md:col-span-3`}
        >
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title}
            </option>
          ))}
        </select>
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className={`${inputCls} md:col-span-2`}
        >
          <option value='all'>Todos los estados</option>
          <option value='1'>Disponible</option>
          <option value='2'>Reservado</option>
          <option value='3'>Vendido</option>
        </select>
        <div className='relative md:col-span-4'>
          <Search
            size={16}
            className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400'
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Buscar unidad, tipo, cliente o vendedor'
            className={`${inputCls} pl-9`}
          />
        </div>
        {data?.pricePerM2 == null && data && (
          <p className='self-center text-xs text-amber-600 md:col-span-3'>
            El edificio no tiene precio por m²; las unidades sin venta no
            muestran costo.
          </p>
        )}
      </div>

      <div className={`space-y-3 md:hidden ${loading ? 'opacity-60' : ''}`}>
        {rows.map((r) => (
          <button
            key={r.unitId}
            type='button'
            onClick={() => setEditing(r)}
            className={`block w-full rounded-xl border border-slate-200 p-3 text-left text-sm text-slate-800 dark:border-zinc-800 dark:text-zinc-200 ${STATE_ROW[r.state] ?? ''}`}
          >
            <div className='flex items-start justify-between gap-2'>
              <div>
                <p className='font-bold'>
                  Unidad {r.unitNumber ?? '-'}{' '}
                  <span className='font-normal text-slate-500 dark:text-zinc-400'>
                    · Piso {r.floor}
                    {r.modelName ? ` · ${r.modelName}` : ''}
                  </span>
                </p>
                <p className='text-xs text-slate-500 dark:text-zinc-400'>
                  {r.sale?.clientName || 'Sin cliente'}
                  {r.sale?.sellerAgency ? ` · ${r.sale.sellerAgency}` : ''}
                </p>
              </div>
              <span className='shrink-0 rounded-full bg-white/70 px-2 py-0.5 text-xs font-medium dark:bg-zinc-900'>
                {STATE_LABEL[r.state] ?? '-'}
              </span>
            </div>
            <dl className='mt-3 grid grid-cols-3 gap-2 text-xs'>
              <div>
                <dt className='text-slate-500 dark:text-zinc-400'>Total</dt>
                <dd className='font-bold'>
                  <Both value={r.totalCost} quiet={!r.sale} />
                </dd>
              </div>
              <div>
                <dt className='text-slate-500 dark:text-zinc-400'>
                  Aportado{' '}
                  {r.paidPercentage != null ? `(${r.paidPercentage}%)` : ''}
                </dt>
                <dd>
                  <Both value={r.paid} />
                </dd>
              </div>
              <div>
                <dt className='text-slate-500 dark:text-zinc-400'>Saldo</dt>
                <dd>
                  <Both value={r.balance} />
                </dd>
              </div>
            </dl>
            <p className='mt-2 text-xs font-medium text-emerald-600'>
              {r.sale ? 'Toca para gestionar' : 'Toca para registrar venta'}
            </p>
          </button>
        ))}
        {rows.length === 0 && (
          <p className='py-6 text-center text-sm text-slate-500'>
            Sin unidades para mostrar
          </p>
        )}
        <div className='rounded-xl bg-slate-50 p-3 text-xs font-bold dark:bg-zinc-900'>
          <p className='mb-2 text-sm'>Totales ({rows.length} unidades)</p>
          <div className='grid grid-cols-3 gap-2'>
            <div>
              <p className='font-normal text-slate-500'>Total</p>
              <Both value={totals.total} />
            </div>
            <div>
              <p className='font-normal text-slate-500'>Aportado</p>
              <Both value={totals.paid} />
            </div>
            <div>
              <p className='font-normal text-slate-500'>Saldo</p>
              <Both value={totals.balance} />
            </div>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={(e) => {
          if (drag.current.moved) {
            e.stopPropagation();
            e.preventDefault();
            drag.current.moved = false;
          }
        }}
        className={`hidden overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800 md:block ${dragging ? 'cursor-grabbing select-none' : 'cursor-grab'} ${loading ? 'opacity-60' : ''}`}
      >
        <table className='min-w-full divide-y divide-slate-200 dark:divide-zinc-800'>
          <thead className='bg-slate-50 dark:bg-zinc-900'>
            <tr>
              {[
                'Unidad',
                'Tipo',
                'Piso',
                'Estado',
                'Cliente',
                'Vendedor',
                'Comisión',
                'Cuotas',
                'Frecuencia',
                'Monto global',
                'Gastos venta',
                'm²',
                'Precio m²',
                'Costo total',
                '% Inicial',
                'Aporte inicial',
                '% Aportado',
                'Aporte a la fecha',
                'Saldo',
                '',
              ].map((h) => (
                <th key={h} className={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-100 dark:divide-zinc-900'>
            {rows.map((r) => (
              <tr
                key={r.unitId}
                onClick={() => setEditing(r)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setEditing(r);
                  }
                }}
                tabIndex={0}
                title={
                  r.sale ? 'Clic para editar' : 'Clic para registrar venta'
                }
                className={`${STATE_ROW[r.state] ?? ''} cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-900`}
              >
                <td className={`${td} font-semibold`}>{r.unitNumber ?? '-'}</td>
                <td className={td}>{r.modelName ?? '-'}</td>
                <td className={td}>{r.floor}</td>
                <td className={td}>{STATE_LABEL[r.state] ?? '-'}</td>
                <td className={td}>{r.sale?.clientName ?? ''}</td>
                <td className={td}>{r.sale?.sellerAgency ?? ''}</td>
                <td className={td}>
                  {r.sale ? (r.sale.hasCommission ? 'SI' : 'NO') : ''}
                </td>
                <td className={td}>
                  {r.sale ? (r.sale.hasInstallments ? 'SI' : 'NO') : ''}
                </td>
                <td className={td}>{r.sale?.paymentFrequency ?? ''}</td>
                <td className={td}>{pct(r.sale?.globalPercentage ?? null)}</td>
                <td className={td}>
                  {pct(r.sale?.salesExpensePercentage ?? null)}
                </td>
                <td className={td}>{r.squareMeters ?? '-'}</td>
                <td className={td}>
                  <Both value={r.pricePerM2} quiet={!r.sale} />
                </td>
                <td className={`${td} font-bold`}>
                  <Both value={r.totalCost} quiet={!r.sale} />
                </td>
                <td className={td}>{pct(r.initialPercentage)}</td>
                <td className={td}>
                  <Both value={r.initialAmount} />
                </td>
                <td className={td}>{pct(r.paidPercentage)}</td>
                <td className={td}>
                  <Both value={r.paid} />
                </td>
                <td className={td}>
                  <Both value={r.balance} />
                </td>
                <td className={td}>
                  <span className='text-sm font-medium text-emerald-600'>
                    {r.sale ? 'Gestionar' : 'Registrar venta'}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className={`${td} text-center`} colSpan={20}>
                  Sin unidades para mostrar
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className='bg-slate-50 font-bold dark:bg-zinc-900'>
            <tr>
              <td className={td} colSpan={13}>
                Totales ({rows.length} unidades)
              </td>
              <td className={td}>
                <Both value={totals.total} />
              </td>
              <td className={td} colSpan={3} />
              <td className={td}>
                <Both value={totals.paid} />
              </td>
              <td className={td}>
                <Both value={totals.balance} />
              </td>
              <td className={td} />
            </tr>
          </tfoot>
        </table>
      </div>
      <p className='mt-2 text-xs text-slate-500'>
        Costo de unidades sin venta = m² × precio por m² del edificio (en USD).
        Cada venta, anticipo y pago maneja su propio tipo de cambio; lo que no
        lo tiene se muestra solo en su moneda original («sin TC»). Los totales
        suman únicamente los montos que ya tienen TC.
      </p>

      {editing && !editing.sale && (
        <CreateSaleModal
          row={editing}
          onClose={() => setEditing(null)}
          onCreated={() => {
            load(buildingId);
            setEditing(null);
          }}
        />
      )}
      {editing?.sale && (
        <ManageModal
          row={editing}
          onClose={() => setEditing(null)}
          onChanged={() => {
            load(buildingId);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function ManageModal({
  row,
  onClose,
  onChanged,
}: {
  row: Row;
  onClose: () => void;
  onChanged: () => void;
}) {
  const sale = row.sale!;
  const [dirty, setDirty] = useState(false);
  const close = () => (dirty ? onChanged() : onClose());

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4'>
      <div className='relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 pt-12 dark:bg-zinc-950 sm:p-6'>
        <button
          type='button'
          aria-label='Cerrar'
          onClick={close}
          className='absolute right-4 top-4 rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
        >
          <X size={18} />
        </button>
        <h2 className='mb-4 text-lg font-bold text-slate-900 dark:text-zinc-100'>
          Unidad {row.unitNumber} · {sale.clientName}
        </h2>
        <SaleControlPanel
          saleId={sale.id}
          showCore
          onChanged={() => setDirty(true)}
        />
        <div className='mt-6 text-right'>
          <button
            type='button'
            onClick={close}
            className='text-sm text-slate-500 hover:underline'
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateSaleModal({
  row,
  onClose,
  onCreated,
}: {
  row: Row;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [clients, setClients] = useState<{ id: string; fullName: string }[]>(
    []
  );
  const [form, setForm] = useState({
    clientId: '',
    state: '2',
    finalPrice: row.totalCost?.usd?.toString() ?? '',
    currency: 'USD',
    exchangeRate: '',
    advanceType: 'percentage',
    advanceValue: '',
    advanceExchangeRate: '',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();

  useEffect(() => {
    getSalesSetupDataAction().then((res) => {
      if (res.success && res.data) setClients(res.data.clients);
      else setMessage(res.error ?? 'No se pudieron cargar los clientes');
    });
  }, []);

  const num = (value: string) => {
    const n = Number(value.replace(',', '.'));
    return value.trim() && Number.isFinite(n) ? n : null;
  };

  const submit = () =>
    startBusy(async () => {
      if (!form.clientId) return setMessage('Selecciona un cliente');
      const advance = num(form.advanceValue);
      const res = await createSaleAction({
        clientId: form.clientId,
        unitId: row.unitId,
        state: Number(form.state) as 1 | 2 | 3,
        finalPrice: num(form.finalPrice),
        currency: form.currency,
        exchangeRate: num(form.exchangeRate),
        advanceExchangeRate: num(form.advanceExchangeRate),
        advanceType: form.advanceType,
        advancePercentage: form.advanceType === 'percentage' ? advance : null,
        advanceAmount: form.advanceType === 'amount' ? advance : null,
      });
      if (res.success) onCreated();
      else setMessage(res.error ?? 'No se pudo registrar la venta');
    });

  const field = (label: string, node: React.ReactNode) => (
    <label className='block text-xs font-medium text-slate-600 dark:text-zinc-400'>
      {label}
      <div className='mt-1'>{node}</div>
    </label>
  );

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4'>
      <div className='relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 pt-12 dark:bg-zinc-950 sm:p-6'>
        <button
          type='button'
          aria-label='Cerrar'
          onClick={onClose}
          className='absolute right-4 top-4 rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
        >
          <X size={18} />
        </button>
        <h2 className='text-lg font-bold text-slate-900 dark:text-zinc-100'>
          Registrar venta · Unidad {row.unitNumber}
        </h2>
        {message && <p className='mt-2 text-sm text-amber-600'>{message}</p>}
        <div className='mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2'>
          {field(
            'Cliente',
            <select
              className={inputCls}
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
            >
              <option value=''>Selecciona…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName}
                </option>
              ))}
            </select>
          )}
          {field(
            'Estado',
            <select
              className={inputCls}
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
            >
              <option value='2'>Reservado</option>
              <option value='3'>Vendido</option>
            </select>
          )}
          {field(
            'Precio final',
            <input
              className={inputCls}
              inputMode='decimal'
              value={form.finalPrice}
              onChange={(e) => setForm({ ...form, finalPrice: e.target.value })}
            />
          )}
          {field(
            'Moneda',
            <select
              className={inputCls}
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            >
              <option value='BOB'>Bs (BOB)</option>
              <option value='USD'>$ (USD)</option>
            </select>
          )}
          {field(
            'TC del total (Bs/USD)',
            <input
              className={inputCls}
              inputMode='decimal'
              value={form.exchangeRate}
              onChange={(e) =>
                setForm({ ...form, exchangeRate: e.target.value })
              }
            />
          )}
          {field(
            'TC del anticipo (Bs/USD)',
            <input
              className={inputCls}
              inputMode='decimal'
              value={form.advanceExchangeRate}
              onChange={(e) =>
                setForm({ ...form, advanceExchangeRate: e.target.value })
              }
            />
          )}
          {field(
            'Tipo de anticipo',
            <select
              className={inputCls}
              value={form.advanceType}
              onChange={(e) =>
                setForm({ ...form, advanceType: e.target.value })
              }
            >
              <option value='percentage'>Porcentaje</option>
              <option value='amount'>Monto</option>
            </select>
          )}
          {field(
            form.advanceType === 'percentage'
              ? 'Anticipo (%)'
              : 'Anticipo (monto)',
            <input
              className={inputCls}
              inputMode='decimal'
              value={form.advanceValue}
              onChange={(e) =>
                setForm({ ...form, advanceValue: e.target.value })
              }
            />
          )}
        </div>
        <p className='mt-3 text-xs text-slate-500'>
          Después podrás completar comisión, cuotas y pagos desde esta misma
          fila.
        </p>
        <div className='mt-5 flex items-center justify-between'>
          <button
            type='button'
            onClick={onClose}
            className='text-sm text-slate-500 hover:underline'
          >
            Cancelar
          </button>
          <button
            type='button'
            disabled={busy}
            onClick={submit}
            className='rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'
          >
            Registrar venta
          </button>
        </div>
      </div>
    </div>
  );
}
