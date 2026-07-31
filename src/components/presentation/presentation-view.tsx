import BuildingLocation from '@/app/[locale]/presentations/[buildingId]/building/second-part';
import CommonAreasSection from '@/app/[locale]/presentations/[buildingId]/building/third-part';
import DepartmentsPage from '@/app/[locale]/presentations/[buildingId]/departamentos/page';
import Floors from '@/app/[locale]/presentations/[buildingId]/building/floors';

export default function PresentationView({
  building,
  isAuthenticated = false,
}: {
  building: any;
  isAuthenticated?: boolean;
}) {
  return (
    <>
      <BuildingLocation building={building} />
      <CommonAreasSection commonAreas={building.commonAreas} />
      <DepartmentsPage data={building} />
      <Floors
        units={building.units}
        building={building}
        isAuthenticated={isAuthenticated}
      />
    </>
  );
}
