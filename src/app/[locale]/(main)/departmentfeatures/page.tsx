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
    <div className='w-full space-y-6 p-6'>
      <div className='flex items-center justify-between'>
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
                            onPress={() => deleteMutation.mutate(feature.id)}
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
          )}
        </CardBody>
      </Card>

      {/* Modal Crear/Editar Feature */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            {featureFormData.id ? 'Editar Feature' : 'Crear Nueva Feature'}
          </ModalHeader>
          <ModalBody className='space-y-4'>
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
          <ModalFooter>
            <Button color='default' onPress={onClose}>
              Cancelar
            </Button>
            <Button
              color='primary'
              isLoading={createMutation.isPending}
              onPress={handleCreateFeature}
            >
              {featureFormData.id ? 'Actualizar' : 'Crear'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
