'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import {
  getDepartmentsByBuilding,
  getBuildingInfo,
} from './actions/departments-actions';
import Image from 'next/image';

interface Building {
  id: string;
  building_title: string;
  building_description?: string;
  building_location?: string;
  prymary_image?: string;
  plan_image?: string;
  distribution_image?: string;
  total_floors?: number;
  number_garages?: number;
  number_storages?: number;
  batch_images?: unknown[];
}

interface DepartmentModel {
  id: string;
  buildingId: string;
  name_model_department?: string;
  base_square_meters?: number;
  balcony: boolean;
  id_plan: string;
  prymary_image?: string;
  batch_images?: string;
  createdAt?: Date;
  updatedAt?: Date;
  units?: Array<{
    id: string;
    unit_number?: string;
    floor: number;
    real_square_meters?: number;
    state: number;
  }>;
  features?: Array<{
    feature: {
      id: string;
      dfeatures_name: string;
    };
  }>;
}

const STATE_COLORS: Record<number, { label: string; color: string }> = {
  1: {
    label: 'Disponible',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  2: {
    label: 'Reservado',
    color:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  3: {
    label: 'Vendido',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
};

const isVideo = (url?: string) => {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov|avi)$/i.test(url);
};

// Componente para SVG interactivo
function InteractiveSVGPlane({
  svgUrl,
  departments,
}: {
  svgUrl: string;
  departments: DepartmentModel[];
}) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSvg = async () => {
      try {
        const response = await fetch(svgUrl);
        const text = await response.text();
        setSvgContent(text);
      } catch (error) {
        console.error('Error loading SVG:', error);
      }
    };

    fetchSvg();
  }, [svgUrl]);
  useEffect(() => {
    if (!containerRef.current || !svgContent) return;

    const timer = setTimeout(() => {
      const svg = containerRef.current?.querySelector('svg');
      if (!svg) return;

      const handleMouseMove = (e: MouseEvent) => {
        const target = e.target as SVGElement;
        // Buscamos el elemento con ID más cercano (hacia arriba)
        const zoneElement = target.closest('[id]') as SVGElement | null;

        if (
          zoneElement &&
          departments.some((d) => d.id_plan === zoneElement.id)
        ) {
          const id = zoneElement.id;

          setHoveredZone(id);
          setTooltipPos({ x: e.clientX, y: e.clientY });

          // Aplicamos estilos al elemento encontrado
          zoneElement.style.fill = '#f59e0b';
          zoneElement.style.opacity = '0.8';
          zoneElement.style.cursor = 'pointer';
          zoneElement.style.transition = 'all 0.3s ease';
        }
      };

      const handleMouseLeave = (e: MouseEvent) => {
        const target = e.target as SVGElement;
        const zoneElement = target.closest('[id]') as SVGElement | null;

        if (zoneElement) {
          zoneElement.style.fill = '';
          zoneElement.style.opacity = '';
        }
        setHoveredZone(null);
        setTooltipPos(null);
      };

      // Solo añadimos los listeners al padre (SVG)
      svg.addEventListener('mousemove', handleMouseMove);
      svg.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        svg.removeEventListener('mousemove', handleMouseMove);
        svg.removeEventListener('mouseleave', handleMouseLeave);
        clearTimeout(timer); // Importante limpiar el timer también
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [svgContent, departments]); // Añade dependencias necesarias

  const getHoveredDepartment = (zoneId: string) => {
    return departments.find((dept) => dept.id_plan === zoneId);
  };

  const hoveredDept = hoveredZone ? getHoveredDepartment(hoveredZone) : null;

  if (!svgContent) {
    return (
      <div className='flex h-full w-full items-center justify-center bg-zinc-200 dark:bg-zinc-800'>
        <p className='text-zinc-600 dark:text-zinc-400'>Cargando plano...</p>
      </div>
    );
  }

  return (
    <div className='relative h-full w-full'>
      <style>{`
  .interactive-svg-container svg {
    width: 100%;
    height: 100%;
    object-fit: contain;
    max-width: 100%;
    max-height: 100%;
  }

  /* Selecciona elementos con ID dentro del SVG al hacer hover */
  .interactive-svg-container svg [id]:hover {
    /* Color naranja (Amber 400) con 50% de opacidad */
    fill: rgba(251, 191, 36, 0.5) !important; 
    
    /* Opcional: añadir un borde naranja sólido para definir mejor el área */
    stroke: #fbbf24;
    stroke-width: 2px;
    
    /* Cambia el cursor para indicar que es clickeable */
    cursor: pointer;
    
    /* Suaviza la aparición del color */
    transition: all 0.3s ease;
  }

  /* Asegura que la transición también funcione al quitar el mouse */
  .interactive-svg-container svg [id] {
    transition: all 0.3s ease;
  }
`}</style>
      <div
        ref={containerRef}
        className='interactive-svg-container h-full w-full'
        dangerouslySetInnerHTML={{ __html: svgContent }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />

      {/* Tooltip con información del departamento */}
      {hoveredDept && tooltipPos && (
        <div
          className='pointer-events-none fixed z-50 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg'
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y - 40}px`,
          }}
        >
          <p className='font-semibold'>
            {hoveredDept.name_model_department || 'Departamento'}
          </p>
          {hoveredDept.base_square_meters && (
            <p className='text-gray-200'>
              📏 {hoveredDept.base_square_meters} m²
            </p>
          )}
          {hoveredDept.units && hoveredDept.units.length > 0 && (
            <p className='text-gray-200'>
              {hoveredDept.units.length}{' '}
              {hoveredDept.units.length === 1 ? 'unidad' : 'unidades'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function DepartmentsPage() {
  const params = useParams();
  const buildingId = params.buildingId as string;
  const [building, setBuilding] = useState<Building | null>(null);
  const [departments, setDepartments] = useState<DepartmentModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<DepartmentModel | null>(
    null
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [buildingData, departmentsData] = await Promise.all([
          getBuildingInfo(buildingId),
          getDepartmentsByBuilding(buildingId),
        ]);
        setBuilding(buildingData as any);
        setDepartments(departmentsData as any);
        console.log(departmentsData, buildingData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Error al cargar los datos'
        );
      } finally {
        setLoading(false);
      }
    };

    if (buildingId) {
      fetchData();
    }
  }, [buildingId]);

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950'>
        <p className='text-xl text-zinc-600 dark:text-zinc-400'>
          Cargando departamentos...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950'>
        <p className='text-xl text-red-600 dark:text-red-400'>{error}</p>
      </div>
    );
  }

  if (departments.length === 0 && !building) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950'>
        <p className='text-xl text-zinc-600 dark:text-zinc-400'>
          No hay departamentos disponibles para este proyecto
        </p>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-white dark:bg-zinc-950'>
      {/* Sección Hero con fondo del edificio */}
      <section
        id='departamentos-hero'
        className='relative h-64 w-full overflow-hidden pt-20 sm:h-80 sm:pt-16 md:h-96 md:pt-12 lg:h-screen lg:pt-0'
      >
        {/* Fondo - Video o Imagen del edificio */}
        {building?.prymary_image && (
          <>
            {isVideo(building.prymary_image) ? (
              <video
                autoPlay
                muted
                loop
                playsInline
                className='absolute inset-0 h-full w-full object-cover'
              >
                <source src={building.prymary_image} type='video/mp4' />
              </video>
            ) : (
              <img
                src={building.prymary_image}
                alt={building.building_title}
                className='object-cover'
              />
            )}
          </>
        )}

        {/* Overlay oscuro */}
        <div className='absolute inset-0 bg-gradient-to-r from-black/70 via-black/60 to-black/50' />

        {/* Contenido */}
        <div className='relative z-10 flex h-full items-center justify-start px-4 py-8 sm:px-6 sm:py-12 md:px-12 lg:px-20'>
          <div className='flex w-full max-w-2xl flex-col justify-center space-y-2 sm:space-y-3 md:space-y-4 lg:max-w-3xl'>
            <h1 className='text-2xl font-black leading-tight text-white drop-shadow-lg sm:text-3xl md:text-5xl lg:text-6xl'>
              Distribución de Departamentos
            </h1>
            {building?.building_title && (
              <p className='text-sm font-semibold text-amber-400 sm:text-base md:text-lg'>
                {building.building_title}
              </p>
            )}
            <p className='text-xs leading-relaxed text-gray-100 drop-shadow-md sm:text-sm md:text-base lg:text-lg'>
              Explora los diferentes modelos y tipos de departamentos
              disponibles en este proyecto
            </p>
          </div>
        </div>
      </section>

      {/* Sección Información del Edificio */}
      {building && (
        <section className='bg-gradient-to-br from-zinc-50 to-white px-4 py-12 dark:from-zinc-900 dark:to-zinc-800 sm:px-6 md:py-16 lg:py-20'>
          <div className='mx-auto max-w-6xl'>
            <div className='grid grid-cols-1 gap-8 md:gap-12 lg:grid-cols-2'>
              {/* Distribution Image - Izquierda */}
              {building.distribution_image && (
                <div className='flex items-center justify-center'>
                  <div className='relative h-64 w-full overflow-hidden rounded-2xl sm:h-80 md:h-[750px]'>
                    <img
                      src={building.distribution_image}
                      alt='Distribución del proyecto'
                      className='h-full w-full object-contain'
                    />
                  </div>
                </div>
              )}

              {/* Plan Image SVG interactivo - Derecha */}
              {building.plan_image && (
                <div className='flex items-center justify-center'>
                  <div className='h-64 w-full overflow-hidden rounded-2xl border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-800 sm:h-80 md:h-[750px]'>
                    <InteractiveSVGPlane
                      svgUrl={building.plan_image}
                      departments={departments}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Información debajo de las imágenes */}
            <div className='mt-12 flex flex-col justify-center space-y-4 sm:space-y-6'>
              {building.building_description && (
                <div>
                  <h3 className='mb-2 text-xl font-bold text-zinc-900 dark:text-white sm:mb-3 sm:text-2xl'>
                    Sobre el Proyecto
                  </h3>
                  <p className='text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-base'>
                    {building.building_description}
                  </p>
                </div>
              )}

              {/* Datos del proyecto */}
              <div className='grid grid-cols-2 gap-3 rounded-xl bg-white p-4 dark:bg-zinc-800 sm:gap-4 sm:p-6 md:grid-cols-4'>
                {building.total_floors && (
                  <div>
                    <p className='text-xs text-zinc-600 dark:text-zinc-400 sm:text-sm'>
                      Pisos
                    </p>
                    <p className='text-xl font-bold text-amber-600 dark:text-amber-400 sm:text-2xl'>
                      {building.total_floors}
                    </p>
                  </div>
                )}
                {building.number_garages && (
                  <div>
                    <p className='text-xs text-zinc-600 dark:text-zinc-400 sm:text-sm'>
                      Cocheras
                    </p>
                    <p className='text-xl font-bold text-blue-600 dark:text-blue-400 sm:text-2xl'>
                      {building.number_garages}
                    </p>
                  </div>
                )}
                {building.number_storages && (
                  <div>
                    <p className='text-xs text-zinc-600 dark:text-zinc-400 sm:text-sm'>
                      Bodegas
                    </p>
                    <p className='text-xl font-bold text-emerald-600 dark:text-emerald-400 sm:text-2xl'>
                      {building.number_storages}
                    </p>
                  </div>
                )}
                {building.building_location && (
                  <div>
                    <p className='text-xs text-zinc-600 dark:text-zinc-400 sm:text-sm'>
                      Ubicación
                    </p>
                    <p className='text-sm font-semibold text-zinc-900 dark:text-white sm:text-base'>
                      {building.building_location}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
      <section
        id='departamentos-grid'
        className='px-4 py-12 sm:px-6 md:py-16 lg:py-20'
      >
        <div className='mx-auto max-w-6xl'>
          <div className='mb-8 grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3'>
            {departments.map((dept) => (
              <div
                key={dept.id}
                onClick={() => setSelectedDept(dept)}
                className='group cursor-pointer overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-md transition-all hover:border-amber-400 hover:shadow-2xl dark:border-zinc-800 dark:bg-zinc-900'
              >
                {/* Imagen del Departamento */}
                {dept.prymary_image && (
                  <div className='relative h-48 w-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 sm:h-56 md:h-64'>
                    <img
                      src={dept.prymary_image}
                      alt={dept.name_model_department || 'Departamento'}
                      className='h-full w-full object-cover transition-transform group-hover:scale-110'
                    />
                  </div>
                )}

                {/* Contenido */}
                <div className='p-4 sm:p-6'>
                  {/* Nombre Modelo */}
                  <h3 className='mb-2 text-lg font-bold text-zinc-900 dark:text-white sm:mb-3 sm:text-2xl'>
                    {dept.name_model_department || 'Modelo'}
                  </h3>

                  {/* Información Básica */}
                  <div className='mb-3 space-y-2 border-b border-zinc-200 pb-3 dark:border-zinc-700 sm:mb-4 sm:pb-4'>
                    {dept.base_square_meters && (
                      <p className='text-xs text-zinc-600 dark:text-zinc-400 sm:text-sm'>
                        📏 {dept.base_square_meters} m²
                      </p>
                    )}
                    {dept.balcony && (
                      <p className='text-xs text-amber-600 dark:text-amber-400 sm:text-sm'>
                        ✨ Con Balcón
                      </p>
                    )}
                  </div>

                  {/* Contador de Unidades */}
                  <div className='mb-3 sm:mb-4'>
                    <p className='text-xs font-medium text-zinc-700 dark:text-zinc-300 sm:text-sm'>
                      <span className='text-base font-bold text-amber-600 dark:text-amber-400 sm:text-lg'>
                        {dept.units?.length || 0}
                      </span>{' '}
                      {dept.units?.length === 1 ? 'Unidad' : 'Unidades'}
                    </p>
                  </div>

                  {/* Estados de Unidades */}
                  {dept.units && dept.units.length > 0 && (
                    <div className='mb-3 space-y-1 text-xs sm:mb-4'>
                      {Object.entries(
                        dept.units.reduce(
                          (acc, unit) => {
                            acc[unit.state] = (acc[unit.state] || 0) + 1;
                            return acc;
                          },
                          {} as Record<number, number>
                        )
                      ).map(([state, count]) => (
                        <div
                          key={state}
                          className={`mr-1 inline-block rounded-full px-2 py-1 ${STATE_COLORS[parseInt(state)].color}`}
                        >
                          {count} {STATE_COLORS[parseInt(state)].label}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Botón Ver Detalles */}
                  <button className='w-full rounded-xl bg-amber-500 py-2 text-sm font-semibold text-white transition-all hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 sm:py-3 sm:text-base'>
                    Ver Detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal - Detalles del Departamento */}
      {selectedDept && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm'
          onClick={() => setSelectedDept(null)}
        >
          <div
            className='relative max-h-[95vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 sm:rounded-3xl'
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón Cerrar */}
            <button
              onClick={() => setSelectedDept(null)}
              className='absolute right-3 top-3 z-10 rounded-full bg-black/20 p-2 text-white transition-all hover:bg-black/40 sm:right-6 sm:top-6 sm:p-3'
            >
              <svg
                className='h-5 w-5 sm:h-6 sm:w-6'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>

            {/* Imagen Grande */}
            {selectedDept.prymary_image && (
              <div className='relative h-48 w-full overflow-hidden sm:h-64 md:h-96'>
                <Image
                  src={selectedDept.prymary_image}
                  alt={selectedDept.name_model_department || 'Departamento'}
                  fill
                  className='object-cover'
                />
              </div>
            )}

            {/* Contenido */}
            <div className='p-4 sm:p-6 md:p-8'>
              {/* Título */}
              <h2 className='mb-2 text-2xl font-black text-zinc-900 dark:text-white sm:mb-3 sm:text-3xl md:text-4xl'>
                {selectedDept.name_model_department || 'Modelo'}
              </h2>

              {/* Información Principal */}
              <div className='mb-6 flex flex-wrap gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-700 sm:mb-8 sm:gap-6 sm:pb-8'>
                {selectedDept.base_square_meters && (
                  <div>
                    <p className='text-xs text-zinc-600 dark:text-zinc-400 sm:text-sm'>
                      Superficie Base
                    </p>
                    <p className='text-lg font-bold text-zinc-900 dark:text-white sm:text-2xl'>
                      {selectedDept.base_square_meters} m²
                    </p>
                  </div>
                )}
                {selectedDept.balcony && (
                  <div>
                    <p className='text-xs text-zinc-600 dark:text-zinc-400 sm:text-sm'>
                      Característica
                    </p>
                    <p className='text-lg font-bold text-amber-600 dark:text-amber-400 sm:text-2xl'>
                      Con Balcón
                    </p>
                  </div>
                )}
              </div>

              {/* Características */}
              {selectedDept.features && selectedDept.features.length > 0 && (
                <div className='mb-6 sm:mb-8'>
                  <h3 className='mb-3 text-lg font-bold text-zinc-900 dark:text-white sm:mb-4 sm:text-xl'>
                    Características
                  </h3>
                  <div className='grid grid-cols-1 gap-2 sm:gap-3 md:grid-cols-2'>
                    {selectedDept.features.map((feat) => (
                      <div
                        key={feat.feature.id}
                        className='flex items-center gap-2 rounded-lg bg-amber-50 p-2 dark:bg-amber-900/20 sm:p-3'
                      >
                        <span className='text-amber-600 dark:text-amber-400'>
                          ✓
                        </span>
                        <span className='text-xs text-zinc-900 dark:text-white sm:text-sm'>
                          {feat.feature.dfeatures_name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unidades */}
              {selectedDept.units && selectedDept.units.length > 0 && (
                <div>
                  <h3 className='mb-3 text-lg font-bold text-zinc-900 dark:text-white sm:mb-4 sm:text-xl'>
                    Unidades Disponibles
                  </h3>
                  <div className='space-y-2 overflow-x-auto'>
                    <table className='w-full text-xs sm:text-sm'>
                      <thead>
                        <tr className='border-b border-zinc-200 dark:border-zinc-700'>
                          <th className='px-2 py-2 text-left font-semibold text-zinc-900 dark:text-white sm:px-4'>
                            Unidad
                          </th>
                          <th className='px-2 py-2 text-left font-semibold text-zinc-900 dark:text-white sm:px-4'>
                            Piso
                          </th>
                          <th className='px-2 py-2 text-left font-semibold text-zinc-900 dark:text-white sm:px-4'>
                            m²
                          </th>
                          <th className='px-2 py-2 text-left font-semibold text-zinc-900 dark:text-white sm:px-4'>
                            Estado
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDept.units.map((unit) => (
                          <tr
                            key={unit.id}
                            className='border-b border-zinc-100 dark:border-zinc-800'
                          >
                            <td className='px-2 py-2 text-zinc-900 dark:text-white sm:px-4 sm:py-3'>
                              {unit.unit_number || '-'}
                            </td>
                            <td className='px-2 py-2 text-zinc-900 dark:text-white sm:px-4 sm:py-3'>
                              {unit.floor}
                            </td>
                            <td className='px-2 py-2 text-zinc-900 dark:text-white sm:px-4 sm:py-3'>
                              {unit.real_square_meters || '-'}
                            </td>
                            <td className='px-2 py-2 sm:px-4 sm:py-3'>
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-medium ${STATE_COLORS[unit.state].color}`}
                              >
                                {STATE_COLORS[unit.state].label}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
