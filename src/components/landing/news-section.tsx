import { parseImageBatch } from '@/lib/presentation-gallery';
import { parseVideo } from '@/lib/video';
import { newsTitleClass } from '@/lib/news-title-color';
import { newsBodyToHtml } from '@/lib/news-html';
import ImageGallery from '@/components/image-lightbox';
import YoutubeFacade from '@/components/youtube-facade';
import TiktokFacade from '@/components/tiktok-facade';
import NewsPagination from '@/components/landing/news-pagination';

interface NewsItem {
  id: string;
  title: string;
  body: string | null;
  news_date: string;
  batch_images: unknown;
  video_url: string | null;
  video_thumbnail_url?: string | null;
  progress_percent: number | null;
  show_progress: boolean;
  title_color: string | null;
}

function formatDate(value: string) {
  const [y, m, d] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

interface NewsSectionProps {
  news: NewsItem[];
  /** Ultimo avance de obra cargado entre todas las noticias, no solo esta pagina. */
  latestProgress: number | null;
  locale: string;
  page: number;
  totalPages: number;
}

export default function NewsSection({
  news,
  latestProgress,
  locale,
  page,
  totalPages,
}: NewsSectionProps) {
  return (
    <section className='min-h-[70vh] bg-zinc-50 px-6 pb-20 pt-36 dark:bg-zinc-950 lg:px-16'>
      <div className='mx-auto max-w-4xl'>
        <h1 className='mb-4 text-center text-3xl font-black uppercase tracking-tight text-zinc-900 dark:text-white md:text-4xl'>
          Avance de obra
        </h1>

        {news.length === 0 && page === 1 && (
          <p className='py-16 text-center text-zinc-500 dark:text-zinc-400'>
            Pronto publicaremos los avances de la obra.
          </p>
        )}

        {latestProgress != null && (
          <div className='mx-auto mb-12 max-w-md'>
            <div className='mb-2 flex justify-between text-sm font-semibold text-zinc-600 dark:text-zinc-300'>
              <span>Avance actual</span>
              <span>{latestProgress}%</span>
            </div>
            <div
              role='progressbar'
              aria-valuenow={latestProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              className='h-3 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800'
            >
              <div
                className='h-full rounded-full bg-[#0a6406] dark:bg-[#fd8129]'
                style={{ width: `${latestProgress}%` }}
              />
            </div>
          </div>
        )}

        <ol className='space-y-10 border-l-2 border-zinc-200 pl-6 dark:border-zinc-800'>
          {news.map((item) => {
            const images = parseImageBatch(item.batch_images);
            const video = parseVideo(item.video_url);
            const bodyHtml = newsBodyToHtml(item.body);

            return (
              <li key={item.id} className='relative'>
                <span className='absolute -left-[33px] top-1.5 h-3 w-3 rounded-full bg-[#0a6406] ring-4 ring-zinc-50 dark:bg-[#fd8129] dark:ring-zinc-950' />
                <time
                  dateTime={item.news_date}
                  className='text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400'
                >
                  {formatDate(item.news_date)}
                </time>
                <h3
                  className={`mt-1 text-xl font-bold ${newsTitleClass(item.title_color)}`}
                >
                  {item.title}
                </h3>
                {bodyHtml && (
                  <div
                    className='prose prose-zinc mt-3 max-w-none dark:prose-invert prose-headings:font-black prose-a:text-[#0a6406] dark:prose-a:text-[#fd8129]'
                    dangerouslySetInnerHTML={{ __html: bodyHtml }}
                  />
                )}

                <ImageGallery images={images} alt={item.title} />

                {video?.provider === 'youtube' && (
                  <YoutubeFacade videoId={video.id} title={item.title} />
                )}
                {video?.provider === 'tiktok' && (
                  <TiktokFacade
                    videoId={video.id}
                    title={item.title}
                    thumbnailUrl={item.video_thumbnail_url}
                  />
                )}
              </li>
            );
          })}
        </ol>

        <NewsPagination locale={locale} page={page} totalPages={totalPages} />
      </div>
    </section>
  );
}
