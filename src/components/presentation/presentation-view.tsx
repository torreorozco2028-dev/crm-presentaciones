import BuildingLocation from '@/app/[locale]/presentations/[buildingId]/building/second-part';
import CommonAreasSection from '@/app/[locale]/presentations/[buildingId]/building/third-part';
import DepartmentsPage from '@/app/[locale]/presentations/[buildingId]/departamentos/page';
import ExtrasSection from '@/app/[locale]/presentations/[buildingId]/building/extras-section';
import Floors from '@/app/[locale]/presentations/[buildingId]/building/floors';

export default function PresentationView({
  building,
  isAuthenticated = false,
}: {
  building: any;
  isAuthenticated?: boolean;
}) {
  const isDepartment = (type?: string | null) =>
    !type || type === 'departamento';
  const departmentModels = (building.models ?? []).filter((m: any) =>
    isDepartment(m.model_type)
  );
  const departmentUnits = (building.units ?? []).filter((u: any) =>
    isDepartment(u.model?.model_type)
  );
  const extraModels = (building.models ?? []).filter(
    (m: any) => !isDepartment(m.model_type)
  );
  const extraUnits = (building.units ?? []).filter(
    (u: any) => !isDepartment(u.model?.model_type)
  );

  return (
    <>
      <BuildingLocation building={building} />
      <CommonAreasSection commonAreas={building.commonAreas} />
      <DepartmentsPage data={{ ...building, models: departmentModels }} />
      <Floors
        units={departmentUnits}
        building={building}
        isAuthenticated={isAuthenticated}
      />
      {extraModels.length > 0 && (
        <ExtrasSection
          building={building}
          models={extraModels}
          units={extraUnits}
          isAuthenticated={isAuthenticated}
        />
      )}
    </>
  );
}
