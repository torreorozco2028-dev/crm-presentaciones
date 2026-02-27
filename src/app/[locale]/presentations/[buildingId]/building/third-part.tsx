'use client';

import { fonts } from '@/config/fonts';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from 'framer-motion';
import Image from 'next/image';
import { Plus, X, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface CommonArea {
  id: string;
  common_area_name: string;
  common_area_description: string | null;
  batch_images: string[];
}

interface CommonAreasSectionProps {
  commonAreas: CommonArea[];
}

const LAYOUT_PATTERN = [
  { width: '500px', height: '300px', top: '57%', left: '-300px' },
  { width: '500px', height: '400px', top: '5%', left: '1250px' },
  { width: '500px', height: '820px', top: '-5%', left: '850px' },
  { width: '750px', height: '820px', top: '-5%', left: '50px' },
  { width: '400px', height: '400px', top: '5%', left: '2200px' },
  { width: '600px', height: '610px', top: '25%', left: '1650px' },
];

const MOBILE_LAYOUT_PATTERN = [
  { width: '60vw', height: '70vh', top: '0vh', left: '5vw', zIndex: 10 },
  { width: '65vw', height: '40vh', top: '30vh', left: '90vw', zIndex: 30 },
  { width: '90vw', height: '35vh', top: '3vh', left: '50vw', zIndex: 20 },
  { width: '55vw', height: '60vh', top: '0vh', left: '150vw', zIndex: 40 },
  { width: '80vw', height: '25vh', top: '40vh', left: '190vw', zIndex: 50 },
  { width: '80vw', height: '40vh', top: '6vh', left: '225vw', zIndex: 60 },
];

export default function CommonAreasSection({
  commonAreas,
}: CommonAreasSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedArea, setSelectedArea] = useState<CommonArea | null>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
  });

  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-70%']);

  useEffect(() => {
    if (selectedArea) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [selectedArea]);

  const itemsPerBlock = LAYOUT_PATTERN.length;
  const totalBlocks = Math.ceil(commonAreas.length / itemsPerBlock);

  const mobileContainerWidth = totalBlocks * 330;

  const desktopContainerWidth = (() => {
    if (commonAreas.length === 0) return 140;
    const itemsInLastBlock =
      commonAreas.length % itemsPerBlock || itemsPerBlock;
    const baseWidth =
      (totalBlocks - 1) * 140 + (itemsInLastBlock / itemsPerBlock) * 140;
    return Math.ceil(baseWidth);
  })();

  return (
    <section id='areas-comunes'>
      <div className='block overflow-hidden bg-white py-16 dark:bg-slate-950 md:hidden'>
        <div className='relative z-50 mb-8 px-6'>
          <span className='mb-4 block text-[10px] font-bold uppercase tracking-[0.8em] text-[#0a192f]/40 dark:text-white/40'>
            Espacios Compartidos
          </span>
          <h3
            className={`${fonts.inter.className} text-4xl leading-tight text-[#0a192f] dark:text-white`}
          >
            ÁREAS <br /> <span className='italic'>COMUNES</span>
          </h3>
          <p className='mt-4 max-w-sm text-sm font-light leading-relaxed text-[#0a192f]/60 dark:text-gray-400'>
            Diseño pensado en la comunidad. Desliza a la derecha para explorar.
          </p>
          <div className='mt-6 flex items-center gap-4 text-[#0a192f] dark:text-white'>
            <div className='h-[1px] w-8 bg-[#0a192f]/20 dark:bg-white/20' />
            <span className='animate-pulse text-[10px] font-bold uppercase tracking-widest'>
              Desliza
            </span>
            <ArrowRight size={16} />
          </div>
        </div>
        <div className='w-full overflow-x-auto overflow-y-hidden pb-10 [&::-webkit-scrollbar]:hidden'>
          <div
            className='relative h-[80vh]'
            style={{ minWidth: `${mobileContainerWidth}vw` }}
          >
            {commonAreas?.map((area, index) => {
              const layout =
                MOBILE_LAYOUT_PATTERN[index % MOBILE_LAYOUT_PATTERN.length];
              const images = Array.isArray(area.batch_images)
                ? area.batch_images
                : [];
              if (images.length === 0) return null;
              const blockIndex = Math.floor(index / 6);
              const leftOffset = blockIndex * 310;

              return (
                <div
                  key={area.id}
                  style={{
                    width: layout.width,
                    height: layout.height,
                    top: layout.top,
                    left: `calc(${layout.left} + ${leftOffset}vw)`,
                    zIndex: layout.zIndex,
                  }}
                  className='absolute overflow-hidden rounded-[6vw] bg-gray-100 shadow-2xl transition-transform active:scale-[0.98]'
                >
                  <div className='relative h-full w-full'>
                    <ImageSlider images={images} index={index} />

                    <div className='absolute left-0 top-0 z-20 w-full bg-gradient-to-b from-black/60 to-transparent p-5'>
                      <h4 className='text-[11px] font-bold uppercase tracking-[0.2em] text-white'>
                        {area.common_area_name}
                      </h4>
                    </div>

                    <button
                      onClick={() => setSelectedArea(area)}
                      className='absolute bottom-4 left-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#0a192f] shadow-lg transition-transform hover:scale-110 active:scale-95'
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div
        ref={containerRef}
        className='relative hidden h-[400vh] bg-white dark:bg-slate-950 md:block'
      >
        <div className='sticky top-0 flex h-screen w-full items-center overflow-hidden'>
          <div className='absolute left-12 top-12 z-0'>
            <h2 className='select-none font-serif text-[12vw] leading-none text-[#0a192f] opacity-[0.05] dark:text-white'>
              AMENITIES
            </h2>
          </div>

          <motion.div
            style={{ x }}
            className='relative flex h-full items-center pl-[10vw]'
          >
            <div className='flex min-w-[40vw] flex-col justify-center pr-20'>
              <motion.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className='mb-6 text-[10px] font-bold uppercase tracking-[0.8em] text-[#0a192f]/40 dark:text-white/40'
              >
                Espacios Compartidos
              </motion.span>
              <h3
                className={`${fonts.inter.className} text-6xl leading-tight text-[#0a192f] dark:text-white lg:text-8xl`}
              >
                ÁREAS <br /> <span className='italic'>COMUNES</span>
              </h3>
              <p className='mt-8 max-w-xs text-sm font-light leading-relaxed text-[#0a192f]/60 dark:text-gray-400'>
                Diseño pensado en la comunidad y el bienestar. Desliza para
                explorar cada detalle arquitectónico.
              </p>
              <div className='mt-12 flex items-center gap-4 text-[#0a192f] dark:text-white'>
                <div className='h-[1px] w-12 bg-[#0a192f]/20 dark:bg-white/20' />
                <span className='animate-pulse text-[10px] font-bold uppercase tracking-widest'>
                  Scroll para explorar
                </span>
                <ArrowRight size={20} />
              </div>
            </div>

            <div
              className='relative flex h-[80vh]'
              style={{ minWidth: `${desktopContainerWidth}vw` }}
            >
              {commonAreas?.map((area, index) => {
                const layout = LAYOUT_PATTERN[index % LAYOUT_PATTERN.length];
                const images = Array.isArray(area.batch_images)
                  ? area.batch_images
                  : [];
                if (images.length === 0) return null;

                return (
                  <motion.div
                    key={area.id}
                    style={{
                      width: layout.width,
                      height: layout.height,
                      top: layout.top,
                      left: `calc(${layout.left} + ${Math.floor(index / 6) * 180}vw)`,
                      zIndex: (commonAreas.length - index) * 10,
                    }}
                    className='group absolute overflow-hidden rounded-[2vw] bg-gray-100 shadow-2xl'
                  >
                    <div className='relative h-full w-full'>
                      <ImageSlider images={images} index={index} />

                      <div className='absolute left-0 top-0 z-20 w-full bg-gradient-to-b from-black/60 to-transparent p-6'>
                        <h4 className='text-xs font-bold uppercase tracking-[0.3em] text-white'>
                          {area.common_area_name}
                        </h4>
                      </div>

                      <button
                        onClick={() => setSelectedArea(area)}
                        className='absolute bottom-6 left-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-[#0a192f] shadow-lg transition-transform hover:scale-110 active:scale-95'
                      >
                        <Plus size={24} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
      <AnimatePresence>
        {selectedArea && (
          <AreaDetailModal
            area={selectedArea}
            onClose={() => setSelectedArea(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function AreaDetailModal({
  area,
  onClose,
}: {
  area: CommonArea;
  onClose: () => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);

  const nextImage = useCallback(() => {
    setCurrentIdx((prev) => (prev + 1) % area.batch_images.length);
  }, [area.batch_images.length]);

  const prevImage = useCallback(() => {
    setCurrentIdx(
      (prev) => (prev - 1 + area.batch_images.length) % area.batch_images.length
    );
  }, [area.batch_images.length]);

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10'>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className='absolute inset-0 bg-black/80 backdrop-blur-xl'
      />

      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        className='relative z-[110] flex h-full max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-900 md:flex-row'
      >
        <div className='group relative flex flex-1 items-center justify-center bg-black'>
          <button
            onClick={onClose}
            className='absolute left-6 top-6 z-50 rounded-full bg-black/20 p-2 text-white hover:bg-black/40 md:hidden'
          >
            <X size={20} />
          </button>

          <AnimatePresence mode='wait'>
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className='relative h-full w-full'
            >
              <Image
                src={area.batch_images[currentIdx]}
                alt={area.common_area_name}
                fill
                className='object-contain md:object-cover'
              />
            </motion.div>
          </AnimatePresence>

          <div className='pointer-events-none absolute inset-x-4 flex items-center justify-between'>
            <button
              onClick={prevImage}
              className='pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20'
            >
              <ChevronLeft size={32} />
            </button>
            <button
              onClick={nextImage}
              className='pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20'
            >
              <ChevronRight size={32} />
            </button>
          </div>
        </div>

        <div className='flex w-full flex-col overflow-y-auto p-8 md:w-[400px] md:p-12'>
          <div className='mb-8 flex items-start justify-between'>
            <div>
              <span
                className={`${fonts.inter.className} text-[12px] uppercase tracking-[0.3em] text-[#0A192F] dark:text-[#ffffff]`}
              >
                Detalle de Amenidad
              </span>
              <h2
                className={`mt-2 ${fonts.inter.className} text-3xl text-[#0a192f] dark:text-white`}
              >
                {area.common_area_name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className='hidden rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-black md:flex'
            >
              <X size={24} />
            </button>
          </div>

          <p className='mb-10 text-[25px] font-light leading-relaxed text-gray-600 dark:text-gray-400'>
            {area.common_area_description || 'Sin descripción disponible.'}
          </p>

          <div className='mt-auto'>
            <h4 className='mb-4 text-xs font-bold uppercase tracking-widest text-gray-400'>
              Galería de imagenes
            </h4>
            <div className='grid grid-cols-4 gap-2'>
              {area.batch_images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIdx(i)}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${currentIdx === i ? 'scale-95 border-[#0a192f] ' : 'border-transparent opacity-50 hover:opacity-100'}`}
                >
                  <Image src={img} alt='Thumb' fill className='object-cover' />
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ImageSlider({ images, index }: { images: string[]; index: number }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const initialDelay = index * 1200;

    const startInterval = () => {
      return setInterval(() => {
        setCurrent((prev) => (prev + 1) % images.length);
      }, 6000);
    };

    let interval: NodeJS.Timeout;
    const timeout = setTimeout(() => {
      interval = startInterval();
    }, initialDelay);

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [images, index]);

  return (
    <div className='relative h-full w-full overflow-hidden bg-gray-200'>
      <AnimatePresence initial={false}>
        <motion.div
          key={images[current]}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
          className='absolute inset-0 h-full w-full'
        >
          <Image
            src={images[current]}
            alt='Common Area'
            fill
            sizes='(max-width: 1200px) 50vw, 33vw'
            className='object-cover'
            priority={index < 3}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
