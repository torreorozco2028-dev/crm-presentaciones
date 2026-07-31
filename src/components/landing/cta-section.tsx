import { siteConfig } from '@/config/site';

export default function CTASection({
  buildingTitle,
}: {
  buildingTitle?: string;
}) {
  return (
    <section className='bg-[#0a6406] px-6 py-20 text-center dark:bg-[#08350e] lg:px-16'>
      <div className='mx-auto max-w-3xl'>
        <h2 className='mb-4 text-3xl font-black uppercase tracking-tight text-white md:text-4xl'>
          {buildingTitle
            ? `Agenda tu visita a ${buildingTitle}`
            : 'Contáctanos'}
        </h2>
        <p className='mb-8 text-lg text-white/80'>
          Nuestro equipo te acompaña en cada paso, desde la elección de tu
          departamento hasta la entrega de llaves.
        </p>
        <div className='flex flex-col justify-center gap-4 sm:flex-row'>
          <a
            href={`mailto:${siteConfig.contact.email}`}
            className='rounded-full bg-white px-8 py-3 font-bold uppercase tracking-wide text-[#0a6406] transition hover:bg-zinc-100'
          >
            Escríbenos
          </a>
          <a
            href={siteConfig.contact.whatsapp}
            target='_blank'
            rel='noopener noreferrer'
            className='rounded-full border-2 border-white px-8 py-3 font-bold uppercase tracking-wide text-white transition hover:bg-white/10'
          >
            WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
