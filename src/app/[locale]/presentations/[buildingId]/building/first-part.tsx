'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface BuildingHeroProps {
  building: any;
}

//PRUEBA VIDEO
const videoUrl = "https://zsychn5egyn9ii5x.public.blob.vercel-storage.com/cocha-2_4oZ3bx1I.mp4";


export default function BuildingHero({ building }: BuildingHeroProps) {
  const primaryImage = building.prymary_image || "/placeholder-1.jpg";
  const secondaryImage = (Array.isArray(building.batch_images) && building.batch_images.length > 0)
    ? building.batch_images[2]
    : "/placeholder-2.jpg";

  return (
    <section className="relative w-full bg-[#0a192f] text-white overflow-x-hidden font-sans">
      <div className="relative flex flex-col lg:flex-row min-h-screen lg:min-h-[110vh]">
        
        <div className="relative flex flex-col pt-32 pb-20 z-10 lg:w-1/2">
          
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="pl-6 lg:pl-12 mb-24"
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif leading-none mb-4">
              {building.building_title}
            </h1>
            <p className="text-xs tracking-[0.5em] uppercase font-bold opacity-60 ml-1">
              {building.building_location}
            </p>
          </motion.div>

          <div className="flex flex-row gap-10 lg:ml-[25%] px-6 lg:px-0 mt-[-40px]">
            <div className="w-[1px] bg-white/20 h-72 lg:h-96 shrink-0" />

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="max-w-xl pt-4"
            >
              <p className="text-[20px] leading-relaxed font-light text-slate-300 mb-8">
                {building.building_description}
              </p>
              
              <div className="inline-block border-b border-white/30 pb-2">
                <span className="text-[10px] tracking-[0.4em] uppercase">
                  STRUCTEC
                </span>
              </div>
            </motion.div>
          </div>
        </div>

<div className="relative lg:w-1/2 min-h-[120vh] lg:min-h-[140vh]">
  
  <motion.div 
    initial={{ opacity: 0, x: 40 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 1.2, ease: "easeOut" }}
    className="absolute top-[85px] right-0 w-[750px] h-[800px] z-0"
  >
    <Image
      src={primaryImage}
      alt="Vista Principal Vertical"
      fill
      className="object-cover shadow-2xl"
      priority
    />
  </motion.div>

  <motion.div 
    initial={{ opacity: 0, y: 100 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 1, delay: 0.2 }}
    className="absolute top-[840px] right-[30%] w-[1000px] h-[500px] z-20"
  >
    <div className="relative w-full h-full  shadow-[0_50px_100px_rgba(0,0,0,0.6)]">
          <video
      src={videoUrl}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      className="absolute inset-0 w-full h-full object-cover"
      controls={false}   
      controlsList="nodownload nofullscreen noremoteplayback"
      disablePictureInPicture
      onContextMenu={(e) => e.preventDefault()}
      onPause={(e) => e.currentTarget.play()}
      tabIndex={-1}
    />
      
      <div className="absolute -top-12 right-6">
         <p className="text-[10px] tracking-[0.6em] text-white/20 uppercase font-black">
           EST. 2023
         </p>
      </div>
    </div>
  </motion.div>

</div>
      </div>

      <div className="h-32 lg:h-64" />
    </section>
  );
}