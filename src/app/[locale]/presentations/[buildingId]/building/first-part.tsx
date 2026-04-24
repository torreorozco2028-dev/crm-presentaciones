'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface BuildingHeroProps {
  building: any;
}

export default function BuildingHero({ building }: BuildingHeroProps) {
  const primaryImage = building.prymary_image || '/placeholder-1.jpg';

  return (
    <section
      id='inicio'
      className='relative w-full bg-white font-sans text-zinc-900 transition-colors duration-500 dark:bg-black dark:text-white'
    >
      <div className='relative flex min-h-screen flex-col lg:min-h-[110vh] lg:flex-row'>
        <div
          id='introduccion'
          className='relative z-10 flex flex-col justify-center pb-10 pt-24 md:pt-32 lg:w-[60%] lg:pb-20 lg:pl-16 lg:pt-16'
        >
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className='mb-8 pl-3 lg:mb-10 lg:max-w-[46rem] lg:-translate-y-8 lg:pl-16 lg:pl-6 lg:pr-8 xl:max-w-[52rem] xl:pl-24'
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className='mb-3'
            >
              <p
                className='mi-fuente-2 text-lg font-bold uppercase tracking-[0.25em] md:text-4xl'
                style={{
                  background:
                    'linear-gradient(90deg, #0a6406 0%, #0a6406  25%, #0a6406  50%, #0a6406  75%, #0a6406  100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  backgroundSize: '200% auto',
                }}
              >
                {building.building_title}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className='mb-6 max-w-4xl lg:max-w-[46rem]'
            >
              <p
                className='mi-fuente-2 text-5xl font-bold uppercase leading-[0.9] text-foreground-900 md:text-7xl lg:text-[4rem] xl:text-[5rem]'
                style={{
                  // background: 'linear-gradient(90deg, var(--foreground-100) 0%, var(--foreground-100) 25%, var(--foreground-100) 50%, var(--foreground-100) 75%, var(--foreground-100) 100%)',
                  WebkitBackgroundClip: 'text',
                  // WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  backgroundSize: '200% auto',
                }}
              >
                Aprovecha los precios de feria
              </p>
            </motion.div>

            {/* Location */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className='mi-fuente border-l-4 border-[#64320e] pl-5 pt-5 text-5xl font-bold leading-[0.9] text-[#64320e] dark:text-[#fd8129] md:text-7xl lg:text-[3rem] xl:text-[4rem]'
              style={{
                backgroundClip: 'text',
                backgroundSize: '200% auto',
              }}
            >
              1100 $us/m²
            </motion.p>
          </motion.div>
        </div>
        <div className='relative flex min-h-[70vh] items-center justify-center lg:min-h-[100vh] lg:w-[40%]'>
          <motion.div
            initial={{ opacity: 0, scale: 1.05, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className='relative z-0 mx-auto aspect-[4/5] w-[88%] overflow-hidden rounded-2xl border-[12px] border-white shadow-2xl dark:border-zinc-800 md:aspect-[5/6] md:max-w-[540px] lg:mx-0 lg:aspect-[5/7] lg:w-[90%] lg:max-w-[600px] lg:-translate-x-12 lg:rounded-lg lg:border-0 lg:shadow-none'
          >
            <Image
              src={primaryImage}
              alt='Vista Principal'
              fill
              className='object-center'
              priority
            />
            <div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent lg:hidden' />
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className='flex h-[1px] w-full flex-row bg-black/10 dark:bg-white/10'
      />
    </section>
  );
}
