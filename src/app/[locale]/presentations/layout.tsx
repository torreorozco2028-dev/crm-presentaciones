import "@/styles/globals.css"; 

export default function PresentationsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang={params.locale}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}