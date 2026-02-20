'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Modal,
  ModalBody,
  ModalContent,
  Button,
  useDisclosure,
} from '@heroui/react';
import { Layers } from 'lucide-react';
import dynamic from 'next/dynamic';
import {
  getDepartmentsByBuilding,
  getBuildingInfo,
} from './actions/departments-actions';

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

        if (model) {
          onSelect(model);
        }
      }
    };

    container.addEventListener('click', handleSvgClick);
    return () => container.removeEventListener('click', handleSvgClick);
  }, [svgContent, departments, onSelect]);

  return (
    <div
      ref={containerRef}
      className='interactive-svg-container flex h-full w-full items-center justify-center p-6'
      dangerouslySetInnerHTML={{ __html: svgContent || '' }}
    />
  );
}

export default function DepartmentsPage() {
  const { buildingId } = useParams();
  const [data, setData] = useState<{
    building: any;
    models: DepartmentModel[];
  } | null>(null);
  const [selectedModel, setSelectedModel] = useState<DepartmentModel | null>(
    null
  );
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  useEffect(() => {
    if (buildingId) {
      Promise.all([
        getBuildingInfo(buildingId as string),
        getDepartmentsByBuilding(buildingId as string),
      ]).then(([b, m]) => {
        setData({ building: b as any, models: m as any });
        if (m && m.length > 0) setSelectedModel(m[0] as any);
      });
    }
  }, [buildingId]);

  if (!data)
    return (
      <div className='flex h-screen items-center justify-center bg-[#0a192f] text-white'>
        Cargando...
      </div>
    );

  const currentImage =
    selectedModel?.prymary_image || data.building.distribution_image;

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
  console.log('Gallery Images:', galleryImages);
  return (
    <div
      id='distribucion'
      className='flex min-h-screen flex-col items-center bg-[#ffffff] p-4 lg:p-10'
    >
      <div className='flex h-[calc(100vh-140px)] w-full max-w-[1700px] flex-col gap-8 lg:flex-row'>
        <section className='relative w-full overflow-hidden rounded-[30px] border border-white/5 bg-[#ffffff] shadow-2xl lg:w-[70%]'>
          <AnimatePresence mode='wait'>
            <motion.div
              key={selectedModel?.id || 'base'}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className='flex h-full w-full items-center justify-center p-12'
            >
              {currentImage ? (
                <img
                  src={currentImage}
                  className='h-full w-full object-contain'
                  alt='Plan'
                />
              ) : (
                <p className='font-serif text-2xl uppercase tracking-widest text-zinc-500'>
                  Seleccione un área en el mapa
                </p>
              )}
            </motion.div>
          </AnimatePresence>

          {selectedModel && (
            <div className='absolute bottom-12 left-12 right-12 flex items-end justify-between'>
              <div className='rounded-3xl border border-white/10 bg-black/20 p-8 backdrop-blur-md'>
                <p className='mb-2 text-[10px] font-bold uppercase tracking-[0.4em] text-[#ffffff]'>
                  Detalles del Modelo
                </p>
                <h1 className='mb-2 font-serif text-5xl text-white'>
                  {selectedModel.name_model_department}
                </h1>
                <p className='text-2xl text-zinc-400'>
                  {selectedModel.base_square_meters} m² totales
                </p>
              </div>

              {galleryImages.length > 0 && (
                <Button
                  onPress={onOpen}
                  className='flex h-20 gap-3 rounded-3xl bg-white px-10 text-lg font-bold text-black shadow-2xl transition-all hover:scale-105'
                >
                  <Layers size={24} /> GALERIA ({galleryImages.length})
                </Button>
              )}
            </div>
          )}
        </section>

        <aside className='flex w-full flex-col gap-6 lg:w-[30%]'>
          <div className='relative h-[100%] overflow-hidden rounded-[40px] bg-white shadow-2xl'>
            <div className='absolute left-8 top-6 z-10 rounded-2xl border border-zinc-200 bg-zinc-100 px-4 py-2'>
              <p className='text-[10px] font-black uppercase tracking-widest text-zinc-500'>
                Mapa Interactivo
              </p>
            </div>

            <InteractiveSVG
              svgUrl={data.building.plan_image}
              departments={data.models}
              onSelect={setSelectedModel}
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
        className='border border-white/10 bg-zinc-950/90'
      >
        <ModalContent>
          <ModalBody className='p-0'>
            <div className='h-[85vh] w-full'>
              <Carousel images={galleryImages} height='h-full' />
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      <style jsx global>{`
        .interactive-svg-container svg {
          width: 100%;
          height: 100%;
          padding: 30px;
        }
        .interactive-svg-container [id] {
          cursor: pointer;
          transition: all 0.3s ease;
          stroke: #e4e4e7; /* Zinc 200 */
          stroke-width: 1px;
        }
        .interactive-svg-container [id]:hover {
          fill: rgba(25, 177, 83, 0.2) !important;
          stroke: #232789;
          stroke-width: 2px;
        }
        ${selectedModel
          ? `
          .interactive-svg-container #[id="${selectedModel.id_plan}"] {
            fill: #13fcc5 !important; /* Zinc 900 */
            stroke: #0bf54d !important;
            stroke-width: 3px !important;
            filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.3));
          }
        `
          : ''}
      `}</style>
    </div>
  );
}
