import { notFound } from 'next/navigation';
import BuildingEntity from '@/server/db/entities/building';
import CreativeNavbar from '@/components/component-navbar/CreativeNavbar';
import BuildingHero from '@/app/[locale]/presentations/[buildingId]/building/first-part';

interface PageProps {
  params: Promise<{
    buildingId: string;
    locale: string;
  }>;
}

export default async function BuildingPage({ params }: PageProps) {
  const { buildingId } = await params;

  const buildingEntity = new BuildingEntity();
  const buildingData = await buildingEntity.getBuildingById(buildingId);
  if (!buildingData) {
    notFound();
  }

  return (
    <main className='min-h-screen bg-black'>
      <CreativeNavbar />

      {/*SECCION1: INTRODUCCION */}
      <BuildingHero building={buildingData} />

      <section className='flex h-[50vh] items-center justify-center bg-black'>
        <p className='text-xs font-bold uppercase tracking-[1em] text-zinc-800'>
          Structec • 2026
        </p>
      </section>
    </main>
  );
}
