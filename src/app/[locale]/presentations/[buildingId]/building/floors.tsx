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

const categoryIcons: Record<string, string> = {
  General: '/clogo1.png',
  Cocina: '/clogo2.png',
  Baño: '/clogo3.png',
  Dormitorio: '/clogo4.png',
  Lavanderia: '/clogo5.png',
  Sala: '/clogo6.png',
};

const darkIcons: Record<string, string> = {
  General: '/dlogo1.png',
  Cocina: '/dlogo2.png',
  Baño: '/dlogo3.png',
  Dormitorio: '/dlogo4.png',
  Lavanderia: '/dlogo5.png',
  Sala: '/dlogo6.png',
};

const roomOrder: Record<string, number> = {
  General: 0,
  Cocina: 1,
  Baño: 2,
  Dormitorio: 3,
  Lavanderia: 4,
  Sala: 5,
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

export default function Floors({ units, building }: Props) {
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

  const groupedFeatures = useMemo(() => {
    const allFeatures = new Map<string, Map<string, DepartmentFeature>>();

    units.forEach((unit) => {
      if (unit.model?.features) {
        unit.model.features.forEach((feature) => {
          const roomName = feature.room || 'General';
          if (!allFeatures.has(roomName)) {
            allFeatures.set(roomName, new Map());
          }
          const roomMap = allFeatures.get(roomName)!;
          if (!roomMap.has(feature.id)) {
            roomMap.set(feature.id, feature);
          }
        });
      }
    });

    return Array.from(allFeatures.entries())
      .map(([room, featuresMap]) => ({
        room,
        features: Array.from(featuresMap.values()).sort(
          (a, b) => (a.order || 0) - (b.order || 0)
        ),
      }))
      .sort((a, b) => {
        const orderA = roomOrder[a.room] ?? 999;
        const orderB = roomOrder[b.room] ?? 999;
        return orderA - orderB;
      });
  }, [units]);

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

  // Calcular precios y ahorros por etapa
  const priceAnalysis = useMemo(() => {
    if (!building?.salesStages || building.salesStages.length === 0) {
      return null;
    }

    const stagesWithPrices = building.salesStages.map((stage) => {
      const stagePrice = stage.price || 0;
      const selectedUnitsData = selectedUnits.map((unit) => {
        const squareMeters = unit.real_square_meters || 0;
        // stagePrice es el precio por m², multiplicamos por m² para obtener el total
        const totalPrice = stagePrice * squareMeters;
        const pricePerM2 = stagePrice;
        return {
          unit,
          pricePerM2,
          totalPrice,
        };
      });

      // Calcular el promedio de precio por m² (que es el mismo stagePrice)
      const avgPricePerM2 = stagePrice;

      return {
        stage,
        avgPricePerM2,
        selectedUnitsData,
        stagePrice,
      };
    });

    const minPrice = Math.min(...stagesWithPrices.map((s) => s.avgPricePerM2));
    const maxPrice = Math.max(...stagesWithPrices.map((s) => s.avgPricePerM2));

    const sortedStages = [...stagesWithPrices].sort(
      (a, b) => a.avgPricePerM2 - b.avgPricePerM2
    );

    return {
      sortedStages,
      minPrice,
      maxPrice,
    };
  }, [building?.salesStages, selectedUnits]);

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
              <div className='mx-auto mt-4 h-px w-20 bg-primary/40' />
            </div>
            <div className='mx-auto max-w-[1400px] px-4'>
              <div className='flex flex-wrap justify-center gap-2 sm:gap-6 lg:flex-nowrap lg:gap-4'>
                {selectedUnits.map((unit) => (
                  <motion.div
                    key={unit.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className='flex w-[calc(50%-0.5rem)] flex-col items-center space-y-4 rounded-xl border border-default-100 bg-content1/50 p-4 shadow-sm backdrop-blur-sm sm:w-[calc(50%-1.5rem)] sm:space-y-8 sm:p-8 lg:w-1/4'
                  >
                    <div className='space-y-3 text-center'>
                      <p className='text-[10px] font-bold uppercase tracking-[0.3em] text-default-400'>
                        Departamento
                      </p>
                      <h3 className='text-5xl font-black tracking-tighter text-foreground'>
                        {unit.unit_number}
                      </h3>

                      <div className='flex flex-col items-center gap-1 text-sm text-default-600'>
                        <span className='font-medium'>Nivel {unit.floor}</span>
                        <span className='rounded bg-default-100 px-2 py-0.5 font-mono text-xs'>
                          {unit.real_square_meters} m² totales
                        </span>
                      </div>

                      {unit.model?.name_model_department && (
                        <p className='pt-2 text-xs font-bold uppercase tracking-widest text-primary'>
                          {unit.model.name_model_department}
                        </p>
                      )}
                    </div>

                    <Chip
                      variant='flat'
                      color={getUnitStateMeta(unit.state).chipColor}
                      className='px-4 py-1 text-[10px] font-bold uppercase tracking-widest'
                    >
                      {getUnitStateMeta(unit.state).label}
                    </Chip>
                    <div className='w-full space-y-12'>
                      {groupedFeatures.map((masterGroup) => {
                        const unitFeaturesInGroup = masterGroup.features.filter(
                          (feature) =>
                            unit.model?.features?.some(
                              (f) => f.id === feature.id
                            )
                        );

                        return (
                          <div
                            key={masterGroup.room}
                            className='flex flex-col items-center text-center'
                          >
                            <div className='mb-4 flex h-[70px] flex-col items-center justify-center gap-2'>
                              <div className='relative flex h-10 w-10 items-center justify-center'>
                                <img
                                  src={
                                    categoryIcons[masterGroup.room] ??
                                    '/clogo5.png'
                                  }
                                  alt={`${masterGroup.room} — logo claro`}
                                  loading='lazy'
                                  decoding='async'
                                />
                                <img
                                  src={
                                    darkIcons?.[masterGroup.room] ??
                                    '/dlogo5.png'
                                  }
                                  alt={`${masterGroup.room} — logo oscuro`}
                                  className='absolute inset-0 h-full w-full object-contain opacity-0 grayscale transition-opacity duration-300 dark:opacity-100'
                                  loading='lazy'
                                  aria-hidden='false'
                                />
                              </div>
                              <p className='text-[10px] font-black uppercase tracking-[0.2em] text-default-500'>
                                {masterGroup.room}
                              </p>
                            </div>
                            <div className='flex min-h-[60px] flex-col items-center justify-start space-y-2'>
                              {unitFeaturesInGroup.length > 0 ? (
                                unitFeaturesInGroup.map((feature) => (
                                  <p
                                    key={feature.id}
                                    className='text-sm font-medium leading-tight text-foreground/80'
                                  >
                                    {feature.dfeatures_name}
                                  </p>
                                ))
                              ) : (
                                <div className='h-4 w-8 border-b border-default-100 opacity-20' />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calculadora de Precio por Metro Cuadrado */}
      <AnimatePresence>
        {selectedIds.length > 0 && priceAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className='mt-20'
          >
            <div className='mb-12 px-4 text-center'>
              <h2 className='text-3xl font-bold text-foreground'>
                Análisis de Precio por Metro Cuadrado
              </h2>
              <p className='mt-3 text-sm text-default-500'>
                Invierta ahora, obtenga ganancias mañana - Vea el potencial de
                ahorro en cada etapa
              </p>
            </div>

            {/* Resumen de Ahorro Total */}
            <div className='mx-auto max-w-7xl px-4'>
              {/* Grilla de Precios por Sales Stage - Ordenada */}
              <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                {priceAnalysis.sortedStages.map(
                  (
                    { stage, avgPricePerM2, selectedUnitsData, stagePrice },
                    index
                  ) => {
                    const isCheapest = avgPricePerM2 === priceAnalysis.minPrice;

                    return (
                      <motion.div
                        key={stage.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative rounded-lg border-2 p-6 shadow-md transition-all ${
                          isCheapest
                            ? 'border-success bg-success/10 ring-2 ring-success/30'
                            : 'border-default-200 bg-content1 hover:border-primary hover:shadow-lg'
                        }`}
                      >
                        {/* Badge de Mejor Opción */}
                        {isCheapest && (
                          <div className='absolute -top-3 right-4 inline-block rounded-full bg-success px-3 py-1 text-xs font-bold text-background'>
                            🏆 MEJOR INVERSIÓN
                          </div>
                        )}

                        {/* Badge de Posición */}
                        <div className='mb-3 inline-block rounded-full bg-default-100 px-3 py-1 text-xs font-semibold text-default-700'>
                          Etapa {index + 1} de{' '}
                          {priceAnalysis.sortedStages.length}
                        </div>

                        <div className='space-y-4'>
                          {/* Nombre de la etapa de venta */}
                          <div>
                            <p className='text-xs font-semibold uppercase tracking-widest text-default-500'>
                              Etapa
                            </p>
                            <h3 className='text-2xl font-bold text-foreground'>
                              {stage.stage_type}
                            </h3>
                          </div>

                          {/* Precio de la etapa */}
                          <div className='border-t border-default-200 pt-3'>
                            <p className='text-xs text-default-400'>
                              Precio Base
                            </p>
                            <p className='text-2xl font-black text-primary'>
                              ${stagePrice.toLocaleString('es-MX')}
                            </p>
                          </div>

                          {/* Ahorro comparado
                          {savings > 0 && (
                            <div className='border-t border-success/30 bg-success/10 p-3 rounded dark:bg-success/5'>
                              <p className='text-xs mb-1 font-semibold text-success'>
                                💡 Ahorro vs. Precio Máximo
                              </p>
                              <p className='text-lg font-black text-success'>
                                ${savings.toFixed(2).replace('.', ',')} por m²
                              </p>
                              <p className='text-xs text-success/70 mt-1'>
                                Ahorras un {savingsPercent}% comprando en esta etapa
                              </p>
                            </div>
                          )} */}

                          {/* Total Ganancia Potencial para todos los departamentos
                          {selectedUnitsData.length > 0 && (() => {
                            const totalGainPerStage = selectedUnitsData.reduce((sum, { unit }) => {
                              const currentPrice = stagePrice * (unit.real_square_meters || 0);
                              const finalSalePrice =
                                priceAnalysis.maxPrice * (unit.real_square_meters || 0);
                              const gain = finalSalePrice - currentPrice;
                              return sum + gain;
                            }, 0);

                            const totalCurrentInvestment = selectedUnitsData.reduce((sum, { unit }) => {
                              return sum + stagePrice * (unit.real_square_meters || 0);
                            }, 0);

                            const portfolioGainPercent = totalCurrentInvestment > 0
                              ? ((totalGainPerStage / totalCurrentInvestment) * 100).toFixed(1)
                              : 0;

                            return (
                              <div className='border-t border-default-200 pt-3'>
                                <p className='text-xs font-semibold mb-2 text-default-500'>
                                  💰 Ganancia Total por Portafolio
                                </p>
                                <div className={`rounded border p-2 ${
                                  totalGainPerStage > 0
                                    ? 'border-success/30 bg-success/10'
                                    : 'border-default-200 bg-default-50'
                                }`}>
                                  <div className='flex items-center justify-between text-sm'>
                                    <span className='font-semibold text-foreground'>
                                      Ganancia Potencial:
                                    </span>
                                    <span className={`text-lg font-black ${
                                      totalGainPerStage > 0
                                        ? 'text-success'
                                        : 'text-warning'
                                    }`}>
                                      {totalGainPerStage > 0 ? '+' : ''}${totalGainPerStage.toLocaleString('es-MX', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                      })}
                                    </span>
                                  </div>
                                  {totalGainPerStage > 0 && (
                                    <p className='text-[10px] text-success/70 mt-1'>
                                      {portfolioGainPercent}% de retorno total
                                    </p>
                                  )}
                                  {totalGainPerStage === 0 && (
                                    <p className='text-[10px] text-default-500 mt-1'>
                                      Sin ganancia: esta es la etapa final de venta
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })()} */}

                          {/* Detalles por unidad seleccionada */}
                          {selectedUnitsData.length > 0 && (
                            <div className='border-t border-default-200 pt-3'>
                              <p className='mb-3 text-xs font-semibold text-default-500'>
                                Por Unidad Seleccionada
                              </p>
                              <div className='space-y-3'>
                                {selectedUnitsData.map(
                                  ({ unit, pricePerM2, totalPrice }) => {
                                    // Calcular ganancia potencial desde la etapa actual hasta la etapa final
                                    const maxTotalPrice =
                                      (unit.real_square_meters || 0) *
                                      priceAnalysis.maxPrice;
                                    const potentialGain =
                                      maxTotalPrice - totalPrice;
                                    const gainPercent =
                                      totalPrice > 0
                                        ? (
                                            (potentialGain / totalPrice) *
                                            100
                                          ).toFixed(1)
                                        : 0;

                                    return (
                                      <div
                                        key={unit.id}
                                        className='rounded border border-default-200 bg-default-100/50 p-3'
                                      >
                                        <div className='mb-2 flex items-center justify-between'>
                                          <span className='font-semibold text-foreground'>
                                            {unit.floor} - {unit.unit_number}
                                          </span>
                                          <span className='text-xs text-default-500'>
                                            {unit.real_square_meters}m²
                                          </span>
                                        </div>
                                        <div className='space-y-1.5 border-t border-default-200 pt-2'>
                                          <div className='flex items-center justify-between text-xs'>
                                            <span className='text-default-500'>
                                              Precio/m²:
                                            </span>
                                            <span
                                              className={`font-bold ${
                                                isCheapest
                                                  ? 'text-success'
                                                  : 'text-primary'
                                              }`}
                                            >
                                              $
                                              {pricePerM2
                                                .toFixed(2)
                                                .replace('.', ',')}
                                            </span>
                                          </div>
                                          <div className='flex items-center justify-between text-sm'>
                                            <span className='font-semibold text-foreground'>
                                              Total:
                                            </span>
                                            <span
                                              className={`text-lg font-black ${
                                                isCheapest
                                                  ? 'text-success'
                                                  : 'text-primary'
                                              }`}
                                            >
                                              $
                                              {totalPrice.toLocaleString(
                                                'es-MX',
                                                {
                                                  minimumFractionDigits: 2,
                                                  maximumFractionDigits: 2,
                                                }
                                              )}
                                            </span>
                                          </div>
                                          {/* Ganancia Potencial */}
                                          {potentialGain > 0 && (
                                            <div className='mt-2 border-t border-default-200 pt-1.5'>
                                              <div className='flex items-center justify-between text-xs'>
                                                <span className='text-default-500'>
                                                  Ganancia Potencial:
                                                </span>
                                                <span className='font-black text-success'>
                                                  +$
                                                  {potentialGain.toLocaleString(
                                                    'es-MX',
                                                    {
                                                      minimumFractionDigits: 2,
                                                      maximumFractionDigits: 2,
                                                    }
                                                  )}
                                                </span>
                                              </div>
                                              <p className='mt-0.5 text-[10px] text-success/70'>
                                                {gainPercent}% de retorno
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            </div>
                          )}

                          {/* Descripción de la etapa */}
                          {stage.stage_description && (
                            <div className='border-t border-default-200 pt-3'>
                              <p className='text-xs italic text-default-400'>
                                {stage.stage_description}
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  }
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
