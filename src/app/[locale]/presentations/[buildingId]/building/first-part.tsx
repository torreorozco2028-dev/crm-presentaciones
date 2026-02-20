'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { fonts } from '@/config/fonts';

interface BuildingHeroProps {
  building: any;
}

export default function BuildingHero({ building }: BuildingHeroProps) {
  const primaryImage = building.prymary_image || '/placeholder-1.jpg';

  return (
    <section
      id='inicio'
      className='relative w-full overflow-x-hidden bg-white font-sans text-[#0a192f] transition-colors duration-500 dark:bg-[#0a192f] dark:text-white'
    >
      <div className='relative flex min-h-screen flex-col lg:min-h-[110vh] lg:flex-row'>
        <div
          id='introduccion'
          className='relative z-10 flex flex-col pb-10 pt-24 md:pt-32 lg:w-1/2 lg:pb-20'
        >
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className='mb-12 pl-6 lg:mb-24 lg:pl-12'
          >
            <h1
              className={`mb-4 ${fonts.inter.className} text-5xl leading-tight md:text-7xl lg:text-8xl`}
            >
              {building.building_title}
            </h1>
            <p className='ml-2 text-xl font-bold uppercase tracking-[0.5em] text-[#474545] dark:text-white'>
              {building.building_location}
            </p>
          </motion.div>

          <div className='flex flex-row gap-6 px-6 md:gap-10 lg:ml-[25%] lg:px-0'>
            <div className='h-40 w-[1px] shrink-0 bg-[#0a192f]/20 dark:bg-white/20 md:h-72 lg:h-96' />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1 }}
              className='max-w-xl pt-2 md:pt-4'
            >
              <p className='mb-8 text-lg font-light leading-relaxed text-[#0a192f] opacity-80 dark:text-slate-300 md:text-[20px]'>
                {building.building_description}
              </p>
              <div className='inline-block border-b border-[#0a192f]/30 pb-2 text-[#000000] dark:border-white/30'>
                <span className='text-[10px] uppercase tracking-[0.4em]'>
                  STRUCTEC
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        <div className='relative flex min-h-[80vh] flex-col lg:block lg:min-h-[100vh] lg:w-1/2'>
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5 }}
            className='relative right-0 top-0 z-0 ml-auto h-[350px] w-[90%] overflow-hidden md:h-[500px] lg:absolute lg:top-[85px] lg:ml-0 lg:h-[800px] lg:w-[750px]'
          >
            <Image
              src={primaryImage}
              alt='Vista Principal'
              fill
              className='object-cover shadow-2xl lg:shadow-none'
              priority
            />
            <div className='absolute inset-0 bg-gradient-to-l from-transparent to-white/10 dark:to-[#0a192f]/20 lg:hidden' />
          </motion.div>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5 }}
        className='flex h-[1px] w-full flex-row bg-black/10 dark:bg-white/10'
      ></motion.div>
    </section>
  );
}
