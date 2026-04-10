import ClientsPart from '@/app/[locale]/(main)/clients/clients-part';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function ClientsPage({ params }: PageProps) {
  await params;

  return (
    <div className='min-h-screen bg-[#ffffff] text-white dark:bg-[#000000]'>
      <div className='pt-5'>
        <ClientsPart />
      </div>
      <section className='mt-20 flex h-[30vh] items-center justify-center border-t border-white/5'>
        <div className='text-center opacity-40'>
          <p className='text-[10px] font-bold uppercase tracking-[1em] text-zinc-500'>
            Structec • 2026
          </p>
        </div>
      </section>
    </div>
  );
}
