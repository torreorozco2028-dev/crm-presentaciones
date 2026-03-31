'use client';

import { useEffect, useMemo, useState } from 'react';

interface AmortizationRow {
  paymentNumber: number;
  paymentDate: string;
  startingBalance: number;
  scheduledPayment: number;
  paymentInBs: number;
  additionalPayment: number;
  interest: number;
  principal: number;
  remainingBalance: number;
}

interface SavedScenario {
  id: string;
  name: string;
  clientName: string;
  offerValidUntil: string;
  createdAt: string;
  squareMeters: number;
  pricePerM2: number;
  downPaymentPercent: number;
  monthlyQuotaTwoYears: number;
  loanYears: number;
  officialExchangeRate: number;
  firstPaymentDate: string;
  monthlyAdditionalPayment: number;
  additionalPaymentsByRow: Record<number, number>;
}

const MIN_DOWN_PAYMENT_PERCENT = 20;
const FIXED_ANNUAL_INTEREST_PERCENT = 5;
const MIN_LOAN_YEARS = 6;
const MAX_LOAN_YEARS = 12;
const SCENARIOS_STORAGE_KEY = 'loan-calculator-scenarios-v1';

function toCurrency(value: number) {
  return value.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function toNumber(value: number) {
  return value.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getNextMonthISODate() {
  const now = new Date();
  const nextMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate()
  );
  const year = nextMonth.getFullYear();
  const month = String(nextMonth.getMonth() + 1).padStart(2, '0');
  const day = String(nextMonth.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function createCsvContent(rows: AmortizationRow[]) {
  const header = [
    'PYMT #',
    'Fecha de pago',
    'Saldo inicial USD',
    'Pago programado USD',
    'Pago en Bs',
    'Pago adicional USD',
    'Interes USD',
    'Principal USD',
    'Restante USD',
  ];

  const lines = rows.map((row) =>
    [
      row.paymentNumber,
      row.paymentDate,
      row.startingBalance.toFixed(2),
      row.scheduledPayment.toFixed(2),
      row.paymentInBs.toFixed(2),
      row.additionalPayment.toFixed(2),
      row.interest.toFixed(2),
      row.principal.toFixed(2),
      row.remainingBalance.toFixed(2),
    ].join(',')
  );

  return [header.join(','), ...lines].join('\n');
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export default function LoanCalculator() {
  const [squareMeters, setSquareMeters] = useState<number>(90);
  const [pricePerM2, setPricePerM2] = useState<number>(1200);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(30);
  const [monthlyQuotaTwoYears, setMonthlyQuotaTwoYears] = useState<number>(400);
  const [loanYears, setLoanYears] = useState<number>(8);
  const [officialExchangeRate, setOfficialExchangeRate] =
    useState<number>(6.96);
  const [firstPaymentDate, setFirstPaymentDate] = useState<string>(
    getNextMonthISODate()
  );
  const [monthlyAdditionalPayment, setMonthlyAdditionalPayment] =
    useState<number>(0);
  const [additionalPaymentsByRow, setAdditionalPaymentsByRow] = useState<
    Record<number, number>
  >({});
  const [scenarioName, setScenarioName] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [offerValidUntil, setOfferValidUntil] = useState<string>(
    getNextMonthISODate()
  );
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);

  const safeDownPaymentPercent = Math.max(
    downPaymentPercent,
    MIN_DOWN_PAYMENT_PERCENT
  );
  const purchasePrice = squareMeters * pricePerM2;
  const downPaymentTotal = purchasePrice * (safeDownPaymentPercent / 100);
  const monthlyInterestRate = FIXED_ANNUAL_INTEREST_PERCENT / 100 / 12;
  const twoYearsNoInterestTotal = monthlyQuotaTwoYears * 24;
  const loanAmount = Math.max(
    purchasePrice - downPaymentTotal - twoYearsNoInterestTotal,
    0
  );
  const totalPayments = clamp(loanYears, MIN_LOAN_YEARS, MAX_LOAN_YEARS) * 12;

  const monthlyInstallment = useMemo(() => {
    if (loanAmount <= 0 || totalPayments <= 0) {
      return 0;
    }

    if (monthlyInterestRate === 0) {
      return loanAmount / totalPayments;
    }

    const factor = Math.pow(1 + monthlyInterestRate, totalPayments);
    return loanAmount * ((monthlyInterestRate * factor) / (factor - 1));
  }, [loanAmount, totalPayments, monthlyInterestRate]);

  const totalInterestWithoutAdditional = Math.max(
    monthlyInstallment * totalPayments - loanAmount,
    0
  );
  const baseScheduledPayment = monthlyInstallment + monthlyAdditionalPayment;
  const monthlyPaymentInBs = baseScheduledPayment * officialExchangeRate;

  const getRequestedAdditionalByPayment = (paymentNumber: number) => {
    const custom = additionalPaymentsByRow[paymentNumber];
    if (typeof custom === 'number' && !Number.isNaN(custom)) {
      return Math.max(custom, 0);
    }
    return Math.max(monthlyAdditionalPayment, 0);
  };

  const amortizationRows = useMemo(() => {
    const rows: AmortizationRow[] = [];
    if (loanAmount <= 0 || totalPayments <= 0) {
      return rows;
    }

    let balance = loanAmount;
    const baseDate = firstPaymentDate
      ? new Date(`${firstPaymentDate}T00:00:00`)
      : new Date();

    for (let i = 1; i <= totalPayments; i += 1) {
      const interest = balance * monthlyInterestRate;
      const requestedAdditional = getRequestedAdditionalByPayment(i);
      const currentPaymentIntent = monthlyInstallment + requestedAdditional;
      const principal = Math.min(currentPaymentIntent - interest, balance);
      const remainingBalance = Math.max(balance - principal, 0);
      const currentScheduledPayment = Math.min(
        interest + principal,
        balance + interest
      );

      const currentDate = new Date(baseDate);
      currentDate.setMonth(baseDate.getMonth() + (i - 1));

      rows.push({
        paymentNumber: i,
        paymentDate: currentDate.toISOString().split('T')[0],
        startingBalance: balance,
        scheduledPayment: currentScheduledPayment,
        paymentInBs: currentScheduledPayment * officialExchangeRate,
        additionalPayment: Math.max(
          currentScheduledPayment - monthlyInstallment,
          0
        ),
        interest,
        principal,
        remainingBalance,
      });

      balance = remainingBalance;
      if (remainingBalance <= 0) {
        break;
      }
    }

    return rows;
  }, [
    loanAmount,
    totalPayments,
    firstPaymentDate,
    monthlyInstallment,
    monthlyInterestRate,
    monthlyAdditionalPayment,
    officialExchangeRate,
    additionalPaymentsByRow,
  ]);

  const amortizationTotalInterest = useMemo(
    () => amortizationRows.reduce((acc, row) => acc + row.interest, 0),
    [amortizationRows]
  );

  useEffect(() => {
    const stored = localStorage.getItem(SCENARIOS_STORAGE_KEY);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as SavedScenario[];
      if (Array.isArray(parsed)) {
        setSavedScenarios(parsed);
      }
    } catch {
      setSavedScenarios([]);
    }
  }, []);

  const saveScenario = () => {
    const trimmedName = scenarioName.trim();
    const trimmedClient = clientName.trim();
    if (!trimmedName || !trimmedClient || !offerValidUntil) {
      return;
    }

    const nextScenario: SavedScenario = {
      id: crypto.randomUUID(),
      name: trimmedName,
      clientName: trimmedClient,
      offerValidUntil,
      createdAt: new Date().toISOString(),
      squareMeters,
      pricePerM2,
      downPaymentPercent,
      monthlyQuotaTwoYears,
      loanYears,
      officialExchangeRate,
      firstPaymentDate,
      monthlyAdditionalPayment,
      additionalPaymentsByRow,
    };

    const next = [nextScenario, ...savedScenarios].slice(0, 20);
    setSavedScenarios(next);
    localStorage.setItem(SCENARIOS_STORAGE_KEY, JSON.stringify(next));
    setScenarioName('');
  };

  const loadScenario = (scenario: SavedScenario) => {
    setSquareMeters(scenario.squareMeters);
    setPricePerM2(scenario.pricePerM2);
    setDownPaymentPercent(scenario.downPaymentPercent);
    setMonthlyQuotaTwoYears(scenario.monthlyQuotaTwoYears);
    setLoanYears(scenario.loanYears);
    setOfficialExchangeRate(scenario.officialExchangeRate);
    setFirstPaymentDate(scenario.firstPaymentDate);
    setMonthlyAdditionalPayment(scenario.monthlyAdditionalPayment);
    setAdditionalPaymentsByRow(scenario.additionalPaymentsByRow || {});
    setScenarioName(scenario.name);
    setClientName(scenario.clientName || '');
    setOfferValidUntil(scenario.offerValidUntil || getNextMonthISODate());
  };

  const removeScenario = (id: string) => {
    const next = savedScenarios.filter((scenario) => scenario.id !== id);
    setSavedScenarios(next);
    localStorage.setItem(SCENARIOS_STORAGE_KEY, JSON.stringify(next));
  };

  const onDownPaymentPercentChange = (rawValue: string) => {
    if (rawValue === '') {
      setDownPaymentPercent(0);
      return;
    }

    const parsed = Number(rawValue);
    if (Number.isNaN(parsed)) {
      return;
    }

    setDownPaymentPercent(Math.max(parsed, 0));
  };

  const onDownPaymentPercentBlur = () => {
    setDownPaymentPercent((prev) => Math.max(prev, MIN_DOWN_PAYMENT_PERCENT));
  };

  const onDownPaymentTotalChange = (rawValue: string) => {
    if (rawValue === '') {
      setDownPaymentPercent(0);
      return;
    }

    const parsed = Number(rawValue);
    if (Number.isNaN(parsed)) {
      return;
    }

    if (purchasePrice <= 0) {
      setDownPaymentPercent(0);
      return;
    }

    const nextPercent = (Math.max(parsed, 0) / purchasePrice) * 100;
    setDownPaymentPercent(nextPercent);
  };

  const onDownPaymentTotalBlur = () => {
    setDownPaymentPercent((prev) => Math.max(prev, MIN_DOWN_PAYMENT_PERCENT));
  };

  const onAdditionalRowChange = (paymentNumber: number, rawValue: string) => {
    if (rawValue === '') {
      setAdditionalPaymentsByRow((prev) => {
        const next = { ...prev };
        delete next[paymentNumber];
        return next;
      });
      return;
    }

    const parsed = Number(rawValue);
    if (Number.isNaN(parsed)) {
      return;
    }

    setAdditionalPaymentsByRow((prev) => ({
      ...prev,
      [paymentNumber]: Math.max(parsed, 0),
    }));
  };

  const exportToCsv = () => {
    if (!amortizationRows.length) {
      return;
    }

    const content = createCsvContent(amortizationRows);
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cronograma-amortizacion.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToPdf = () => {
    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) {
      return;
    }

    const summaryRows = [
      ['Cliente', clientName || 'No definido'],
      ['Oferta valida hasta', offerValidUntil || 'No definido'],
      ['Precio de compra', toCurrency(purchasePrice)],
      ['Pago inicial porcentual', `${toNumber(safeDownPaymentPercent)}%`],
      ['Pago inicial total', toCurrency(downPaymentTotal)],
      ['Cuota mensual', toCurrency(monthlyQuotaTwoYears)],
      ['2 anos sin interes', toCurrency(twoYearsNoInterestTotal)],
      ['Monto del prestamo', toCurrency(loanAmount)],
      ['Tasa de interes anual', `${toNumber(FIXED_ANNUAL_INTEREST_PERCENT)}%`],
      ['Tasa de interes mensual', `${toNumber(monthlyInterestRate * 100)}%`],
      ['Mensualidad base', toCurrency(baseScheduledPayment)],
      ['Mensualidad en Bs', `Bs ${toNumber(monthlyPaymentInBs)}`],
      ['Numero de pagos', String(amortizationRows.length)],
      ['Interes total', toCurrency(amortizationTotalInterest)],
    ];

    const summaryHtml = summaryRows
      .map(
        (row) =>
          `<tr><td class="label">${escapeHtml(row[0])}</td><td class="value">${escapeHtml(row[1])}</td></tr>`
      )
      .join('');

    const amortizationHtml = amortizationRows
      .map(
        (row) => `<tr>
          <td>${row.paymentNumber}</td>
          <td>${escapeHtml(row.paymentDate)}</td>
          <td class="right">${escapeHtml(toCurrency(row.startingBalance))}</td>
          <td class="right">${escapeHtml(toCurrency(row.scheduledPayment))}</td>
          <td class="right">${escapeHtml(`Bs ${toNumber(row.paymentInBs)}`)}</td>
          <td class="right">${escapeHtml(toCurrency(row.additionalPayment))}</td>
          <td class="right">${escapeHtml(toCurrency(row.interest))}</td>
          <td class="right">${escapeHtml(toCurrency(row.principal))}</td>
          <td class="right">${escapeHtml(toCurrency(row.remainingBalance))}</td>
        </tr>`
      )
      .join('');

    const doc = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Oferta de prestamo - ${escapeHtml(clientName || 'Cliente')}</title>
    <style>
      @page { size: A4 landscape; margin: 6mm; }
      * { box-sizing: border-box; }
      body { font-family: Arial, sans-serif; color: #111827; margin: 0; }
      .header { display: flex; justify-content: space-between; align-items: end; margin-bottom: 10px; }
      .title { font-size: 20px; font-weight: 700; }
      .meta { font-size: 12px; text-align: right; }
      .summary { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
      .summary td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 12px; }
      .summary td.label { width: 65%; background: #f8fafc; font-weight: 700; text-transform: uppercase; }
      .summary td.value { width: 35%; text-align: right; background: #ffffff; }
      .amort-title { background: #0e3344; color: #fff; padding: 6px 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
      .amort { width: 100%; border-collapse: collapse; }
      .amort thead th { background: #1f2937; color: #fff; border: 1px solid #111827; padding: 6px 4px; font-size: 10px; text-transform: uppercase; }
      .amort tbody td { border: 1px solid #d1d5db; padding: 5px 4px; font-size: 10px; }
      .amort tbody tr:nth-child(even) { background: #f8fafc; }
      .right { text-align: right; }
      .footer { margin-top: 8px; font-size: 10px; color: #475569; display: flex; justify-content: space-between; }
      .page-break { page-break-before: always; }
      thead { display: table-header-group; }
      tr, td, th { page-break-inside: avoid; }
      @media print { .no-print { display: none; } }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="title">Oferta y cronograma de prestamo</div>
      <div class="meta">
        <div><strong>Cliente:</strong> ${escapeHtml(clientName || 'No definido')}</div>
        <div><strong>Valido hasta:</strong> ${escapeHtml(offerValidUntil || 'No definido')}</div>
        <div><strong>Generado:</strong> ${escapeHtml(new Date().toLocaleString('es-MX'))}</div>
      </div>
    </div>

    <table class="summary">${summaryHtml}</table>

    <div class="amort-title">Cronograma de amortizacion</div>
    <table class="amort">
      <thead>
        <tr>
          <th>PYMT #</th>
          <th>Fecha</th>
          <th>Saldo inicial</th>
          <th>Pago programado</th>
          <th>Pago en Bs</th>
          <th>Pago adicional</th>
          <th>Interes</th>
          <th>Principal</th>
          <th>Equilibrar</th>
        </tr>
      </thead>
      <tbody>${amortizationHtml}</tbody>
    </table>
    <div class="footer">
      <span>Documento referencial. Tasas y montos sujetos a validacion comercial.</span>
      <span>Structec</span>
    </div>
    <script>
      window.onload = function () {
        window.print();
      };
    </script>
  </body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(doc);
    printWindow.document.close();
    printWindow.focus();
  };

  return (
    <section className='rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_20px_50px_-32px_rgba(15,23,42,0.3)] dark:border-slate-800 dark:bg-slate-950 sm:p-6 lg:p-8'>
      <div className='mb-8 flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl'>
            Calculadora de Prestamo
          </h1>
          <p className='mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-[15px]'>
            Modulo independiente para simular financiamiento y cronograma de
            pagos.
          </p>
        </div>
        <div className='flex w-full flex-wrap gap-2 sm:w-auto'>
          <button
            type='button'
            onClick={exportToCsv}
            className='flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 sm:flex-none'
          >
            Exportar Excel (CSV)
          </button>
          <button
            type='button'
            onClick={exportToPdf}
            className='flex-1 rounded-xl bg-[#0e3344] px-4 py-2.5 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#12495f] dark:bg-[#12495f] dark:hover:bg-[#165b75] sm:flex-none'
          >
            Exportar PDF
          </button>
        </div>
      </div>

      <div className='mb-8 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[1fr_auto]'>
        <div className='grid gap-2 md:grid-cols-2'>
          <input
            value={scenarioName}
            onChange={(event) => setScenarioName(event.target.value)}
            placeholder='Nombre del escenario (ej. Oferta Torre Norte)'
            className='rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0e3344] focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#7fa0b4] dark:focus:ring-slate-800'
          />
          <input
            value={clientName}
            onChange={(event) => setClientName(event.target.value)}
            placeholder='Nombre del cliente'
            className='rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0e3344] focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#7fa0b4] dark:focus:ring-slate-800'
          />
          <input
            type='date'
            value={offerValidUntil}
            onChange={(event) => setOfferValidUntil(event.target.value)}
            className='rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0e3344] focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-[#7fa0b4] dark:focus:ring-slate-800'
          />
          <button
            type='button'
            onClick={saveScenario}
            className='rounded-xl bg-[#0e3344] px-3 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#12495f] dark:bg-[#12495f] dark:hover:bg-[#165b75]'
          >
            Guardar escenario
          </button>
        </div>

        <span className='self-center text-xs text-slate-500 dark:text-slate-400'>
          Debes completar nombre de escenario, cliente y vigencia.
        </span>
      </div>

      {savedScenarios.length > 0 && (
        <div className='mb-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950'>
          <table className='min-w-full text-xs sm:text-sm'>
            <thead className='bg-slate-900 text-white dark:bg-slate-800'>
              <tr>
                <th className='px-3 py-2 text-left'>Escenario</th>
                <th className='px-3 py-2 text-left'>Cliente</th>
                <th className='px-3 py-2 text-left'>Valido hasta</th>
                <th className='px-3 py-2 text-left'>Guardado</th>
                <th className='px-3 py-2 text-right'>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {savedScenarios.map((scenario) => (
                <tr
                  key={scenario.id}
                  className='border-t border-slate-100 text-slate-700 dark:border-slate-700 dark:text-slate-200'
                >
                  <td className='px-3 py-2 font-semibold'>{scenario.name}</td>
                  <td className='px-3 py-2 text-slate-600 dark:text-slate-300'>
                    {scenario.clientName}
                  </td>
                  <td className='px-3 py-2 text-slate-600 dark:text-slate-300'>
                    {scenario.offerValidUntil}
                  </td>
                  <td className='px-3 py-2 text-slate-500 dark:text-slate-400'>
                    {new Date(scenario.createdAt).toLocaleString('es-MX')}
                  </td>
                  <td className='px-3 py-2 text-right'>
                    <div className='flex justify-end gap-2'>
                      <button
                        type='button'
                        onClick={() => loadScenario(scenario)}
                        className='rounded-lg bg-slate-800 px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600'
                      >
                        Cargar
                      </button>
                      <button
                        type='button'
                        onClick={() => removeScenario(scenario.id)}
                        className='rounded-lg bg-rose-700 px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-500'
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className='mb-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:grid-cols-2'>
        <label className='flex flex-col gap-1'>
          <span className='text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400'>
            Metros cuadrados
          </span>
          <input
            type='number'
            min={0}
            step='0.01'
            value={squareMeters}
            onChange={(event) =>
              setSquareMeters(Number(event.target.value) || 0)
            }
            className='rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0e3344] focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-[#7fa0b4] dark:focus:ring-slate-800'
          />
        </label>

        <label className='flex flex-col gap-1'>
          <span className='text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400'>
            Precio por metro cuadrado
          </span>
          <input
            type='number'
            min={0}
            step='0.01'
            value={pricePerM2}
            onChange={(event) => setPricePerM2(Number(event.target.value) || 0)}
            className='rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0e3344] focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-[#7fa0b4] dark:focus:ring-slate-800'
          />
        </label>

        <label className='flex flex-col gap-1'>
          <span className='text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400'>
            Pago inicial porcentual (minimo 20%)
          </span>
          <input
            type='number'
            min={0}
            step='0.01'
            value={downPaymentPercent}
            onChange={(event) => onDownPaymentPercentChange(event.target.value)}
            onBlur={onDownPaymentPercentBlur}
            className='rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0e3344] focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-[#7fa0b4] dark:focus:ring-slate-800'
          />
        </label>

        <label className='flex flex-col gap-1'>
          <span className='text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400'>
            Pago inicial total
          </span>
          <input
            type='number'
            min={0}
            step='0.01'
            value={downPaymentTotal}
            onChange={(event) => onDownPaymentTotalChange(event.target.value)}
            onBlur={onDownPaymentTotalBlur}
            className='rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0e3344] focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-[#7fa0b4] dark:focus:ring-slate-800'
          />
        </label>

        <label className='flex flex-col gap-1'>
          <span className='text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400'>
            Cuota mensual para 2 años sin interés
          </span>
          <input
            type='number'
            min={0}
            step='0.01'
            value={monthlyQuotaTwoYears}
            onChange={(event) =>
              setMonthlyQuotaTwoYears(Number(event.target.value) || 0)
            }
            className='rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0e3344] focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-[#7fa0b4] dark:focus:ring-slate-800'
          />
        </label>

        <label className='flex flex-col gap-1'>
          <span className='text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400'>
            Duracion del prestamo (anos 6-12)
          </span>
          <input
            type='number'
            min={MIN_LOAN_YEARS}
            max={MAX_LOAN_YEARS}
            step='1'
            value={loanYears}
            onChange={(event) =>
              setLoanYears(
                clamp(
                  Number(event.target.value) || 0,
                  MIN_LOAN_YEARS,
                  MAX_LOAN_YEARS
                )
              )
            }
            className='rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0e3344] focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-[#7fa0b4] dark:focus:ring-slate-800'
          />
        </label>

        <label className='flex flex-col gap-1'>
          <span className='text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400'>
            Primera fecha de pago
          </span>
          <input
            type='date'
            value={firstPaymentDate}
            onChange={(event) => setFirstPaymentDate(event.target.value)}
            className='rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0e3344] focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-[#7fa0b4] dark:focus:ring-slate-800'
          />
        </label>

        <label className='flex flex-col gap-1'>
          <span className='text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400'>
            Cambio oficial $ - Bs
          </span>
          <input
            type='number'
            min={0}
            step='0.01'
            value={officialExchangeRate}
            onChange={(event) =>
              setOfficialExchangeRate(Number(event.target.value) || 0)
            }
            className='rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0e3344] focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-[#7fa0b4] dark:focus:ring-slate-800'
          />
        </label>

        <label className='flex flex-col gap-1'>
          <span className='text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400'>
            Pago adicional mensual
          </span>
          <input
            type='number'
            min={0}
            step='0.01'
            value={monthlyAdditionalPayment}
            onChange={(event) =>
              setMonthlyAdditionalPayment(Number(event.target.value) || 0)
            }
            className='rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0e3344] focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-[#7fa0b4] dark:focus:ring-slate-800'
          />
        </label>
      </div>

      <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950'>
        <table className='w-full text-sm'>
          <tbody>
            <tr className='bg-slate-100 dark:bg-slate-900'>
              <td className='px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-slate-100 sm:text-sm'>
                Cliente
              </td>
              <td className='px-4 py-2 text-right font-semibold text-slate-800 dark:text-slate-100 sm:text-base'>
                {clientName || 'No definido'}
              </td>
            </tr>
            <tr className='bg-white dark:bg-slate-950'>
              <td className='px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 sm:text-sm'>
                Oferta valida hasta
              </td>
              <td className='px-4 py-2 text-right text-slate-700 dark:text-slate-300'>
                {offerValidUntil || 'No definido'}
              </td>
            </tr>
            <tr className='bg-slate-100 dark:bg-slate-900'>
              <td className='px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200 sm:text-sm'>
                Precio de compra
              </td>
              <td className='px-4 py-2 text-right font-semibold text-slate-800 dark:text-slate-200 sm:text-base'>
                {toCurrency(purchasePrice)}
              </td>
            </tr>
            <tr className='bg-white dark:bg-slate-950'>
              <td className='px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 sm:text-sm'>
                Pago inicial porcentual
              </td>
              <td className='px-4 py-2 text-right text-slate-700 dark:text-slate-300'>
                {toNumber(safeDownPaymentPercent)}%
              </td>
            </tr>
            <tr className='bg-slate-100 dark:bg-slate-900'>
              <td className='px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200 sm:text-sm'>
                Pago inicial total
              </td>
              <td className='px-4 py-2 text-right text-slate-800 dark:text-slate-200'>
                {toCurrency(downPaymentTotal)}
              </td>
            </tr>
            <tr className='bg-slate-100 dark:bg-slate-900'>
              <td className='px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200 sm:text-sm'>
                Cuota mensual
              </td>
              <td className='px-4 py-2 text-right font-semibold text-slate-800 dark:text-slate-200 sm:text-base'>
                {toCurrency(monthlyQuotaTwoYears)}
              </td>
            </tr>
            <tr className='bg-white dark:bg-slate-950'>
              <td className='px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 sm:text-sm'>
                2 años sin interés
              </td>
              <td className='px-4 py-2 text-right text-slate-700 dark:text-slate-300'>
                {toCurrency(twoYearsNoInterestTotal)}
              </td>
            </tr>
            <tr className='bg-[#0e3344] text-white dark:bg-slate-950'>
              <td className='px-4 py-2 text-xs font-bold uppercase tracking-wide text-white dark:text-slate-300 sm:text-sm'>
                Monto del prestamo
              </td>
              <td className='px-4 py-2 text-right font-bold text-white dark:text-slate-300 sm:text-base'>
                {toCurrency(loanAmount)}
              </td>
            </tr>
            <tr className='bg-slate-100 dark:bg-slate-900'>
              <td className='px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200 sm:text-sm'>
                Tasa de interes anual
              </td>
              <td className='px-4 py-2 text-right text-slate-800 dark:text-slate-200'>
                {toNumber(FIXED_ANNUAL_INTEREST_PERCENT)}%
              </td>
            </tr>
            <tr className='bg-white dark:bg-slate-950'>
              <td className='px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 sm:text-sm'>
                Duracion del prestamo en anos
              </td>
              <td className='px-4 py-2 text-right text-slate-700 dark:text-slate-300'>
                {loanYears}
              </td>
            </tr>
            <tr className='bg-slate-100 dark:bg-slate-900'>
              <td className='px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200 sm:text-sm'>
                Frecuencia de pago
              </td>
              <td className='px-4 py-2 text-right text-slate-800 dark:text-slate-200'>
                Mensual
              </td>
            </tr>
            <tr className='bg-white dark:bg-slate-950'>
              <td className='px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 sm:text-sm'>
                Cambio oficial $ - Bs
              </td>
              <td className='px-4 py-2 text-right text-slate-700 dark:text-slate-300'>
                {toNumber(officialExchangeRate)}
              </td>
            </tr>
            <tr className='bg-slate-100 dark:bg-slate-900'>
              <td className='px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200 sm:text-sm'>
                Primera fecha de pago
              </td>
              <td className='px-4 py-2 text-right text-slate-800 dark:text-slate-200'>
                {firstPaymentDate}
              </td>
            </tr>
            <tr className='bg-white dark:bg-[#12495f]'>
              <td className='px-4 py-2 text-xs font-bold uppercase tracking-wide sm:text-sm'>
                Tasa de interes mensual
              </td>
              <td className='px-4 py-2 text-right font-bold'>
                {toNumber(monthlyInterestRate * 100)}%
              </td>
            </tr>
            <tr className='bg-slate-100 dark:bg-slate-900'>
              <td className='px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200 sm:text-sm'>
                Mensualidad base
              </td>
              <td className='px-4 py-2 text-right font-bold text-slate-800 dark:text-slate-200 sm:text-base'>
                {toCurrency(baseScheduledPayment)}
              </td>
            </tr>
            <tr className='bg-white dark:bg-slate-950'>
              <td className='px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 sm:text-sm'>
                Mensualidad en Bs
              </td>
              <td className='px-4 py-2 text-right font-bold text-slate-700 dark:text-slate-300 sm:text-base'>
                Bs {toNumber(monthlyPaymentInBs)}
              </td>
            </tr>
            <tr className='bg-slate-100 dark:bg-slate-900'>
              <td className='px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200 sm:text-sm'>
                Numero de pagos
              </td>
              <td className='px-4 py-2 text-right text-slate-800 dark:text-slate-200'>
                {amortizationRows.length}
              </td>
            </tr>
            <tr className='bg-white dark:bg-slate-950'>
              <td className='px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 sm:text-sm'>
                Interes total
              </td>
              <td className='px-4 py-2 text-right font-bold text-slate-700 dark:text-slate-300 sm:text-base'>
                {toCurrency(amortizationTotalInterest)}
              </td>
            </tr>
            <tr className='bg-slate-100 dark:bg-slate-900'>
              <td className='px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200 sm:text-sm'>
                Interes total (sin pago adicional)
              </td>
              <td className='px-4 py-2 text-right text-slate-800 dark:text-slate-200'>
                {toCurrency(totalInterestWithoutAdditional)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className='mt-8 hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 md:block'>
        <div className='bg-[#0e3344] px-3 py-2 text-center text-sm font-bold uppercase tracking-wide text-white dark:bg-[#12495f]'>
          Cronograma de amortizacion de prestamos
        </div>
        <table className='min-w-full text-xs sm:text-sm'>
          <thead className='bg-slate-700 text-white dark:bg-slate-800'>
            <tr>
              <th className='px-3 py-2 text-left'>PYMT #</th>
              <th className='px-3 py-2 text-left'>Fecha de pago</th>
              <th className='px-3 py-2 text-right'>Saldo inicial</th>
              <th className='px-3 py-2 text-right'>Pago programado</th>
              <th className='px-3 py-2 text-right'>Pago en Bs</th>
              <th className='px-3 py-2 text-right'>Pago adicional</th>
              <th className='px-3 py-2 text-right'>Interes</th>
              <th className='px-3 py-2 text-right'>Principal</th>
              <th className='px-3 py-2 text-right'>Equilibrar</th>
            </tr>
          </thead>
          <tbody>
            {amortizationRows.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className='px-3 py-4 text-center text-slate-500 dark:text-slate-400'
                >
                  No hay saldo por financiar con los valores actuales.
                </td>
              </tr>
            ) : (
              amortizationRows.map((row, index) => (
                <tr
                  key={row.paymentNumber}
                  className='border-t border-slate-100 text-slate-700 odd:bg-slate-50/60 dark:border-slate-700 dark:text-slate-200 dark:odd:bg-slate-800/50'
                >
                  <td className='px-3 py-2'>{row.paymentNumber}</td>
                  <td className='px-3 py-2'>{row.paymentDate}</td>
                  <td className='px-3 py-2 text-right'>
                    {toCurrency(row.startingBalance)}
                  </td>
                  <td className='px-3 py-2 text-right'>
                    {toCurrency(row.scheduledPayment)}
                  </td>
                  <td className='px-3 py-2 text-right'>
                    Bs {toNumber(row.paymentInBs)}
                  </td>
                  <td className='px-3 py-2 text-right'>
                    <input
                      type='number'
                      min={0}
                      step='0.01'
                      value={getRequestedAdditionalByPayment(row.paymentNumber)}
                      onChange={(event) =>
                        onAdditionalRowChange(
                          row.paymentNumber,
                          event.target.value
                        )
                      }
                      className='w-24 rounded-lg border border-slate-300 bg-white px-2 py-1 text-right text-xs outline-none transition focus:border-[#0e3344] focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-[#7fa0b4] dark:focus:ring-slate-800'
                    />
                  </td>
                  <td className='px-3 py-2 text-right'>
                    {toCurrency(row.interest)}
                  </td>
                  <td className='px-3 py-2 text-right'>
                    {toCurrency(row.principal)}
                  </td>
                  <td className='px-3 py-2 text-right font-semibold'>
                    {index === 0
                      ? toCurrency(loanAmount)
                      : toCurrency(row.remainingBalance)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className='mt-6 space-y-3 md:hidden'>
        <div className='rounded-xl bg-[#0e3344] px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-white dark:bg-[#12495f]'>
          Cronograma de amortizacion
        </div>
        {amortizationRows.length === 0 ? (
          <div className='rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'>
            No hay saldo por financiar con los valores actuales.
          </div>
        ) : (
          amortizationRows.map((row, index) => (
            <div
              key={`mobile-${row.paymentNumber}`}
              className='rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900'
            >
              <div className='mb-2 flex items-center justify-between'>
                <p className='text-sm font-bold text-slate-800 dark:text-slate-100'>
                  Cuota #{row.paymentNumber}
                </p>
                <p className='text-xs text-slate-500 dark:text-slate-400'>
                  {row.paymentDate}
                </p>
              </div>
              <div className='grid grid-cols-2 gap-x-2 gap-y-1 text-xs'>
                <span className='text-slate-500 dark:text-slate-400'>
                  Saldo inicial
                </span>
                <span className='text-right font-semibold'>
                  {toCurrency(row.startingBalance)}
                </span>
                <span className='text-slate-500 dark:text-slate-400'>
                  Pago programado
                </span>
                <span className='text-right font-semibold'>
                  {toCurrency(row.scheduledPayment)}
                </span>
                <span className='text-slate-500 dark:text-slate-400'>
                  Pago en Bs
                </span>
                <span className='text-right'>
                  Bs {toNumber(row.paymentInBs)}
                </span>
                <span className='text-slate-500 dark:text-slate-400'>
                  Interes
                </span>
                <span className='text-right'>{toCurrency(row.interest)}</span>
                <span className='text-slate-500 dark:text-slate-400'>
                  Principal
                </span>
                <span className='text-right'>{toCurrency(row.principal)}</span>
                <span className='text-slate-500 dark:text-slate-400'>
                  Equilibrar
                </span>
                <span className='text-right font-semibold'>
                  {index === 0
                    ? toCurrency(loanAmount)
                    : toCurrency(row.remainingBalance)}
                </span>
              </div>
              <div className='mt-3'>
                <label className='mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>
                  Pago adicional
                </label>
                <input
                  type='number'
                  min={0}
                  step='0.01'
                  value={getRequestedAdditionalByPayment(row.paymentNumber)}
                  onChange={(event) =>
                    onAdditionalRowChange(row.paymentNumber, event.target.value)
                  }
                  className='w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0e3344] focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-[#7fa0b4] dark:focus:ring-slate-800'
                />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
