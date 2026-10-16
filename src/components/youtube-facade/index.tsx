'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FiPlay } from 'react-icons/fi';

/**
 * Muestra solo la miniatura del video; el iframe de YouTube (muy pesado)
 * se carga recien cuando la persona hace clic.
 */
export default function YoutubeFacade({
  videoId,
  title,
}: {
  videoId: string;
  title: string;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className='relative mt-4 aspect-video overflow-hidden rounded-xl bg-zinc-900'>
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow='accelerometer; autoplay; encrypted-media; picture-in-picture'
          allowFullScreen
          referrerPolicy='strict-origin-when-cross-origin'
          className='absolute inset-0 h-full w-full'
        />
      ) : (
        <button
          type='button'
          onClick={() => setPlaying(true)}
          aria-label={`Reproducir video: ${title}`}
          className='group absolute inset-0 h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a6406]'
        >
          <Image
            src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
            alt=''
            fill
            sizes='(min-width: 896px) 832px, 100vw'
            className='object-cover opacity-90 transition group-hover:opacity-100'
          />
          <span className='absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-3xl text-white transition group-hover:scale-110 group-hover:bg-[#0a6406]'>
            <FiPlay className='ml-1' />
          </span>
        </button>
      )}
    </div>
  );
}
