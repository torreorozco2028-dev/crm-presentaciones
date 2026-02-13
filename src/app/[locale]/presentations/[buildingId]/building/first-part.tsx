'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface BuildingHeroProps {
  building: any;
}

const videoUrl = 'https://zsychn5egyn9ii5x.public.blob.vercel-storage.com/cocha-2_4oZ3bx1I.mp4';

export default function BuildingHero({ building }: BuildingHeroProps) {
  const primaryImage = building.prymary_image || '/placeholder-1.jpg';

  return (
    <section className="relative w-full overflow-x-hidden transition-colors duration-500 bg-white text-[#0a192f] dark:bg-[#0a192f] dark:text-white font-sans">
      <div className="relative flex min-h-screen flex-col lg:min-h-[110vh] lg:flex-row">
        
        <div className="relative z-10 flex flex-col pb-10 pt-24 md:pt-32 lg:pb-20 lg:w-1/2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12 lg:mb-24 pl-6 lg:pl-12"
          >
            <h1 className="mb-4 font-serif text-5xl leading-tight md:text-7xl lg:text-8xl">
              {building.building_title}
            </h1>
            <p className="ml-1 text-xs font-bold uppercase tracking-[0.5em] opacity-60 text-[#0a192f] dark:text-white">
              {building.building_location}
            </p>
          </motion.div>

          <div className="flex flex-row gap-6 md:gap-10 px-6 lg:ml-[25%] lg:px-0">
            <div className="h-40 md:h-72 w-[1px] shrink-0 bg-[#0a192f]/20 dark:bg-white/20 lg:h-96" />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="max-w-xl pt-2 md:pt-4"
            >
              <p className="mb-8 text-lg md:text-[20px] font-light leading-relaxed opacity-80 text-[#0a192f] dark:text-slate-300">
                {building.building_description}
              </p>
              <div className="inline-block border-b border-[#0a192f]/30 dark:border-white/30 pb-2">
                <span className="text-[10px] uppercase tracking-[0.4em]">STRUCTEC</span>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="relative flex flex-col lg:block lg:w-1/2 min-h-[80vh] lg:min-h-[140vh]">
          
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5 }}
            className="relative lg:absolute right-0 top-0 lg:top-[85px] z-0 
                       h-[350px] md:h-[500px] lg:h-[800px] 
                       w-[90%] lg:w-[750px] 
                       ml-auto lg:ml-0 overflow-hidden"
          >
            <Image
              src={primaryImage}
              alt="Vista Principal"
              fill
              className="object-cover shadow-2xl lg:shadow-none"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-white/10 dark:to-[#0a192f]/20 lg:hidden" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative lg:absolute z-20 
                       mt-[-80px] lg:mt-0 
                       ml-6 lg:ml-0 
                       lg:right-[30%] lg:top-[840px] 
                       h-[300px] md:h-[450px] lg:h-[500px] 
                       w-[85%] lg:w-[1000px]"
          >
            <div className="relative h-full w-full group">
              <div className="absolute -inset-2 border border-[#0a192f]/10 dark:border-white/10 translate-x-4 translate-y-4 lg:hidden" />
              
              <div className="relative h-full w-full overflow-hidden shadow-2xl">
                <video
                  src={videoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 h-full w-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute bottom-4 left-4 lg:hidden">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full">
                    <span className="text-[8px] font-bold tracking-widest text-white uppercase">Structec</span>
                  </div>
                </div>
              </div>
              <div className="absolute -top-10 lg:-top-12 right-4 lg:right-6">
                <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.6em] opacity-40">
                  EST. 2023
                </p>
              </div>
            </div>
          </motion.div>
          <div className="h-20 lg:hidden" />
        </div>
      </div>
    </section>
  );
}