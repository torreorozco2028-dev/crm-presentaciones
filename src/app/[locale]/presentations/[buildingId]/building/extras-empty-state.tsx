'use client';

import { useEffect, useRef } from 'react';
import { animate, motion, useInView, useReducedMotion } from 'framer-motion';
import { Car, Package, Ruler } from 'lucide-react';

function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!inView || reduceMotion) {
      node.textContent = String(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.1,
      ease: 'easeOut',
      onUpdate: (v) => {
        node.textContent = String(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [inView, value, reduceMotion]);

  return <span ref={ref}>{value}</span>;
}

/** Vista inicial de vauleras y estacionamientos: cantidad de espacios disponibles. */
export interface ExtrasSelection {
  name: string;
  kind: string | null;
  description: string | null;
  area: number | null;
  available: number;
  total: number;
}

export default function ExtrasEmptyState({
  availableTotal,
  selected,
}: {
  availableTotal: number;
  selected?: ExtrasSelection | null;
}) {
  const reduceMotion = useReducedMotion();
  if (selected) {
    const Icon = selected.kind === 'estacionamiento' ? Car : Package;
    return (
      <motion.div
        key={selected.name}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className='flex h-full min-h-[380px] w-full flex-col items-center justify-center p-8 text-center'
      >
        <div className='mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-zinc-900 text-white shadow-xl dark:bg-white dark:text-black'>
          <Icon size={36} />
        </div>
        <h3 className='mi-fuente-2 text-3xl font-black uppercase tracking-tight text-zinc-900 dark:text-white md:text-4xl'>
          {selected.name}
        </h3>
        {selected.description && (
          <p className='mx-auto mt-4 max-w-md text-sm leading-relaxed text-zinc-600 dark:text-white/70'>
            {selected.description}
          </p>
        )}
        <div className='mt-6 flex flex-wrap items-center justify-center gap-3'>
          {selected.area ? (
            <span className='flex items-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-zinc-700 dark:border-white/20 dark:text-white/80'>
              <Ruler size={14} /> {selected.area} m²
            </span>
          ) : null}
          <span className='rounded-full border border-zinc-300 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-zinc-700 dark:border-white/20 dark:text-white/80'>
            {selected.available} de {selected.total} disponibles
          </span>
        </div>
      </motion.div>
    );
  }
  return (
    <div className='flex h-full min-h-[380px] w-full flex-col items-center justify-center p-8 text-center'>
      <div className='relative mb-6 flex h-24 w-24 items-center justify-center'>
        <motion.div
          animate={
            reduceMotion ? undefined : { y: [0, -8, 0], rotate: [-4, 2, -4] }
          }
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className='absolute left-0 top-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-xl dark:bg-white dark:text-black'
        >
          <Car size={26} />
        </motion.div>
        <motion.div
          animate={
            reduceMotion ? undefined : { y: [0, 8, 0], rotate: [4, -2, 4] }
          }
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          className='absolute bottom-0 right-0 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-zinc-900 bg-white text-zinc-900 shadow-xl dark:border-white dark:bg-black dark:text-white'
        >
          <Package size={26} />
        </motion.div>
      </div>
      <p className='text-5xl font-black tracking-tighter text-zinc-900 dark:text-white'>
        <AnimatedNumber value={availableTotal} />
      </p>
      <p className='mt-1 text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-500 dark:text-white/60'>
        espacios disponibles
      </p>
      <p className='mx-auto mt-5 max-w-xs text-sm leading-relaxed text-zinc-600 dark:text-white/70'>
        Explora el plano y selecciona una zona para conocer sus fotos, medidas y
        disponibilidad.
      </p>
    </div>
  );
}
