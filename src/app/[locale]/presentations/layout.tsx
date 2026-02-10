import '@/styles/globals.css';
import CreativeNavbar from '@/components/component-navbar/CreativeNavbar';
import { routing } from '@/i18n/routing';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
export default async function PresentationsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }
  const session: any = await auth();

  if (!session) {
    redirect(`/${locale}`);
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className='antialiased'>
        <main>
          <header>
            <CreativeNavbar />
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
