'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { fonts } from '@/config/fonts';

interface AdvertisingTitleProps {
  buildingName: string;
  callToAction?: string;
  gradientFrom?: string;
  gradientVia?: string;
  gradientTo?: string;
}

export default function AdvertisingTitle({
  buildingName,
  callToAction = 'Compra YA',
  gradientFrom = '#fbbf24',
  gradientVia = '#f59e0b',
  gradientTo = '#d97706',
}: AdvertisingTitleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.1 }}
      className='relative z-20 w-full bg-gradient-to-r from-black/40 to-black/40 py-8 text-center backdrop-blur-sm'
    >
      <div className='mx-auto max-w-7xl px-6'>
        {/* Call to Action - Texto pequeño arriba */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className='mb-2'
        >
          <p
            className={`${fonts.MiFuente.className} text-2xl font-bold uppercase tracking-wider md:text-4xl`}
            style={{
              background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientVia} 50%, ${gradientTo} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: `0 0 30px rgba(251, 191, 36, 0.3)`,
              filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.2))',
            }}
          >
            {callToAction}
          </p>
        </motion.div>

        {/* Building Name - Título grande principal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className='mb-3'
        >
          <h1
            className={`${fonts.boldPublicity.className} text-6xl font-black leading-none tracking-tight md:text-7xl lg:text-8xl`}
            style={{
              background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientVia} 50%, ${gradientTo} 100%)`,
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'gradient-shift 3s ease infinite',
            }}
          >
            {buildingName}
          </h1>
        </motion.div>

        {/* Línea decorativa */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className='mx-auto h-1 w-24 rounded-full'
          style={{
            background: `linear-gradient(90deg, ${gradientFrom}, ${gradientVia}, ${gradientTo})`,
          }}
        />

        {/* Efecto de brillo/glow */}
        <div
          className='pointer-events-none absolute inset-0 opacity-30'
          style={{
            background: `radial-gradient(circle at center, ${gradientVia} 0%, transparent 70%)`,
            filter: 'blur(40px)',
          }}
        />
      </div>

      <style>{`
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% center;
          }
          50% {
            background-position: 100% center;
          }
        }
      `}</style>
    </motion.div>
  );
}
