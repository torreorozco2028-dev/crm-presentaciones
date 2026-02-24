'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Button,
  useDisclosure,
} from '@heroui/react';
import { Layers, X, Map as MapIcon, Info } from 'lucide-react';
import dynamic from 'next/dynamic';

const Carousel = dynamic(() => import('@/components/carousel'), { ssr: false });

interface DepartmentModel {
  id: string;
  name_model_department?: string;
  base_square_meters?: number;
  id_plan: string;
  prymary_image?: string;
  batch_images?: any;
}

// --- COMPONENTE SVG INTERACTIVO ---
function InteractiveSVG({
  svgUrl,
  departments,
  onSelect,
  selectedId,
}: {
  svgUrl: string;
  departments: DepartmentModel[];
  onSelect: (model: DepartmentModel) => void;
  selectedId?: string;
}) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(svgUrl)
      .then((res) => res.text())
      .then((text) => {
        const cleanSvg = text
          .replace(/<style([\s\S]*?)<\/style>/gi, '')
          .replace(
            /<text/g,
            '<text style="pointer-events: none; user-select: none;"'
          );
        setSvgContent(cleanSvg);
      });
  }, [svgUrl]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !svgContent) return;

    const handleSvgClick = (e: MouseEvent) => {
      const target = e.target as SVGElement;
      const zone = target.closest('[id]');
      if (zone) {
        const zoneId = zone.id.trim();
        const model = departments.find(
          (d) => String(d.id_plan).trim() === zoneId
        );
        if (model) onSelect(model);
      }
    };

    container.addEventListener('click', handleSvgClick);
    return () => container.removeEventListener('click', handleSvgClick);
  }, [svgContent, departments, onSelect]);

  return (
    <div
      ref={containerRef}
      className='interactive-svg-container flex h-full w-full items-center justify-center p-4'
      dangerouslySetInnerHTML={{ __html: svgContent || '' }}
    />
  );
}

export default function DepartmentsPage({ data }: { data: any }) {
  const [selectedModel, setSelectedModel] = useState<DepartmentModel | null>(
    null
  );
  // 'map' para el SVG, 'model' para la imagen del departamento
  const [mobileTab, setMobileTab] = useState<'map' | 'model'>('map');
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  if (!data)
    return (
      <div className='flex h-screen items-center justify-center bg-[#0a192f] text-white'>
        Cargando...
      </div>
    );

  const currentImage = selectedModel?.prymary_image || data.distribution_image;

  const getGallery = () => {
    const raw = selectedModel?.batch_images;
    if (!raw) return [];
    try {
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return [raw];
    }
  };
  const galleryImages = getGallery();

  // Función para manejar selección en móvil
  const handleSelectModel = (model: DepartmentModel) => {
    setSelectedModel(model);
    if (window.innerWidth < 1024) setMobileTab('model');
  };

  // Lógica de Swiping para móvil
  const onDragEnd = (event: any, info: any) => {
    const threshold = 50;
    if (info.offset.x < -threshold) {
      // Swipe hacia la izquierda -> Volver al Mapa
      setMobileTab('map');
    } else if (info.offset.x > threshold) {
      // Swipe hacia la derecha -> Ver modelo (si hay uno seleccionado)
      if (selectedModel) setMobileTab('model');
    }
  };

  return (
    <div
      id='distribucion'
      className='flex min-h-screen flex-col items-center bg-[#ffffff] p-2 dark:bg-[#0a192f] lg:p-10'
    >
      <div className='flex h-[calc(100vh-120px)] w-full max-w-[1700px] flex-col gap-8 lg:flex-row'>
        {/* CONTENEDOR PRINCIPAL (En móvil alterna entre Mapa e Imagen) */}
        <section className='relative h-[70vh] w-full overflow-hidden rounded-[30px] border border-white/5 bg-[#ffffff] shadow-2xl dark:bg-transparent lg:h-full lg:w-[70%]'>
          <AnimatePresence mode='wait'>
            {/* VISTA MAPA (Sólo Mobile cuando active) */}
            {mobileTab === 'map' && (
              <motion.div
                key='map-view'
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className='absolute inset-0 z-10 flex items-center justify-center lg:hidden'
                drag='x'
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={onDragEnd}
              >
                <div className='absolute top-10 flex flex-col items-center gap-2 opacity-40'>
                  <MapIcon size={20} />
                  <p className='text-[10px] font-bold uppercase tracking-widest'>
                    Mapa Interactivo
                  </p>
                </div>
                <InteractiveSVG
                  svgUrl={data.plan_image}
                  departments={data.models}
                  onSelect={handleSelectModel}
                  selectedId={selectedModel?.id_plan}
                />
              </motion.div>
            )}

            {/* VISTA MODELO (Desktop siempre, Mobile según tab) */}
            {(mobileTab === 'model' ||
              (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
              <motion.div
                key={selectedModel?.id || 'base'}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.5 }}
                className={`absolute inset-0 flex flex-col items-center justify-center p-8 lg:relative lg:flex lg:p-12 ${mobileTab === 'model' ? 'flex' : 'hidden'}`}
                drag={window.innerWidth < 1024 ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={onDragEnd}
              >
                <img
                  src={currentImage}
                  className='h-full w-full object-contain'
                  alt='Plan'
                />

                {selectedModel && (
                  <div className='absolute bottom-6 left-6 right-6 flex flex-col gap-4 lg:bottom-12 lg:left-12 lg:right-12 lg:flex-row lg:items-end lg:justify-between'>
                    <div className='rounded-2xl border border-white/10 bg-black/60 p-5 backdrop-blur-md lg:rounded-3xl lg:p-8'>
                      <p className='mb-1 text-[9px] font-bold uppercase tracking-[0.4em] text-white/70'>
                        Detalles
                      </p>
                      <h1 className='mb-1 font-serif text-2xl text-white lg:text-5xl'>
                        {selectedModel.name_model_department}
                      </h1>
                      <p className='text-sm text-zinc-300 lg:text-2xl'>
                        {selectedModel.base_square_meters} m² totales
                      </p>
                    </div>

                    {galleryImages.length > 0 && (
                      <Button
                        onPress={onOpen}
                        className='flex h-12 gap-3 rounded-xl bg-white px-6 text-xs font-bold text-black shadow-2xl transition-all hover:scale-105 lg:h-20 lg:rounded-3xl lg:px-10 lg:text-lg'
                      >
                        <Layers size={20} /> GALERIA ({galleryImages.length})
                      </Button>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* LADO DERECHO (Solo Desktop) */}
        <aside className='hidden h-full flex-col gap-6 lg:flex lg:w-[30%]'>
          <div className='relative h-full overflow-hidden rounded-[40px] border border-white/5 bg-white shadow-2xl dark:bg-transparent'>
            <div className='absolute left-8 top-6 z-10 rounded-2xl border border-zinc-200 bg-zinc-100 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800'>
              <p className='text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-300'>
                Mapa Interactivo
              </p>
            </div>
            <InteractiveSVG
              svgUrl={data.plan_image}
              departments={data.models}
              onSelect={setSelectedModel}
              selectedId={selectedModel?.id_plan}
            />
          </div>
        </aside>
      </div>

      {/* MODAL GALERIA CON BOTON DE CIERRE */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size='5xl'
        backdrop='blur'
        className='border border-white/10 bg-black/90 shadow-2xl backdrop-blur-xl'
        hideCloseButton={false} // HeroUI ya provee uno, pero lo haremos más obvio
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className='absolute right-2 top-2 z-50 flex justify-end'>
                <Button
                  isIconOnly
                  variant='light'
                  onPress={onClose}
                  className='text-white hover:bg-white/20'
                >
                  <X size={30} />
                </Button>
              </ModalHeader>
              <ModalBody className='p-0'>
                <div className='h-[85vh] w-full'>
                  <Carousel images={galleryImages} height='h-full' />
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* ESTILOS SVG (MANTENIDOS EXACTAMENTE IGUAL) */}
      <style jsx global>{`
        .interactive-svg-container svg {
          width: 100%;
          height: 100%;
          padding: 20px;
        }
        .interactive-svg-container [id] {
          cursor: pointer;
          transition: all 0.3s ease;
          stroke: #5c5c5c;
          fill: rgba(255, 255, 255, 0.99);
          stroke-width: 1px;
        }
        .interactive-svg-container [id]:hover {
          fill: rgba(0, 100, 139, 0.2) !important;
          stroke: #000000;
          stroke-width: 2px;
        }
        :is(.dark) .interactive-svg-container [id] {
          stroke: #a1a1a1;
          fill: rgba(30, 30, 30, 0.95);
        }
        :is(.dark) .interactive-svg-container [id]:hover {
          fill: rgba(0, 150, 180, 0.3) !important;
          stroke: #ffffff;
          stroke-width: 2px;
        }
        ${selectedModel
          ? `
          .interactive-svg-container #[id="${selectedModel.id_plan}"] { 
             fill: #007c5f !important; stroke: #4a00ac !important; stroke-width: 3px !important; 
             filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.3));
          }
          :is(.dark) .interactive-svg-container #[id="${selectedModel.id_plan}"] {
             fill: #10b981 !important; stroke: #7c3aed !important; stroke-width: 3px !important;
             filter: drop-shadow(0 0 10px rgba(167, 139, 250, 0.5));
          }
        `
          : ''}
      `}</style>
    </div>
  );
}
