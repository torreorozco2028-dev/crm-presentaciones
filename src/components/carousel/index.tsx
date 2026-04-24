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
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const autoplayRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchDeltaX = useRef<number>(0);
  const touchStartPan = useRef({ x: 0, y: 0 });
  const isPinching = useRef(false);
  const pinchStartDistance = useRef<number | null>(null);
  const pinchStartZoom = useRef(1);
  const pinchStartCenter = useRef<{ x: number; y: number } | null>(null);
  const pinchStartPan = useRef({ x: 0, y: 0 });
  const SWIPE_THRESHOLD = 50;

  useEffect(() => {
    if (currentImageIndex >= filteredImages.length) {
      setCurrentImageIndex(0);
    }
  }, [filteredImages.length, currentImageIndex]);

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [currentImageIndex]);

  const clampPan = (nextX: number, nextY: number, zoomLevel = zoom) => {
    const el = containerRef.current;
    if (!el) return { x: nextX, y: nextY };

    const maxX = ((zoomLevel - 1) * el.clientWidth) / 2;
    const maxY = ((zoomLevel - 1) * el.clientHeight) / 2;

    return {
      x: Math.max(-maxX, Math.min(maxX, nextX)),
      y: Math.max(-maxY, Math.min(maxY, nextY)),
    };
  };

  useEffect(() => {
    setPan((prev) => clampPan(prev.x, prev.y, zoom));
  }, [zoom]);

  const getTouchDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const getTouchCenter = (touches: React.TouchList) => ({
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  });

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
      if (e.key === 'ArrowLeft')
        setCurrentImageIndex((prev) =>
          prev === 0 ? filteredImages.length - 1 : prev - 1
        );
      if (e.key === 'ArrowRight')
        setCurrentImageIndex((prev) =>
          prev === filteredImages.length - 1 ? 0 : prev + 1
        );
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [filteredImages.length]);

  const onTouchStart: React.TouchEventHandler = (e) => {
    if (e.touches.length === 2) {
      isPinching.current = true;
      pinchStartDistance.current = getTouchDistance(e.touches);
      pinchStartZoom.current = zoom;
      pinchStartCenter.current = getTouchCenter(e.touches);
      pinchStartPan.current = pan;
      setIsPanning(true);
      return;
    }

    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchStartPan.current = pan;
    if (zoom > 1) setIsPanning(true);
    touchDeltaX.current = 0;
  };

  const onTouchMove: React.TouchEventHandler = (e) => {
    if (
      isPinching.current &&
      e.touches.length === 2 &&
      pinchStartDistance.current &&
      pinchStartCenter.current
    ) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      const center = getTouchCenter(e.touches);
      const rawZoom =
        (pinchStartZoom.current * distance) / pinchStartDistance.current;
      const nextZoom = Math.max(1, Math.min(3, Number(rawZoom.toFixed(2))));

      const nextPan = clampPan(
        pinchStartPan.current.x + (center.x - pinchStartCenter.current.x),
        pinchStartPan.current.y + (center.y - pinchStartCenter.current.y),
        nextZoom
      );

      setZoom(nextZoom);
      setPan(nextPan);
      return;
    }

    if (isPinching.current) return;

    if (touchStartX.current == null || touchStartY.current == null) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;

    if (zoom > 1) {
      const next = clampPan(
        touchStartPan.current.x + (currentX - touchStartX.current),
        touchStartPan.current.y + (currentY - touchStartY.current)
      );
      setPan(next);
      return;
    }

    touchDeltaX.current = currentX - touchStartX.current;
  };

  const onTouchEnd: React.TouchEventHandler = () => {
    if (isPinching.current) {
      isPinching.current = false;
      pinchStartDistance.current = null;
      pinchStartCenter.current = null;
      setIsPanning(false);
      touchStartX.current = null;
      touchStartY.current = null;
      touchDeltaX.current = 0;
      return;
    }

    if (zoom <= 1) {
      if (touchDeltaX.current > SWIPE_THRESHOLD) {
        handlePrevImage();
      } else if (touchDeltaX.current < -SWIPE_THRESHOLD) {
        handleNextImage();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
    setIsPanning(false);
    touchDeltaX.current = 0;
  };
  const pointerStartX = useRef<number | null>(null);
  const pointerStartY = useRef<number | null>(null);
  const pointerStartPan = useRef({ x: 0, y: 0 });
  const pointerDeltaX = useRef<number>(0);
  const onPointerDown: React.PointerEventHandler = (e) => {
    pointerStartX.current = e.clientX;
    pointerStartY.current = e.clientY;
    pointerStartPan.current = pan;
    if (zoom > 1) setIsPanning(true);
    (e.target as Element).setPointerCapture?.((e as any).pointerId);
  };
  const onPointerMove: React.PointerEventHandler = (e) => {
    if (pointerStartX.current == null || pointerStartY.current == null) return;

    if (zoom > 1) {
      const next = clampPan(
        pointerStartPan.current.x + (e.clientX - pointerStartX.current),
        pointerStartPan.current.y + (e.clientY - pointerStartY.current)
      );
      setPan(next);
      return;
    }

    pointerDeltaX.current = e.clientX - pointerStartX.current;
  };
  const onPointerUp: React.PointerEventHandler = () => {
    if (zoom <= 1) {
      if (pointerDeltaX.current > SWIPE_THRESHOLD) handlePrevImage();
      else if (pointerDeltaX.current < -SWIPE_THRESHOLD) handleNextImage();
    }

    pointerStartX.current = null;
    pointerStartY.current = null;
    setIsPanning(false);
    pointerDeltaX.current = 0;
  };

  const handleWheelZoom: React.WheelEventHandler<HTMLDivElement> = (e) => {
    if (filteredImages.length === 0) return;
    e.preventDefault();
    setZoom((prev) => {
      const next = e.deltaY < 0 ? prev + 0.2 : prev - 0.2;
      return Math.max(1, Math.min(3, Number(next.toFixed(2))));
    });
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role='region'
      aria-roledescription='carousel'
      aria-label='Image carousel'
      className={`relative overflow-hidden ${height} ${width} rounded-sm ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : ''} ${className}`}
      style={{ touchAction: 'none' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={handleWheelZoom}
    >
      {filteredImages.length > 0 ? (
        <>
          <div className='absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-black/90'>
            {filteredImages.map((src, idx) => {
              const isActive = idx === currentImageIndex;
              return (
                <img
                  key={idx}
                  src={src}
                  alt={`Imagen ${idx + 1} de ${filteredImages.length}`}
                  loading={idx === currentImageIndex ? 'eager' : 'lazy'}
                  onDoubleClick={() => {
                    if (zoom > 1) {
                      setZoom(1);
                      setPan({ x: 0, y: 0 });
                    } else {
                      setZoom(2);
                    }
                  }}
                  className={`absolute inset-0 m-auto transition-opacity duration-300 ease-in-out ${isActive ? 'z-20 opacity-100' : 'pointer-events-none z-0 opacity-0'} max-h-full max-w-full object-contain`}
                  style={{
                    maxHeight: '100%',
                    maxWidth: '100%',
                    transform: isActive
                      ? `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
                      : 'translate(0px, 0px) scale(1)',
                    transformOrigin: 'center center',
                    transition: isPanning
                      ? 'opacity 300ms ease-in-out'
                      : 'opacity 300ms ease-in-out, transform 160ms ease-out',
                  }}
                  draggable={false}
                />
              );
            })}
          </div>

          {filteredImages.length > 1 && showArrows && (
            <>
              <Button
                isIconOnly
                className='absolute left-2 top-1/2 z-30 -translate-y-1/2 bg-default-100/80 hover:bg-default-200/80'
                size='sm'
                variant='flat'
                onPress={handlePrevImage}
                aria-label='Imagen anterior'
              >
                <LucideIcon name='ChevronLeft' size='20' />
              </Button>

              <Button
                isIconOnly
                className='absolute right-2 top-1/2 z-30 -translate-y-1/2 bg-default-100/80 hover:bg-default-200/80'
                size='sm'
                variant='flat'
                onPress={handleNextImage}
                aria-label='Siguiente imagen'
              >
                <LucideIcon name='ChevronRight' size='20' />
              </Button>
            </>
          )}
          {filteredImages.length > 1 && showIndicators && (
            <div className='absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 gap-2'>
              {filteredImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentImageIndex(idx);
                    resetAutoplay();
                  }}
                  aria-label={`Ir a la imagen ${idx + 1}`}
                  className={`h-2 w-2 rounded-full transition-all ${idx === currentImageIndex ? 'scale-110 bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className='flex h-full w-full items-center justify-center'>
          <LucideIcon name={fallbackIcon as any} size={fallbackIconSize} />
        </div>
      )}
    </div>
  );
}
