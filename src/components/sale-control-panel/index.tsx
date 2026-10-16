'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import {
  getSaleDetailAction,
  registerSalePaymentAction,
  removeSalePaymentAction,
  saveSaleControlAction,
  updateSaleAction,
} from '@/app/[locale]/admin/(protected)/sales/actions';

type Detail = Extract<
  Awaited<ReturnType<typeof getSaleDetailAction>>,
  { success: true }
>['data'];

const inputCls =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100';

const money = (value: number) =>
  value.toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function num(value: string) {
  const text = value.trim();
  if (!text) return null;
  const n = Number(
    text.includes(',') ? text.replace(/\./g, '').replace(',', '.') : text
  );
  return Number.isFinite(n) ? n : null;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className='block text-xs font-medium text-slate-600 dark:text-zinc-400'>
      {label}
      <div className='mt-1'>{children}</div>
    </label>
  );
}

interface Props {
  saleId: string;
  // Muestra también precio, anticipo y método de pago (la pantalla de ventas ya
  // los edita en su propio formulario).
  showCore?: boolean;
  onChanged?: () => void;
}

// Panel de edición de una venta compartido por la pantalla de ventas y el
// control de ventas. Los permisos los resuelven las acciones (dueño o admin).
export default function SaleControlPanel({
  saleId,
  showCore,
  onChanged,
}: Props) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null
  );
  const [busy, startBusy] = useTransition();

  const load = useCallback(async () => {
    const res = await getSaleDetailAction(saleId);
    if (res.success) setDetail(res.data);
    else setMessage({ ok: false, text: res.error ?? 'Error' });
  }, [saleId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!detail) {
    if (message)
      return <p className='text-sm text-amber-600'>{message.text}</p>;
    return <PanelSkeleton showCore={showCore} />;
  }

  return (
    <PanelBody
      key={detail.id + detail.payments.length}
      detail={detail}
      showCore={showCore}
      message={message}
      busy={busy}
      run={(fn, okText) =>
        startBusy(async () => {
          const res = await fn();
          if (res.success) {
            setMessage({ ok: true, text: okText });
            await load();
            onChanged?.();
          } else {
            setMessage({ ok: false, text: res.error ?? 'Error' });
          }
        })
      }
    />
  );
}

function PanelBody({
  detail,
  showCore,
  message,
  busy,
  run,
}: {
  detail: Detail;
  showCore?: boolean;
  message: { ok: boolean; text: string } | null;
  busy: boolean;
  run: (
    fn: () => Promise<{ success: boolean; error?: string }>,
    okText: string
  ) => void;
}) {
  const [core, setCore] = useState({
    finalPrice: detail.finalPrice?.toString() ?? '',
    currency: detail.currency,
    advanceType: detail.advanceType as string,
    advanceValue:
      (detail.advanceType === 'amount'
        ? detail.advanceAmount
        : detail.advancePercentage
      )?.toString() ?? '',
    paymentMethod: detail.paymentMethod,
    paymentNotes: detail.paymentNotes,
  });
  const [form, setForm] = useState({
    sellerAgency: detail.sellerAgency ?? '',
    hasCommission: detail.hasCommission,
    hasInstallments: detail.hasInstallments,
    paymentFrequency: detail.paymentFrequency ?? '',
    installmentsPercentage: detail.installmentsPercentage?.toString() ?? '',
    globalPercentage: detail.globalPercentage?.toString() ?? '',
    salesExpensePercentage: detail.salesExpensePercentage?.toString() ?? '',
    exchangeRate: detail.exchangeRate?.toString() ?? '',
    advanceExchangeRate: detail.advanceExchangeRate?.toString() ?? '',
  });
  const [payment, setPayment] = useState({
    amount: '',
    currency: detail.currency as string,
    exchangeRate: detail.exchangeRate?.toString() ?? '',
    paidAt: new Date().toISOString().slice(0, 10),
    note: '',
  });

  const saveCore = () =>
    run(() => {
      const advance = num(core.advanceValue);
      return updateSaleAction({
        saleId: detail.id,
        finalPrice: num(core.finalPrice),
        currency: core.currency,
        advanceType: core.advanceType,
        advancePercentage: core.advanceType === 'percentage' ? advance : null,
        advanceAmount: core.advanceType === 'amount' ? advance : null,
        paymentMethod: core.paymentMethod,
        paymentNotes: core.paymentNotes,
      });
    }, 'Datos de la reserva guardados');

  return (
    <div>
      {message && (
        <p
          className={`mb-3 text-sm ${message.ok ? 'text-emerald-600' : 'text-amber-600'}`}
        >
          {message.text}
        </p>
      )}

      {showCore && (
        <>
          <h3 className='text-sm font-semibold text-slate-900 dark:text-zinc-100'>
            Precio y anticipo
          </h3>
          <div className='mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <Field label='Precio final'>
              <input
                className={inputCls}
                inputMode='decimal'
                value={core.finalPrice}
                onChange={(e) =>
                  setCore({ ...core, finalPrice: e.target.value })
                }
              />
            </Field>
            <Field label='Moneda'>
              <select
                className={inputCls}
                value={core.currency}
                onChange={(e) => setCore({ ...core, currency: e.target.value })}
              >
                <option value='BOB'>Bs (BOB)</option>
                <option value='USD'>$ (USD)</option>
              </select>
            </Field>
            <Field label='Tipo de anticipo'>
              <select
                className={inputCls}
                value={core.advanceType}
                onChange={(e) =>
                  setCore({ ...core, advanceType: e.target.value })
                }
              >
                <option value='percentage'>Porcentaje</option>
                <option value='amount'>Monto</option>
              </select>
            </Field>
            <Field
              label={
                core.advanceType === 'percentage'
                  ? 'Anticipo (%)'
                  : 'Anticipo (monto)'
              }
            >
              <input
                className={inputCls}
                inputMode='decimal'
                value={core.advanceValue}
                onChange={(e) =>
                  setCore({ ...core, advanceValue: e.target.value })
                }
              />
            </Field>
            <Field label='Método de pago'>
              <input
                className={inputCls}
                value={core.paymentMethod}
                onChange={(e) =>
                  setCore({ ...core, paymentMethod: e.target.value })
                }
              />
            </Field>
            <Field label='Notas de pago'>
              <input
                className={inputCls}
                value={core.paymentNotes}
                onChange={(e) =>
                  setCore({ ...core, paymentNotes: e.target.value })
                }
              />
            </Field>
          </div>
          <button
            type='button'
            disabled={busy}
            onClick={saveCore}
            className='mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50'
          >
            Guardar precio y anticipo
          </button>
        </>
      )}

      <h3
        className={`${showCore ? 'mt-6' : ''} text-sm font-semibold text-slate-900 dark:text-zinc-100`}
      >
        Datos de control
      </h3>
      <div className='mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <Field label='Vendedor / agencia'>
          <input
            className={inputCls}
            value={form.sellerAgency}
            onChange={(e) => setForm({ ...form, sellerAgency: e.target.value })}
          />
        </Field>
        <Field label='Frecuencia de pago'>
          <input
            className={inputCls}
            placeholder='C/2 meses, 3 pagos…'
            value={form.paymentFrequency}
            onChange={(e) =>
              setForm({ ...form, paymentFrequency: e.target.value })
            }
          />
        </Field>
        <Field label='Monto global (%)'>
          <input
            className={inputCls}
            type='number'
            step='0.01'
            value={form.globalPercentage}
            onChange={(e) =>
              setForm({ ...form, globalPercentage: e.target.value })
            }
          />
        </Field>
        <Field label='Gastos de venta (%)'>
          <input
            className={inputCls}
            type='number'
            step='0.01'
            value={form.salesExpensePercentage}
            onChange={(e) =>
              setForm({ ...form, salesExpensePercentage: e.target.value })
            }
          />
        </Field>
        <Field label={`TC del total (Bs/USD) · precio en ${detail.currency}`}>
          <input
            className={inputCls}
            inputMode='decimal'
            value={form.exchangeRate}
            onChange={(e) => setForm({ ...form, exchangeRate: e.target.value })}
          />
        </Field>
        <Field label='TC del anticipo (Bs/USD)'>
          <input
            className={inputCls}
            inputMode='decimal'
            value={form.advanceExchangeRate}
            onChange={(e) =>
              setForm({ ...form, advanceExchangeRate: e.target.value })
            }
          />
        </Field>
        <Field label='% de cuotas'>
          <input
            className={inputCls}
            type='number'
            value={form.installmentsPercentage}
            onChange={(e) =>
              setForm({ ...form, installmentsPercentage: e.target.value })
            }
          />
        </Field>
        <div className='flex items-end gap-4 pb-2 text-sm text-slate-700 dark:text-zinc-300'>
          <label className='flex items-center gap-2'>
            <input
              type='checkbox'
              checked={form.hasCommission}
              onChange={(e) =>
                setForm({ ...form, hasCommission: e.target.checked })
              }
            />
            Comisión
          </label>
          <label className='flex items-center gap-2'>
            <input
              type='checkbox'
              checked={form.hasInstallments}
              onChange={(e) =>
                setForm({ ...form, hasInstallments: e.target.checked })
              }
            />
            Cuotas
          </label>
        </div>
      </div>
      <button
        type='button'
        disabled={busy}
        onClick={() =>
          run(
            () => saveSaleControlAction({ saleId: detail.id, ...form }),
            'Datos de control guardados'
          )
        }
        className='mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50'
      >
        Guardar datos de control
      </button>

      <h3 className='mt-6 text-sm font-semibold text-slate-900 dark:text-zinc-100'>
        Pagos
      </h3>
      <ul className='mt-2 divide-y divide-slate-100 text-sm dark:divide-zinc-900'>
        {detail.payments.map((p) => (
          <li
            key={p.id}
            className='flex items-center justify-between gap-3 py-2'
          >
            <span className='text-slate-700 dark:text-zinc-300'>
              {new Date(p.paidAt).toLocaleDateString('es-BO')} ·{' '}
              {p.currency ?? detail.currency} {money(p.amount)}
              {p.exchangeRate ? ` · TC ${p.exchangeRate}` : ''}
              {p.note ? ` · ${p.note}` : ''}
            </span>
            <button
              type='button'
              disabled={busy}
              onClick={() => {
                if (
                  !window.confirm(
                    '¿Eliminar este pago? Quedará en el historial.'
                  )
                )
                  return;
                run(() => removeSalePaymentAction(p.id), 'Pago eliminado');
              }}
              className='text-xs text-red-600 hover:underline disabled:opacity-50'
            >
              Eliminar
            </button>
          </li>
        ))}
        {detail.payments.length === 0 && (
          <li className='py-2 text-slate-500'>Sin pagos registrados</li>
        )}
      </ul>
      <div className='mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5'>
        <select
          className={inputCls}
          value={payment.currency}
          onChange={(e) => setPayment({ ...payment, currency: e.target.value })}
        >
          <option value='BOB'>Bs (BOB)</option>
          <option value='USD'>$ (USD)</option>
        </select>
        <input
          className={inputCls}
          inputMode='decimal'
          placeholder='TC'
          value={payment.exchangeRate}
          onChange={(e) =>
            setPayment({ ...payment, exchangeRate: e.target.value })
          }
        />
        <input
          className={inputCls}
          type='number'
          step='0.01'
          placeholder='Monto'
          value={payment.amount}
          onChange={(e) => setPayment({ ...payment, amount: e.target.value })}
        />
        <input
          className={inputCls}
          type='date'
          value={payment.paidAt}
          onChange={(e) => setPayment({ ...payment, paidAt: e.target.value })}
        />
        <input
          className={inputCls}
          placeholder='Nota'
          value={payment.note}
          onChange={(e) => setPayment({ ...payment, note: e.target.value })}
        />
      </div>
      <button
        type='button'
        disabled={busy}
        onClick={() =>
          run(
            () => registerSalePaymentAction({ saleId: detail.id, ...payment }),
            'Pago registrado'
          )
        }
        className='mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'
      >
        Registrar pago
      </button>
    </div>
  );
}

function Bone({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200 dark:bg-zinc-800 ${className}`}
    />
  );
}

function FieldsSkeleton({ count }: { count: number }) {
  return (
    <div className='mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2'>
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <Bone className='mb-1 h-3 w-24' />
          <Bone className='h-10 w-full' />
        </div>
      ))}
    </div>
  );
}

// Esqueleto con la misma estructura que el panel mientras carga la venta.
function PanelSkeleton({ showCore }: { showCore?: boolean }) {
  return (
    <div role='status' aria-label='Cargando datos de la venta'>
      {showCore && (
        <>
          <Bone className='h-4 w-36' />
          <FieldsSkeleton count={6} />
          <Bone className='mt-3 h-10 w-48 rounded-xl' />
        </>
      )}
      <Bone className={`${showCore ? 'mt-6' : ''} h-4 w-32`} />
      <FieldsSkeleton count={8} />
      <Bone className='mt-3 h-10 w-52 rounded-xl' />
      <Bone className='mt-6 h-4 w-16' />
      <div className='mt-2 space-y-2'>
        <Bone className='h-8 w-full' />
        <Bone className='h-8 w-full' />
      </div>
      <div className='mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5'>
        {Array.from({ length: 5 }, (_, i) => (
          <Bone key={i} className='h-10' />
        ))}
      </div>
      <Bone className='mt-3 h-10 w-36 rounded-xl' />
    </div>
  );
}
