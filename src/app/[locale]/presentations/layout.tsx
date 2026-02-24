import '@/styles/globals.css';
import CreativeNavbar from '@/components/component-navbar/CreativeNavbar';
import { routing } from '@/i18n/routing';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { ServiceProvider } from '@/providers/service-provider';
import { NextIntlClientProvider } from 'next-intl';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import { getMessages } from 'next-intl/server';
import { ThemeProvider } from '@/providers/theme-provider';
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
  const messages = await getMessages();
  return (
    <html lang={locale} suppressHydrationWarning className='scroll-smooth'>
      <body className='antialiased'>
        <SessionProvider session={session}>
          <ServiceProvider>
            <NextIntlClientProvider messages={messages}>
              <Toaster
                position='top-right'
                containerClassName=''
                toastOptions={{
                  className: 'dark:bg-default-200 dark:text-slate-400',
                  duration: 5000,
                }}
              />
              <ThemeProvider>
                <main>
                  <header>
                    <CreativeNavbar />
                  </header>
                  {children}
                </main>
              </ThemeProvider>
            </NextIntlClientProvider>
          </ServiceProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
