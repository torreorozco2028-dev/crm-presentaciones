'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Plus, X, ArrowRight } from 'lucide-react';

interface CommonArea {
  id: string;
  common_area_name: string;
  common_area_description: string | null;
  batch_images: string[]; 
}
//revisar modo oscuro y celuylar
interface CommonAreasSectionProps {
  commonAreas: CommonArea[];
}

const LAYOUT_PATTERN = [
  { width: '700px', height: '60vh', top: '15%', left: '5vw' },
  { width: '25vw', height: '40vh', top: '10%', left: '950px' },
  { width: '40vw', height: '35vh', top: '55%', left: '600px' },
  { width: '30vw', height: '50vh', top: '25%', left: '1410px' },
  { width: '50vw', height: '45vh', top: '45%', left: '125vw' },
  { width: '20vw', height: '30vh', top: '5%', left: '145vw' },
];

export default function CommonAreasSection({ commonAreas }: CommonAreasSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-70%"]);

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
              Diseño pensado en la comunidad y el bienestar. Desliza para explorar cada detalle arquitectonico.
            </p>
            <div className="flex items-center gap-4 mt-12 text-[#0a192f]">
               <div className="w-12 h-[1px] bg-[#0a192f]/20" />
               <span className="text-[10px] font-bold tracking-widest uppercase animate-pulse">Scroll para explorar</span>
               <ArrowRight size={14} />
            </div>
          </div>

          <div className="flex relative h-[80vh] min-w-[300vw]">
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
                  }}
                  className="absolute group rounded-xl overflow-hidden shadow-2xl bg-gray-100"
                >
                  <div className="relative w-full h-full">
                    <ImageSlider images={images} />
                    
                    <div className="absolute top-0 left-0 w-full p-6 bg-gradient-to-b from-black/60 to-transparent z-20">
                        <h4 className="text-white text-xs tracking-[0.3em] font-bold uppercase">
                           {area.common_area_name}
                        </h4>
                    </div>

                    <button 
                      onClick={() => setSelectedArea(selectedArea === area.id ? null : area.id)}
                      className="absolute bottom-6 left-6 z-30 w-10 h-10 bg-[#0a192f] text-white rounded-full flex items-center justify-center shadow-lg"
                    >
                      <Plus className={`transition-transform duration-500 ${selectedArea === area.id ? 'rotate-45' : ''}`} size={20} />
                    </button>

                    <AnimatePresence>
                      {selectedArea === area.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="absolute inset-4 z-40 backdrop-blur-xl bg-white/80 p-8 rounded-lg flex flex-col justify-center"
                        >
                          <button onClick={() => setSelectedArea(null)} className="absolute top-4 right-4 text-[#0a192f]/40">
                            <X size={18} />
                          </button>
                          <p className="text-[#0a192f] text-sm font-light">
                            {area.common_area_description}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ImageSlider({ images, index }: { images: string[]; index: number }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const initialDelay = index * 800; 

    const startInterval = () => {
      return setInterval(() => {
        setCurrent((prev) => (prev + 1) % images.length);
      }, 5000);
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
          transition={{ 
            duration: 2,
            ease: "easeInOut" 
          }}
          className="absolute inset-0 w-full h-full"
        >
          <Image
            src={images[current]}
            alt="Common Area"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority={index < 2}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}