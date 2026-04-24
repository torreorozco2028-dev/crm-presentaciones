'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Input,
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  addToast,
  Spinner,
  Chip,
  Card,
  CardBody,
} from '@heroui/react';
import LucideIcon from '@/components/lucide-icon';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBuildingsAction,
  createBuildingAction,
  updateBuildingAction,
  deleteBuildingAction,
} from './actions';
// import { getAllFeaturesAction } from '../generalfeatures/actions';
import useUserRole from '@/lib/getUserRole';

export default function BuildingsPage() {
  const queryClient = useQueryClient();
  const role = useUserRole();
  const isAdmin = role === 'admin';
  const { isOpen, onOpen, onClose } = useDisclosure();
  // const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [editingBuilding, setEditingBuilding] = useState<any | null>(null);
  const [selectedPrimaryPreviewUrl, setSelectedPrimaryPreviewUrl] =
    useState('');
  const [selectedPlanPreviewUrl, setSelectedPlanPreviewUrl] = useState('');
  const [selectedDistributionPreviewUrl, setSelectedDistributionPreviewUrl] =
    useState('');
  const [selectedBatchCount, setSelectedBatchCount] = useState(0);
  const [selectedBatchPreviewUrls, setSelectedBatchPreviewUrls] = useState<
    string[]
  >([]);
  const [currentGalleryImages, setCurrentGalleryImages] = useState<string[]>(
    []
  );
  const [removedGalleryImages, setRemovedGalleryImages] = useState<string[]>(
    []
  );
  const primaryImageInputRef = useRef<HTMLInputElement>(null);
  const planImageInputRef = useRef<HTMLInputElement>(null);
  const distributionImageInputRef = useRef<HTMLInputElement>(null);
  const batchImagesInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      selectedBatchPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedBatchPreviewUrls]);

  useEffect(() => {
    return () => {
      if (selectedPrimaryPreviewUrl) {
        URL.revokeObjectURL(selectedPrimaryPreviewUrl);
      }
      if (selectedPlanPreviewUrl) {
        URL.revokeObjectURL(selectedPlanPreviewUrl);
      }
      if (selectedDistributionPreviewUrl) {
        URL.revokeObjectURL(selectedDistributionPreviewUrl);
      }
    };
  }, [
    selectedPrimaryPreviewUrl,
    selectedPlanPreviewUrl,
    selectedDistributionPreviewUrl,
  ]);

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

  const { data: buildings, isLoading: loadingBuildings } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => getBuildingsAction(10, 1),
  });

  // const { data: featureCatalog } = useQuery({
  //   queryKey: ['generalfeatures'],
  //   queryFn: () => getAllFeaturesAction(),
  // });

  const createMutation = useMutation({
    mutationFn: (formData: FormData) => createBuildingAction(formData),
    onSuccess: (res) => {
      if (res.success) {
        addToast({
          title: 'Edificio creado',
          description: 'Se ha registrado correctamente con sus imagenes',
          color: 'success',
        });
        queryClient.invalidateQueries({ queryKey: ['buildings'] });
        onClose();
        // setSelectedFeatures([]);
      } else {
        addToast({ title: 'Error', description: res.error, color: 'danger' });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      updateBuildingAction(id, formData),
    onSuccess: (res) => {
      if (res.success) {
        addToast({
          title: 'Edificio actualizado',
          description: 'Los datos se guardaron correctamente',
          color: 'success',
        });
        queryClient.invalidateQueries({ queryKey: ['buildings'] });
        handleModalClose();
      } else {
        addToast({ title: 'Error', description: res.error, color: 'danger' });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBuildingAction(id),
    onSuccess: (res) => {
      if (res.success) {
        addToast({ title: 'Edificio eliminado', color: 'warning' });
        queryClient.invalidateQueries({ queryKey: ['buildings'] });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // formData.append('featureIds', JSON.stringify(selectedFeatures));

    if (editingBuilding?.id) {
      formData.append(
        'removed_batch_images',
        JSON.stringify(removedGalleryImages)
      );
      formData.append(
        'ordered_existing_batch_images',
        JSON.stringify(currentGalleryImages)
      );
      updateMutation.mutate({ id: editingBuilding.id, formData });
      return;
    }

    createMutation.mutate(formData);
  };

  const clearBatchSelection = () => {
    setSelectedBatchPreviewUrls((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return [];
    });
    setSelectedBatchCount(0);
    if (batchImagesInputRef.current) {
      batchImagesInputRef.current.value = '';
    }
  };

  const clearMainImageSelection = () => {
    setSelectedPrimaryPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
    setSelectedPlanPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
    setSelectedDistributionPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
    if (primaryImageInputRef.current) {
      primaryImageInputRef.current.value = '';
    }
    if (planImageInputRef.current) {
      planImageInputRef.current.value = '';
    }
    if (distributionImageInputRef.current) {
      distributionImageInputRef.current.value = '';
    }
  };

  const handlePrimaryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedPrimaryPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : '';
    });
  };

  const handlePlanImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedPlanPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : '';
    });
  };

  const handleDistributionImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    setSelectedDistributionPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : '';
    });
  };

  const handleBatchImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setSelectedBatchCount(files.length);
    setSelectedBatchPreviewUrls((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return files.map((file) => URL.createObjectURL(file));
    });
  };

  const clearGalleryEditState = () => {
    setCurrentGalleryImages([]);
    setRemovedGalleryImages([]);
  };

  const removeExistingGalleryImage = (imageUrl: string) => {
    setCurrentGalleryImages((prev) => prev.filter((img) => img !== imageUrl));
    setRemovedGalleryImages((prev) =>
      prev.includes(imageUrl) ? prev : [...prev, imageUrl]
    );
  };

  const openCreateModal = () => {
    setEditingBuilding(null);
    // setSelectedFeatures([]);
    clearMainImageSelection();
    clearBatchSelection();
    clearGalleryEditState();
    onOpen();
  };

  const openEditModal = (building: any) => {
    setEditingBuilding(building);
    // const currentFeatures = (building.buildingToFeatures ?? [])
    //   .map((rel: any) => rel.feature?.id)
    //   .filter(Boolean);
    // setSelectedFeatures(currentFeatures);
    setCurrentGalleryImages(parseBatchImages(building.batch_images));
    setRemovedGalleryImages([]);
    clearMainImageSelection();
    clearBatchSelection();
    onOpen();
  };

  const handleModalClose = () => {
    onClose();
    setEditingBuilding(null);
    // setSelectedFeatures([]);
    clearMainImageSelection();
    clearBatchSelection();
    clearGalleryEditState();
  };

  if (loadingBuildings) return <Spinner className='flex h-screen w-full' />;

  return (
    <div className='space-y-6 p-4 sm:p-6 lg:p-8'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-foreground'>
            Gestion de Edificios
          </h1>
          <p className='text-default-500'>Administra tus proyectos</p>
        </div>
        {isAdmin && (
          <Button
            color='primary'
            onPress={openCreateModal}
            startContent={<LucideIcon name='Plus' />}
            className='w-full sm:w-auto'
          >
            Nuevo Edificio
          </Button>
        )}
      </div>

      <div className='hidden overflow-x-auto rounded-xl border border-default-200 bg-content1 lg:block'>
        <Table aria-label='Lista de edificios' className='min-w-[980px]'>
          <TableHeader>
            <TableColumn>VISTA</TableColumn>
            <TableColumn>EDIFICIO</TableColumn>
            <TableColumn>UBICACION</TableColumn>
            <TableColumn>MAPA</TableColumn>
            <TableColumn>CARACTERISTICAS</TableColumn>
            <TableColumn>GARAGES</TableColumn>
            <TableColumn>STORAGES</TableColumn>
            <TableColumn align='center'>ACCIONES</TableColumn>
          </TableHeader>
          <TableBody emptyContent={'No hay edificios registrados'}>
            {(buildings ?? []).map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  <img
                    src={b.prymary_image || ''}
                    alt={b.building_title}
                    className='h-10 w-10 rounded-md bg-default-100 object-cover'
                  />
                </TableCell>
                <TableCell>
                  <div className='flex flex-col'>
                    <span className='font-bold'>{b.building_title}</span>
                    <span className='text-tiny text-default-400'>
                      {b.total_floors} Pisos
                    </span>
                  </div>
                </TableCell>
                <TableCell>{b.building_location}</TableCell>
                <TableCell>
                  {b.building_locationURL ? (
                    (() => {
                      const srcMatch =
                        b.building_locationURL.match(/src="([^"]+)"/);
                      const iframeSrc = srcMatch ? srcMatch[1] : null;
                      return iframeSrc ? (
                        <iframe
                          src={iframeSrc}
                          width='160'
                          height='100'
                          loading='lazy'
                          referrerPolicy='no-referrer-when-downgrade'
                          className='rounded-md border border-default-200'
                          style={{ border: 0 }}
                        />
                      ) : (
                        <a
                          href={b.building_locationURL}
                          target='_blank'
                          rel='noreferrer'
                          className='block max-w-[180px] truncate text-primary underline-offset-2 hover:underline'
                        >
                          {b.building_locationURL}
                        </a>
                      );
                    })()
                  ) : (
                    <span className='text-default-400'>-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className='flex max-w-[240px] flex-col gap-1'>
                    {b.building_description && (
                      <p className='line-clamp-2 text-tiny text-default-500'>
                        {b.building_description}
                      </p>
                    )}
                    <div className='flex flex-wrap gap-1'>
                      {b.buildingToFeatures?.map((rel: any) => (
                        <Chip key={rel.feature.id} size='sm' variant='flat'>
                          {rel.feature.name_gfeatures}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className='flex flex-col'>
                    <span className='font-bold'>{b.number_garages}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className='flex flex-col'>
                    <span className='font-bold'>{b.number_storages}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className='flex justify-center gap-2'>
                    {isAdmin && (
                      <Button
                        isIconOnly
                        size='sm'
                        color='primary'
                        variant='flat'
                        onPress={() => openEditModal(b)}
                      >
                        <LucideIcon name='Pencil' size='18' />
                      </Button>
                    )}
                    {isAdmin && (
                      <Button
                        isIconOnly
                        size='sm'
                        color='danger'
                        variant='flat'
                        onPress={() => deleteMutation.mutate(b.id)}
                        isLoading={deleteMutation.isPending}
                      >
                        <LucideIcon name='Trash2' size='18' />
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
        {(buildings ?? []).length === 0 && (
          <Card className='border border-default-200'>
            <CardBody className='text-sm text-default-500'>
              No hay edificios registrados.
            </CardBody>
          </Card>
        )}

        {(buildings ?? []).map((b) => (
          <Card key={b.id} className='border border-default-200'>
            <CardBody className='space-y-3'>
              <div className='flex items-start gap-3'>
                <img
                  src={b.prymary_image || ''}
                  alt={b.building_title}
                  className='h-14 w-14 rounded-md bg-default-100 object-cover'
                />
                <div className='min-w-0 flex-1'>
                  <p className='truncate font-bold'>{b.building_title}</p>
                  <p className='text-xs text-default-500'>
                    {b.total_floors} pisos
                  </p>
                  <p className='mt-1 text-sm text-default-600'>
                    {b.building_location || '-'}
                  </p>
                </div>
              </div>

              {b.building_description && (
                <p className='line-clamp-2 text-sm text-default-500'>
                  {b.building_description}
                </p>
              )}

              {b.building_locationURL && (
                <a
                  href={b.building_locationURL}
                  target='_blank'
                  rel='noreferrer'
                  className='block truncate text-sm text-primary underline-offset-2 hover:underline'
                >
                  Ver ubicación en mapa
                </a>
              )}

              <div className='flex items-center justify-between text-sm'>
                <span className='text-default-600'>
                  Garajes: {b.number_garages}
                </span>
                <span className='text-default-600'>
                  Depósitos: {b.number_storages}
                </span>
              </div>

              {isAdmin && (
                <div className='flex justify-end gap-2'>
                  <Button
                    isIconOnly
                    size='sm'
                    color='primary'
                    variant='flat'
                    onPress={() => openEditModal(b)}
                  >
                    <LucideIcon name='Pencil' size='18' />
                  </Button>
                  <Button
                    isIconOnly
                    size='sm'
                    color='danger'
                    variant='flat'
                    onPress={() => deleteMutation.mutate(b.id)}
                    isLoading={deleteMutation.isPending}
                  >
                    <LucideIcon name='Trash2' size='18' />
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={isOpen}
        onClose={handleModalClose}
        size='5xl'
        scrollBehavior='inside'
        classNames={{
          base: 'mx-2 my-2 h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] sm:mx-6 sm:my-4 sm:h-[calc(100vh-2rem)] lg:mx-auto lg:w-[94vw] lg:!max-w-[1400px] lg:h-[94vh]',
          body: 'py-4 overflow-y-auto',
          header: 'pb-2',
          footer: 'pt-2',
        }}
      >
        <ModalContent className='h-full w-full'>
          <form onSubmit={handleSubmit} className='flex h-full flex-col'>
            <ModalHeader>
              {editingBuilding ? 'Editar Edificio' : 'Registrar Nuevo Proyecto'}
            </ModalHeader>
            <ModalBody className='grid flex-1 grid-cols-1 gap-4 md:grid-cols-2'>
              <Input
                name='building_title'
                label='Nombre del Edificio'
                defaultValue={editingBuilding?.building_title ?? ''}
                isRequired
                variant='bordered'
              />
              <Input
                name='building_location'
                label='Ubicación'
                defaultValue={editingBuilding?.building_location ?? ''}
                isRequired
                variant='bordered'
              />
              <Input
                name='building_locationURL'
                label='Ubicación link'
                defaultValue={editingBuilding?.building_locationURL ?? ''}
                isRequired
                variant='bordered'
              />

              <Textarea
                name='building_description'
                label='Descripción'
                defaultValue={editingBuilding?.building_description ?? ''}
                className='md:col-span-2'
                variant='bordered'
              />

              <Input
                name='total_floors'
                label='Total Pisos'
                type='number'
                defaultValue={String(editingBuilding?.total_floors ?? 0)}
                variant='bordered'
              />
              <div className='grid grid-cols-2 gap-2'>
                <Input
                  name='number_garages'
                  label='Garajes'
                  type='number'
                  defaultValue={String(editingBuilding?.number_garages ?? 0)}
                  variant='bordered'
                />
                <Input
                  name='number_storages'
                  label='Depósitos'
                  type='number'
                  defaultValue={String(editingBuilding?.number_storages ?? 0)}
                  variant='bordered'
                />
              </div>

              <div className='mt-2 border-t pt-4 md:col-span-2'>
                <p className='mb-2 text-small font-bold'>
                  Archivos y Multimedia
                </p>
                {editingBuilding && (
                  <div className='mt-4 space-y-4 rounded-lg border border-default-200 p-3'>
                    <p className='text-small font-semibold text-default-700'>
                      Imágenes actuales
                    </p>
                    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                      <div className='rounded-lg border border-default-200 p-2'>
                        <p className='mb-2 text-tiny font-medium uppercase tracking-wider text-default-500'>
                          Principal
                        </p>
                        <div className='relative'>
                          {editingBuilding?.prymary_image ? (
                            <img
                              src={
                                selectedPrimaryPreviewUrl ||
                                editingBuilding.prymary_image
                              }
                              alt='Imagen principal actual'
                              className='h-24 w-full rounded-md border border-default-200 bg-default-100 object-cover sm:h-28'
                            />
                          ) : (
                            <div className='flex h-24 items-center justify-center rounded-md border border-dashed border-default-300 text-tiny text-default-400 sm:h-28'>
                              Sin imagen principal
                            </div>
                          )}
                          <div className='pointer-events-none absolute inset-x-0 bottom-0 rounded-b-md bg-black/50 px-2 py-1 text-center text-[11px] text-white'>
                            Haz clic para reemplazar
                          </div>
                          <button
                            type='button'
                            className='absolute inset-0 rounded-md'
                            onClick={() =>
                              primaryImageInputRef.current?.click()
                            }
                            aria-label='Reemplazar imagen principal'
                          />
                        </div>
                        {selectedPrimaryPreviewUrl && (
                          <Chip
                            size='sm'
                            color='primary'
                            variant='flat'
                            className='mt-2'
                          >
                            Nueva imagen principal seleccionada
                          </Chip>
                        )}
                        <input
                          ref={primaryImageInputRef}
                          name='primary_image'
                          type='file'
                          accept='image/*'
                          onChange={handlePrimaryImageChange}
                          className='hidden'
                        />
                      </div>
                      <div className='rounded-lg border border-default-200 p-2'>
                        <p className='mb-2 text-tiny font-medium uppercase tracking-wider text-default-500'>
                          Plano
                        </p>
                        <div className='relative'>
                          {editingBuilding?.plan_image ? (
                            <img
                              src={
                                selectedPlanPreviewUrl ||
                                editingBuilding.plan_image
                              }
                              alt='Plano actual'
                              className='h-24 w-full rounded-md border border-default-200 bg-default-100 object-contain sm:h-28'
                            />
                          ) : (
                            <div className='flex h-24 items-center justify-center rounded-md border border-dashed border-default-300 text-tiny text-default-400 sm:h-28'>
                              Sin plano
                            </div>
                          )}
                          <div className='pointer-events-none absolute inset-x-0 bottom-0 rounded-b-md bg-black/50 px-2 py-1 text-center text-[11px] text-white'>
                            Haz clic para reemplazar
                          </div>
                          <button
                            type='button'
                            className='absolute inset-0 rounded-md'
                            onClick={() => planImageInputRef.current?.click()}
                            aria-label='Reemplazar plano'
                          />
                        </div>
                        {selectedPlanPreviewUrl && (
                          <Chip
                            size='sm'
                            color='primary'
                            variant='flat'
                            className='mt-2'
                          >
                            Nuevo plano seleccionado
                          </Chip>
                        )}
                        <input
                          ref={planImageInputRef}
                          name='plan_image'
                          type='file'
                          accept='image/*'
                          onChange={handlePlanImageChange}
                          className='hidden'
                        />
                      </div>
                      <div className='rounded-lg border border-default-200 p-2'>
                        <p className='mb-2 text-tiny font-medium uppercase tracking-wider text-default-500'>
                          Distribución
                        </p>
                        <div className='relative'>
                          {editingBuilding?.distribution_image ||
                          selectedDistributionPreviewUrl ? (
                            <img
                              src={
                                selectedDistributionPreviewUrl ||
                                editingBuilding.distribution_image
                              }
                              alt='Distribución actual'
                              className='h-24 w-full rounded-md border border-default-200 bg-default-100 object-contain sm:h-28'
                            />
                          ) : (
                            <div className='flex h-24 items-center justify-center rounded-md border border-dashed border-default-300 text-tiny text-default-400 sm:h-28'>
                              Sin imagen de distribución
                            </div>
                          )}
                          <div className='pointer-events-none absolute inset-x-0 bottom-0 rounded-b-md bg-black/50 px-2 py-1 text-center text-[11px] text-white'>
                            Haz clic para reemplazar
                          </div>
                          <button
                            type='button'
                            className='absolute inset-0 rounded-md'
                            onClick={() =>
                              distributionImageInputRef.current?.click()
                            }
                            aria-label='Reemplazar imagen de distribución'
                          />
                        </div>
                        {selectedDistributionPreviewUrl && (
                          <Chip
                            size='sm'
                            color='primary'
                            variant='flat'
                            className='mt-2'
                          >
                            Nueva imagen de distribución seleccionada
                          </Chip>
                        )}
                        <input
                          ref={distributionImageInputRef}
                          name='distribution_image'
                          type='file'
                          accept='image/*'
                          onChange={handleDistributionImageChange}
                          className='hidden'
                        />
                      </div>
                    </div>

                    <div>
                      <div className='mb-2 flex items-center justify-between gap-2'>
                        <p className='text-tiny font-medium uppercase tracking-wider text-default-500'>
                          Galería
                        </p>
                        <Button
                          size='sm'
                          variant='flat'
                          color='primary'
                          onPress={() => batchImagesInputRef.current?.click()}
                        >
                          Reemplazar/Añadir fotos
                        </Button>
                        <input
                          ref={batchImagesInputRef}
                          name='batch_images'
                          type='file'
                          accept='image/*'
                          multiple
                          onChange={handleBatchImagesChange}
                          className='hidden'
                        />
                      </div>
                      {selectedBatchCount > 0 && (
                        <div className='space-y-2 rounded-md border border-primary/30 bg-primary/5 p-2'>
                          <Chip size='sm' color='primary' variant='flat'>
                            {selectedBatchCount} imagen(es) nueva(s)
                            seleccionada(s)
                          </Chip>
                          <p className='text-tiny text-default-500'>
                            Al guardar, se agregarán a la galería existente.
                          </p>
                          <div className='grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6'>
                            {selectedBatchPreviewUrls.map((url, idx) => (
                              <img
                                key={`${url}-${idx}`}
                                src={url}
                                alt={`Nueva imagen ${idx + 1}`}
                                className='h-14 w-full rounded-md border border-default-200 bg-default-100 object-cover'
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {currentGalleryImages.length > 0 ? (
                        <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
                          {currentGalleryImages.map((url, idx) => (
                            <div key={`${url}-${idx}`} className='relative'>
                              <img
                                src={url}
                                alt={`Galería actual ${idx + 1}`}
                                className='h-14 w-full rounded-md border border-default-200 bg-default-100 object-cover sm:h-16'
                              />
                              <button
                                type='button'
                                onClick={() => removeExistingGalleryImage(url)}
                                className='absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white transition hover:bg-black'
                                aria-label='Quitar imagen de galería'
                              >
                                <LucideIcon name='X' size='12' />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className='flex h-14 items-center justify-center rounded-md border border-dashed border-default-300 text-tiny text-default-400 sm:h-16'>
                          Sin imágenes de galería
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!editingBuilding && (
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <div className='space-y-2'>
                      <Input
                        name='primary_image'
                        label='Imagen Principal (JPG/PNG)'
                        type='file'
                        accept='image/*'
                        isRequired
                        onChange={handlePrimaryImageChange}
                        labelPlacement='outside'
                      />
                      {selectedPrimaryPreviewUrl && (
                        <img
                          src={selectedPrimaryPreviewUrl}
                          alt='Preview imagen principal'
                          className='h-24 w-full rounded-md border border-default-200 bg-default-100 object-cover sm:h-28'
                        />
                      )}
                    </div>
                    <div className='space-y-2'>
                      <Input
                        name='plan_image'
                        label='Plano General (SVG/IMG)'
                        type='file'
                        accept='image/*'
                        isRequired
                        onChange={handlePlanImageChange}
                        labelPlacement='outside'
                      />
                      {selectedPlanPreviewUrl && (
                        <img
                          src={selectedPlanPreviewUrl}
                          alt='Preview plano'
                          className='h-24 w-full rounded-md border border-default-200 bg-default-100 object-contain sm:h-28'
                        />
                      )}
                    </div>
                    <div className='space-y-2'>
                      <Input
                        name='distribution_image'
                        label='Imagen de Distribución'
                        type='file'
                        accept='image/*'
                        onChange={handleDistributionImageChange}
                        labelPlacement='outside'
                      />
                      {selectedDistributionPreviewUrl && (
                        <img
                          src={selectedDistributionPreviewUrl}
                          alt='Preview distribución'
                          className='h-24 w-full rounded-md border border-default-200 bg-default-100 object-contain sm:h-28'
                        />
                      )}
                    </div>
                    <Input
                      name='batch_images'
                      label='Galería de Fotos'
                      type='file'
                      accept='image/*'
                      multiple
                      onChange={handleBatchImagesChange}
                      className='md:col-span-2'
                      labelPlacement='outside'
                    />
                    {selectedBatchCount > 0 && (
                      <div className='space-y-2 rounded-md border border-primary/30 bg-primary/5 p-2 md:col-span-2'>
                        <Chip size='sm' color='primary' variant='flat'>
                          {selectedBatchCount} imagen(es) seleccionada(s) para
                          galería
                        </Chip>
                        <div className='grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6'>
                          {selectedBatchPreviewUrls.map((url, idx) => (
                            <img
                              key={`${url}-${idx}`}
                              src={url}
                              alt={`Nueva imagen ${idx + 1}`}
                              className='h-14 w-full rounded-md border border-default-200 bg-default-100 object-cover'
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Características generales deshabilitadas temporalmente */}
              {/* <div className='border-t pt-4 md:col-span-2'>
                <p className='mb-2 text-small font-bold'>
                  Asociar Características
                </p>
                <Select
                  label='Selecciona las características'
                  selectionMode='multiple'
                  placeholder='Selecciona una o mas...'
                  selectedKeys={selectedFeatures}
                  onSelectionChange={(keys) =>
                    setSelectedFeatures(Array.from(keys) as string[])
                  }
                  variant='bordered'
                >
                  {(featureCatalog ?? []).map((f) => (
                    <SelectItem key={f.id} textValue={f.name_gfeatures}>
                      {f.name_gfeatures} ({f.room || 'General'})
                    </SelectItem>
                  ))}
                </Select>
              </div> */}
            </ModalBody>
            <ModalFooter className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
              <Button
                variant='light'
                onPress={handleModalClose}
                className='w-full sm:w-auto'
              >
                Cancelar
              </Button>
              <Button
                color='primary'
                type='submit'
                isLoading={createMutation.isPending || updateMutation.isPending}
                className='w-full sm:w-auto'
              >
                {editingBuilding ? 'Guardar Cambios' : 'Guardar Edificio'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
