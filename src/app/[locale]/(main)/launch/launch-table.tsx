'use client';

import React, { useState } from 'react';
import { Pagination, Image } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { getBuildings } from './_actions/building-actions';
import { useParams, useRouter } from 'next/navigation';

interface Building {
  id: string | number;
  building_title: string;
  prymary_image: string | null; // Puede ser URL de imagen (.png, .jpg, .webp) o video (.mp4)
  building_description: string | null;
  building_location: string | null;
}

interface LaunchTableProps {
  buildings: Building[];
  total: number;
}

export default function LaunchTable({ buildings, total }: LaunchTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [items, setItems] = useState<any[]>(buildings);
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const isVideo = (url: string) => {
    return (
      url.toLowerCase().endsWith('.mp4') ||
      url.toLowerCase().endsWith('.webm') ||
      url.toLowerCase().endsWith('.mov')
    );
  };
  const onPageChange = async (pNum: number) => {
    const items = await getBuildings(3, pNum);
    setItems(items);
    setCurrentPage(pNum);
  };

  const navToPresentation = (id: string | number) => {
    router.push(`/${locale}/presentaciones/${id}`);
  };

  return (
    <div className='items-between mx-auto flex min-h-screen max-w-7xl flex-col justify-between'>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className='mb-8 text-center'
      >
        <h1
          className='mb-2 text-2xl font-black tracking-tight sm:text-3xl md:mb-3 md:text-xl lg:text-3xl'
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
      </motion.div>
      <div className='mb-10 grid grid-cols-1 gap-4 sm:mb-12 sm:grid-cols-2 sm:gap-6 md:mb-16 md:gap-8 lg:grid-cols-3'>
        <AnimatePresence mode='wait'>
          {items.map((building) => (
            <motion.div
              key={`${building.id}-${currentPage}`}
              initial={{ scale: 0.9 }}
              animate={{}}
              exit={{}}
              whileHover={{ opacity: 1, scale: 1 }}
              className='hover:border-lg cursor-pointer rounded-xl border-foreground-50 bg-transparent duration-300 hover:rounded-lg hover:border-1 hover:border-foreground-50 hover:shadow-xl'
              onClick={() => navToPresentation(building.id)}
            >
              <div className={`group relative overflow-hidden`}>
                <div className='relative p-0 opacity-95 group-hover:opacity-100'>
                  {/* Contenedor de imagen/video */}
                  <div>
                    {isVideo(building.prymary_image) ? (
                      <video
                        src={building.prymary_image}
                        className='h-full w-full object-cover group-hover:scale-110'
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      <Image
                        src={building.prymary_image}
                        alt={building.building_title}
                        className='h-full w-full object-cover'
                        removeWrapper
                        style={{
                          background: 'transparent',
                        }}
                      />
                    )}
                    <motion.div
                      className='absolute inset-0 opacity-0 group-hover:opacity-100'
                      style={{
                        background:
                          'linear-gradient(90deg, transparent, rgba(251, 190, 36, 0), transparent)',
                      }}
                      animate={{
                        x: ['-100%', '100%'],
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                    />
                  </div>
                </div>
                <div className='flex flex-col items-start bg-transparent p-4 sm:gap-3 sm:p-6'>
                  <h3 className='text-lg font-bold leading-tight text-foreground-900 transition-colors duration-300 group-hover:text-amber-400 sm:text-xl md:text-2xl'>
                    {building.building_title}
                  </h3>

                  {building.building_location && (
                    <div className='flex items-center gap-2 text-sm text-zinc-400 transition-colors duration-300 group-hover:text-foreground-800'>
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
                      <span className='font-medium transition-colors duration-300 group-hover:text-foreground-800'>
                        {building.building_location}
                      </span>
                    </div>
                  )}

                  {building.building_description && (
                    <p className='line-clamp-2 text-xs leading-relaxed text-zinc-400 transition-colors duration-300 group-hover:text-foreground-800 sm:text-sm'>
                      {building.building_description}
                    </p>
                  )}

                  {/* Botón CTA */}
                </div>
              </div>
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
            total={Math.ceil(total / 3)}
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
