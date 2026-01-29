import '@/styles/globals.css';
import { Metadata, Viewport } from 'next';
import { siteConfig } from '@/config/site';
import { fontSans } from '@/config/fonts';
import { Toaster } from 'react-hot-toast';

import { auth } from '@/auth';
import { ThemeProvider } from '@/providers/theme-provider';
import { redirect } from 'next/navigation';
import { ServiceProvider } from '@/providers/service-provider';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import SideBarLeft from '@/components/sidebar-left';
import NavBarTop from '@/components/nav-bar-top';
import { ToastProvider } from '@heroui/toast';
import { ReactScan } from '@/components/react-scan';

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

export default async function RootLayout({
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
    <html lang={locale} suppressHydrationWarning>
      {process.env.NODE_ENV === 'development' && <ReactScan />}
      <body className={fontSans.variable}>
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
            </ThemeProvider>
          </NextIntlClientProvider>
        </ServiceProvider>
      </body>
    </html>
  );
}
