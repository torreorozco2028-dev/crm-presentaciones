'use client';

import { Button } from '@heroui/react';
import LucideIcon from '@/components/lucide-icon';
import { useState } from 'react';

interface CarouselProps {
  images: string[];
  height?: string;
  width?: string;
  className?: string;
  fallbackIcon?: string;
  fallbackIconSize?: string;
}

export default function Carousel({
  images,
  height = 'h-full',
  width = 'w-full',
  className = '',
  fallbackIcon = 'CameraOff',
  fallbackIconSize = '40',
}: CarouselProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const filteredImages = images.filter(Boolean);

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? filteredImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === filteredImages.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className={`relative ${height} ${width} rounded-sm ${className} `}>
      {filteredImages.length > 0 ? (
        <>
          <div
            className='absolute inset-0 object-cover transition-transform duration-300 ease-in-out'
            style={{
              backgroundImage: `url(${filteredImages[currentImageIndex]})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          {filteredImages.length > 1 && (
            <>
              <Button
                isIconOnly
                className='absolute left-2 top-1/2 -translate-y-1/2 bg-default-100/80 hover:bg-default-200/80'
                size='sm'
                variant='flat'
                onPress={handlePrevImage}
              >
                <LucideIcon name='ChevronLeft' size='20' />
              </Button>
              <Button
                isIconOnly
                className='absolute right-2 top-1/2 -translate-y-1/2 bg-default-100/80 hover:bg-default-200/80'
                size='sm'
                variant='flat'
                onPress={handleNextImage}
              >
                <LucideIcon name='ChevronRight' size='20' />
              </Button>
              <div className='absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1'>
                {filteredImages.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 w-1.5 rounded-full transition-colors ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            </>
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
