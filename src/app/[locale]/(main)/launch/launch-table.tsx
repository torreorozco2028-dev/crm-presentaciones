'use client';

import React, { useState } from 'react';
import { Card, CardBody, CardFooter, Pagination, Image } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { getBuildings } from './_actions/building-actions';

interface Building {
  id: string | number;
  building_title: string;
  primary_image: string; // Puede ser URL de imagen (.png, .jpg, .webp) o video (.mp4)
  building_description: string | null;
  building_location: string;
}

interface LaunchTableProps {
  buildings: Building[];
  total: number;
}

export default function LaunchTable({ buildings, total }: LaunchTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBuilding, setSelectedBuilding] = useState<
    string | number | null
  >(null);
  const [items, setItems] = useState<any[]>(buildings);
  // Helper function to check if media is video
  const isVideo = (url: string) => {
    return (
      url.toLowerCase().endsWith('.mp4') ||
      url.toLowerCase().endsWith('.webm') ||
      url.toLowerCase().endsWith('.mov')
    );
  };
  const onPageChange = async (pNum: number) => {
    const items = await getBuildings(10, pNum);
    setItems(items);
    setCurrentPage(pNum);
  };

  return (
    <div className='mx-auto max-w-7xl'>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className='mb-8 text-center'
      >
        <h1
          className='mb-2 text-2xl font-black tracking-tight sm:text-3xl md:mb-3 md:text-4xl lg:text-5xl'
          style={{
            background:
              'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #fbbf24 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundSize: '200% auto',
          }}
        >
          Proyectos Exclusivos
        </h1>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className='mx-auto mb-2 h-1 w-24 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 sm:w-32 md:mb-3'
        />
        <p className='mx-auto max-w-2xl text-base font-light tracking-wide text-zinc-400 sm:text-lg md:text-xl'>
          Descubre nuestra colección de desarrollos inmobiliarios premium
        </p>
      </motion.div>
      <div className='mb-10 grid grid-cols-1 gap-4 sm:mb-12 sm:grid-cols-2 sm:gap-6 md:mb-16 md:gap-8 lg:grid-cols-3'>
        <AnimatePresence mode='wait'>
          {items.map((building, index) => (
            <motion.div
              key={`${building.id}-${currentPage}`}
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: -30 }}
              transition={{
                duration: 0.5,
                delay: index * 0.08,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              whileHover={{ y: -8 }}
              className='touch-none'
            >
              <Card
                isPressable
                className={`group relative overflow-hidden border-1 backdrop-blur-md transition-all duration-500 ${
                  selectedBuilding === building.id
                    ? 'scale-[1.02] border-amber-500 shadow-2xl shadow-amber-500/30'
                    : 'border-foreground-100/10 hover:border-foreground-200/10'
                }`}
                onPress={() =>
                  setSelectedBuilding(
                    selectedBuilding === building.id ? null : building.id
                  )
                }
              >
                <CardBody className='relative p-0'>
                  {/* Contenedor de imagen/video */}
                  <div className='relative aspect-[3/4] overflow-hidden bg-transparent'>
                    {isVideo(building.primary_image) ? (
                      <video
                        src={building.primary_image}
                        className='h-full w-full object-cover transition-all duration-700 group-hover:scale-110'
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      <Image
                        src={building.primary_image}
                        alt={building.building_title}
                        className='h-full w-full object-cover transition-all duration-700 group-hover:scale-110'
                        removeWrapper
                      />
                    )}
                    <motion.div
                      className='absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100'
                      style={{
                        background:
                          'linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.1), transparent)',
                      }}
                      animate={{
                        x: ['-100%', '100%'],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                    />
                    {/* Badge de selección */}
                    {selectedBuilding === building.id && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{
                          type: 'spring',
                          stiffness: 200,
                          damping: 15,
                        }}
                        className='absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-2xl shadow-amber-500/50 sm:right-4 sm:top-4 sm:h-14 sm:w-14'
                      >
                        <svg
                          className='h-6 w-6 text-zinc-950 sm:h-8 sm:w-8'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <motion.path
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={3}
                            d='M5 13l4 4L19 7'
                          />
                        </svg>
                      </motion.div>
                    )}
                  </div>
                </CardBody>
                <CardFooter className='flex flex-col items-start gap-2 border-t border-foreground-100/10 bg-gradient-to-br from-foreground-50 via-foreground-100 to-foreground-50 p-4 backdrop-blur-sm sm:gap-3 sm:p-6'>
                  <h3 className='text-lg font-bold leading-tight text-foreground-900 transition-colors duration-300 group-hover:text-amber-400 sm:text-xl md:text-2xl'>
                    {building.building_title}
                  </h3>

                  {building.building_location && (
                    <div className='flex items-center gap-2 text-sm text-zinc-400'>
                      <svg
                        className='h-4 w-4 flex-shrink-0'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                        />
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                        />
                      </svg>
                      <span className='font-medium'>
                        {building.building_location}
                      </span>
                    </div>
                  )}

                  {building.building_description && (
                    <p className='line-clamp-2 text-xs leading-relaxed text-zinc-400 sm:text-sm'>
                      {building.building_description}
                    </p>
                  )}

                  {/* Botón CTA */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className='mt-1 w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2 text-xs font-bold tracking-wide text-zinc-950 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/30 sm:mt-2 sm:px-4 sm:py-2.5 sm:text-sm'
                  >
                    Ver Detalles
                  </motion.button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {/* Paginación */}
      {total > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className='flex flex-col items-center gap-4 px-2 sm:gap-6'
        >
          <Pagination
            total={total}
            page={currentPage}
            onChange={onPageChange}
            showControls
            color='warning'
            // siblings={1} // Opcional: mantiene la paginación compacta
          />
        </motion.div>
      )}
    </div>
  );
}
