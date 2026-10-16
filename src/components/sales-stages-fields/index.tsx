'use client';

import { useRef, useState } from 'react';
import { Button, Input } from '@heroui/react';
import LucideIcon from '@/components/lucide-icon';
import {
  DEFAULT_STAGE_NAMES,
  MAX_SALES_STAGES,
  sortStages,
  stageName,
} from '@/lib/sales-stages';

interface Stage {
  stage_type: string;
  price: number | null;
  sold_percent: number | null;
  position?: number | null;
  is_current: boolean;
}

interface Row {
  key: number;
  name: string;
  price: string;
  percent: string;
  current: boolean;
}

function initialRows(stages?: Stage[]): Row[] {
  if (stages && stages.length > 0) {
    return sortStages(stages).map((s, key) => ({
      key,
      name: stageName(s),
      price: s.price != null ? String(s.price) : '',
      percent: s.sold_percent != null ? String(s.sold_percent) : '',
      current: s.is_current,
    }));
  }
  // Edificio sin etapas cargadas: se sugieren las habituales, sin etapa actual.
  return DEFAULT_STAGE_NAMES.map((name, key) => ({
    key,
    name,
    price: '',
    percent: '',
    current: false,
  }));
}

/** Editor de etapas de venta: agregar, quitar, ordenar y marcar la actual. */
export default function SalesStagesFields({ stages }: { stages?: Stage[] }) {
  const [rows, setRows] = useState<Row[]>(() => initialRows(stages));
  const nextKey = useRef(rows.length);

  const update = (key: number, patch: Partial<Row>) =>
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r))
    );

  const setCurrent = (key: number | null) =>
    setRows((prev) => prev.map((r) => ({ ...r, current: r.key === key })));

  const move = (index: number, delta: number) =>
    setRows((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const serialized = JSON.stringify(
    rows.map(({ name, price, percent, current }) => ({
      name,
      price,
      percent,
      current,
    }))
  );

  return (
    <div className='rounded-lg border border-default-200 p-3 md:col-span-2'>
      <input type='hidden' name='stages' value={serialized} />
      <p className='text-small font-bold'>Etapas de venta</p>
      <p className='mb-3 text-tiny text-default-500'>
        Agrega o quita etapas y marca la actual: su precio y porcentaje se
        muestran en la portada. El porcentaje es manual.
      </p>

      <div className='space-y-3'>
        {rows.map((row, index) => (
          <div
            key={row.key}
            className='grid grid-cols-1 items-center gap-2 rounded-md bg-default-50 p-2 sm:grid-cols-[auto_1fr_130px_90px_auto]'
          >
            <label
              className='flex cursor-pointer items-center gap-1 text-tiny font-medium'
              title='Etapa actual'
            >
              <input
                type='radio'
                checked={row.current}
                onChange={() => setCurrent(row.key)}
                className='accent-[#0a6406]'
              />
              Actual
            </label>
            <Input
              label='Nombre'
              size='sm'
              maxLength={50}
              value={row.name}
              onValueChange={(name) => update(row.key, { name })}
              variant='bordered'
            />
            <Input
              label='USD/m²'
              type='number'
              min={0}
              step={1}
              size='sm'
              value={row.price}
              onValueChange={(price) => update(row.key, { price })}
              variant='bordered'
            />
            <Input
              label='% vendido'
              type='number'
              min={0}
              max={100}
              step={1}
              size='sm'
              value={row.percent}
              onValueChange={(percent) => update(row.key, { percent })}
              variant='bordered'
            />
            <div className='flex items-center justify-end'>
              <Button
                isIconOnly
                size='sm'
                variant='light'
                aria-label='Subir etapa'
                isDisabled={index === 0}
                onPress={() => move(index, -1)}
              >
                <LucideIcon name='ChevronUp' size='16' />
              </Button>
              <Button
                isIconOnly
                size='sm'
                variant='light'
                aria-label='Bajar etapa'
                isDisabled={index === rows.length - 1}
                onPress={() => move(index, 1)}
              >
                <LucideIcon name='ChevronDown' size='16' />
              </Button>
              <Button
                isIconOnly
                size='sm'
                variant='light'
                color='danger'
                aria-label='Eliminar etapa'
                onPress={() =>
                  setRows((prev) => prev.filter((r) => r.key !== row.key))
                }
              >
                <LucideIcon name='Trash2' size='16' />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className='mt-3 flex flex-wrap items-center justify-between gap-2'>
        <Button
          size='sm'
          variant='flat'
          isDisabled={rows.length >= MAX_SALES_STAGES}
          onPress={() =>
            setRows((prev) => [
              ...prev,
              {
                key: nextKey.current++,
                name: '',
                price: '',
                percent: '',
                current: false,
              },
            ])
          }
        >
          Agregar etapa
        </Button>
        <Button
          size='sm'
          variant='light'
          isDisabled={!rows.some((r) => r.current)}
          onPress={() => setCurrent(null)}
        >
          Sin etapa actual (ocultar barra)
        </Button>
      </div>
    </div>
  );
}
