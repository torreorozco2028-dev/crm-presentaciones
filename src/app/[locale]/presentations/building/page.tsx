'use client'; 
import CreativeNavbar from '@/components/component-navbar/CreativeNavbar'; 

export default function BuildingsPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950">
      <CreativeNavbar />

      <section id="inicio" className="h-screen flex items-center justify-center bg-white">
        <h1 className="text-6xl font-bold text-black">Sección Inicio</h1>
      </section>

      <section id="areas-comunes" className="h-screen flex items-center justify-center bg-ehite">
        <h2 className="text-5xl font-bold text-black">Áreas Comunes</h2>
      </section>

      <div className="h-[200vh]"></div>
    </main>
  );
}