'use client';

export default function BuildingsPage() {
  return (
    <div className='min-h-screen bg-white dark:bg-zinc-950'>
      <section
        id='inicio'
        className='flex h-screen items-center justify-center bg-white'
      >
        <h1 className='text-6xl font-bold text-black'>Sección Inicio</h1>
      </section>
      <section
        id='areas-comunes'
        className='bg-ehite flex h-screen items-center justify-center'
      >
        <h2 className='text-5xl font-bold text-black'>Áreas Comunes</h2>
      </section>
      <div className='h-[200vh]'></div>
    </div>
  );
}
