'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';

interface ImageGalleryProps {
  images: string[];
  alt: string;
  /** Miniaturas visibles; el resto se ve al ampliar. */
  maxThumbnails?: number;
}

/** Grilla de miniaturas; al hacer clic abre la foto a pantalla completa. */
export default function ImageGallery({
  images,
  alt,
  maxThumbnails = 4,
}: ImageGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const count = images.length;
  const visible = images.slice(0, maxThumbnails);
  const hidden = count - visible.length;

  const close = useCallback(() => setOpenIndex(null), []);
  const move = useCallback(
    (step: number) =>
      setOpenIndex((i) => (i === null ? i : (i + step + count) % count)),
    [count]
  );

  useEffect(() => {
    if (openIndex === null) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') move(-1);
      else if (e.key === 'ArrowRight') move(1);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [openIndex, close, move]);

  if (count === 0) return null;

  return (
    <>
      <div
        className={`mt-4 grid gap-2 ${count === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}
      >
        {visible.map((src, idx) => (
          <button
            key={`${src}-${idx}`}
            type='button'
            onClick={() => setOpenIndex(idx)}
            aria-label={`Ampliar foto ${idx + 1} de ${count}`}
            className='group relative aspect-video cursor-zoom-in overflow-hidden rounded-xl bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a6406] dark:bg-zinc-800'
          >
            <Image
              src={src}
              alt={`${alt} - foto ${idx + 1}`}
              fill
              sizes='(min-width: 1024px) 400px, 50vw'
              className='object-cover transition-transform duration-300 group-hover:scale-105'
            />
            {hidden > 0 && idx === visible.length - 1 && (
              <span className='absolute inset-0 flex items-center justify-center bg-black/60 text-3xl font-black text-white'>
                +{hidden}
              </span>
            )}
          </button>
        ))}
      </div>

      {openIndex !== null &&
        createPortal(
          <div
            role='dialog'
            aria-modal='true'
            aria-label={`${alt} - foto ${openIndex + 1} de ${count}`}
            className='fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm'
            onClick={close}
          >
            <button
              type='button'
              onClick={close}
              aria-label='Cerrar'
              className='absolute right-4 top-4 z-10 rounded-full bg-white/10 p-3 text-2xl text-white transition hover:bg-white/25'
            >
              <FiX />
            </button>

            {count > 1 && (
              <>
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation();
                    move(-1);
                  }}
                  aria-label='Foto anterior'
                  className='absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-2xl text-white transition hover:bg-white/25 sm:left-6'
                >
                  <FiChevronLeft />
                </button>
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation();
                    move(1);
                  }}
                  aria-label='Foto siguiente'
                  className='absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-2xl text-white transition hover:bg-white/25 sm:right-6'
                >
                  <FiChevronRight />
                </button>
              </>
            )}

            <div
              className='relative h-full w-full max-w-6xl'
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={images[openIndex]}
                alt={`${alt} - foto ${openIndex + 1}`}
                fill
                sizes='100vw'
                className='object-contain'
                priority
              />
            </div>

            {count > 1 && (
              <p className='absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white'>
                {openIndex + 1} / {count}
              </p>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
