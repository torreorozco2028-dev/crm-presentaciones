'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getBuildingById } from './building/actions/building-actions';

interface Building {
  id: string;
  building_title: string;
  building_description?: string;
  building_location?: string;
  prymary_image?: string;
  distribution_image: string;
  createdAt?: Date;
  updatedAt?: Date;
  plan_image: string;
  total_floors?: number;
  number_garages?: number;
  number_storages?: number;
  batch_images?: unknown[];
  buildingToFeatures?: Array<{
    feature: {
      id: string;
      name_gfeatures: string;
      room?: string;
    };
  }>;
}

export default function BuildingsPage() {
  const params = useParams();
  const buildingId = params.buildingId as string;
  const [building, setBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBuilding = async () => {
      try {
        setLoading(true);
        const data = await getBuildingById(buildingId);
        setBuilding(data as Building);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Error al cargar el edificio'
        );
      } finally {
        setLoading(false);
      }
    };

    if (buildingId) {
      fetchBuilding();
    }
  }, [buildingId]);

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950'>
        <p className='text-xl text-zinc-600 dark:text-zinc-400'>
          Cargando edificio...
        </p>
      </div>
    );
  }

  if (error || !building) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950'>
        <p className='text-xl text-red-600 dark:text-red-400'>
          {error || 'Edificio no encontrado'}
        </p>
      </div>
    );
  }

  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-white dark:bg-zinc-950'>
      <h1 className='mb-4 text-center text-5xl font-bold dark:text-zinc-200'>
        INICIO
      </h1>
    </div>
  );
}
