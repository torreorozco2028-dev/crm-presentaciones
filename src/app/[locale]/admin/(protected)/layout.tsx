import { SessionProvider } from 'next-auth/react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ServiceProvider } from '@/providers/service-provider';
import SideBarLeft from '@/components/sidebar-left';
import NavBarTop from '@/components/nav-bar-top';
import { ToastProvider } from '@heroui/toast';

export default async function AdminProtectedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session: any = await auth();

  if (!session) {
    redirect(`/${locale}/admin/login`);
  }

  return (
    <SessionProvider session={session}>
      <ServiceProvider>
        <ToastProvider placement='top-right' />
        <div className='flex min-h-screen bg-background'>
          <aside className='fixed hidden h-screen w-64 border-r border-divider bg-default-50/50 shadow-sm dark:border-zinc-700/50 md:block'>
            <SideBarLeft />
          </aside>
          <main className='flex-1'>
            <div className='flex min-h-screen flex-col md:ml-64'>
              <header className='sticky top-0 z-40 border-b border-none bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
                <NavBarTop user={session} />
              </header>
              <div className='flex flex-grow flex-col gap-4 p-6'>
                {children}
              </div>
            </div>
          </main>
        </div>
      </ServiceProvider>
    </SessionProvider>
  );
}
