'use client';
import React, { useEffect, useState, useRef } from 'react';

interface Props {
  svgUrl: string;
  onSelectModel: (idPlan: string) => void;
  selectedIdPlan: string | null;
}

export default function InteractiveSVG({
  svgUrl,
  onSelectModel,
  selectedIdPlan,
}: Props) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(svgUrl)
      .then((res) => res.text())
      .then((text) => {
        const cleanText = text
          .replace(/fill="[^"]*"/g, '')
          .replace(/stroke="[^"]*"/g, '');
        setSvgContent(cleanText);
      });
  }, [svgUrl]);

  useEffect(() => {
    if (!containerRef.current || !svgContent) return;
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as SVGElement;
      const zone = target.closest('[id]');
      if (zone) onSelectModel(zone.id);
    };

    svg.addEventListener('click', handleClick);
    return () => svg.removeEventListener('click', handleClick);
  }, [svgContent, onSelectModel]);

  return (
    <div className='flex h-full w-full items-center justify-center p-4'>
      <div
        ref={containerRef}
        className='interactive-svg-container h-full w-full'
        dangerouslySetInnerHTML={{ __html: svgContent || '' }}
      />
      <style jsx global>{`
        .interactive-svg-container svg {
          width: 100%;
          height: 100%;
        }
        .interactive-svg-container [id] {
          cursor: pointer;
          transition: all 0.3s;
          fill: rgba(255, 255, 255, 0.1);
          stroke: #ccc;
        }
        .interactive-svg-container [id]:hover {
          fill: rgba(251, 191, 36, 0.4);
        }
        /* Resaltar el seleccionado */
        ${selectedIdPlan
          ? `.interactive-svg-container #[id="${selectedIdPlan}"] { fill: #fbbf24 !important; stroke: #b45309; }`
          : ''}
      `}</style>
    </div>
  );
}
