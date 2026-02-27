'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fonts } from '@/config/fonts';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Button,
  useDisclosure,
} from '@heroui/react';
import { Layers, X } from 'lucide-react';
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

function InteractiveSVG({
  svgUrl,
  departments,
  onSelect,
  selectedId,
}: {
  svgUrl: string;
  departments: DepartmentModel[];
  onSelect: (model: DepartmentModel | null) => void;
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
        if (model) {
          onSelect(model.id_plan === selectedId ? null : model);
        }
      }
    };

    container.addEventListener('click', handleSvgClick);
    return () => container.removeEventListener('click', handleSvgClick);
  }, [svgContent, departments, onSelect, selectedId]);

  return (
    <div
      ref={containerRef}
      className='interactive-svg-container flex h-full w-full items-center justify-center p-4 lg:p-10'
      dangerouslySetInnerHTML={{ __html: svgContent || '' }}
    />
  );
}

export default function DepartmentsPage({ data }: { data: any }) {
  const [selectedModel, setSelectedModel] = useState<DepartmentModel | null>(
    null
  );
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

  const handleSelectModel = (model: DepartmentModel | null) => {
    setSelectedModel(model);
    if (model && typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileTab('model');
    }
  };

  const onDragEnd = (event: any, info: any) => {
    const threshold = 50;
    if (info.offset.x < -threshold) setMobileTab('map');
    else if (info.offset.x > threshold && selectedModel) setMobileTab('model');
  };

  return (
    <div
      id='distribucion'
      className='flex min-h-screen flex-col items-center bg-[#ffffff] p-4 dark:bg-[#0a192f] lg:p-10'
    >
      <div className='mb-10 flex flex-col items-center'>
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-2 text-xs font-bold uppercase tracking-[0.5em] text-zinc-500 dark:text-zinc-400'
        >
          Explora tu próximo hogar
        </motion.span>
        <h1
          className={`${fonts.inter.className} bg-gradient-to-b from-zinc-800 to-zinc-400 bg-clip-text text-5xl font-black uppercase tracking-tighter text-transparent dark:from-white dark:to-zinc-500 md:text-7xl lg:text-8xl`}
        >
          plano Interactivo
        </h1>
      </div>

      <div className='flex h-auto w-full max-w-[1700px] flex-col gap-8 lg:h-[calc(100vh-250px)] lg:flex-row'>
        <section className='relative w-full overflow-hidden rounded-[30px] border-[2px] border-zinc-100 bg-[#fcfcfc] shadow-xl dark:border-[#949494] dark:bg-transparent lg:w-[70%]'>
          <AnimatePresence mode='wait'>
            {mobileTab === 'map' && (
              <motion.div
                key='mobile-map'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className='flex min-h-[50vh] items-center justify-center lg:hidden'
              >
                <InteractiveSVG
                  svgUrl={data.plan_image}
                  departments={data.models}
                  onSelect={handleSelectModel}
                  selectedId={selectedModel?.id_plan}
                />
              </motion.div>
            )}

            {(mobileTab === 'model' ||
              (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
              <motion.div
                key={selectedModel?.id || 'base-view'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                drag={
                  typeof window !== 'undefined' && window.innerWidth < 1024
                    ? 'x'
                    : false
                }
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={onDragEnd}
                className={`flex h-full w-full flex-col lg:relative ${mobileTab === 'model' ? 'p-4' : ''}`}
              >
                <div className='mb-6 flex w-full items-center justify-center lg:absolute lg:inset-0 lg:mb-0 lg:p-10'>
                  <img
                    src={currentImage}
                    className='max-h-[50vh] w-auto object-contain transition-all duration-500 lg:max-h-full lg:w-full'
                    alt='Vista Departamento'
                  />
                </div>

                {selectedModel && (
                  <div className='z-10 flex w-full flex-col items-center gap-6 px-4 lg:absolute lg:bottom-10 lg:left-0 lg:right-0 lg:flex-row lg:items-end lg:justify-between lg:px-10'>
                    <div className='w-full rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-black/40 lg:w-auto'>
                      <p className='mb-1 text-[10px] font-bold uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400'>
                        Modelo Seleccionado
                      </p>
                      <h2 className='mb-1 font-serif text-3xl dark:text-white'>
                        {selectedModel.name_model_department}
                      </h2>
                      <p className='text-lg text-zinc-500 dark:text-zinc-400'>
                        {selectedModel.base_square_meters} m² totales
                      </p>
                    </div>
                    {galleryImages.length > 0 && (
                      <div className='w-full lg:w-auto'>
                        <Button
                          onPress={onOpen}
                          className='h-16 w-full gap-3 rounded-2xl bg-zinc-900 px-8 font-bold text-white shadow-2xl transition-transform hover:scale-105 active:scale-95 dark:bg-white dark:text-black lg:h-20 lg:w-auto'
                        >
                          <Layers size={18} /> VER GALERIA (
                          {galleryImages.length})
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
        <aside className='hidden h-full flex-col gap-6 lg:flex lg:w-[30%]'>
          <div className='relative h-full overflow-hidden rounded-[40px] border-[2px] border-[#0a192f] bg-white shadow-xl dark:border-[#949494] dark:border-white/5 dark:bg-transparent'>
            <InteractiveSVG
              svgUrl={data.plan_image}
              departments={data.models}
              onSelect={handleSelectModel}
              selectedId={selectedModel?.id_plan}
            />
          </div>
        </aside>
      </div>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size='5xl'
        backdrop='blur'
        className='bg-black/95'
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className='absolute right-4 top-4 z-50'>
                <Button
                  isIconOnly
                  variant='flat'
                  onPress={onClose}
                  className='rounded-full bg-white/10 text-white backdrop-blur-xl'
                >
                  <X size={24} />
                </Button>
              </ModalHeader>
              <ModalBody className='p-0'>
                <div className='h-[85vh] w-full'>
                  <Carousel
                    images={galleryImages}
                    height='h-full w-full object-contain'
                  />
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      <style jsx global>{`
        .interactive-svg-container svg {
          width: 100%;
          height: 100%;
        }
        .interactive-svg-container [id] {
          cursor: pointer;
          transition: all 0.3s ease;
          stroke: #000000;
          fill: #908e8e;
        }
        :is(.dark) .interactive-svg-container [id] {
          cursor: pointer;
          transition: all 0.3s ease;
          stroke: #bebdbd;
          fill: #6b6b6b;
        }

        .interactive-svg-container [id]:hover {
          fill: #ffffff;
          stroke: #0a192f;
          stroke-width: 2px;
        }

        ${selectedModel
          ? `
          .interactive-svg-container #[id="${selectedModel.id_plan}"] {
            fill: #3b82f6 !important;
            stroke: #2563eb !important;
            stroke-width: 3px !important;
          }
        `
          : ''}
      `}</style>
    </div>
  );
}
