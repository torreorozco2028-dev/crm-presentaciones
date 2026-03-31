'use client';

import React, { useState, useMemo } from 'react';
import { Card, Chip } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bed, UtensilsCrossed, Bath, Wind, Zap, Check } from 'lucide-react';

// --- Tipos basados en tu esquema de DB ---
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
  state: number; // 1, 2, 3
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

// Mapeo de iconos por categoría
const categoryIcons: Record<string, React.ReactNode> = {
  General: <Check className='h-5 w-5' />,
  Dormitorios: <Bed className='h-5 w-5' />,
  Cocina: <UtensilsCrossed className='h-5 w-5' />,
  Baño: <Bath className='h-5 w-5' />,
  Sala: <Wind className='h-5 w-5' />,
  Lavanderia: <Zap className='h-5 w-5' />,
};

// Orden personalizado para los tipos de espacios
const roomOrder = {
  General: 0,
  Dormitorios: 1,
  Cocina: 2,
  Baño: 3,
  Sala: 4,
  Lavanderia: 5,
};

export default function Floors({ units, building }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  // Detectar tamaño de pantalla
  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxSelections = windowWidth < 768 ? 2 : 4; // 2 en mobile, 4 en desktop

  // Agrupar features por room y ordenar
  const groupedFeatures = useMemo(() => {
    const allFeatures = new Map<
      string,
      Map<string | null, DepartmentFeature[]>
    >();

    units.forEach((unit: any) => {
      if (unit.model?.features) {
        unit.model.features.forEach((feature: any) => {
          const room = feature.room || 'General';
          if (!allFeatures.has(room)) {
            allFeatures.set(room, new Map());
          }
          const roomMap = allFeatures.get(room)!;
          if (!roomMap.has(feature.id)) {
            roomMap.set(feature.id, feature);
          }
        });
      }
    });

    // Convertir a array y ordenar
    return Array.from(allFeatures.entries())
      .map(([room, featuresMap]) => ({
        room,
        features: Array.from(featuresMap.values()).sort(
          (a: any, b: any) => (a.order || 0) - (b.order || 0)
        ),
      }))
      .sort((a, b) => {
        const orderA = roomOrder[a.room as keyof typeof roomOrder] ?? 999;
        const orderB = roomOrder[b.room as keyof typeof roomOrder] ?? 999;
        return orderA - orderB;
      });
  }, [units]);

  // 1. Agrupar y ordenar datos dinámicamente
  const buildingMap = useMemo(() => {
    const floors: Record<number, UnitDepartment[]> = {};

    units.forEach((unit) => {
      if (!floors[unit.floor]) floors[unit.floor] = [];
      floors[unit.floor].push(unit);
    });

    // Ordenar departamentos dentro de cada piso por su número/nombre
    Object.keys(floors).forEach((f) => {
      floors[Number(f)].sort((a, b) =>
        a.unit_number.localeCompare(b.unit_number)
      );
    });

    // Retornar pisos ordenados de mayor a menor (arquitectónico)
    return Object.entries(floors)
      .map(([floor, depts]) => ({ floor: Number(floor), depts }))
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

  const hasFeatures = selectedUnits.some((u) => u.model?.features?.length > 0);

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
      className='min-h-screen bg-background p-4 pt-10 text-foreground transition-colors sm:p-10'
    >
      <p className='text-xs text-default-500'>
        Selecciona hasta {maxSelections} unidades para comparar
      </p>
      <div className='mx-auto flex max-w-3xl flex-col gap-4'>
        {buildingMap.map(({ floor, depts }) => (
          <div
            key={floor}
            className='group flex flex-col items-start gap-3 sm:flex-row sm:items-center'
          >
            {/* Etiqueta de Piso Estilo Plano */}
            <div className='min-w-[60px] border-l-2 border-default-300 pl-3'>
              <span className='block font-mono text-[10px] uppercase tracking-tighter text-default-400'>
                Nivel
              </span>
              <span className='text-lg font-bold leading-none'>
                {floor.toString().padStart(2, '0')}
              </span>
            </div>
            {/* Contenedor Flex Dinámico: Se adapta a cualquier cantidad de depts */}
            <div className='flex w-full flex-wrap gap-2'>
              {depts.map((unit) => {
                const isSelected = selectedIds.includes(unit.id);
                const isAvailable = unit.state === 1;
                return (
                  <button
                    key={unit.id}
                    disabled={!isAvailable}
                    onClick={() => handleSelect(unit)}
                    className={`relative flex min-w-[80px] flex-1 flex-col items-start rounded-lg border-2 px-4 py-3 transition-all duration-300 sm:min-w-[100px] sm:flex-none ${
                      isSelected
                        ? 'z-10 scale-[1.02] border-foreground bg-foreground text-background shadow-xl'
                        : isAvailable
                          ? 'border-default-300 text-default-600 hover:border-primary dark:border-default-700 dark:text-default-400'
                          : 'cursor-not-allowed border-default-100 bg-default-50/50 text-default-300 opacity-50 dark:border-default-900 dark:bg-default-900/20 dark:text-default-700'
                    } `}
                  >
                    <span className='text-[10px] font-bold uppercase tracking-widest opacity-70'>
                      Depto
                    </span>
                    <span className='font-mono text-sm font-black'>
                      {unit.unit_number}
                    </span>
                    {unit.real_square_meters && (
                      <span
                        className={`mt-1 text-[9px] ${isSelected ? 'opacity-80' : 'text-default-400'}`}
                      >
                        {unit.real_square_meters}m²
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Comparador de Características - Minimalista sin tabla */}
      <AnimatePresence>
        {selectedIds.length > 0 && hasFeatures && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className='mt-20'
          >
            <div className='mb-12 px-4 text-center'>
              <h2 className='text-3xl font-bold text-foreground'>
                Comparar Características
              </h2>
              <p className='mt-3 text-sm text-default-500'>
                Visualiza los detalles de las unidades seleccionadas
              </p>
            </div>

            {/* Columnas flexibles - Características minimalistas */}
            <div className='w-full sm:mx-auto sm:max-w-7xl'>
              <div className='flex flex-wrap justify-start gap-3 px-3 sm:justify-center sm:gap-12 sm:px-0 lg:gap-16'>
                {selectedUnits.map((unit) => (
                  <motion.div
                    key={unit.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='flex w-[calc(50%-6px)] flex-col space-y-8 px-4 py-6 sm:w-72 lg:rounded-lg lg:shadow-lg'
                  >
                    {/* Encabezado de la unidad */}
                    <div className='space-y-3 p-4 lg:text-center'>
                      <p className='text-xs font-semibold uppercase tracking-widest text-default-500'>
                        Departamento
                      </p>
                      <h3 className='text-4xl font-black tracking-tight text-foreground'>
                        {unit.unit_number}
                      </h3>
                      <div className='flex flex-col gap-2 pt-2 text-sm text-default-600'>
                        <span>
                          Piso{' '}
                          <span className='font-semibold text-foreground'>
                            {unit.floor}
                          </span>
                        </span>
                        <span>
                          <span className='font-semibold text-foreground'>
                            {unit.real_square_meters}
                          </span>
                          m²
                        </span>
                      </div>
                      {unit.model?.name_model_department && (
                        <p className='pt-2 text-xs font-semibold text-primary'>
                          {unit.model.name_model_department}
                        </p>
                      )}
                    </div>

                    {/* Estado */}
                    <Chip
                      variant='flat'
                      color={unit.state === 1 ? 'success' : 'default'}
                      className='flex w-fit text-xs font-semibold lg:self-center'
                    >
                      {unit.state === 1 && 'Disponible'}
                      {unit.state === 2 && 'Reservado'}
                      {unit.state === 3 && 'Vendido'}
                    </Chip>

                    {/* Características agrupadas por categoría */}
                    <div className='space-y-7'>
                      {groupedFeatures.map((group) => {
                        // Filtrar features que tiene esta unidad en esta categoría
                        const unitFeaturesInGroup = group.features.filter(
                          (feature: any) =>
                            unit.model?.features?.some(
                              (f) => f.id === feature.id
                            )
                        );

                        // Solo mostrar la categoría si la unidad tiene características en ella
                        if (unitFeaturesInGroup.length === 0) {
                          return null;
                        }

                        return (
                          <div
                            key={group.room}
                            className='bg-tra flex-col space-y-3 lg:flex lg:items-center'
                          >
                            <div className='flex items-center gap-2.5'>
                              <div className='text-default-400'>
                                {categoryIcons[group.room]}
                              </div>
                              <p className='text-xs font-bold uppercase tracking-widest text-default-600 dark:text-default-400'>
                                {group.room}
                              </p>
                            </div>
                            <div className='space-y-2.5 pl-8'>
                              {unitFeaturesInGroup.map((feature: any) => (
                                <p
                                  key={feature.id}
                                  className='text-sm font-medium leading-relaxed text-foreground'
                                >
                                  {feature.dfeatures_name}
                                </p>
                              ))}
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
      {/* Selector Flotante Minimalista */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className='pointer-events-none fixed right-0 z-50 flex justify-center px-4 lg:bottom-10 lg:right-10'
          >
            <Card className='pointer-events-auto w-full max-w-lg border border-default-200 bg-content1 bg-transparent p-4 text-foreground shadow-2xl'>
              <div className='flex items-center justify-between'>
                <div className='flex flex-col'>
                  <p className='text-[10px] uppercase tracking-widest text-default-500'>
                    Seleccionados
                  </p>
                  <div className='mt-1 flex gap-2'>
                    {selectedUnits.map((u) => (
                      <Chip
                        key={u.id}
                        size='sm'
                        variant='flat'
                        className='bg-default-100 font-bold text-foreground'
                      >
                        {u.unit_number}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div className='pl-2 text-right'>
                  <p className='text-2xl font-black text-foreground'>
                    {selectedIds.length}
                    <span className='ml-1 text-xs text-default-500'>
                      / {maxSelections}
                    </span>
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
