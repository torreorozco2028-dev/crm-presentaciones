'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, School, Coffee, Hospital, ShoppingBag, Landmark } from 'lucide-react';

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
  if (!iframeString) return "";
  const match = iframeString.match(/src="([^"]+)"/);
  return match ? match[1] : iframeString;
};

const getPoiIcon = (name: string) => {
  const n = name?.toLowerCase() || "";
  if (n.includes('hospital') || n.includes('clinica')) return <Hospital size={16} />;
  if (n.includes('colegio') || n.includes('escuela') || n.includes('universidad')) return <School size={16} />;
  if (n.includes('cafe') || n.includes('restaurante')) return <Coffee size={16} />;
  if (n.includes('mall') || n.includes('supermercado') || n.includes('tienda')) return <ShoppingBag size={16} />;
  if (n.includes('plaza') || n.includes('parque')) return <Landmark size={16} />;
  return <MapPin size={16} />;
};

export default function BuildingLocation({ building }: BuildingLocationProps) {
  const mapUrl = extractMapUrl(building.building_locationURL);
  const points = building.pointsOfInterest || [];

  return (
    <section className="relative w-full transition-colors duration-500 bg-white text-[#0a192f] dark:bg-[#0a192f] dark:text-white py-12 lg:py-20 overflow-hidden">
      <div className="flex flex-col lg:flex-row min-h-[600px] lg:min-h-[800px]">
        
        <div className="relative w-full lg:w-[60%] h-[400px] lg:h-auto order-2 lg:order-1">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="absolute inset-0 z-0 grayscale invert brightness-[0.8] dark:brightness-[0.6] contrast-[1.2] sepia-[0.1] hue-rotate-[190deg] hover:grayscale-0 hover:invert-0 hover:brightness-100 transition-all duration-1000"
          >
            {mapUrl ? (
              <iframe
                src={mapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-slate-200 dark:bg-slate-900" />
            )}
          </motion.div>

          <div className="absolute top-6 left-6 lg:top-10 lg:left-10 z-10 bg-[#0a192f] text-white dark:bg-white dark:text-black px-4 py-2 text-[9px] lg:text-[10px] font-bold tracking-[0.3em] uppercase">
            Map View / {building.building_location || "Location"}
          </div>
        </div>

        <div className="relative w-full lg:w-[40%] flex flex-col justify-center px-6 md:px-12 lg:px-16 py-12 order-1 lg:order-2">
          <div className="z-10 relative">
            <motion.span 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="text-[10px] tracking-[0.6em] text-[#0a192f] dark:text-blue-400 font-bold uppercase mb-4 block"
            >
              Conectividad
            </motion.span>
            <h2 className="text-4xl lg:text-6xl font-serif mb-6 lg:mb-8 leading-tight">
              Entorno <br /> <span className="italic text-[#0a192f] dark:text-white">Privilegiado</span>
            </h2>
            
            <div className="flex gap-4 lg:gap-6 items-start">
                <div className="w-[1px] bg-[#0a192f]/20 dark:bg-white/20 h-32 lg:h-40 shrink-0" />
                <p className="text-[20px] opacity-70 font-light leading-relaxed max-w-xs">
                    Descubre los puntos clave que rodean tu próximo hogar. Diseñado para quienes valoran el tiempo y la cercanía.
                </p>
            </div>
          </div>
        </div>

        <div className="relative lg:absolute bottom-0 lg:bottom-10 left-0 w-full z-20 mt-8 lg:mt-0 pb-10 lg:pb-0 order-3">
          <motion.div 
            drag="x"
            dragConstraints={{ right: 0, left: -((points.length * 300) - 200) }}
            className="flex gap-4 lg:gap-6 px-6 lg:px-20 cursor-grab active:cursor-grabbing"
          >
            {points.length > 0 ? (
              points.map((poi) => (
                <motion.div
                  key={poi.id}
                  className="min-w-[260px] lg:min-w-[320px] bg-white dark:bg-[#0a192f] border border-[#0a192f] dark:border-white p-6 shadow-xl relative group overflow-hidden"
                  whileHover={{ y: -10 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="absolute top-2 right-2 opacity-10 dark:opacity-20 group-hover:opacity-100 transition-opacity">
                    {getPoiIcon(poi.point_name)}
                  </div>
                  
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="h-[1px] w-6 bg-blue-600 dark:bg-blue-500"></span>
                        <span className="text-[10px] tracking-widest uppercase text-blue-600 dark:text-blue-400 font-bold">
                            CERCA
                        </span>
                      </div>
                      
                      <h3 className="text-base lg:text-lg font-serif mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors uppercase tracking-tight">
                        {poi.point_name}
                      </h3>
                      <p className="text-xs opacity-60 font-light leading-relaxed line-clamp-2 lg:line-clamp-3">
                        {poi.point_description}
                      </p>
                    </div>

                    <div className="mt-6 lg:mt-8 flex justify-between items-center border-t border-[#0a192f]/10 dark:border-white/10 pt-4">
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="opacity-40" />
                        <span className="text-[10px] font-bold opacity-50">
                            {poi.point_distance ? `${poi.point_distance} MIN` : 'CERCANO'}
                        </span>
                      </div>
                      <div className="text-[9px] tracking-tighter opacity-20">
                        {building.building_location?.split(',')[0] || "Ubicación"}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="opacity-20 uppercase tracking-widest text-xs px-10">
                No hay puntos registrados
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="hidden lg:block absolute bottom-4 right-10 text-[9px] uppercase tracking-[0.3em] opacity-30 animate-pulse">
        Arrastra para explorar →
      </div>
    </section>
  );
}