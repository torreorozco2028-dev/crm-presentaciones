'use client';

import React, { useState, useMemo } from 'react';
import { Card, Chip } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Tipos basados en tu esquema de DB ---
interface UnitDepartment {
  id: string;
  unit_number: string;
  floor: number;
  real_square_meters: number | null;
  state: number; // 1, 2, 3
}

interface Props {
  units: UnitDepartment[];
}

export default function Floors({ units }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
        : prev.length < 4
          ? [...prev, unit.id]
          : prev
    );
  };

  const selectedUnits = units.filter((u) => selectedIds.includes(u.id));

  return (
    <div
      id='equipo'
      className='min-h-screen bg-background p-4 pt-10 text-foreground transition-colors sm:p-10'
    >
      <p className='text-xs text-default-500'>
        Selecciona hasta 4 unidades para comparar
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

      {/* Selector Flotante Minimalista */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className='pointer-events-none fixed bottom-10 left-0 right-0 z-50 flex justify-center px-4'
          >
            <Card className='pointer-events-auto w-full max-w-lg bg-foreground p-4 text-background shadow-2xl dark:bg-content1 dark:text-foreground'>
              <div className='flex items-center justify-between'>
                <div className='flex flex-col'>
                  <p className='text-[10px] uppercase tracking-widest opacity-60'>
                    Seleccionados
                  </p>
                  <div className='mt-1 flex gap-2'>
                    {selectedUnits.map((u) => (
                      <Chip
                        key={u.id}
                        size='sm'
                        variant='flat'
                        className='bg-background/10 font-bold text-inherit'
                      >
                        {u.unit_number}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div className='text-right'>
                  <p className='text-2xl font-black'>
                    {selectedIds.length}
                    <span className='ml-1 text-xs opacity-50'>/ 4</span>
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
