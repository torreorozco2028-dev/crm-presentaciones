import CreativeNavbar from '@/components/component-navbar/CreativeNavbar';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ServiceProvider } from '@/providers/service-provider';
import { SessionProvider } from 'next-auth/react';

export default async function PresentationsLayout({
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
        <main>
          <header>
            <CreativeNavbar session={session} />
          </header>
          {children}
        </main>
      </ServiceProvider>
    </SessionProvider>
  );
}
