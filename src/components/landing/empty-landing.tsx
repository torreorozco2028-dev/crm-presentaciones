import { siteConfig } from '@/config/site';
import CTASection from './cta-section';
import LandingFooter from './landing-footer';

export default function EmptyLanding() {
  return (
    <div className='min-h-screen'>
      <section className='flex min-h-[80vh] flex-col items-center justify-center gap-6 bg-white px-6 text-center dark:bg-black'>
        <h1 className='text-4xl font-black uppercase tracking-tight text-zinc-900 dark:text-white md:text-6xl'>
          {siteConfig.name}
        </h1>
        <p className='max-w-xl text-lg text-zinc-600 dark:text-zinc-300'>
          {siteConfig.description}
        </p>
      </section>
      <CTASection />
      <LandingFooter />
    </div>
  );
}
