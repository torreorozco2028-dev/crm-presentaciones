import Link from 'next/link';
import { auth } from '@/auth';
import { isAdminRole } from '@/lib/ownership';
import { SALE_CONTROL_ENABLED } from '@/lib/feature-flags';
import ClientsPart from '@/app/[locale]/admin/(protected)/sales/clients-part';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function ClientsPage({ params }: PageProps) {
  await params;
  const session = await auth();
  const isAdmin = isAdminRole(session?.user?.role);

  return (
    <div className='min-h-screen bg-[#ffffff] text-white dark:bg-[#000000]'>
      <div className='pt-5'>
        {SALE_CONTROL_ENABLED && isAdmin && (
          <div className='mx-auto mb-3 max-w-[1600px] px-5 text-right'>
            <Link
              href='/admin/sales/control'
              className='text-sm font-medium text-emerald-600 hover:underline'
            >
              Control de ventas por edificio →
            </Link>
          </div>
        )}
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
