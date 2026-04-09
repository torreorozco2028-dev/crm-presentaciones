'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, Chip } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { fonts } from '@/config/fonts';

interface DepartmentFeature {
  id: string;
  dfeatures_name: string;
  room: string | null;
  order: number | null;
}

interface DepartmentModel {
  id: string;
  name_model_department: string | null;
  base_square_meters: number | null;
  balcony: boolean;
  features: DepartmentFeature[];
}

interface UnitDepartment {
  id: string;
  unit_number: string;
  floor: number;
  real_square_meters: number | null;
  state: number;
  model: DepartmentModel;
}

interface SalesStage {
  id: string;
  stage_type: string;
  price: number | null;
  stage_description: string | null;
}

interface Building {
  id: string;
  building_title: string;
  salesStages?: SalesStage[];
}

interface Props {
  units: UnitDepartment[];
  building?: Building;
}

const roomOrder: Record<string, number> = {
  General: 0,
  Cocina: 1,
  Baño: 2,
  Dormitorio: 3,
  Lavanderia: 4,
  Sala: 5,
};

const categoryIcons: Record<string, string> = {
  General: '/clogo1.png',
  Cocina: '/clogo2.png',
  Baño: '/clogo3.png',
  Dormitorio: '/clogo4.png',
  Lavanderia: '/clogo5.png',
  Sala: '/clogo6.png',
};

function getUnitStateMeta(state: number) {
  if (state === 3) {
    return {
      label: 'Vendido',
      chipColor: 'danger' as const,
      buttonClass:
        'cursor-not-allowed border-rose-200 bg-rose-50/70 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-300',
      badgeClass: 'text-rose-700 dark:text-rose-300',
    };
  }

  if (state === 2) {
    return {
      label: 'Reservado',
      chipColor: 'warning' as const,
      buttonClass:
        'cursor-not-allowed border-amber-200 bg-amber-50/70 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300',
      badgeClass: 'text-amber-700 dark:text-amber-300',
    };
  }

  return {
    label: 'Disponible',
    chipColor: 'success' as const,
    buttonClass:
      'border-emerald-200 bg-emerald-50/55 text-emerald-700 hover:border-emerald-400 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:border-emerald-700',
    badgeClass: 'text-emerald-700 dark:text-emerald-300',
  };
}

export default function Floors({ units }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxSelections = windowWidth < 768 ? 2 : 4;

  const buildingMap = useMemo(() => {
    const floors: Record<number, UnitDepartment[]> = {};
    units.forEach((unit) => {
      if (!floors[unit.floor]) floors[unit.floor] = [];
      floors[unit.floor].push(unit);
    });

    return Object.entries(floors)
      .map(([floor, depts]) => ({
        floor: Number(floor),
        depts: depts.sort((a, b) => a.unit_number.localeCompare(b.unit_number)),
      }))
      .sort((a, b) => b.floor - a.floor);
  }, [units]);

  const handleSelect = (unit: UnitDepartment) => {
    if (unit.state !== 1) return;
    setSelectedIds((prev) =>
      prev.includes(unit.id)
        ? prev.filter((id) => id !== unit.id)
        : prev.length < maxSelections
          ? [...prev, unit.id]
          : prev
    );
  };

  const selectedUnits = units.filter((u) => selectedIds.includes(u.id));
  const hasFeatures = selectedUnits.some(
    (u) => (u.model?.features?.length ?? 0) > 0
  );

  const comparisonRooms = useMemo(() => {
    const rooms = new Set<string>();

    selectedUnits.forEach((unit) => {
      unit.model?.features?.forEach((feature) => {
        if (!feature.dfeatures_name?.trim()) return;
        rooms.add(feature.room?.trim() || 'General');
      });
    });

    return Array.from(rooms).sort((a, b) => {
      const orderA = roomOrder[a] ?? 999;
      const orderB = roomOrder[b] ?? 999;
      return orderA - orderB || a.localeCompare(b, 'es');
    });
  }, [selectedUnits]);

  // // Calcular precios y ahorros por etapa
  // const priceAnalysis = useMemo(() => {
  //   if (!building?.salesStages || building.salesStages.length === 0) {
  //     return null;
  //   }

  //   const stagesWithPrices = building.salesStages.map((stage) => {
  //     const stagePrice = stage.price || 0;
  //     const selectedUnitsData = selectedUnits.map((unit) => {
  //       const squareMeters = unit.real_square_meters || 0;
  //       // stagePrice es el precio por m², multiplicamos por m² para obtener el total
  //       const totalPrice = stagePrice * squareMeters;
  //       const pricePerM2 = stagePrice;
  //       return {
  //         unit,
  //         pricePerM2,
  //         totalPrice,
  //       };
  //     });

  //     // Calcular el promedio de precio por m² (que es el mismo stagePrice)
  //     const avgPricePerM2 = stagePrice;

  //     return {
  //       stage,
  //       avgPricePerM2,
  //       selectedUnitsData,
  //       stagePrice,
  //     };
  //   });

  //   const minPrice = Math.min(...stagesWithPrices.map((s) => s.avgPricePerM2));
  //   const maxPrice = Math.max(...stagesWithPrices.map((s) => s.avgPricePerM2));

  //   const sortedStages = [...stagesWithPrices].sort(
  //     (a, b) => a.avgPricePerM2 - b.avgPricePerM2
  //   );

  //   return {
  //     sortedStages,
  //     minPrice,
  //     maxPrice,
  //   };
  // }, [building?.salesStages, selectedUnits]);

  return (
    <div
      id='equipo'
      className='min-h-screen bg-background p-4 pt-10 font-sans text-foreground transition-colors dark:bg-slate-950 sm:p-10'
    >
      <div className='mb-10 text-center'>
        <h1
          className={`mb-4 ${fonts.inter.className} text-5xl tracking-tight text-foreground sm:text-5xl md:text-6xl`}
        >
          Nuestras Unidades
        </h1>
        <p className='text-xs uppercase tracking-widest text-default-500'>
          Selecciona hasta {maxSelections} unidades para comparar detalles
        </p>
      </div>

      <div className='mx-auto mb-20 flex max-w-3xl flex-col gap-4'>
        {buildingMap.map(({ floor, depts }) => (
          <div
            key={floor}
            className='group flex flex-col items-center gap-3 sm:flex-row sm:items-center'
          >
            <div className='min-w-[70px] border-default-300 text-center sm:border-l-2 sm:pl-3 sm:text-left'>
              <span className='block font-mono text-[10px] uppercase tracking-tighter text-default-400'>
                Nivel
              </span>
              <span className='text-xl font-bold leading-none'>
                {floor.toString().padStart(2, '0')}
              </span>
            </div>

            <div className='flex w-full flex-wrap justify-center gap-2 sm:justify-start'>
              {depts.map((unit) => {
                const isSelected = selectedIds.includes(unit.id);
                const isAvailable = unit.state === 1;
                const stateMeta = getUnitStateMeta(unit.state);
                return (
                  <button
                    key={unit.id}
                    disabled={!isAvailable}
                    onClick={() => handleSelect(unit)}
                    className={`relative flex min-w-[90px] flex-1 flex-col items-center rounded-xl border-2 px-4 py-3 transition-all duration-400 sm:min-w-[110px] sm:flex-none ${
                      isSelected
                        ? 'z-10 scale-[1.05] border-foreground bg-foreground text-background shadow-2xl'
                        : isAvailable
                          ? stateMeta.buttonClass
                          : `${stateMeta.buttonClass} opacity-85`
                    }`}
                  >
                    <span className='text-[9px] font-bold uppercase tracking-[0.2em] opacity-70'>
                      Depto
                    </span>
                    <span className='font-mono text-base font-black'>
                      {unit.unit_number}
                    </span>
                    {unit.real_square_meters && (
                      <span
                        className={`mt-1 text-[10px] font-medium ${isSelected ? 'opacity-90' : 'text-default-400'}`}
                      >
                        {unit.real_square_meters} m²
                      </span>
                    )}
                    <span
                      className={`mt-1 text-[9px] font-semibold uppercase tracking-wider ${isSelected ? 'text-background/80' : stateMeta.badgeClass}`}
                    >
                      {stateMeta.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <AnimatePresence>
        {selectedIds.length > 0 && hasFeatures && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className='mt-32 pb-40'
          >
            <div className='mb-16 px-4 text-center'>
              <h2 className='font-serif text-4xl italic text-foreground'>
                Detalles de Selección
              </h2>
            </div>
            <div className='mx-auto max-w-[1400px] px-4'>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className='overflow-x-auto rounded-[2rem] border border-default-200/80 bg-background/90 shadow-[0_20px_70px_-40px_rgba(15,23,42,0.45)] dark:border-transparent dark:bg-transparent dark:shadow-none'
              >
                <table className='w-full min-w-[720px]'>
                  <thead>
                    <tr>
                      {selectedUnits.map((unit) => (
                        <th
                          key={unit.id}
                          className='min-w-[280px] border-default-200/80 px-8 py-8 text-center align-top backdrop-blur-sm dark:border-default-100/10'
                        >
                          <div className='space-y-5'>
                            <div className='space-y-2'>
                              <p className='text-[10px] font-bold uppercase tracking-[0.3em] text-default-400'>
                                Departamento
                              </p>
                              <p className='text-xl font-bold tracking-tight text-foreground sm:text-2xl'>
                                {unit.unit_number}
                              </p>
                              {/* {unit.model?.name_model_department && (
                                <p className='text-sm text-default-500'>
                                  {unit.model.name_model_department}
                                </p>
                              )} */}
                            </div>
                            <div className='border-t border-default-200/70 pt-5 dark:border-default-100/10'>
                              <div className='flex items-end justify-center gap-2'>
                                <span className='text-5xl font-black tracking-tighter text-foreground sm:text-6xl'>
                                  {unit.real_square_meters?.toLocaleString(
                                    'es-MX'
                                  ) ?? '--'}
                                </span>
                              </div>
                              <p className='mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-default-400'>
                                m² Construidos
                              </p>
                              <p className='mt-1 text-sm text-default-500'>
                                Nivel {unit.floor}
                              </p>
                            </div>
                            <div>
                              <Chip
                                variant='flat'
                                color={getUnitStateMeta(unit.state).chipColor}
                                className='mx-auto w-fit px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider'
                              >
                                {getUnitStateMeta(unit.state).label}
                              </Chip>
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRooms.map((room, rowIndex) => (
                      <tr key={room}>
                        {selectedUnits.map((unit) => {
                          const roomFeatures =
                            unit.model?.features?.filter(
                              (feature) =>
                                !!feature.dfeatures_name?.trim() &&
                                (feature.room?.trim() || 'General') === room
                            ) ?? [];

                          return (
                            <td
                              key={`${unit.id}-${room}`}
                              className={`px-8 align-top text-base ${
                                rowIndex % 2 === 0
                                  ? 'bg-content1/10 dark:bg-transparent'
                                  : 'bg-default-50/10 dark:bg-transparent'
                              }`}
                            >
                              <div className='min-h-[180px] border-t border-default-200/70 py-8 dark:border-default-100/10'>
                                <div className='mb-6 flex flex-col items-center justify-center gap-2'>
                                  <div className='relative h-9 w-9 shrink-0'>
                                    <img
                                      src={categoryIcons[room] ?? '/clogo5.png'}
                                      alt={`${room} icono`}
                                      className='h-full w-full object-contain brightness-0 dark:invert'
                                      loading='lazy'
                                      decoding='async'
                                    />
                                  </div>
                                  <div className='text-center'>
                                    <p className='text-xs font-bold uppercase tracking-[0.24em] text-default-400'>
                                      {room}
                                    </p>
                                    <p className='text-xs text-default-500'>
                                      Caracteristicas del ambiente
                                    </p>
                                  </div>
                                </div>
                                {roomFeatures.length > 0 ? (
                                  <div className='space-y-5 text-center'>
                                    {roomFeatures.map((feature) => (
                                      <div
                                        key={feature.id}
                                        className='mx-auto flex max-w-[30ch] items-start justify-center gap-3'
                                      >
                                        <span className='mt-3 h-1.5 w-1.5 rounded-full bg-foreground/35' />
                                        <p className='text-pretty text-lg font-semibold leading-7 tracking-tight text-foreground/85'>
                                          {feature.dfeatures_name}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className='flex min-h-16 items-center justify-center'>
                                    <span className='text-sm text-default-300'>
                                      —
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            </div>
            {comparisonRooms.length === 0 && (
              <p className='mt-8 text-center text-sm text-default-500'>
                No hay definiciones disponibles para comparar.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calculadora de Precio por Metro Cuadrado */}
      {/* Selector Flotante Minimalista */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className='pointer-events-none fixed right-0 z-50 flex justify-center px-4 lg:bottom-10'
          >
            <Card className='pointer-events-auto flex max-w-md flex-row justify-between border border-white/10 bg-black/80 p-4 text-white opacity-60 shadow-2xl backdrop-blur-xl dark:bg-content1'>
              <div className='flex flex-col gap-1'>
                <p className='text-[9px] font-bold uppercase tracking-[0.2em] opacity-50'>
                  Unidades seleccionadas
                </p>
                <div className='mt-1 flex flex-wrap gap-2'>
                  {selectedUnits.map((u) => (
                    <Chip
                      key={u.id}
                      size='sm'
                      variant='flat'
                      className='border border-white/15 bg-white/10 font-mono text-xs font-bold text-white dark:border-white/15 dark:bg-white/10'
                    >
                      #{u.unit_number}
                    </Chip>
                  ))}
                </div>
              </div>
              <div className='flex items-center gap-4'>
                <div className='text-right'>
                  <span className='text-2xl font-black'>
                    {selectedIds.length}
                  </span>
                  <span className='ml-1 text-[10px] opacity-40'>
                    / {maxSelections}
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
