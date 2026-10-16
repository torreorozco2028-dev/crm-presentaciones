'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FiPlay } from 'react-icons/fi';
import { getTiktokEmbedUrl } from '@/lib/tiktok';

/**
 * La miniatura se guarda al crear la noticia (la URL de TikTok vence); si no
 * hay, se muestra un placeholder. El reproductor se carga recien cuando la persona hace clic.
 */
export default function TiktokFacade({
  videoId,
  title,
  thumbnailUrl,
}: {
  videoId: string;
  title: string;
  thumbnailUrl?: string | null;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className='relative mx-auto mt-4 aspect-[9/16] w-full max-w-[325px] overflow-hidden rounded-xl bg-zinc-900'>
      {playing ? (
        <iframe
          src={`${getTiktokEmbedUrl(videoId)}&autoplay=1`}
          title={title}
          allow='autoplay; fullscreen; encrypted-media'
          allowFullScreen
          referrerPolicy='strict-origin-when-cross-origin'
          className='absolute inset-0 h-full w-full'
        />
      ) : (
        <button
          type='button'
          onClick={() => setPlaying(true)}
          aria-label={`Reproducir video de TikTok: ${title}`}
          className='group absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-zinc-900 to-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a6406]'
        >
          {thumbnailUrl && (
            <Image
              src={thumbnailUrl}
              alt=''
              fill
              sizes='325px'
              className='object-cover opacity-90 transition group-hover:opacity-100'
            />
          )}
          <span className='relative flex h-16 w-16 items-center justify-center rounded-full bg-black/70 text-3xl text-white transition group-hover:scale-110 group-hover:bg-[#0a6406]'>
            <FiPlay className='ml-1' />
          </span>
          <span className='relative text-xs font-bold uppercase tracking-widest text-zinc-300'>
            Ver en TikTok
          </span>
        </button>
      )}
    </div>
  );
}
