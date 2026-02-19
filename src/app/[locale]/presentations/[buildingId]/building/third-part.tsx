'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
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


export default function CommonAreasSection({ commonAreas }: CommonAreasSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedArea, setSelectedArea] = useState<CommonArea | null>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-70%"]);

  useEffect(() => {
    if (selectedArea) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [selectedArea]);
  //
  const itemsPerBlock = LAYOUT_PATTERN.length; // 6
  const totalBlocks = Math.ceil(commonAreas.length / itemsPerBlock);

  return (
    <section ref={containerRef} className="relative h-[400vh] bg-white">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center">
        
        <div className="absolute top-12 left-12 z-0">
          <h2 className="text-[#0a192f] text-[12vw] font-serif opacity-[0.03] leading-none select-none">
            AMENITIES
          </h2>
        </div>

        <motion.div style={{ x }} className="flex relative h-full items-center pl-[10vw]">
          
          <div className="min-w-[40vw] flex flex-col justify-center pr-20">
            <motion.span 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-[10px] tracking-[0.8em] uppercase text-[#0a192f]/40 font-bold mb-6"
            >
              Espacios Compartidos
            </motion.span>
            <h3 className="text-[#0a192f] text-6xl lg:text-8xl font-serif leading-tight">
              ÁREAS <br /> <span className="italic">COMUNES</span>
            </h3>
            <p className="text-[#0a192f]/60 text-sm max-w-xs mt-8 font-light leading-relaxed">
              Diseño pensado en la comunidad y el bienestar. Desliza para explorar cada detalle arquitectónico.
            </p>
            <div className="flex items-center gap-4 mt-12 text-[#0a192f]">
               <div className="w-12 h-[1px] bg-[#0a192f]/20" />
               <span className="text-[10px] font-bold tracking-widest uppercase animate-pulse">Scroll para explorar</span>
               <ArrowRight size={20} />
            </div>
          </div>

          <div
            className="flex relative h-[80vh]"
            style={{ minWidth: `${totalBlocks * 140}vw` }}>
              
            {commonAreas?.map((area, index) => {
              const layout = LAYOUT_PATTERN[index % LAYOUT_PATTERN.length];
              const images = Array.isArray(area.batch_images) ? area.batch_images : [];
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
                  className="absolute group rounded-[2vw] overflow-hidden shadow-2xl bg-gray-100"

                >
                  <div className="relative w-full h-full">
                    <ImageSlider images={images} index={index} />
                    
                    <div className="absolute top-0 left-0 w-full p-6 bg-gradient-to-b from-black/60 to-transparent z-20">
                        <h4 className="text-white text-xs tracking-[0.3em] font-bold uppercase">
                           {area.common_area_name}
                        </h4>
                    </div>

                    <button 
                      onClick={() => setSelectedArea(area)}
                      className="absolute bottom-6 left-6 z-30 w-12 h-12 bg-white/90 text-[#0a192f] rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
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

function AreaDetailModal({ area, onClose }: { area: CommonArea, onClose: () => void }) {
  const [currentIdx, setCurrentIdx] = useState(0);

  const nextImage = useCallback(() => {
    setCurrentIdx((prev) => (prev + 1) % area.batch_images.length);
  }, [area.batch_images.length]);

  const prevImage = useCallback(() => {
    setCurrentIdx((prev) => (prev - 1 + area.batch_images.length) % area.batch_images.length);
  }, [area.batch_images.length]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        className="relative z-[110] w-full max-w-6xl bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-full max-h-[90vh]"
      >
        <div className="relative flex-1 bg-black flex items-center justify-center group">
          <button onClick={onClose} className="absolute top-6 left-6 z-50 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full md:hidden">
            <X size={20} />
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="relative w-full h-full"
            >
              <Image 
                src={area.batch_images[currentIdx]} 
                alt={area.common_area_name}
                fill
                className="object-contain md:object-cover"
              />
            </motion.div>
          </AnimatePresence>

          <div className="absolute inset-x-4 flex justify-between items-center pointer-events-none">
            <button onClick={prevImage} className="pointer-events-auto w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition-all">
              <ChevronLeft size={32} />
            </button>
            <button onClick={nextImage} className="pointer-events-auto w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition-all">
              <ChevronRight size={32} />
            </button>
          </div>
        </div>

        <div className="w-full md:w-[400px] p-8 md:p-12 overflow-y-auto flex flex-col">
          <div className="flex justify-between items-start mb-8">
            <div>
              <span className="text-[10px] tracking-[0.3em] font-bold text-orange-500 uppercase">Detalle de Amenidad</span>
              <h2 className="text-3xl font-serif text-[#0a192f] dark:text-white mt-2">{area.common_area_name}</h2>
            </div>
            <button onClick={onClose} className="hidden md:flex p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-black">
              <X size={24} />
            </button>
          </div>

          <p className="text-gray-600 dark:text-gray-400 font-light leading-relaxed mb-10 text-lg">
            {area.common_area_description || "Sin descripción disponible."}
          </p>

          <div className="mt-auto">
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Galería de imágenes</h4>
            <div className="grid grid-cols-4 gap-2">
              {area.batch_images.map((img, i) => (
                <button 
                  key={i} 
                  onClick={() => setCurrentIdx(i)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${currentIdx === i ? 'border-orange-500 scale-95' : 'border-transparent opacity-50 hover:opacity-100'}`}
                >
                  <Image src={img} alt="Thumb" fill className="object-cover" />
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
    <div className="w-full h-full relative bg-gray-200 overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.div
          key={images[current]}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full"
        >
          <Image
            src={images[current]}
            alt="Common Area"
            fill
            sizes="(max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            priority={index < 3}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}