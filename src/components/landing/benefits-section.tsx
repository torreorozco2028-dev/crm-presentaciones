import { CheckCircle2 } from 'lucide-react';

interface Feature {
  feature: {
    id: string;
    name_gfeatures: string;
    room?: string | null;
  };
}

export default function BenefitsSection({ features }: { features: Feature[] }) {
  if (!features || features.length === 0) return null;

  return (
    <section className='bg-white px-6 py-20 dark:bg-black lg:px-16'>
      <div className='mx-auto max-w-6xl'>
        <h2 className='mb-12 text-center text-3xl font-black uppercase tracking-tight text-zinc-900 dark:text-white md:text-4xl'>
          Beneficios
        </h2>
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {features.map(({ feature }) => (
            <div
              key={feature.id}
              className='flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50'
            >
              <CheckCircle2 className='mt-0.5 shrink-0 text-[#0a6406] dark:text-[#fd8129]' />
              <div>
                <p className='font-semibold text-zinc-900 dark:text-white'>
                  {feature.name_gfeatures}
                </p>
                {feature.room && (
                  <p className='text-sm text-zinc-500 dark:text-zinc-400'>
                    {feature.room}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
