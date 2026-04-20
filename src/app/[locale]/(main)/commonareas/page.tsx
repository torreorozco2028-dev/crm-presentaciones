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
  Chip,
  Card,
  CardBody,
} from '@heroui/react';
import LucideIcon from '@/components/lucide-icon';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBuildingsAction } from '../buildings/actions';
import {
  createCommonAreaAction,
  updateCommonAreaAction,
  getCommonAreasByBuildingAction,
  deleteCommonAreaAction,
} from './actions';
import useUserRole from '@/lib/getUserRole';

function parseBatchImages(batchImages: unknown): string[] {
  if (!batchImages) return [];
  if (Array.isArray(batchImages)) {
    return batchImages.filter((img): img is string => typeof img === 'string');
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
}

export default function CommonAreasPage() {
  const queryClient = useQueryClient();
  const role = useUserRole();
  const isAdmin = role === 'admin';
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [editingArea, setEditingArea] = useState<any | null>(null);

  // Gallery state
  const [currentGalleryImages, setCurrentGalleryImages] = useState<string[]>(
    []
  );
  const [removedGalleryImages, setRemovedGalleryImages] = useState<string[]>(
    []
  );
  const [newBatchCount, setNewBatchCount] = useState(0);
  const [newBatchPreviewUrls, setNewBatchPreviewUrls] = useState<string[]>([]);
  const batchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      newBatchPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newBatchPreviewUrls]);

  const { data: buildings, isLoading: loadingBuildings } = useQuery({
    queryKey: ['buildings-list'],
    queryFn: () => getBuildingsAction(100, 1),
  });

  const { data: areas, isLoading: loadingAreas } = useQuery({
    queryKey: ['common-areas', selectedBuilding],
    queryFn: () => getCommonAreasByBuildingAction(selectedBuilding),
    enabled: !!selectedBuilding,
  });

  const createMutation = useMutation({
    mutationFn: (formData: FormData) => createCommonAreaAction(formData),
    onSuccess: (res) => {
      if (res.success) {
        addToast({ title: 'Área común creada', color: 'success' });
        queryClient.invalidateQueries({ queryKey: ['common-areas'] });
        handleModalClose();
      } else {
        addToast({ title: 'Error', description: res.error, color: 'danger' });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      updateCommonAreaAction(id, formData),
    onSuccess: (res) => {
      if (res.success) {
        addToast({ title: 'Área actualizada', color: 'success' });
        queryClient.invalidateQueries({ queryKey: ['common-areas'] });
        handleModalClose();
      } else {
        addToast({ title: 'Error', description: res.error, color: 'danger' });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCommonAreaAction(id),
    onSuccess: (res) => {
      if (res.success) {
        addToast({ title: 'Área eliminada', color: 'warning' });
        queryClient.invalidateQueries({ queryKey: ['common-areas'] });
      }
    },
  });

  const clearGalleryState = () => {
    newBatchPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    setNewBatchPreviewUrls([]);
    setNewBatchCount(0);
    setCurrentGalleryImages([]);
    setRemovedGalleryImages([]);
    if (batchInputRef.current) batchInputRef.current.value = '';
  };

  const handleModalClose = () => {
    onClose();
    setEditingArea(null);
    clearGalleryState();
  };

  const openCreateModal = () => {
    setEditingArea(null);
    clearGalleryState();
    onOpen();
  };

  const openEditModal = (area: any) => {
    setEditingArea(area);
    setCurrentGalleryImages(parseBatchImages(area.batch_images));
    setRemovedGalleryImages([]);
    setNewBatchCount(0);
    newBatchPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    setNewBatchPreviewUrls([]);
    if (batchInputRef.current) batchInputRef.current.value = '';
    onOpen();
  };

  const removeExistingImage = (url: string) => {
    setCurrentGalleryImages((prev) => prev.filter((img) => img !== url));
    setRemovedGalleryImages((prev) =>
      prev.includes(url) ? prev : [...prev, url]
    );
  };

  const handleBatchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setNewBatchCount(files.length);
    setNewBatchPreviewUrls((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return files.map((f) => URL.createObjectURL(f));
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (editingArea?.id) {
      formData.append(
        'removed_batch_images',
        JSON.stringify(removedGalleryImages)
      );
      formData.append(
        'ordered_existing_batch_images',
        JSON.stringify(currentGalleryImages)
      );
      updateMutation.mutate({ id: editingArea.id, formData });
    } else {
      formData.append('buildingId', selectedBuilding);
      createMutation.mutate(formData);
    }
  };

  return (
    <div className='space-y-6 p-4 sm:p-6 lg:p-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-foreground'>Áreas Comunes</h1>
          <p className='text-default-500'>
            Administra los espacios compartidos
          </p>
        </div>
      </div>

      {/* Building selector */}
      <Card className='border border-default-200 shadow-sm'>
        <CardBody className='space-y-4'>
          <Select
            label='Seleccionar Edificio'
            isLoading={loadingBuildings}
            selectedKeys={selectedBuilding ? [selectedBuilding] : []}
            onSelectionChange={(keys) => {
              const key = Array.from(keys)[0] as string;
              setSelectedBuilding(key ?? '');
            }}
            className='max-w-xs'
          >
            {(buildings ?? []).map((b) => (
              <SelectItem key={b.id} textValue={b.building_title}>
                {b.building_title}
              </SelectItem>
            ))}
          </Select>
        </CardBody>
      </Card>

      {/* Areas list */}
      {selectedBuilding && (
        <Card className='border border-default-200 shadow-sm'>
          <CardBody className='space-y-4'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <h2 className='text-xl font-semibold'>
                Áreas del edificio
                {areas && (
                  <Chip size='sm' variant='flat' className='ml-2'>
                    {areas.length}
                  </Chip>
                )}
              </h2>
              {isAdmin && (
                <Button
                  color='primary'
                  startContent={<LucideIcon name='Plus' size='20' />}
                  onPress={openCreateModal}
                  className='w-full sm:w-auto'
                >
                  Nueva Área
                </Button>
              )}
            </div>

            <div className='hidden overflow-x-auto rounded-xl border border-default-200 lg:block'>
              <Table aria-label='Lista de áreas comunes'>
                <TableHeader>
                  <TableColumn>ÁREA</TableColumn>
                  <TableColumn>DESCRIPCIÓN</TableColumn>
                  <TableColumn>GALERÍA</TableColumn>
                  <TableColumn align='center'>ACCIONES</TableColumn>
                </TableHeader>
                <TableBody
                  emptyContent='No hay áreas registradas para este edificio'
                  isLoading={loadingAreas}
                  loadingContent={<Spinner size='lg' />}
                >
                  {(areas ?? []).map((a) => {
                    const images = parseBatchImages(a.batch_images);
                    return (
                      <TableRow key={a.id}>
                        <TableCell className='font-bold'>
                          {a.common_area_name}
                        </TableCell>
                        <TableCell className='max-w-xs text-default-500'>
                          <span className='line-clamp-2'>
                            {a.common_area_description ?? '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {images.length > 0 ? (
                            <div className='flex gap-1'>
                              {images.slice(0, 4).map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt={`foto ${idx + 1}`}
                                  className='h-9 w-9 rounded-md border border-default-200 object-cover'
                                />
                              ))}
                              {images.length > 4 && (
                                <div className='flex h-9 w-9 items-center justify-center rounded-md border border-default-200 bg-default-100 text-tiny text-default-500'>
                                  +{images.length - 4}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className='text-tiny text-default-400'>
                              Sin fotos
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className='flex justify-center gap-2'>
                            {isAdmin && (
                              <Button
                                isIconOnly
                                size='sm'
                                color='primary'
                                variant='flat'
                                onPress={() => openEditModal(a)}
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
                                onPress={() => deleteMutation.mutate(a.id)}
                                isLoading={deleteMutation.isPending}
                              >
                                <LucideIcon name='Trash2' size='18' />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className='space-y-3 lg:hidden'>
              {loadingAreas && (
                <Card className='border border-default-200'>
                  <CardBody className='flex items-center justify-center py-6'>
                    <Spinner size='sm' />
                  </CardBody>
                </Card>
              )}

              {!loadingAreas && (areas ?? []).length === 0 && (
                <Card className='border border-default-200'>
                  <CardBody className='text-sm text-default-500'>
                    No hay áreas registradas para este edificio
                  </CardBody>
                </Card>
              )}

              {(areas ?? []).map((a) => {
                const images = parseBatchImages(a.batch_images);

                return (
                  <Card key={a.id} className='border border-default-200'>
                    <CardBody className='space-y-3'>
                      <div className='flex items-start justify-between gap-3'>
                        <div>
                          <p className='font-semibold'>{a.common_area_name}</p>
                          <p className='text-sm text-default-500'>
                            {a.common_area_description ?? '-'}
                          </p>
                        </div>
                      </div>

                      <div>
                        {images.length > 0 ? (
                          <div className='flex gap-1'>
                            {images.slice(0, 4).map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`foto ${idx + 1}`}
                                className='h-10 w-10 rounded-md border border-default-200 object-cover'
                              />
                            ))}
                            {images.length > 4 && (
                              <div className='flex h-10 w-10 items-center justify-center rounded-md border border-default-200 bg-default-100 text-tiny text-default-500'>
                                +{images.length - 4}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className='text-sm text-default-400'>
                            Sin fotos
                          </span>
                        )}
                      </div>

                      {isAdmin && (
                        <div className='flex justify-end gap-2'>
                          <Button
                            isIconOnly
                            size='sm'
                            color='primary'
                            variant='flat'
                            onPress={() => openEditModal(a)}
                          >
                            <LucideIcon name='Pencil' size='18' />
                          </Button>
                          <Button
                            isIconOnly
                            size='sm'
                            color='danger'
                            variant='flat'
                            onPress={() => deleteMutation.mutate(a.id)}
                            isLoading={deleteMutation.isPending}
                          >
                            <LucideIcon name='Trash2' size='18' />
                          </Button>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={handleModalClose}
        size='2xl'
        scrollBehavior='inside'
        classNames={{
          base: 'mx-2 my-4 h-[calc(100vh-2rem)] w-[calc(100vw-1rem)] sm:mx-6 sm:w-auto sm:h-[90vh] sm:max-h-[90vh]',
          body: 'py-4',
        }}
      >
        <ModalContent className='h-full'>
          <form
            onSubmit={handleSubmit}
            className='flex h-full flex-col overflow-hidden'
          >
            <ModalHeader>
              {editingArea ? 'Editar Área Común' : 'Nueva Área Común'}
            </ModalHeader>
            <ModalBody className='flex-1 space-y-4 overflow-y-auto'>
              <Input
                name='common_area_name'
                label='Nombre del Área'
                placeholder='Ej: Piscina, Gimnasio...'
                defaultValue={editingArea?.common_area_name ?? ''}
                isRequired
                variant='bordered'
              />

              <Textarea
                name='common_area_description'
                label='Descripción'
                defaultValue={editingArea?.common_area_description ?? ''}
                variant='bordered'
                minRows={3}
              />

              {/* Gallery section */}
              <div className='rounded-lg border border-default-200 p-3'>
                <div className='mb-3 flex items-center justify-between'>
                  <p className='text-small font-semibold text-default-700'>
                    Fotos del Área
                  </p>
                  <Button
                    size='sm'
                    variant='flat'
                    color='primary'
                    onPress={() => batchInputRef.current?.click()}
                    startContent={<LucideIcon name='ImagePlus' size='16' />}
                  >
                    {editingArea ? 'Añadir fotos' : 'Seleccionar fotos'}
                  </Button>
                  <input
                    ref={batchInputRef}
                    name='batch_images'
                    type='file'
                    accept='image/*'
                    multiple
                    onChange={handleBatchChange}
                    className='hidden'
                  />
                </div>

                {/* Existing images in edit mode */}
                {editingArea && currentGalleryImages.length > 0 && (
                  <div className='mb-3'>
                    <p className='mb-2 text-tiny font-medium uppercase tracking-wider text-default-500'>
                      Fotos actuales — clic en ✕ para quitar
                    </p>
                    <div className='grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5'>
                      {currentGalleryImages.map((url, idx) => (
                        <div key={`${url}-${idx}`} className='relative'>
                          <img
                            src={url}
                            alt={`Foto ${idx + 1}`}
                            className='h-16 w-full rounded-md border border-default-200 object-cover'
                          />
                          <button
                            type='button'
                            onClick={() => removeExistingImage(url)}
                            className='absolute right-1 top-1 rounded-full bg-black/70 p-0.5 text-white transition hover:bg-black'
                            aria-label='Quitar foto'
                          >
                            <LucideIcon name='X' size='11' />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {editingArea &&
                  currentGalleryImages.length === 0 &&
                  newBatchCount === 0 && (
                    <div className='flex h-14 items-center justify-center rounded-md border border-dashed border-default-300 text-tiny text-default-400'>
                      Sin fotos — añade nuevas con el botón de arriba
                    </div>
                  )}

                {/* New images preview */}
                {newBatchCount > 0 && (
                  <div className='space-y-2 rounded-md border border-primary/30 bg-primary/5 p-2'>
                    <Chip size='sm' color='primary' variant='flat'>
                      {newBatchCount} foto(s) nueva(s) seleccionada(s)
                    </Chip>
                    {editingArea && (
                      <p className='text-tiny text-default-500'>
                        Se añadirán a las fotos existentes al guardar.
                      </p>
                    )}
                    <div className='grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5'>
                      {newBatchPreviewUrls.map((url, idx) => (
                        <img
                          key={`new-${url}-${idx}`}
                          src={url}
                          alt={`Nueva foto ${idx + 1}`}
                          className='h-16 w-full rounded-md border border-default-200 object-cover'
                        />
                      ))}
                    </div>
                  </div>
                )}

                {!editingArea && newBatchCount === 0 && (
                  <div className='flex h-14 items-center justify-center rounded-md border border-dashed border-default-300 text-tiny text-default-400'>
                    Sin fotos seleccionadas
                  </div>
                )}
              </div>
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
                {editingArea ? 'Guardar Cambios' : 'Crear Área'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
