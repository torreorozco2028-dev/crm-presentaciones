'use client';

import React, { useState, useTransition } from 'react';
import { Pagination, Image, Button } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getBuildings } from './_actions/building-actions';
import { publishLandingChanges } from './_actions/publish-actions';
import { useParams, useRouter } from 'next/navigation';
import useUserRole from '@/lib/getUserRole';

interface Building {
  id: string | number;
  building_title: string;
  prymary_image: string | null; // Puede ser URL de imagen (.png, .jpg, .webp) o video (.mp4)
  building_description: string | null;
  building_location: string | null;
  is_published?: boolean;
}

interface LaunchTableProps {
  buildings: Building[];
  total: number;
}

export default function LaunchTable({ buildings, total }: LaunchTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [items, setItems] = useState<any[]>(buildings);
  const [isPublishing, startPublishing] = useTransition();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const userRole = useUserRole();
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
    router.push(`/${locale}/presentations/${id}/building`);
  };

  const handlePublish = (id: string | number) => {
    startPublishing(async () => {
      const result = await publishLandingChanges(String(id));
      if (result.success) {
        setItems((prev) =>
          prev.map((b) => ({ ...b, is_published: b.id === id }))
        );
        toast.success('Landing publicada correctamente');
      } else {
        toast.error(result.error || 'No se pudo publicar');
      }
    });
  };

  return (
    <div className='items-between mx-auto flex min-h-screen max-w-7xl flex-col'>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className='mb-20 text-center'
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
      <div className='mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:grid-cols-2 sm:gap-6 md:-mt-4 md:mb-4 md:gap-8 lg:grid-cols-3'>
        <AnimatePresence mode='wait'>
          {items.map((building) => (
            <motion.div
              key={`${building.id}-${currentPage}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              whileHover={{ scale: 1.02 }}
              // Definimos una altura fija para que el % funcione, o puedes usar h-full si el padre tiene altura
              className='flex h-[500px] cursor-pointer flex-col overflow-hidden rounded-xl border-1 border-foreground-50 bg-transparent shadow-md hover:shadow-xl'
              onClick={() => navToPresentation(building.id)}
            >
              <div className='group relative flex h-full flex-col'>
                {/* CONTENEDOR DE IMAGEN/VIDEO - Ocupa el 70% (puedes cambiar a h-[60%]) */}
                <div className='relative h-[70%] w-full overflow-hidden opacity-95 transition-opacity duration-300 group-hover:opacity-100'>
                  {isVideo(building.prymary_image) ? (
                    <video
                      src={building.prymary_image}
                      className='h-full w-full object-cover'
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
                    />
                  )}

                  {/* Efecto de brillo (Shimmer) al hacer hover */}
                  <motion.div
                    className='pointer-events-none absolute inset-0'
                    style={{
                      background:
                        'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                    }}
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                </div>

                {/* CONTENEDOR DE TEXTO - Ocupa el 30% restante */}
                <div className='flex h-[30%] flex-col justify-center gap-1 bg-white/5 p-4 backdrop-blur-sm'>
                  <h3 className='line-clamp-1 text-lg font-bold leading-tight text-foreground-900 transition-colors group-hover:text-amber-400'>
                    {building.building_title}
                  </h3>

                  {building.building_location && (
                    <div className='flex items-center gap-1 text-zinc-400'>
                      <svg
                        className='h-3 w-3 flex-shrink-0'
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
                      <span className='truncate text-xs font-medium'>
                        {building.building_location}
                      </span>
                    </div>
                  )}

                  {building.building_description && (
                    <p className='line-clamp-2 text-xs text-zinc-500 transition-colors group-hover:text-zinc-300'>
                      {building.building_description}
                    </p>
                  )}

                  {userRole === 'admin' && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <Button
                        size='sm'
                        className='mt-2'
                        color={building.is_published ? 'success' : 'warning'}
                        variant={building.is_published ? 'flat' : 'solid'}
                        isLoading={isPublishing}
                        onPress={() => handlePublish(building.id)}
                      >
                        {building.is_published
                          ? 'Publicada · Actualizar landing'
                          : 'Publicar cambios'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {/* Paginación */}
      {total >= 1 && (
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
