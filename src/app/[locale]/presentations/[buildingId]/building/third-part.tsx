'use client';

import { fonts } from '@/config/fonts';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AnimatePresence,
  type PanInfo,
  animate,
  motion,
  useAnimationFrame,
  useMotionValue,
} from 'framer-motion';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Play,
  X,
} from 'lucide-react';

interface CommonArea {
  id: string;
  common_area_name: string;
  common_area_description: string | null;
  batch_images: unknown;
}

interface CommonAreaWithImages extends Omit<CommonArea, 'batch_images'> {
  batch_images: string[];
}

interface CommonAreasSectionProps {
  commonAreas: CommonArea[];
}

function toImageUrl(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (value && typeof value === 'object') {
    const possibleUrl = (value as { url?: unknown }).url;
    return typeof possibleUrl === 'string' ? possibleUrl.trim() : '';
  }
  return '';
}

function parseImageBatch(raw: unknown): string[] {
  if (!raw) return [];

  const parsed = (() => {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        const value = JSON.parse(raw);
        return Array.isArray(value) ? value : [value];
      } catch {
        return [raw];
      }
    }
    return [raw];
  })();

  return parsed.map(toImageUrl).filter(Boolean);
}

export default function CommonAreasSection({
  commonAreas,
}: CommonAreasSectionProps) {
  const [selectedArea, setSelectedArea] = useState<CommonAreaWithImages | null>(
    null
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDraggingRail, setIsDraggingRail] = useState(false);
  const dragX = useMotionValue(0);
  const [dragLeft, setDragLeft] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoDirectionRef = useRef<-1 | 1>(-1);
  const mainImageRef = useRef<HTMLDivElement>(null);

  const normalizedCommonAreas = useMemo<CommonAreaWithImages[]>(
    () =>
      (commonAreas ?? [])
        .map((area) => ({
          ...area,
          batch_images: parseImageBatch(area.batch_images),
        }))
        .filter((area) => area.batch_images.length > 0),
    [commonAreas]
  );

  useEffect(() => {
    document.body.style.overflow = selectedArea ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [selectedArea]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedArea?.id]);

  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      const cardW = w < 640 ? w * 0.8 : w < 1024 ? w * 0.44 : w * 0.28;
      const gap = w < 640 ? 16 : 20;
      const totalWidth =
        normalizedCommonAreas.length * cardW +
        Math.max(0, normalizedCommonAreas.length - 1) * gap;
      const containerW = containerRef.current?.clientWidth ?? w - 32;
      setDragLeft(-Math.max(0, totalWidth - containerW));
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [normalizedCommonAreas.length]);

  useEffect(() => {
    setCanScrollLeft(dragX.get() < -5);
    setCanScrollRight(dragLeft < -5);
    const unsubscribe = dragX.on('change', (v) => {
      setCanScrollLeft(v < -5);
      setCanScrollRight(v > dragLeft + 5);
    });
    return unsubscribe;
  }, [dragX, dragLeft]);

  const scrollRail = useCallback(
    (direction: 'left' | 'right') => {
      const w = window.innerWidth;
      const amount = Math.max(300, w * 0.75);
      const current = dragX.get();
      const next =
        direction === 'right'
          ? Math.max(dragLeft, current - amount)
          : Math.min(0, current + amount);
      animate(dragX, next, { type: 'spring', stiffness: 200, damping: 30 });
    },
    [dragX, dragLeft]
  );

  useAnimationFrame((_, delta) => {
    if (normalizedCommonAreas.length <= 1 || dragLeft >= -5 || isDraggingRail) {
      return;
    }

    const pxPerSecond = 22;
    const step = (pxPerSecond * delta) / 1000;
    const current = dragX.get();
    let next = current + autoDirectionRef.current * step;

    if (next <= dragLeft) {
      next = dragLeft;
      autoDirectionRef.current = 1;
    } else if (next >= 0) {
      next = 0;
      autoDirectionRef.current = -1;
    }

    dragX.set(next);
  });

  const selectedImages = selectedArea?.batch_images ?? [];
  const selectedImage = selectedImages[activeImageIndex] ?? selectedImages[0];

  const goNextImage = useCallback(() => {
    if (!selectedImages.length) return;
    setActiveImageIndex((prev) => (prev + 1) % selectedImages.length);
  }, [selectedImages.length]);

  const goPrevImage = useCallback(() => {
    if (!selectedImages.length) return;
    setActiveImageIndex(
      (prev) => (prev - 1 + selectedImages.length) % selectedImages.length
    );
  }, [selectedImages.length]);

  const handleSelectModalImage = useCallback((index: number) => {
    setActiveImageIndex(index);

    if (window.innerWidth < 1024) {
      mainImageRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, []);

  if (normalizedCommonAreas.length === 0) {
    return (
      <section id='areas-comunes' className='bg-white py-16 dark:bg-slate-950'>
        <div className='mx-auto max-w-6xl px-6 text-center'>
          <p className='text-sm text-default-500'>
            No hay areas comunes disponibles por el momento.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id='areas-comunes'
      className='relative overflow-hidden py-16 dark:bg-[#0B1220] dark:text-white sm:py-20'
    >
      <div className='mx-auto w-full max-w-[1700px] px-4 sm:px-8'>
        <div className='mb-8 flex flex-wrap items-end justify-between gap-5'>
          <div>
            <span className='mb-3 block text-[10px] font-bold uppercase tracking-[0.55em] text-zinc-500 dark:text-white/50'>
              Espacios Compartidos
            </span>
            <h2
              className={`${fonts.inter.className} text-3xl font-black uppercase tracking-tight text-zinc-500 dark:text-white sm:text-4xl lg:text-5xl`}
            >
              Areas Comunes
            </h2>
          </div>

          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => scrollRail('left')}
              disabled={!canScrollLeft}
              className='inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-35'
              aria-label='Desplazar a la izquierda'
            >
              <ArrowLeft size={18} />
            </button>
            <button
              type='button'
              onClick={() => scrollRail('right')}
              disabled={!canScrollRight}
              className='inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-35'
              aria-label='Desplazar a la derecha'
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <div ref={containerRef} className='overflow-hidden'>
          <motion.div
            drag='x'
            dragConstraints={{ left: dragLeft, right: 0 }}
            dragElastic={0.05}
            dragMomentum
            onDragStart={() => setIsDraggingRail(true)}
            onDragEnd={(_, info: PanInfo) => {
              if (info.velocity.x > 60) autoDirectionRef.current = 1;
              if (info.velocity.x < -60) autoDirectionRef.current = -1;
              setIsDraggingRail(false);
            }}
            style={{ x: dragX }}
            className='flex cursor-grab gap-4 pb-3 active:cursor-grabbing sm:gap-5'
          >
            {normalizedCommonAreas.map((area, index) => {
              const cover = area.batch_images[0];
              return (
                <motion.article
                  key={area.id}
                  initial={{ opacity: 0, y: 14, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  whileHover={{ y: -4, scale: 1.01 }}
                  whileTap={{ scale: 0.995 }}
                  transition={{
                    delay: index * 0.04,
                    duration: 0.42,
                    ease: 'easeOut',
                  }}
                  className='group relative h-[360px] w-[80vw] min-w-[80vw] overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl sm:h-[400px] sm:w-[44vw] sm:min-w-[44vw] lg:h-[460px] lg:w-[28vw] lg:min-w-[28vw]'
                >
                  <Image
                    src={cover}
                    alt={area.common_area_name}
                    fill
                    sizes='(max-width: 640px) 80vw, (max-width: 1024px) 44vw, 28vw'
                    className='object-cover transition duration-500 group-hover:scale-105'
                    priority
                  />

                  <div className='absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent' />

                  <div className='absolute left-0 right-0 top-0 flex items-center justify-between p-4'>
                    <span className='rounded-full bg-black/55 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/90'>
                      Amenidad
                    </span>
                    <span className='inline-flex items-center gap-1 rounded-full bg-black/55 px-3 py-1 text-xs text-white/90'>
                      <ImageIcon size={12} /> {area.batch_images.length}
                    </span>
                  </div>

                  <div className='absolute inset-x-0 bottom-0 p-4 sm:p-5'>
                    <h3 className='text-xl font-bold leading-tight text-white sm:text-2xl'>
                      {area.common_area_name}
                    </h3>
                    <p className='mt-2 line-clamp-2 text-sm text-white/75'>
                      {area.common_area_description ||
                        'Espacio disenado para mejorar la experiencia del proyecto.'}
                    </p>

                    <button
                      type='button'
                      onClick={() => setSelectedArea(area)}
                      className='mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0B1220] transition hover:scale-[1.03]'
                    >
                      <Play size={14} /> Ver detalles
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {selectedArea && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-[120] overflow-y-auto p-2 sm:p-4'
          >
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='absolute inset-0 bg-black/80 backdrop-blur-sm'
              onClick={() => setSelectedArea(null)}
              aria-label='Cerrar modal de area comun'
            />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
              className='relative z-[130] mx-auto my-auto h-[96dvh] w-full max-w-6xl overflow-y-auto overflow-x-hidden rounded-2xl border border-white/15 bg-[#0B1220] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.65)] sm:h-[92dvh] sm:rounded-3xl lg:h-[88dvh] lg:overflow-hidden'
            >
              <button
                type='button'
                onClick={() => setSelectedArea(null)}
                className='absolute right-4 top-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/70'
                aria-label='Cerrar'
              >
                <X size={20} />
              </button>

              <div className='grid h-full min-h-0 grid-cols-1 lg:grid-cols-[1.5fr_1fr]'>
                <div
                  ref={mainImageRef}
                  className='relative h-[44dvh] min-h-[260px] bg-black sm:h-[50dvh] lg:h-full'
                >
                  <AnimatePresence mode='wait'>
                    <motion.div
                      key={selectedImage}
                      initial={{ opacity: 0, scale: 1.02 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.99 }}
                      transition={{ duration: 0.35 }}
                      className='absolute inset-0'
                    >
                      {selectedImage ? (
                        <Image
                          src={selectedImage}
                          alt={selectedArea.common_area_name}
                          fill
                          sizes='(max-width: 1024px) 96vw, 65vw'
                          className='object-cover'
                          priority
                        />
                      ) : (
                        <div className='flex h-full items-center justify-center text-white/70'>
                          Sin imagen disponible
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {selectedImages.length > 1 && (
                    <>
                      <button
                        type='button'
                        onClick={goPrevImage}
                        className='absolute left-4 top-1/2 z-30 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/75'
                        aria-label='Imagen anterior'
                      >
                        <ChevronLeft size={22} />
                      </button>
                      <button
                        type='button'
                        onClick={goNextImage}
                        className='absolute right-4 top-1/2 z-30 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/75'
                        aria-label='Imagen siguiente'
                      >
                        <ChevronRight size={22} />
                      </button>
                    </>
                  )}
                </div>

                <div className='flex h-full min-h-0 flex-col p-5 sm:p-6 lg:overflow-y-auto lg:p-7'>
                  <p className='text-[10px] font-bold uppercase tracking-[0.32em] text-white/55'>
                    Caracteristicas
                  </p>
                  <h3 className='mt-2 text-2xl font-black uppercase tracking-tight text-white sm:text-3xl'>
                    {selectedArea.common_area_name}
                  </h3>

                  <p className='mt-4 text-sm leading-relaxed text-white/80 sm:text-base'>
                    {selectedArea.common_area_description ||
                      'Sin descripcion disponible para esta area comun.'}
                  </p>

                  <div className='mt-6'>
                    <p className='mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white/55'>
                      Galeria
                    </p>
                    <div className='grid grid-cols-4 gap-2 sm:grid-cols-5'>
                      {selectedImages.map((img, idx) => (
                        <button
                          type='button'
                          key={`${selectedArea.id}-${idx}`}
                          onClick={() => handleSelectModalImage(idx)}
                          className={`relative aspect-square overflow-hidden rounded-lg border-2 transition ${
                            idx === activeImageIndex
                              ? 'border-white'
                              : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <Image
                            src={img}
                            alt={`Thumb ${idx + 1}`}
                            fill
                            className='object-cover'
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
