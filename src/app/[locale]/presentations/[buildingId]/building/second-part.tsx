'use client';

import { fonts } from '@/config/fonts';
import React from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Clock,
  School,
  Coffee,
  Hospital,
  ShoppingBag,
  Landmark,
} from 'lucide-react';

interface PointOfInterest {
  id: string;
  point_name: string;
  point_description: string | null;
  point_distance: number | null;
}

interface BuildingLocationProps {
  building: {
    building_location: string;
    building_locationURL: string;
    pointsOfInterest: PointOfInterest[];
  };
}

const extractMapUrl = (iframeString: string) => {
  if (!iframeString) return '';
  const match = iframeString.match(/src="([^"]+)"/);
  return match ? match[1] : iframeString;
};

const getPoiIcon = (name: string) => {
  const n = name?.toLowerCase() || '';
  if (n.includes('hospital') || n.includes('clinica'))
    return <Hospital size={16} />;
  if (
    n.includes('colegio') ||
    n.includes('escuela') ||
    n.includes('universidad')
  )
    return <School size={16} />;
  if (n.includes('cafe') || n.includes('restaurante'))
    return <Coffee size={16} />;
  if (n.includes('mall') || n.includes('supermercado') || n.includes('tienda'))
    return <ShoppingBag size={16} />;
  if (n.includes('plaza') || n.includes('parque'))
    return <Landmark size={16} />;
  return <MapPin size={16} />;
};

export default function BuildingLocation({ building }: BuildingLocationProps) {
  const mapUrl = extractMapUrl(building.building_locationURL);
  const points = building.pointsOfInterest || [];

  return (
    <section
      id='ubicacion'
      className='relative w-full overflow-hidden bg-white py-12 text-[#0a192f] transition-colors duration-500 dark:bg-[#0a192f] dark:text-white lg:py-20'
    >
      <div className='flex min-h-[600px] flex-col lg:min-h-[800px] lg:flex-row'>
        <div className='relative order-2 h-[400px] w-full lg:order-1 lg:h-auto lg:w-[60%]'>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className='absolute inset-0 z-0 brightness-[0.8] contrast-[1.2] grayscale hue-rotate-[190deg] invert sepia-[0.1] transition-all duration-1000 hover:brightness-100 hover:grayscale-0  dark:brightness-[0.6]'
          >
            {mapUrl ? (
              <iframe
                src={mapUrl}
                width='100%'
                height='100%'
                style={{ border: 0 }}
                allowFullScreen
                loading='lazy'
              />
            ) : (
              <div className='h-full w-full bg-slate-200 dark:bg-slate-900' />
            )}
          </motion.div>

          <div className='absolute left-6 top-6 z-10 bg-[#0a192f] px-4 py-2 text-[9px] font-bold uppercase tracking-[0.3em] text-white dark:bg-white dark:text-black lg:left-10 lg:top-10 lg:text-[10px]'>
            Map View / {building.building_location || 'Location'}
          </div>
        </div>

        <div className='relative order-1 flex w-full flex-col justify-center px-6 py-12 md:px-12 lg:order-2 lg:w-[40%] lg:px-16'>
          <div className='relative z-10'>
            <motion.span
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className='mb-4 block text-[10px] font-bold uppercase tracking-[0.6em] text-[#0a192f] dark:text-blue-400'
            >
              Conectividad
            </motion.span>
            <h2 className={`${fonts.inter.className} mb-6 text-4xl leading-tight lg:mb-8 lg:text-6xl`}>
              Entorno <br />{' '}
              <span className={`${fonts.inter.className} text-[#0a192f] dark:text-white`}>
                Privilegiado
              </span>
            </h2>

            <div className='flex items-start gap-4 lg:gap-6'>
              <div className='h-32 w-[1px] shrink-0 bg-[#0a192f]/20 dark:bg-white/20 lg:h-40' />
              <p className='max-w-xs text-[20px] font-light leading-relaxed opacity-70'>
                Descubre los puntos clave que rodean tu próximo hogar. Diseñado
                para quienes valoran el tiempo y la cercanía.
              </p>
            </div>
          </div>
        </div>

        <div className='relative bottom-0 left-0 z-20 order-3 mt-8 w-full pb-10 lg:absolute lg:bottom-10 lg:mt-0 lg:pb-0'>
          <motion.div
            drag='x'
            dragConstraints={{ right: 0, left: -(points.length * 300 - 200) }}
            className='flex cursor-grab gap-4 px-6 active:cursor-grabbing lg:gap-6 lg:px-20'
          >
            {points.length > 0 ? (
              points.map((poi) => (
                <motion.div
                  key={poi.id}
                  className='group relative min-w-[260px] overflow-hidden border border-[#0a192f] bg-white p-6 shadow-xl dark:border-white dark:bg-[#0a192f] lg:min-w-[320px]'
                  whileHover={{ y: -10 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className='absolute right-2 top-2 opacity-10 transition-opacity group-hover:opacity-100 dark:opacity-20'>
                    {getPoiIcon(poi.point_name)}
                  </div>

                  <div className='flex h-full flex-col justify-between'>
                    <div>
                      <div className='mb-4 flex items-center gap-2'>
                        <span className='h-[1px] w-6 bg-blue-600 dark:bg-blue-500'></span>
                        <span className='text-[10px] font-bold uppercase tracking-widest text-[4f7cac] dark:text-blue-400'>
                          CERCA
                        </span>
                      </div>

                      <h3 className='mb-2 font-serif text-base uppercase tracking-tight transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-300 lg:text-lg'>
                        {poi.point_name}
                      </h3>
                      <p className='line-clamp-2 text-xs font-light leading-relaxed opacity-60 lg:line-clamp-3'>
                        {poi.point_description}
                      </p>
                    </div>

                    <div className='mt-6 flex items-center justify-between border-t border-[#0a192f]/10 pt-4 dark:border-white/10 lg:mt-8'>
                      <div className='flex items-center gap-2'>
                        <Clock size={12} className='opacity-40' />
                        <span className='text-[10px] font-bold opacity-50'>
                          {poi.point_distance
                            ? `${poi.point_distance} MIN`
                            : 'CERCANO'}
                        </span>
                      </div>
                      <div className='text-[9px] tracking-tighter opacity-20'>
                        {building.building_location?.split(',')[0] ||
                          'Ubicación'}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className='px-10 text-xs uppercase tracking-widest opacity-20'>
                No hay puntos registrados
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className='absolute bottom-4 right-10 hidden animate-pulse text-[9px] uppercase tracking-[0.3em] opacity-30 lg:block'>
        Arrastra para explorar →
      </div>
    </section>
  );
}
