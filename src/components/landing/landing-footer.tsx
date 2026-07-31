import { siteConfig } from '@/config/site';

export default function LandingFooter() {
  return (
    <footer className='flex h-[30vh] flex-col items-center justify-center gap-2 border-t border-white/5 bg-black px-6 text-center'>
      <p className='text-sm font-bold uppercase tracking-[0.3em] text-zinc-400'>
        {siteConfig.name}
      </p>
      <p className='text-[10px] uppercase tracking-[0.2em] text-zinc-600'>
        © {new Date().getFullYear()} {siteConfig.name}. Todos los derechos
        reservados.
      </p>
    </footer>
  );
}
