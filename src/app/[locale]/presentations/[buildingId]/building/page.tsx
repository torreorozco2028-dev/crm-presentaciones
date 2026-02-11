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
    <main className="min-h-screen bg-black">
      <CreativeNavbar />

      {/*SECCION1: INTRODUCCION */}
      <BuildingHero building={buildingData} />

      <section className="h-[50vh] bg-black flex items-center justify-center">
        <p className="text-zinc-800 font-bold tracking-[1em] uppercase text-xs">Structec • 2026</p>
      </section>
    </main>
  );
}