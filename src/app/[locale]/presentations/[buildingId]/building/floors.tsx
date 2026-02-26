'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, Chip } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';

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

interface Props {
  units: UnitDepartment[];
}

const categoryIcons: Record<string, string> = {
  General: '/clogo1.png',
  Cocina: '/clogo2.png',
  Baño: '/clogo3.png',
  Dormitorio: '/clogo4.png',
  Lavanderia: '/clogo5.png',
  Sala: '/clogo6.png',
};

const roomOrder: Record<string, number> = {
  General: 0,
  Cocina: 1,
  Baño: 2,
  Dormitorio: 3,
  Lavanderia: 4,
  Sala: 5,
};

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

  return (
    <div
      id='equipo'
      className='min-h-screen bg-background p-4 pt-10 font-sans text-foreground transition-colors sm:p-10'
    >
      <div className='mb-10 text-center'>
        <h1 className='mb-4 text-4xl font-light tracking-tight text-foreground sm:text-5xl'>
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
                return (
                  <button
                    key={unit.id}
                    disabled={!isAvailable}
                    onClick={() => handleSelect(unit)}
                    className={`relative flex min-w-[90px] flex-1 flex-col items-center rounded-xl border-2 px-4 py-3 transition-all duration-400 sm:min-w-[110px] sm:flex-none ${
                      isSelected
                        ? 'z-10 scale-[1.05] border-foreground bg-foreground text-background shadow-2xl'
                        : isAvailable
                          ? 'border-default-200 text-default-600 hover:border-foreground dark:border-default-800'
                          : 'cursor-not-allowed border-default-100 bg-default-50/30 text-default-300 opacity-40'
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
                      color={unit.state === 1 ? 'success' : 'default'}
                      className='px-4 py-1 text-[10px] font-bold uppercase tracking-widest'
                    >
                      {unit.state === 1 ? 'Disponible' : 'Consultar'}
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
                              <div className='flex h-10 w-10 items-center justify-center'>
                                <img
                                  src={
                                    categoryIcons[masterGroup.room] ||
                                    '/clogo1.png'
                                  }
                                  alt={masterGroup.room}
                                  className='h-full w-full object-contain grayscale'
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

      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className='pointer-events-none fixed bottom-8 left-0 right-0 z-50 flex justify-center px-4'
          >
            <Card className='pointer-events-auto flex w-full max-w-md flex-row items-center justify-between border border-white/10 bg-black/80 p-4 text-white shadow-2xl backdrop-blur-xl dark:bg-content1'>
              <div className='flex flex-col gap-1'>
                <p className='text-[9px] font-bold uppercase tracking-[0.2em] opacity-50'>
                  Unidades seleccionadas
                </p>
                <div className='flex gap-2'>
                  {selectedUnits.map((u) => (
                    <span key={u.id} className='font-mono text-sm font-bold'>
                      #{u.unit_number}
                    </span>
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
