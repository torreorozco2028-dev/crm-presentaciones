'use client';

import React, { useState } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  addToast,
  Spinner,
  Card,
  CardBody,
} from '@heroui/react';
import LucideIcon from '@/components/lucide-icon';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useUserRole from '@/lib/getUserRole';
import {
  getAllDepartmentFeaturesAction,
  createDepartmentFeatureAction,
  deleteDepartmentFeatureAction,
} from './actions';

export default function DepartmentFeaturesPage() {
  const queryClient = useQueryClient();
  const role = useUserRole();
  const isAdmin = role === 'admin';
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [featureFormData, setFeatureFormData] = useState<any>({});

  // Queries
  const { data: features, isLoading: loadingFeatures } = useQuery({
    queryKey: ['departmentFeatures'],
    queryFn: () => getAllDepartmentFeaturesAction(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: FormData) => createDepartmentFeatureAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departmentFeatures'] });
      onClose();
      addToast({
        title: 'Éxito',
        description: 'Feature creada exitosamente',
        color: 'success',
      });
      setFeatureFormData({});
    },
    onError: (error: any) => {
      addToast({
        title: 'Error',
        description: error.message || 'Error al crear la feature',
        color: 'danger',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDepartmentFeatureAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departmentFeatures'] });
      addToast({
        title: 'Éxito',
        description: 'Feature eliminada exitosamente',
        color: 'success',
      });
    },
    onError: (error: any) => {
      addToast({
        title: 'Error',
        description: error.message || 'Error al eliminar la feature',
        color: 'danger',
      });
    },
  });

  const handleCreateFeature = async () => {
    const formData = new FormData();
    formData.append('dfeatures_name', featureFormData.dfeatures_name || '');
    formData.append('room', featureFormData.room || '');
    formData.append('order', featureFormData.order || '0');

    createMutation.mutate(formData);
  };

  return (
    <div className='w-full space-y-6 p-4 sm:p-6 lg:p-8'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Features de Departamentos</h1>
          <p className='mt-1 text-sm text-gray-500'>
            Administra las características y acabados disponibles para los
            departamentos
          </p>
        </div>
        {isAdmin && (
          <Button
            color='primary'
            startContent={<LucideIcon icon='Plus' size={20} />}
            className='w-full sm:w-auto'
            onPress={() => {
              setFeatureFormData({});
              onOpen();
            }}
          >
            Nueva Feature
          </Button>
        )}
      </div>

      {/* Features Table */}
      <Card>
        <CardBody>
          {loadingFeatures ? (
            <div className='flex justify-center py-10'>
              <Spinner />
            </div>
          ) : (
            <>
              <div className='hidden lg:block'>
                <Table>
                  <TableHeader>
                    <TableColumn>Nombre</TableColumn>
                    <TableColumn>Área/Espacio</TableColumn>
                    <TableColumn>Orden</TableColumn>
                    <TableColumn>Acciones</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent={'No hay features registradas'}>
                    {(features || []).map((feature: any) => (
                      <TableRow key={feature.id}>
                        <TableCell className='font-medium'>
                          {feature.dfeatures_name}
                        </TableCell>
                        <TableCell>{feature.room || '-'}</TableCell>
                        <TableCell>{feature.order || '-'}</TableCell>
                        <TableCell>
                          <div className='flex gap-2'>
                            {isAdmin && (
                              <Button
                                isIconOnly
                                variant='light'
                                color='warning'
                                onPress={() => {
                                  setFeatureFormData(feature);
                                  onOpen();
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
                                isLoading={deleteMutation.isPending}
                                onPress={() =>
                                  deleteMutation.mutate(feature.id)
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
                {(features || []).length === 0 && (
                  <Card className='border border-default-200'>
                    <CardBody className='text-sm text-default-500'>
                      No hay features registradas
                    </CardBody>
                  </Card>
                )}

                {(features || []).map((feature: any) => (
                  <Card key={feature.id} className='border border-default-200'>
                    <CardBody className='space-y-2'>
                      <p className='font-semibold'>{feature.dfeatures_name}</p>
                      <div className='grid grid-cols-2 gap-2 text-sm'>
                        <span className='text-default-500'>Área/Espacio</span>
                        <span className='text-right'>
                          {feature.room || '-'}
                        </span>
                        <span className='text-default-500'>Orden</span>
                        <span className='text-right'>
                          {feature.order || '-'}
                        </span>
                      </div>

                      {isAdmin && (
                        <div className='flex justify-end gap-2'>
                          <Button
                            isIconOnly
                            variant='light'
                            color='warning'
                            onPress={() => {
                              setFeatureFormData(feature);
                              onOpen();
                            }}
                          >
                            <LucideIcon icon='SquarePen' size={20} />
                          </Button>
                          <Button
                            isIconOnly
                            variant='light'
                            color='danger'
                            isLoading={deleteMutation.isPending}
                            onPress={() => deleteMutation.mutate(feature.id)}
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
        </CardBody>
      </Card>

      {/* Modal Crear/Editar Feature */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        scrollBehavior='inside'
        classNames={{
          base: 'mx-2 my-4 h-[calc(100vh-2rem)] w-[calc(100vw-1rem)] sm:mx-6 sm:w-auto sm:h-[90vh] sm:max-h-[90vh]',
          body: 'py-4',
        }}
      >
        <ModalContent className='h-full'>
          <ModalHeader>
            {featureFormData.id ? 'Editar Feature' : 'Crear Nueva Feature'}
          </ModalHeader>
          <ModalBody className='flex-1 space-y-4 overflow-y-auto'>
            <Input
              label='Nombre de la Feature'
              placeholder='Ej: Aire Acondicionado, Calefacción'
              value={featureFormData.dfeatures_name || ''}
              onValueChange={(value) =>
                setFeatureFormData({
                  ...featureFormData,
                  dfeatures_name: value,
                })
              }
              isRequired
            />
            <Input
              label='Área/Espacio (Opcional)'
              placeholder='Ej: Cocina, Sala, Dormitorio'
              value={featureFormData.room || ''}
              onValueChange={(value) =>
                setFeatureFormData({ ...featureFormData, room: value })
              }
            />
            <Input
              type='number'
              label='Orden de Visualización'
              placeholder='Ej: 1, 2, 3'
              value={featureFormData.order?.toString() || '0'}
              onValueChange={(value) =>
                setFeatureFormData({
                  ...featureFormData,
                  order: parseInt(value) || 0,
                })
              }
            />
          </ModalBody>
          <ModalFooter className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
            <Button
              color='default'
              onPress={onClose}
              className='w-full sm:w-auto'
            >
              Cancelar
            </Button>
            <Button
              color='primary'
              isLoading={createMutation.isPending}
              onPress={handleCreateFeature}
              className='w-full sm:w-auto'
            >
              {featureFormData.id ? 'Actualizar' : 'Crear'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
