'use client';

import { useEffect, useState, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Button,
  useDisclosure,
} from '@heroui/react';
import { X, Map } from 'lucide-react';
import Image from 'next/image';
import Carousel from '@/components/carousel';
import { getPresentationGalleryImages } from '@/lib/presentation-gallery';

interface DepartmentModel {
  id: string;
  name_model_department?: string;
  base_square_meters?: number;
  id_plan: string;
  prymary_image?: string;
  batch_images?: any;
}

function normalizeZoneId(id: string) {
  return id
    .trim()
    .replace(/_x([0-9a-f]{2,4})_/gi, (_m, hex: string) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/_\d+_$/, '')
    .replace(/[\s_-]+/g, '')
    .toLowerCase();
}

/** Un modelo puede apuntar a varias zonas del plano: "E1, E2; E3". */
function zoneIdsOf(model: DepartmentModel) {
  return String(model.id_plan ?? '')
    .split(/[,;\n]+/)
    .map(normalizeZoneId)
    .filter(Boolean);
}

function modelFromElement(
  target: Element | null,
  departments: DepartmentModel[],
  root: Element
) {
  for (let el = target; el && el !== root; el = el.parentElement) {
    if (!el.id) continue;
    const zone = normalizeZoneId(el.id);
    const model = departments.find((d) => zoneIdsOf(d).includes(zone));
    if (model) return model;
  }
  return null;
}

function InteractiveSVG({
  svgUrl,
  departments,
  onSelect,
  selectedId,
  ownStyles = false,
}: {
  svgUrl: string;
  departments: DepartmentModel[];
  onSelect: (model: DepartmentModel | null) => void;
  selectedId?: string;
  ownStyles?: boolean;
}) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgUrl) return;
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
          .replace(/<style([\s\S]*?)<\/style>/gi, (block) =>
            ownStyles ? block.replace(/@import[^;]*;/gi, '') : ''
          )
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '')
          .replace(
            /<text/g,
            '<text style="pointer-events: none; user-select: none;"'
          );
        setSvgContent(cleanSvg);
      });
  }, [svgUrl, ownStyles]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !svgContent) return;

    const handleSvgClick = (e: MouseEvent) => {
      const model = modelFromElement(
        e.target as Element,
        departments,
        container
      );
      if (model) onSelect(model.id_plan === selectedId ? null : model);
    };

    container.addEventListener('click', handleSvgClick);
    return () => container.removeEventListener('click', handleSvgClick);
  }, [svgContent, departments, onSelect, selectedId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !svgContent) return;
    const selected = departments.find((d) => d.id_plan === selectedId);
    const wanted = selected ? zoneIdsOf(selected) : [];
    container.querySelectorAll<SVGElement>('svg [id]').forEach((el) => {
      el.toggleAttribute(
        'data-zone-selected',
        wanted.includes(normalizeZoneId(el.id))
      );
    });
  }, [svgContent, departments, selectedId]);

  return (
    <div
      ref={containerRef}
      className={`interactive-svg-container ${ownStyles ? 'own-svg' : ''} flex h-full w-full items-center justify-center p-0 lg:p-4`}
      dangerouslySetInnerHTML={{ __html: svgContent || '' }}
    />
  );
}

export default function DepartmentsPage({
  data,
  sectionId = 'distribucion',
  eyebrow = 'Explora tu próximo hogar',
  title = 'plano Interactivo',
  emptyText = 'Sin imagen disponible',
  emptyContent,
  subtitle,
  ownStyles = false,
  titleClassName = 'text-5xl md:text-7xl lg:text-8xl',
}: {
  data: any;
  sectionId?: string;
  eyebrow?: string;
  title?: string;
  emptyText?: string;
  emptyContent?: (model: DepartmentModel | null) => ReactNode;
  subtitle?: string;
  ownStyles?: boolean;
  titleClassName?: string;
}) {
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
      <div className='flex h-screen items-center justify-center bg-black text-white'>
        Cargando...
      </div>
    );
  const galleryImages = getPresentationGalleryImages(
    selectedModel,
    data.distribution_image
  );
  const currentImage = galleryImages[0] ?? '';

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
      id={sectionId}
      className='flex min-h-screen flex-col items-center bg-[#ffffff] p-4 dark:bg-black lg:p-10'
    >
      <div className='mb-10 flex w-full flex-col items-center px-2 text-center'>
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-2 text-xs font-bold uppercase tracking-[0.5em] text-zinc-500 dark:text-zinc-400'
        >
          {eyebrow}
        </motion.span>
        <h1
          className={`mi-fuente-2 bg-gradient-to-b from-zinc-800 to-zinc-500 bg-clip-text font-black uppercase tracking-tighter text-transparent dark:from-white dark:to-zinc-500 ${titleClassName}`}
        >
          {title}
        </h1>
        {subtitle && (
          <p className='mt-4 max-w-xl text-center text-sm text-zinc-600 dark:text-white/65 sm:text-base'>
            {subtitle}
          </p>
        )}
      </div>

      <div className='flex h-auto w-full max-w-[1700px] flex-col gap-8 lg:h-[calc(100vh-250px)] lg:flex-row'>
        <section className='relative w-full overflow-visible rounded-[30px] border-[2px] border-zinc-100 bg-[#fcfcfc] shadow-xl dark:border-[#949494] dark:bg-transparent lg:w-[70%] lg:overflow-hidden'>
          <AnimatePresence mode='wait'>
            {mobileTab === 'map' && isMobileViewport && (
              <motion.div
                key='mobile-map'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className='flex w-full flex-col items-center justify-center gap-4 p-2 lg:hidden'
              >
                <div className='w-full overflow-hidden rounded-[24px] border border-zinc-200 bg-white/80 shadow-md dark:border-zinc-700 dark:bg-zinc-900/40'>
                  {currentImage ? (
                    <button
                      type='button'
                      onClick={onOpen}
                      className='relative block h-[32vh] w-full'
                      aria-label='Ampliar distribución'
                    >
                      <Image
                        src={currentImage}
                        alt='Distribución del piso'
                        fill
                        sizes='100vw'
                        className='bg-white object-contain p-2 dark:bg-black'
                      />
                    </button>
                  ) : emptyContent ? (
                    <div className='min-h-[32vh]'>
                      {emptyContent(selectedModel)}
                    </div>
                  ) : (
                    <div className='flex h-[32vh] items-center justify-center text-sm text-zinc-500 dark:text-zinc-400'>
                      Sin imagen de distribución disponible
                    </div>
                  )}
                </div>

                <div className='flex w-full items-center justify-between px-1'>
                  <p className='text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400'>
                    {emptyContent
                      ? 'Toca una zona del plano'
                      : 'Distribución del piso'}
                  </p>
                  {currentImage && (
                    <Button
                      size='sm'
                      variant='flat'
                      onPress={onOpen}
                      className='bg-white/80 text-zinc-900 dark:bg-zinc-800 dark:text-white'
                    >
                      Ampliar
                    </Button>
                  )}
                </div>

                <div className='h-[45vh] max-h-[45vh] w-full'>
                  <InteractiveSVG
                    ownStyles={ownStyles}
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
                <div className='relative mb-4 flex min-h-[74vh] w-full items-center justify-center lg:absolute lg:inset-0 lg:mb-0 lg:min-h-0 lg:p-10'>
                  {currentImage ? (
                    <Image
                      key={currentImage}
                      src={currentImage}
                      onClick={onOpen}
                      fill
                      sizes='(min-width: 1024px) 70vw, 100vw'
                      className='cursor-zoom-in object-contain transition-all duration-500'
                      alt='Vista Departamento'
                    />
                  ) : (
                    (emptyContent?.(selectedModel) ?? (
                      <div className='flex h-[70vh] w-full items-center justify-center text-sm text-zinc-500 dark:text-zinc-400'>
                        {emptyText}
                      </div>
                    ))
                  )}
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
          <div className='relative aspect-square w-full max-w-[520px] overflow-hidden rounded-[40px] border-[2px] border-zinc-900 bg-white shadow-xl dark:border-[#949494] dark:border-white/5 dark:bg-transparent'>
            <InteractiveSVG
              ownStyles={ownStyles}
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
        hideCloseButton
        backdrop={isMobileViewport ? 'opaque' : 'blur'}
        classNames={{
          wrapper: 'p-0',
          base: 'bg-white dark:bg-black m-0 h-[100dvh] max-h-[100dvh] w-full max-w-full rounded-none sm:m-4 sm:h-[90vh] sm:max-h-[90vh] sm:max-w-5xl sm:rounded-2xl',
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
                  className='h-11 w-11 rounded-full border border-zinc-300 bg-white/90 text-zinc-900 shadow-lg backdrop-blur-md transition hover:bg-white dark:border-white/20 dark:bg-black/55 dark:text-white dark:hover:bg-black/70'
                  aria-label='Cerrar visor de imagen'
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
        .interactive-svg-container:not(.own-svg) [id] {
          cursor: pointer;
          transition: all 0.3s ease;
          stroke: #000000;
          fill: #908e8e;
        }
        :is(.dark) .interactive-svg-container:not(.own-svg) [id] {
          cursor: pointer;
          transition: all 0.3s ease;
          stroke: #bebdbd;
          fill: #6b6b6b;
        }

        .interactive-svg-container:not(.own-svg) [id]:hover {
          fill: #ffffff;
          stroke: #111111;
          stroke-width: 2px;
        }

        ${selectedModel
          ? `
          .interactive-svg-container:not(.own-svg) [data-zone-selected],
          .interactive-svg-container:not(.own-svg) [data-zone-selected] :is(path, rect, polygon, polyline, circle, ellipse) {
            fill: #d4d4d4 !important;
            stroke: #8a8a8a !important;
            stroke-width: 3px !important;
          }
        `
          : ''}
        /* SVG con estilos propios: se conservan sus colores; solo se resalta la zona */
        .interactive-svg-container.own-svg [id] {
          cursor: pointer;
        }
        .interactive-svg-container.own-svg [data-zone-selected] {
          filter: drop-shadow(0 0 3px #fbbf24) drop-shadow(0 0 6px #fbbf24);
        }
      `}</style>
    </div>
  );
}
