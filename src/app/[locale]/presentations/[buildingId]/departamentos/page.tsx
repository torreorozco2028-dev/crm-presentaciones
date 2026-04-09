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
import { X, Map } from 'lucide-react';
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

function toImageUrl(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (value && typeof value === 'object') {
    const possibleUrl = (value as { url?: unknown }).url;
    return typeof possibleUrl === 'string' ? possibleUrl.trim() : '';
  }
  return '';
}

function parseImageBatch(raw: unknown): string[] {
  if (!raw) return [];

  const parsed = (() => {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        const value = JSON.parse(raw);
        return Array.isArray(value) ? value : [value];
      } catch {
        return [raw];
      }
    }
    return [raw];
  })();

  return parsed.map(toImageUrl).filter(Boolean);
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
          .replace(/<svg\b([^>]*)>/i, (_match, attrs) => {
            // If viewBox exists we can safely force responsive sizing.
            // Without viewBox, keep intrinsic viewport attrs to avoid clipping.
            const hasViewBox = /\sviewBox\s*=/.test(attrs);

            const withoutPreserve = attrs.replace(
              /\spreserveAspectRatio\s*=\s*(['"]).*?\1/gi,
              ''
            );

            if (!hasViewBox) {
              return `<svg${withoutPreserve} preserveAspectRatio="xMidYMid meet">`;
            }

            const withoutWidth = withoutPreserve.replace(
              /\swidth\s*=\s*(['"]).*?\1/gi,
              ''
            );
            const withoutHeight = withoutWidth.replace(
              /\sheight\s*=\s*(['"]).*?\1/gi,
              ''
            );

            return `<svg${withoutHeight} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">`;
          })
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
      className='interactive-svg-container flex h-full w-full items-center justify-center p-0 lg:p-4'
      dangerouslySetInnerHTML={{ __html: svgContent || '' }}
    />
  );
}

export default function DepartmentsPage({ data }: { data: any }) {
  const [selectedModel, setSelectedModel] = useState<DepartmentModel | null>(
    null
  );
  const [mobileTab, setMobileTab] = useState<'map' | 'model'>('map');
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const handleMediaChange = (event: MediaQueryListEvent) => {
      setIsMobileViewport(event.matches);
    };

    setIsMobileViewport(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  if (!data)
    return (
      <div className='flex h-screen items-center justify-center bg-[#0a192f] text-white'>
        Cargando...
      </div>
    );
  const currentImage = (
    selectedModel?.prymary_image ||
    data.distribution_image ||
    ''
  ).trim();
  const galleryImages = (() => {
    if (!selectedModel) return [];

    const primary = (selectedModel?.prymary_image || '').trim();
    const normalizedBatch = parseImageBatch(selectedModel?.batch_images);

    // Gallery starts with primary image, then batch images without duplicates.
    return [...new Set([primary, ...normalizedBatch].filter(Boolean))];
  })();

  const handleSelectModel = (model: DepartmentModel | null) => {
    setSelectedModel(model);
    if (model && isMobileViewport) {
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
        <section className='relative w-full overflow-visible rounded-[30px] border-[2px] border-zinc-100 bg-[#fcfcfc] shadow-xl dark:border-[#949494] dark:bg-transparent lg:w-[70%] lg:overflow-hidden'>
          <AnimatePresence mode='wait'>
            {mobileTab === 'map' && (
              <motion.div
                key='mobile-map'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className='flex w-full flex-col items-center justify-center gap-4 p-2 lg:hidden'
              >
                <div className='h-[45vh] max-h-[45vh] w-full'>
                  <InteractiveSVG
                    svgUrl={data.plan_image}
                    departments={data.models}
                    onSelect={handleSelectModel}
                    selectedId={selectedModel?.id_plan}
                  />
                </div>
              </motion.div>
            )}

            {(mobileTab === 'model' || !isMobileViewport) && (
              <motion.div
                key={selectedModel?.id || 'base-view'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                drag={isMobileViewport ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={onDragEnd}
                className={`flex h-full w-full flex-col lg:relative ${mobileTab === 'model' ? 'p-2 lg:p-4' : ''}`}
              >
                <div className='mb-4 flex min-h-[74vh] w-full items-center justify-center lg:absolute lg:inset-0 lg:mb-0 lg:min-h-0 lg:p-10'>
                  <img
                    key={currentImage || 'fallback-distribution-image'}
                    src={currentImage}
                    onClick={galleryImages.length > 0 ? onOpen : undefined}
                    className={`h-[70vh] w-full object-contain transition-all duration-500 lg:h-auto lg:max-h-full lg:w-full${galleryImages.length > 0 ? 'cursor-pointer' : ''}`}
                    alt='Vista Departamento'
                  />
                </div>

                {selectedModel && (
                  <div className='z-10 flex w-full flex-col items-center gap-4 px-2 lg:absolute lg:bottom-10 lg:left-0 lg:right-0 lg:items-start lg:gap-6 lg:px-10'>
                    <div className='w-full lg:hidden'>
                      <Button
                        onPress={() => setMobileTab('map')}
                        className='h-12 w-full gap-3 rounded-2xl bg-white/90 px-6 font-bold text-zinc-900 shadow-xl dark:bg-zinc-800 dark:text-white'
                      >
                        <Map size={18} /> VER PLANO
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
        <aside className='hidden items-center lg:flex lg:w-[30%]'>
          <div className='relative aspect-square w-full max-w-[520px] overflow-hidden rounded-[40px] border-[2px] border-[#0a192f] bg-white shadow-xl dark:border-[#949494] dark:border-white/5 dark:bg-transparent'>
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
        backdrop='blur'
        classNames={{
          wrapper: 'p-0',
          base: 'bg-black m-0 h-[100dvh] max-h-[100dvh] w-full max-w-full rounded-none sm:m-4 sm:h-[90vh] sm:max-h-[90vh] sm:max-w-5xl sm:rounded-2xl',
          body: 'p-0 flex-1 overflow-hidden',
          header: 'p-0 border-none',
        }}
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
              <ModalBody>
                <div className='h-full w-full'>
                  <Carousel
                    images={galleryImages}
                    height='h-full'
                    className='rounded-none'
                  />
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      <style jsx global>{`
        .interactive-svg-container {
          overflow: visible;
        }
        .interactive-svg-container svg {
          display: block;
          width: auto;
          height: auto;
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          overflow: visible;
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
          .interactive-svg-container [id="${selectedModel.id_plan}"] {
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
