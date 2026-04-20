'use client';

import React, { useMemo, useState } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Input,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  addToast,
  Spinner,
  Checkbox,
  Card,
  CardBody,
  Chip,
} from '@heroui/react';
import LucideIcon from '@/components/lucide-icon';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getModelsByBuildingAction,
  createDepartmentModelAction,
  updateDepartmentModelAction,
  deleteDepartmentModelAction,
  getUnitsByModelAction,
  createDepartmentUnitAction,
  updateDepartmentUnitAction,
  deleteDepartmentUnitAction,
  getAllDepartmentFeaturesAction,
} from './actions';
import { getBuildingsAction } from '../buildings/actions';
import useUserRole from '@/lib/getUserRole';

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const role = useUserRole();
  const isAdmin = role === 'admin';
  const {
    isOpen: isModelOpen,
    onOpen: onModelOpen,
    onClose: onModelClose,
  } = useDisclosure();
  const {
    isOpen: isUnitsOpen,
    onOpen: onUnitsOpen,
    onClose: onUnitsClose,
  } = useDisclosure();
  const {
    isOpen: isUnitFormOpen,
    onOpen: onUnitFormOpen,
    onClose: onUnitFormClose,
  } = useDisclosure();

  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [modelFormData, setModelFormData] = useState<any>({});
  const [unitFormData, setUnitFormData] = useState<any>({});
  const [primaryImageFile, setPrimaryImageFile] = useState<File | null>(null);
  const [batchImageFiles, setBatchImageFiles] = useState<File[]>([]);
  const [existingBatchImages, setExistingBatchImages] = useState<string[]>([]);
  const [removedBatchImages, setRemovedBatchImages] = useState<string[]>([]);
  const [removePrimaryImage, setRemovePrimaryImage] = useState(false);
  const [featureSearch, setFeatureSearch] = useState('');

  const FEATURE_ROOM_ORDER = [
    'Generales',
    'Dormitorios',
    'Banos',
    'Cocina',
    'Sala',
    'Comedor',
    'Lavanderia',
    'Terraza',
    'Otros',
  ];

  const normalizeRoom = (room?: string | null) => {
    const value = (room || '').trim().toLowerCase();

    if (!value) return 'Otros';
    if (value.includes('general')) return 'Generales';
    if (value.includes('dorm')) return 'Dormitorios';
    if (
      value.includes('ba') ||
      value.includes('bano') ||
      value.includes('bano')
    )
      return 'Banos';
    if (value.includes('cocina')) return 'Cocina';
    if (value.includes('sala') || value.includes('living')) return 'Sala';
    if (value.includes('comedor')) return 'Comedor';
    if (value.includes('lav')) return 'Lavanderia';
    if (value.includes('terraza') || value.includes('balcon')) return 'Terraza';

    return 'Otros';
  };

  const parseBatchImages = (batchImages: unknown): string[] => {
    if (!batchImages) return [];
    if (Array.isArray(batchImages)) {
      return batchImages.filter(
        (img): img is string => typeof img === 'string'
      );
    }
    if (typeof batchImages === 'string') {
      try {
        const parsed = JSON.parse(batchImages);
        return Array.isArray(parsed)
          ? parsed.filter((img): img is string => typeof img === 'string')
          : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // Queries
  const {
    data: buildings,
    isLoading: loadingBuildings,
    error: buildingsError,
  } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => getBuildingsAction(100, 1),
  });

  const {
    data: models,
    isLoading: loadingModels,
    error: modelsError,
  } = useQuery({
    queryKey: ['departmentModels', selectedBuilding],
    queryFn: () =>
      selectedBuilding
        ? getModelsByBuildingAction(selectedBuilding)
        : Promise.resolve([]),
    enabled: !!selectedBuilding,
  });

  const {
    data: units,
    isLoading: loadingUnits,
    error: unitsError,
  } = useQuery({
    queryKey: ['departmentUnits', selectedModel?.id],
    queryFn: () =>
      selectedModel?.id
        ? getUnitsByModelAction(selectedModel.id)
        : Promise.resolve([]),
    enabled: !!selectedModel?.id,
  });

  const { data: features, isLoading: loadingFeatures } = useQuery({
    queryKey: ['departmentFeatures'],
    queryFn: () => getAllDepartmentFeaturesAction(),
  });

  const filteredFeatures = useMemo(() => {
    if (!Array.isArray(features)) return [];
    const search = featureSearch.trim().toLowerCase();
    if (!search) return features;

    return features.filter((feature: any) => {
      const name = (feature.dfeatures_name || '').toLowerCase();
      const room = (feature.room || '').toLowerCase();
      return name.includes(search) || room.includes(search);
    });
  }, [features, featureSearch]);

  const selectedFeatureItems = useMemo(() => {
    if (!Array.isArray(features)) return [];
    return selectedFeatures
      .map((id) => features.find((feature: any) => feature.id === id))
      .filter(Boolean);
  }, [features, selectedFeatures]);

  const availableFeatures = useMemo(() => {
    return filteredFeatures.filter(
      (feature: any) => !selectedFeatures.includes(feature.id)
    );
  }, [filteredFeatures, selectedFeatures]);

  const groupedAvailableFeatures = useMemo(() => {
    const grouped = availableFeatures.reduce(
      (acc: Record<string, any[]>, feature: any) => {
        const group = normalizeRoom(feature.room);
        if (!acc[group]) {
          acc[group] = [];
        }
        acc[group].push(feature);
        return acc;
      },
      {}
    );

    return FEATURE_ROOM_ORDER.filter((group) => grouped[group]?.length > 0).map(
      (group) => ({
        group,
        items: grouped[group].sort((a: any, b: any) => {
          const nameA = (a.dfeatures_name || '').toLowerCase();
          const nameB = (b.dfeatures_name || '').toLowerCase();
          return nameA.localeCompare(nameB);
        }),
      })
    );
  }, [availableFeatures]);

  const addFeature = (featureId: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featureId) ? prev : [...prev, featureId]
    );
  };

  const removeFeature = (featureId: string) => {
    setSelectedFeatures((prev) => prev.filter((id) => id !== featureId));
  };

  const moveFeature = (featureId: string, direction: 'up' | 'down') => {
    setSelectedFeatures((prev) => {
      const index = prev.indexOf(featureId);
      if (index === -1) return prev;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  // Mutations
  const createModelMutation = useMutation({
    mutationFn: (data: FormData) => createDepartmentModelAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['departmentModels', selectedBuilding],
      });
      onModelClose();
      addToast({
        title: 'Éxito',
        description: 'Modelo creado exitosamente',
        color: 'success',
      });
      setModelFormData({});
      setFeatureSearch('');
      setPrimaryImageFile(null);
      setBatchImageFiles([]);
      setExistingBatchImages([]);
      setRemovedBatchImages([]);
      setRemovePrimaryImage(false);
    },
    onError: (error: any) => {
      addToast({ title: 'Error', description: error.message, color: 'danger' });
    },
  });

  const updateModelMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      updateDepartmentModelAction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['departmentModels', selectedBuilding],
      });
      onModelClose();
      addToast({
        title: 'Éxito',
        description: 'Modelo actualizado exitosamente',
        color: 'success',
      });
      setModelFormData({});
      setFeatureSearch('');
      setPrimaryImageFile(null);
      setBatchImageFiles([]);
      setExistingBatchImages([]);
      setRemovedBatchImages([]);
      setRemovePrimaryImage(false);
    },
    onError: (error: any) => {
      addToast({ title: 'Error', description: error.message, color: 'danger' });
    },
  });

  const deleteModelMutation = useMutation({
    mutationFn: (id: string) => deleteDepartmentModelAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['departmentModels', selectedBuilding],
      });
      addToast({
        title: 'Éxito',
        description: 'Modelo eliminado exitosamente',
        color: 'success',
      });
    },
    onError: (error: any) => {
      addToast({ title: 'Error', description: error.message, color: 'danger' });
    },
  });

  const createUnitMutation = useMutation({
    mutationFn: (data: FormData) => createDepartmentUnitAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['departmentUnits', selectedModel?.id],
      });
      onUnitFormClose();
      addToast({
        title: 'Éxito',
        description: 'Unidad creada exitosamente',
        color: 'success',
      });
      setUnitFormData({});
    },
    onError: (error: any) => {
      addToast({ title: 'Error', description: error.message, color: 'danger' });
    },
  });

  const updateUnitMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      updateDepartmentUnitAction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['departmentUnits', selectedModel?.id],
      });
      onUnitFormClose();
      addToast({
        title: 'Éxito',
        description: 'Unidad actualizada exitosamente',
        color: 'success',
      });
      setUnitFormData({});
    },
    onError: (error: any) => {
      addToast({ title: 'Error', description: error.message, color: 'danger' });
    },
  });

  const deleteUnitMutation = useMutation({
    mutationFn: (id: string) => deleteDepartmentUnitAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['departmentUnits', selectedModel?.id],
      });
      addToast({
        title: 'Éxito',
        description: 'Unidad eliminada exitosamente',
        color: 'success',
      });
    },
    onError: (error: any) => {
      addToast({ title: 'Error', description: error.message, color: 'danger' });
    },
  });

  const handleCreateModel = async () => {
    const formData = new FormData();
    formData.append('buildingId', selectedBuilding);
    formData.append(
      'name_model_department',
      modelFormData.name_model_department || ''
    );
    formData.append(
      'base_square_meters',
      modelFormData.base_square_meters || '0'
    );
    formData.append('balcony', modelFormData.balcony ? 'true' : 'false');
    formData.append('id_plan', modelFormData.id_plan || '');
    formData.append('featureIds', JSON.stringify(selectedFeatures));

    if (primaryImageFile) {
      formData.append('primary_image', primaryImageFile);
    }

    batchImageFiles.forEach((file) => {
      formData.append('batch_images', file);
    });

    if (modelFormData.id) {
      formData.append(
        'remove_primary_image',
        removePrimaryImage ? 'true' : 'false'
      );
      formData.append(
        'removed_batch_images',
        JSON.stringify(removedBatchImages)
      );
      formData.append(
        'ordered_existing_batch_images',
        JSON.stringify(existingBatchImages)
      );
      updateModelMutation.mutate({ id: modelFormData.id, data: formData });
    } else {
      createModelMutation.mutate(formData);
    }
  };

  const handleCreateUnit = async () => {
    const formData = new FormData();
    formData.append('buildingId', selectedBuilding);
    formData.append('modelId', selectedModel.id);
    formData.append('unit_number', unitFormData.unit_number || '');
    formData.append('floor', unitFormData.floor?.toString() || '0');
    formData.append(
      'real_square_meters',
      unitFormData.real_square_meters?.toString() || '0'
    );
    formData.append('state', unitFormData.state || '1');

    if (selectedUnit?.id) {
      updateUnitMutation.mutate({ id: selectedUnit.id, data: formData });
    } else {
      createUnitMutation.mutate(formData);
    }
  };

  return (
    <div className='w-full space-y-6 p-4 sm:p-6 lg:p-8'>
      {/* Error handling */}
      {buildingsError && (
        <Card className='border-danger bg-danger-50'>
          <CardBody>
            <p className='text-danger'>
              Error al cargar edificios: {buildingsError.message}
            </p>
          </CardBody>
        </Card>
      )}

      {modelsError && (
        <Card className='border-danger bg-danger-50'>
          <CardBody>
            <p className='text-danger'>
              Error al cargar modelos: {modelsError.message}
            </p>
          </CardBody>
        </Card>
      )}

      {isUnitsOpen && unitsError && (
        <Card className='border-danger bg-danger-50'>
          <CardBody>
            <p className='text-danger'>
              Error al cargar unidades: {unitsError.message}
            </p>
          </CardBody>
        </Card>
      )}

      {/* Selector de Edificio */}
      <Card className='border border-default-200 shadow-sm'>
        <CardBody className='space-y-4'>
          <Select
            label='Seleccionar Edificio'
            isLoading={loadingBuildings}
            selectedKeys={selectedBuilding ? [selectedBuilding] : []}
            onSelectionChange={(keys: any) => {
              const key = Array.from(keys)[0] as string;
              setSelectedBuilding(key);
              setSelectedModel(null);
              onUnitsClose();
            }}
            className='max-w-xs'
          >
            {Array.isArray(buildings) && buildings?.length > 0 ? (
              buildings.map((building: any) => (
                <SelectItem key={building.id}>
                  {building.building_title}
                </SelectItem>
              ))
            ) : (
              <SelectItem key='empty'>No hay edificios disponibles</SelectItem>
            )}
          </Select>
        </CardBody>
      </Card>

      {/* Modelos de Departamentos */}
      {selectedBuilding && (
        <Card className='border border-default-200 shadow-sm'>
          <CardBody className='space-y-4'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <h2 className='text-xl font-semibold'>
                Modelos de Departamentos
              </h2>
              {isAdmin && (
                <Button
                  color='primary'
                  startContent={<LucideIcon icon='Plus' size={20} />}
                  className='w-full sm:w-auto'
                  onPress={() => {
                    setModelFormData({});
                    setSelectedFeatures([]);
                    setFeatureSearch('');
                    setPrimaryImageFile(null);
                    setBatchImageFiles([]);
                    setExistingBatchImages([]);
                    setRemovedBatchImages([]);
                    setRemovePrimaryImage(false);
                    onModelOpen();
                  }}
                >
                  Nuevo Modelo
                </Button>
              )}
            </div>

            {loadingModels ? (
              <Spinner />
            ) : (
              <>
                <div className='hidden overflow-x-auto rounded-xl border border-default-200 lg:block'>
                  <Table>
                    <TableHeader>
                      <TableColumn>Nombre</TableColumn>
                      <TableColumn>Área Base (m²)</TableColumn>
                      <TableColumn>Balcón</TableColumn>
                      <TableColumn>Unidades</TableColumn>
                      <TableColumn>Acciones</TableColumn>
                    </TableHeader>
                    <TableBody emptyContent={'No hay modelos'}>
                      {(models || []).map((model: any) => (
                        <TableRow key={model.id}>
                          <TableCell>{model.name_model_department}</TableCell>
                          <TableCell>{model.base_square_meters}</TableCell>
                          <TableCell>{model.balcony ? 'Sí' : 'No'}</TableCell>
                          <TableCell>
                            <Button
                              isIconOnly
                              variant='light'
                              onPress={() => {
                                setSelectedModel(model);
                                onUnitsOpen();
                              }}
                            >
                              <LucideIcon icon='Eye' size={20} />
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className='flex gap-2'>
                              {isAdmin && (
                                <Button
                                  isIconOnly
                                  variant='light'
                                  className='text-foreground-700 dark:text-foreground-300'
                                  onPress={() => {
                                    setModelFormData(model);
                                    setSelectedFeatures(
                                      model.features?.map((f: any) => f.id) ||
                                        []
                                    );
                                    setFeatureSearch('');
                                    setPrimaryImageFile(null);
                                    setBatchImageFiles([]);
                                    setExistingBatchImages(
                                      parseBatchImages(model.batch_images)
                                    );
                                    setRemovedBatchImages([]);
                                    setRemovePrimaryImage(false);
                                    onModelOpen();
                                  }}
                                >
                                  <LucideIcon icon='SquarePen' size={20} />
                                </Button>
                              )}
                              {isAdmin && (
                                <Button
                                  isIconOnly
                                  variant='light'
                                  color='danger'
                                  onPress={() =>
                                    deleteModelMutation.mutate(model.id)
                                  }
                                >
                                  <LucideIcon icon='Trash2' size={20} />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className='space-y-3 lg:hidden'>
                  {(models || []).length === 0 && (
                    <Card className='border border-default-200'>
                      <CardBody className='text-sm text-default-500'>
                        No hay modelos
                      </CardBody>
                    </Card>
                  )}

                  {(models || []).map((model: any) => (
                    <Card key={model.id} className='border border-default-200'>
                      <CardBody className='space-y-3'>
                        <div>
                          <p className='font-semibold'>
                            {model.name_model_department}
                          </p>
                          <p className='text-sm text-default-500'>
                            Área base: {model.base_square_meters} m²
                          </p>
                          <p className='text-sm text-default-500'>
                            Balcón: {model.balcony ? 'Sí' : 'No'}
                          </p>
                        </div>

                        <div className='flex items-center justify-between'>
                          <Button
                            size='sm'
                            variant='flat'
                            onPress={() => {
                              setSelectedModel(model);
                              onUnitsOpen();
                            }}
                          >
                            Ver unidades
                          </Button>

                          {isAdmin && (
                            <div className='flex gap-2'>
                              <Button
                                isIconOnly
                                variant='light'
                                className='text-foreground-700 dark:text-foreground-300'
                                onPress={() => {
                                  setModelFormData(model);
                                  setSelectedFeatures(
                                    model.features?.map((f: any) => f.id) || []
                                  );
                                  setFeatureSearch('');
                                  setPrimaryImageFile(null);
                                  setBatchImageFiles([]);
                                  setExistingBatchImages(
                                    parseBatchImages(model.batch_images)
                                  );
                                  setRemovedBatchImages([]);
                                  setRemovePrimaryImage(false);
                                  onModelOpen();
                                }}
                              >
                                <LucideIcon icon='SquarePen' size={20} />
                              </Button>
                              <Button
                                isIconOnly
                                variant='light'
                                color='danger'
                                onPress={() =>
                                  deleteModelMutation.mutate(model.id)
                                }
                              >
                                <LucideIcon icon='Trash2' size={20} />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardBody>
        </Card>
      )}

      {/* Modal Unidades del Modelo */}
      <Modal
        isOpen={isUnitsOpen}
        onClose={() => {
          onUnitsClose();
          setSelectedModel(null);
        }}
        size='5xl'
        scrollBehavior='inside'
        classNames={{
          base: 'mx-2 my-4 h-[calc(100vh-2rem)] w-[calc(100vw-1rem)] sm:mx-6 sm:w-auto sm:h-[90vh] sm:max-h-[90vh]',
          body: 'py-4',
        }}
      >
        <ModalContent className='mx-2 h-full sm:mx-6'>
          <ModalHeader className='flex flex-col gap-1'>
            <span className='text-base sm:text-lg'>
              Unidades de{' '}
              {selectedModel?.name_model_department || 'departamento'}
            </span>
            <span className='text-sm font-normal text-foreground-500'>
              Gestiona el inventario por piso, área y estado comercial.
            </span>
          </ModalHeader>
          <ModalBody className='flex-1 space-y-4 overflow-y-auto'>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
              <div className='text-sm text-foreground-500'>
                Total unidades: {Array.isArray(units) ? units.length : 0}
              </div>
              {isAdmin && (
                <Button
                  color='primary'
                  startContent={<LucideIcon icon='Plus' size={18} />}
                  className='w-full sm:w-auto'
                  onPress={() => {
                    setSelectedUnit(null);
                    setUnitFormData({});
                    onUnitFormOpen();
                  }}
                >
                  Nueva Unidad
                </Button>
              )}
            </div>

            {loadingUnits ? (
              <div className='flex justify-center py-8'>
                <Spinner />
              </div>
            ) : (
              <>
                <div className='hidden overflow-x-auto lg:block'>
                  <Table aria-label='Tabla de unidades por modelo'>
                    <TableHeader>
                      <TableColumn>Número</TableColumn>
                      <TableColumn>Piso</TableColumn>
                      <TableColumn>Área Real (m²)</TableColumn>
                      <TableColumn>Estado</TableColumn>
                      <TableColumn>Acciones</TableColumn>
                    </TableHeader>
                    <TableBody emptyContent={'No hay unidades'}>
                      {(units || []).map((unit: any) => (
                        <TableRow key={unit.id}>
                          <TableCell>{unit.unit_number}</TableCell>
                          <TableCell>{unit.floor}</TableCell>
                          <TableCell>{unit.real_square_meters}</TableCell>
                          <TableCell>
                            {unit.state === 1
                              ? '✓ Disponible'
                              : unit.state === 2
                                ? '⏳ Reservado'
                                : '✗ Vendido'}
                          </TableCell>
                          <TableCell>
                            <div className='flex gap-2'>
                              {isAdmin && (
                                <Button
                                  isIconOnly
                                  variant='light'
                                  className='text-foreground-700 dark:text-foreground-300'
                                  onPress={() => {
                                    setSelectedUnit(unit);
                                    setUnitFormData(unit);
                                    onUnitFormOpen();
                                  }}
                                >
                                  <LucideIcon icon='SquarePen' size={20} />
                                </Button>
                              )}
                              {isAdmin && (
                                <Button
                                  isIconOnly
                                  variant='light'
                                  color='danger'
                                  onPress={() =>
                                    deleteUnitMutation.mutate(unit.id)
                                  }
                                >
                                  <LucideIcon icon='Trash2' size={20} />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className='space-y-3 lg:hidden'>
                  {(units || []).length === 0 && (
                    <Card className='border border-default-200'>
                      <CardBody className='text-sm text-default-500'>
                        No hay unidades
                      </CardBody>
                    </Card>
                  )}

                  {(units || []).map((unit: any) => (
                    <Card key={unit.id} className='border border-default-200'>
                      <CardBody className='space-y-2'>
                        <p className='font-semibold'>
                          Unidad {unit.unit_number}
                        </p>
                        <div className='grid grid-cols-2 gap-2 text-sm'>
                          <span className='text-default-500'>Piso</span>
                          <span className='text-right'>{unit.floor}</span>
                          <span className='text-default-500'>Área real</span>
                          <span className='text-right'>
                            {unit.real_square_meters} m²
                          </span>
                          <span className='text-default-500'>Estado</span>
                          <span className='text-right'>
                            {unit.state === 1
                              ? '✓ Disponible'
                              : unit.state === 2
                                ? '⏳ Reservado'
                                : '✗ Vendido'}
                          </span>
                        </div>

                        {isAdmin && (
                          <div className='flex justify-end gap-2'>
                            <Button
                              isIconOnly
                              variant='light'
                              className='text-foreground-700 dark:text-foreground-300'
                              onPress={() => {
                                setSelectedUnit(unit);
                                setUnitFormData(unit);
                                onUnitFormOpen();
                              }}
                            >
                              <LucideIcon icon='SquarePen' size={20} />
                            </Button>
                            <Button
                              isIconOnly
                              variant='light'
                              color='danger'
                              onPress={() => deleteUnitMutation.mutate(unit.id)}
                            >
                              <LucideIcon icon='Trash2' size={20} />
                            </Button>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color='default'
              onPress={() => {
                onUnitsClose();
                setSelectedModel(null);
              }}
            >
              Cerrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Crear/Editar Modelo */}
      <Modal
        isOpen={isModelOpen}
        onClose={onModelClose}
        size='4xl'
        scrollBehavior='inside'
        classNames={{
          base: 'mx-2 my-4 h-[calc(100vh-2rem)] w-[calc(100vw-1rem)] sm:mx-6 sm:w-auto sm:h-[90vh] sm:max-h-[90vh]',
          body: 'py-4',
        }}
      >
        <ModalContent className='mx-2 h-full sm:mx-4'>
          <ModalHeader>
            {modelFormData.id ? 'Editar Modelo' : 'Crear Nuevo Modelo'}
          </ModalHeader>
          <ModalBody className='flex-1 space-y-4 overflow-y-auto'>
            <Input
              label='Nombre del Modelo'
              placeholder='Ej: Apartamento Premium 2H'
              value={modelFormData.name_model_department || ''}
              onValueChange={(value) =>
                setModelFormData({
                  ...modelFormData,
                  name_model_department: value,
                })
              }
            />
            <Input
              type='number'
              label='Área Base (m²)'
              placeholder='Ej: 120'
              value={modelFormData.base_square_meters?.toString() || ''}
              onValueChange={(value) =>
                setModelFormData({
                  ...modelFormData,
                  base_square_meters: parseInt(value),
                })
              }
            />
            <Input
              label='ID Plan'
              placeholder='Identificador del plano'
              value={modelFormData.id_plan || ''}
              onValueChange={(value) =>
                setModelFormData({ ...modelFormData, id_plan: value })
              }
            />
            <Checkbox
              isSelected={modelFormData.balcony || false}
              onValueChange={(value) =>
                setModelFormData({ ...modelFormData, balcony: value })
              }
            >
              Tiene Balcón
            </Checkbox>

            <div className='space-y-2'>
              <label className='block text-sm font-medium'>
                Imagen principal
              </label>
              {modelFormData.id &&
                modelFormData.prymary_image &&
                !removePrimaryImage && (
                  <div className='flex items-center gap-3 rounded-medium border p-2'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={modelFormData.prymary_image}
                      alt='Primary'
                      className='h-16 w-16 rounded object-cover'
                    />
                    <Button
                      size='sm'
                      color='danger'
                      variant='flat'
                      onPress={() => setRemovePrimaryImage(true)}
                    >
                      Quitar imagen actual
                    </Button>
                  </div>
                )}
              {removePrimaryImage && (
                <p className='text-sm text-danger'>
                  La imagen principal actual será eliminada.
                </p>
              )}
              <Input
                type='file'
                accept='image/*'
                label='Subir/Reemplazar imagen principal'
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setPrimaryImageFile(file);
                  if (file) {
                    setRemovePrimaryImage(false);
                  }
                }}
              />
              {primaryImageFile && (
                <p className='text-sm text-foreground-500'>
                  Nueva imagen: {primaryImageFile.name}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <label className='block text-sm font-medium'>
                Imágenes de galería (batch)
              </label>
              {existingBatchImages.length > 0 && (
                <div className='grid grid-cols-2 gap-2 md:grid-cols-3'>
                  {existingBatchImages.map((imgUrl, index) => (
                    <div key={imgUrl} className='rounded-medium border p-2'>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgUrl}
                        alt='Batch'
                        className='h-20 w-full rounded object-cover'
                      />
                      <div className='mt-2 flex flex-col gap-2'>
                        <Button
                          size='sm'
                          variant='flat'
                          color='primary'
                          isDisabled={index === 0}
                          onPress={() => {
                            setExistingBatchImages((prev) => [
                              imgUrl,
                              ...prev.filter((url) => url !== imgUrl),
                            ]);
                          }}
                        >
                          {index === 0
                            ? 'Imagen principal del batch'
                            : 'Poner primero'}
                        </Button>
                        <Button
                          size='sm'
                          color='danger'
                          variant='flat'
                          className='w-full'
                          onPress={() => {
                            setExistingBatchImages((prev) =>
                              prev.filter((url) => url !== imgUrl)
                            );
                            setRemovedBatchImages((prev) =>
                              prev.includes(imgUrl) ? prev : [...prev, imgUrl]
                            );
                          }}
                        >
                          Quitar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Input
                type='file'
                accept='image/*'
                label='Agregar nuevas imágenes a galería'
                multiple
                onChange={(event) => {
                  const files = Array.from(event.target.files || []);
                  setBatchImageFiles(files);
                }}
              />

              {batchImageFiles.length > 0 && (
                <div className='rounded-medium border p-2 text-sm text-foreground-500'>
                  {batchImageFiles.length} imagen(es) nuevas seleccionadas.
                </div>
              )}
            </div>

            <div className='rounded-xl border border-default-200 bg-content2/30 p-4'>
              <div className='mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <label className='block text-sm font-semibold'>
                    Features del Departamento
                  </label>
                  <p className='text-xs text-foreground-500'>
                    Selecciona y ordena las features para este modelo.
                  </p>
                </div>
                <div className='flex items-center gap-2 text-xs'>
                  <Chip size='sm' color='primary' variant='flat'>
                    {selectedFeatures.length} seleccionada(s)
                  </Chip>
                  <Button
                    size='sm'
                    variant='light'
                    onPress={() => {
                      setSelectedFeatures([]);
                      setFeatureSearch('');
                    }}
                  >
                    Limpiar
                  </Button>
                </div>
              </div>

              <Input
                size='sm'
                value={featureSearch}
                onValueChange={setFeatureSearch}
                placeholder='Buscar feature por nombre o ambiente'
                className='mb-3'
                startContent={<LucideIcon icon='Search' size={16} />}
              />

              <div className='grid gap-3 lg:grid-cols-2'>
                <div className='rounded-lg border border-default-200 bg-content1 p-3'>
                  <div className='mb-2 text-sm font-medium'>Disponibles</div>
                  <div className='max-h-64 space-y-2 overflow-y-auto pr-1'>
                    {loadingFeatures ? (
                      <p className='text-sm text-foreground-500'>
                        Cargando features...
                      </p>
                    ) : groupedAvailableFeatures.length > 0 ? (
                      groupedAvailableFeatures.map((section) => (
                        <div key={section.group} className='space-y-2'>
                          <div className='sticky top-0 z-10 rounded-md bg-content2 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-foreground-600'>
                            {section.group}
                          </div>
                          {section.items.map((feature: any) => (
                            <div
                              key={feature.id}
                              className='flex items-center justify-between rounded-md border border-default-200 px-3 py-2'
                            >
                              <div className='min-w-0'>
                                <p className='truncate text-sm font-medium'>
                                  {feature.dfeatures_name}
                                </p>
                                <p className='truncate text-xs text-foreground-500'>
                                  {normalizeRoom(feature.room)}
                                </p>
                              </div>
                              <Button
                                size='sm'
                                color='primary'
                                variant='flat'
                                onPress={() => addFeature(feature.id)}
                              >
                                Agregar
                              </Button>
                            </div>
                          ))}
                        </div>
                      ))
                    ) : (
                      <p className='text-sm text-foreground-500'>
                        No hay features disponibles para el filtro.
                      </p>
                    )}
                  </div>
                </div>

                <div className='rounded-lg border border-default-200 bg-content1 p-3'>
                  <div className='mb-2 text-sm font-medium'>
                    Seleccionadas (orden final)
                  </div>
                  <div className='max-h-64 space-y-2 overflow-y-auto pr-1'>
                    {selectedFeatureItems.length > 0 ? (
                      selectedFeatureItems.map((feature: any, index) => (
                        <div
                          key={feature.id}
                          className='flex items-center justify-between rounded-md border border-primary-200 bg-primary-50/40 px-3 py-2 dark:border-primary-700/40 dark:bg-primary-900/10'
                        >
                          <div className='min-w-0'>
                            <p className='truncate text-sm font-medium'>
                              {index + 1}. {feature.dfeatures_name}
                            </p>
                            <p className='truncate text-xs text-foreground-500'>
                              {feature.room || 'Sin ambiente'}
                            </p>
                          </div>
                          <div className='flex items-center gap-1'>
                            <Button
                              isIconOnly
                              size='sm'
                              variant='light'
                              isDisabled={index === 0}
                              onPress={() => moveFeature(feature.id, 'up')}
                            >
                              <LucideIcon icon='ChevronUp' size={16} />
                            </Button>
                            <Button
                              isIconOnly
                              size='sm'
                              variant='light'
                              isDisabled={
                                index === selectedFeatureItems.length - 1
                              }
                              onPress={() => moveFeature(feature.id, 'down')}
                            >
                              <LucideIcon icon='ChevronDown' size={16} />
                            </Button>
                            <Button
                              isIconOnly
                              size='sm'
                              color='danger'
                              variant='flat'
                              onPress={() => removeFeature(feature.id)}
                            >
                              <LucideIcon icon='X' size={16} />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className='text-sm text-foreground-500'>
                        Aun no seleccionaste features para este modelo.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
            <Button
              color='default'
              onPress={onModelClose}
              className='w-full sm:w-auto'
            >
              Cancelar
            </Button>
            <Button
              color='primary'
              isLoading={
                createModelMutation.isPending || updateModelMutation.isPending
              }
              onPress={handleCreateModel}
              className='w-full sm:w-auto'
            >
              {modelFormData.id ? 'Actualizar' : 'Crear'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Crear/Editar Unidad */}
      <Modal
        isOpen={isUnitFormOpen}
        onClose={onUnitFormClose}
        scrollBehavior='inside'
        classNames={{
          base: 'mx-2 my-4 h-[calc(100vh-2rem)] w-[calc(100vw-1rem)] sm:mx-6 sm:w-auto sm:h-[90vh] sm:max-h-[90vh]',
          body: 'py-4',
        }}
      >
        <ModalContent className='h-full'>
          <ModalHeader>
            {selectedUnit?.id ? 'Editar Unidad' : 'Crear Nueva Unidad'}
          </ModalHeader>
          <ModalBody className='flex-1 space-y-4 overflow-y-auto'>
            <Input
              label='Número de Unidad'
              placeholder='Ej: 101, 201'
              value={unitFormData.unit_number || ''}
              onValueChange={(value) =>
                setUnitFormData({ ...unitFormData, unit_number: value })
              }
            />
            <Input
              type='number'
              label='Piso'
              placeholder='Ej: 1'
              value={unitFormData.floor?.toString() || ''}
              onValueChange={(value) =>
                setUnitFormData({ ...unitFormData, floor: parseInt(value) })
              }
            />
            <Input
              type='number'
              label='Área Real (m²)'
              placeholder='Ej: 125.5'
              value={unitFormData.real_square_meters?.toString() || ''}
              onValueChange={(value) =>
                setUnitFormData({
                  ...unitFormData,
                  real_square_meters: parseFloat(value),
                })
              }
            />
            <Select
              label='Estado'
              selectedKeys={[unitFormData.state?.toString() || '1']}
              onSelectionChange={(keys: any) => {
                const key = Array.from(keys)[0];
                setUnitFormData({
                  ...unitFormData,
                  state: parseInt(key as string),
                });
              }}
            >
              <SelectItem key='1'>✓ Disponible</SelectItem>
              <SelectItem key='2'>⏳ Reservado</SelectItem>
              <SelectItem key='3'>✗ Vendido</SelectItem>
            </Select>
          </ModalBody>
          <ModalFooter className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
            <Button
              color='default'
              onPress={onUnitFormClose}
              className='w-full sm:w-auto'
            >
              Cancelar
            </Button>
            <Button
              color='primary'
              isLoading={
                createUnitMutation.isPending || updateUnitMutation.isPending
              }
              onPress={handleCreateUnit}
              className='w-full sm:w-auto'
            >
              {selectedUnit?.id ? 'Actualizar' : 'Crear'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
