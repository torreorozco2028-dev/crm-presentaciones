'use client';

import DepartmentsPage from '@/app/[locale]/presentations/[buildingId]/departamentos/page';
import Floors from '@/app/[locale]/presentations/[buildingId]/building/floors';
import ExtrasEmptyState from '@/app/[locale]/presentations/[buildingId]/building/extras-empty-state';

/** Vauleras y estacionamientos: plano interactivo + unidades disponibles. */
export default function ExtrasSection({
  building,
  models,
  units,
  isAuthenticated,
}: {
  building: any;
  models: any[];
  units: any[];
  isAuthenticated: boolean;
}) {
  const availableTotal = units.filter((u) => u.state === 1).length;

  return (
    <>
      <DepartmentsPage
        data={{
          ...building,
          plan_image: building.extras_plan_image,
          distribution_image: null,
          models,
        }}
        sectionId='vauleras-estacionamientos'
        eyebrow='Completa tu hogar'
        title='Vauleras y Estacionamientos'
        subtitle='Resguarda tu vehículo y tus pertenencias en espacios seguros, dentro del mismo edificio.'
        titleClassName='text-[1.65rem] min-[400px]:text-3xl sm:text-4xl md:text-5xl lg:text-6xl'
        ownStyles
        emptyContent={(model: any) => {
          const modelUnits = model
            ? units.filter((u) => (u.modelId ?? u.model?.id) === model.id)
            : [];
          return (
            <ExtrasEmptyState
              availableTotal={availableTotal}
              selected={
                model
                  ? {
                      name: model.name_model_department ?? 'Espacio',
                      kind: model.model_type ?? null,
                      description: model.model_description ?? null,
                      area: model.base_square_meters ?? null,
                      available: modelUnits.filter((u) => u.state === 1).length,
                      total: modelUnits.length,
                    }
                  : null
              }
            />
          );
        }}
      />
      <Floors
        units={units}
        building={building}
        isAuthenticated={isAuthenticated}
        title='UNIDADES DISPONIBLES'
        sectionId='unidades-extras'
        unitLabel='espacio'
      />
    </>
  );
}
