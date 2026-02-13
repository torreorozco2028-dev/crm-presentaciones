'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import {
  getDepartmentsByBuilding,
  getBuildingInfo,
} from './actions/departments-actions';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Image,
  useDisclosure,
} from '@heroui/react';
import dynamic from 'next/dynamic';
const Carousel = dynamic(() => import('@/components/carousel'), { ssr: false });

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
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [forceModal, setForceModal] = useState(false);
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
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;
    const handleMouseClick = (e: MouseEvent) => {
      const target = e.target as SVGElement;
      const zoneElement = target.closest('[id]') as SVGElement | null;
      if (!zoneElement) return;
      const zoneId = zoneElement.id?.trim();
      const dept = departments.find((d) => String(d.id_plan).trim() === zoneId);
      if (dept) {
        setHoveredZone(zoneId);
        setSelectedZone(zoneId);
        // Aplicar estilos visuales
        zoneElement.style.color = '#ff9900';
        zoneElement.style.opacity = '0.8';
        zoneElement.style.cursor = 'pointer';
        zoneElement.style.transition = 'all 0.3s ease';
      }
    };
    svg.addEventListener('click', handleMouseClick);
    return () => {
      svg.removeEventListener('click', handleMouseClick);
      setSelectedZone(null);
      setHoveredZone(null);
      setTooltipPos(null);
    };
  }, [svgContent, departments]);

  const getHoveredDepartment = (zoneId: string) => {
    return departments.find((dept) => dept.id_plan === zoneId);
  };
  const hoveredDept = hoveredZone ? getHoveredDepartment(hoveredZone) : null;
  const selectedDept = selectedZone ? getHoveredDepartment(selectedZone) : null;
  if (!svgContent) {
    return (
      <div className='flex h-full w-full items-center justify-center bg-zinc-200 dark:bg-zinc-800'>
        <p className='text-zinc-600 dark:text-zinc-400'>Cargando plano...</p>
      </div>
    );
  }
  return (
    <div className='relative h-full w-full'>
      {selectedDept &&
        selectedDept.batch_images &&
        !forceModal &&
        (() => {
          let images: string[] = [];
          const raw = selectedDept.batch_images;
          if (typeof raw === 'string') {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                images = parsed.filter(Boolean) as string[];
              } else if (typeof parsed === 'string') {
                images = [parsed];
              } else {
                images = [];
              }
            } catch {
              if (typeof raw === 'string') {
                images = [raw];
              }
            }
          } else if (Array.isArray(raw)) {
            images = (raw as string[]).filter(Boolean);
          }
          return (
            <div className='modal-enter-backdrop fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white/20 backdrop-blur-xl dark:bg-black/40'>
              <button
                className='modal-close-btn absolute right-5 top-5 z-50 text-4xl text-white transition-all duration-300 hover:rotate-90 hover:text-gray-300'
                onClick={() => {
                  setSelectedZone(null);
                  setHoveredZone(null);
                  setTooltipPos(null);
                  setSvgContent(null); // Forzar rerender del SVG para reiniciar listeners
                  setTimeout(() => setSvgContent(svgContent), 10); // Restaurar SVG tras cerrar modal
                }}
                style={{ zIndex: 201 }}
              >
                &times;
              </button>
              <div className='absolute inset-0 flex items-center justify-center p-4 sm:p-4 md:p-8 lg:p-12'>
                <div className='modal-content-enter w-full max-w-[95vw] sm:h-[85vh] sm:max-w-[95vw] md:h-[90vh] md:max-w-[90vw] lg:h-[90vh] lg:max-w-[80vw]'>
                  {images.length > 0 ? (
                    <Carousel
                      images={images}
                      className='!rounded-none !bg-foreground-50/10 !object-cover !shadow-none'
                      height='h-64 md:h-full'
                    />
                  ) : (
                    <div className='text-xl text-white'>
                      No hay imágenes para mostrar
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

      {/* Modal de prueba forzado */}
      {forceModal &&
        (() => {
          let images: string[] = [];
          console.log('SELECTED DEPT', selectedDept);
          const raw = selectedDept?.batch_images;
          if (typeof raw === 'string') {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                images = parsed.filter(Boolean) as string[];
              } else if (typeof parsed === 'string') {
                images = [parsed];
              } else {
                images = [];
              }
            } catch {
              if (typeof raw === 'string') {
                images = [raw];
              }
            }
          } else if (Array.isArray(raw)) {
            images = (raw as string[]).filter(Boolean);
          }
          return (
            <div className='modal-enter-backdrop fixed inset-0 z-[300] flex flex-col items-center justify-center bg-white/20 backdrop-blur-xl dark:bg-black/40'>
              <button
                className='modal-close-btn absolute right-5 top-5 z-50 text-4xl text-white transition-all duration-300 hover:rotate-90 hover:text-gray-300'
                onClick={() => setForceModal(false)}
                style={{ zIndex: 301 }}
              >
                &times;
              </button>
              <div className='absolute inset-0 flex items-center justify-center p-4 sm:p-4 md:p-8 lg:p-12'>
                <div className='modal-content-enter max-h-64 w-full max-w-[95vw] sm:h-[85vh] sm:max-w-[95vw] md:h-[90vh] md:max-w-[90vw] lg:h-[90vh] lg:max-w-[80vw]'>
                  {images.length > 0 ? (
                    <Carousel
                      images={images}
                      height='h-full'
                      width='w-full'
                      className='!rounded-none !bg-foreground-800 !shadow-none'
                    />
                  ) : (
                    <div className='text-xl text-white'>
                      No hay imágenes para mostrar
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      <style>{`
  /* Animaciones del Modal */
  @keyframes modalBackdropEnter {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes modalContentEnter {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes closeButtonRotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(90deg);
    }
  }

  .modal-enter-backdrop {
    animation: modalBackdropEnter 0.3s ease-out forwards;
  }

  .modal-content-enter {
    animation: modalContentEnter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .modal-close-btn {
    transform-origin: center;
  }

  .modal-close-btn:hover {
    animation: closeButtonRotate 0.3s ease-in-out forwards;
  }

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
    color: rgba(251, 191, 36, 1) !important;
    stroke: rgba(251, 191, 36, 1) !important;
    
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
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
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
    <div className='min-h-screen rounded-xl bg-white dark:bg-zinc-950'>
      <section
        id='departamentos-hero'
        className='relative h-64 w-full overflow-hidden rounded-xl pt-20 sm:h-80 sm:pt-16 md:h-96 md:pt-12 lg:h-screen lg:pt-0'
      >
        {building?.prymary_image && (
          <>
            {isVideo(building.prymary_image) ? (
              <video
                autoPlay
                muted
                loop
                playsInline
                className='absolute inset-0 h-full w-full rounded-xl object-cover'
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
        <div className='absolute inset-0 bg-gradient-to-r from-foreground/60 via-black/50 to-black/40' />
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
                  {/* Imagen Miniatura (Trigger) */}
                  <div
                    className='relative h-64 w-full cursor-zoom-in overflow-hidden rounded-2xl sm:h-80 md:h-[750px]'
                    onClick={onOpen}
                  >
                    <img
                      src={building.distribution_image}
                      alt='Distribución del proyecto'
                      className='h-full w-full object-contain transition-transform duration-300'
                    />
                  </div>
                  <Modal
                    className='animate-in fade-in fixed inset-0 z-[100] flex items-center justify-center overflow-scroll bg-black/90 p-4 duration-200 md:p-10'
                    size='full'
                    isOpen={isOpen}
                    onOpenChange={onOpenChange}
                  >
                    <ModalContent>
                      <ModalHeader></ModalHeader>
                      <ModalBody>
                        <Image src={building.distribution_image} />
                      </ModalBody>
                    </ModalContent>
                  </Modal>
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
    </div>
  );
}
