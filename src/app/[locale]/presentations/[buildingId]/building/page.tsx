import { notFound } from 'next/navigation';
import BuildingEntity from '@/server/db/entities/building';
import BuildingHero from '@/app/[locale]/presentations/[buildingId]/building/first-part';
import BuildingLocation from '@/app/[locale]/presentations/[buildingId]/building/second-part';
import CommonAreasSection from '@/app/[locale]/presentations/[buildingId]/building/third-part';
import DepartmentsPage from '../departamentos/page';
import Floors from './floors';

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
    <div className='min-h-screen'>
      <BuildingHero building={buildingData} />
      <BuildingLocation building={buildingData as any} />
      <CommonAreasSection commonAreas={buildingData.commonAreas as any} />
      <DepartmentsPage data={buildingData} />
      <Floors units={buildingData.units as any} />
      <section className='flex h-[50vh] items-center justify-center border-t border-white/5 bg-[#0a192f]'>
        <p className='text-[10px] font-bold uppercase tracking-[1em] text-zinc-600'>
          Structec • 2026
        </p>
      </section>
    </div>
  );
}
