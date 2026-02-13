'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface BuildingHeroProps {
  building: any;
}

//PRUEBA VIDEO
const videoUrl =
  'https://zsychn5egyn9ii5x.public.blob.vercel-storage.com/cocha-2_4oZ3bx1I.mp4';

export default function BuildingHero({ building }: BuildingHeroProps) {
  const primaryImage = building.prymary_image || '/placeholder-1.jpg';

  return (
    <section className='relative w-full overflow-x-hidden bg-[#0a192f] font-sans text-white'>
      <div className='relative flex min-h-screen flex-col lg:min-h-[110vh] lg:flex-row'>
        <div className='relative z-10 flex flex-col pb-20 pt-32 lg:w-1/2'>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className='mb-24 pl-6 lg:pl-12'
          >
            <h1 className='mb-4 font-serif text-5xl leading-none md:text-7xl lg:text-8xl'>
              {building.building_title}
            </h1>
            <p className='ml-1 text-xs font-bold uppercase tracking-[0.5em] opacity-60'>
              {building.building_location}
            </p>
          </motion.div>

          <div className='mt-[-40px] flex flex-row gap-10 px-6 lg:ml-[25%] lg:px-0'>
            <div className='h-72 w-[1px] shrink-0 bg-white/20 lg:h-96' />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1 }}
              className='max-w-xl pt-4'
            >
              <p className='mb-8 text-[20px] font-light leading-relaxed text-slate-300'>
                {building.building_description}
              </p>

              <div className='inline-block border-b border-white/30 pb-2'>
                <span className='text-[10px] uppercase tracking-[0.4em]'>
                  STRUCTEC
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        <div className='relative min-h-[120vh] lg:min-h-[140vh] lg:w-1/2'>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className='absolute right-0 top-[85px] z-0 h-[800px] w-[750px]'
          >
            <Image
              src={primaryImage}
              alt='Vista Principal Vertical'
              fill
              className='object-cover shadow-2xl'
              priority
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1, delay: 0.2 }}
            className='absolute right-[30%] top-[840px] z-20 h-[500px] w-[1000px]'
          >
            <div className='relative h-full w-full shadow-[0_50px_100px_rgba(0,0,0,0.6)]'>
              <video
                src={videoUrl}
                autoPlay
                muted
                loop
                playsInline
                preload='auto'
                className='absolute inset-0 h-full w-full object-cover'
                controls={false}
                controlsList='nodownload nofullscreen noremoteplayback'
                disablePictureInPicture
                onContextMenu={(e) => e.preventDefault()}
                onPause={(e) => e.currentTarget.play()}
                tabIndex={-1}
              />

              <div className='absolute -top-12 right-6'>
                <p className='text-[10px] font-black uppercase tracking-[0.6em] text-white/20'>
                  EST. 2023
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className='h-32 lg:h-64' />
    </section>
  );
}
