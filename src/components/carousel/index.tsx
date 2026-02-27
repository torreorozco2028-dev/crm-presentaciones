'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@heroui/react';
import LucideIcon from '@/components/lucide-icon';

interface CarouselProps {
  images: string[];
  height?: string;
  width?: string;
  className?: string;
  fallbackIcon?: string;
  fallbackIconSize?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showArrows?: boolean;
  showIndicators?: boolean;
}

export default function Carousel({
  images,
  height = 'h-full',
  width = 'w-full',
  className = '',
  fallbackIcon = 'CameraOff',
  fallbackIconSize = '40',
  autoPlay = false,
  autoPlayInterval = 5000,
  showArrows = true,
  showIndicators = true,
}: CarouselProps) {
  const filteredImages = images.filter(Boolean);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const autoplayRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef<number>(0);
  const SWIPE_THRESHOLD = 50;

  useEffect(() => {
    if (currentImageIndex >= filteredImages.length) {
      setCurrentImageIndex(0);
    }
  }, [filteredImages.length, currentImageIndex]);

  useEffect(() => {
    if (!autoPlay || filteredImages.length <= 1) return;

    const id = window.setInterval(() => {
      setCurrentImageIndex((prev) =>
        prev === filteredImages.length - 1 ? 0 : prev + 1
      );
    }, autoPlayInterval);

    autoplayRef.current = id;
    return () => {
      if (autoplayRef.current) {
        window.clearInterval(autoplayRef.current);
        autoplayRef.current = null;
      }
    };
  }, [autoPlay, autoPlayInterval, filteredImages.length]);

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? filteredImages.length - 1 : prev - 1
    );
    resetAutoplay();
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === filteredImages.length - 1 ? 0 : prev + 1
    );
    resetAutoplay();
  };

  const resetAutoplay = () => {
    if (!autoPlay) return;
    if (autoplayRef.current) {
      window.clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
    const id = window.setInterval(() => {
      setCurrentImageIndex((prev) =>
        prev === filteredImages.length - 1 ? 0 : prev + 1
      );
    }, autoPlayInterval);
    autoplayRef.current = id;
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevImage();
      if (e.key === 'ArrowRight') handleNextImage();
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [filteredImages.length]);

  const onTouchStart: React.TouchEventHandler = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const onTouchMove: React.TouchEventHandler = (e) => {
    if (touchStartX.current == null) return;
    const currentX = e.touches[0].clientX;
    touchDeltaX.current = currentX - touchStartX.current;
  };

  const onTouchEnd: React.TouchEventHandler = () => {
    if (touchDeltaX.current > SWIPE_THRESHOLD) {
      handlePrevImage();
    } else if (touchDeltaX.current < -SWIPE_THRESHOLD) {
      handleNextImage();
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };
  const pointerStartX = useRef<number | null>(null);
  const pointerDeltaX = useRef<number>(0);
  const onPointerDown: React.PointerEventHandler = (e) => {
    pointerStartX.current = e.clientX;
    (e.target as Element).setPointerCapture?.((e as any).pointerId);
  };
  const onPointerMove: React.PointerEventHandler = (e) => {
    if (pointerStartX.current == null) return;
    pointerDeltaX.current = e.clientX - pointerStartX.current;
  };
  const onPointerUp: React.PointerEventHandler = () => {
    if (pointerDeltaX.current > SWIPE_THRESHOLD) handlePrevImage();
    else if (pointerDeltaX.current < -SWIPE_THRESHOLD) handleNextImage();

    pointerStartX.current = null;
    pointerDeltaX.current = 0;
  };
  const handleImageLoad = (index: number) => {
    setLoaded((s) => ({ ...s, [index]: true }));
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Image carousel"
      className={`relative overflow-hidden ${height} ${width} rounded-sm ${className}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {filteredImages.length > 0 ? (
        <>
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 lg:bg-black/90">
            {filteredImages.map((src, idx) => {
              const isActive = idx === currentImageIndex;
              return (
                <img
                  key={idx}
                  src={src}
                  alt={`Imagen ${idx + 1} de ${filteredImages.length}`}
                  onLoad={() => handleImageLoad(idx)}
                  loading={idx === currentImageIndex ? 'eager' : 'lazy'}
                  className={`
                    absolute inset-0 m-auto
                    transition-opacity duration-300 ease-in-out
                    ${isActive ? 'opacity-100 z-20' : 'opacity-0 z-10'}
                    max-h-full max-w-full
                    object-contain lg:h-full lg:w-full lg:object-cover
                    `}
                  style={{ maxHeight: '100%', maxWidth: '100%' }}
                  draggable={false}
                />
              );
            })}
          </div>

          {filteredImages.length > 1 && showArrows && (
            <>
              <Button
                isIconOnly
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-default-100/80 hover:bg-default-200/80 z-30"
                size="sm"
                variant="flat"
                onPress={handlePrevImage}
                aria-label="Imagen anterior"
              >
                <LucideIcon name="ChevronLeft" size="20" />
              </Button>

              <Button
                isIconOnly
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-default-100/80 hover:bg-default-200/80 z-30"
                size="sm"
                variant="flat"
                onPress={handleNextImage}
                aria-label="Siguiente imagen"
              >
                <LucideIcon name="ChevronRight" size="20" />
              </Button>
            </>
          )}
          {filteredImages.length > 1 && showIndicators && (
            <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 gap-2">
              {filteredImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentImageIndex(idx);
                    resetAutoplay();
                  }}
                  aria-label={`Ir a la imagen ${idx + 1}`}
                  className={`h-2 w-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white scale-110' : 'bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <LucideIcon name={fallbackIcon as any} size={fallbackIconSize} />
        </div>
      )}
    </div>
  );
}