import { SessionProvider } from 'next-auth/react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ServiceProvider } from '@/providers/service-provider';
import SideBarLeft from '@/components/sidebar-left';
import NavBarTop from '@/components/nav-bar-top';
import { ToastProvider } from '@heroui/toast';
import {
  SidebarProvider,
  SidebarAside,
  SidebarContent,
} from '@/components/sidebar-provider';

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
        <SidebarProvider>
          <div className='flex min-h-screen bg-background'>
            <SidebarAside>
              <SideBarLeft />
            </SidebarAside>
            <main className='min-w-0 flex-1'>
              <SidebarContent>
                <header className='sticky top-0 z-40 border-b border-none bg-background/95'>
                  <NavBarTop user={session} />
                </header>
                <div className='flex flex-grow flex-col gap-4 p-6'>
                  {children}
                </div>
              </SidebarContent>
            </main>
          </div>
        </SidebarProvider>
      </ServiceProvider>
    </SessionProvider>
  );
}
