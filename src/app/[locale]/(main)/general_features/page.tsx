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
} from '@heroui/react';
import LucideIcon from '@/components/lucide-icon';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllFeaturesAction,
  createFeatureAction,
  deleteFeatureAction,
} from './actions';

export default function GeneralFeaturesPage() {
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [featureName, setFeatureName] = useState('');
  const [roomName, setRoomName] = useState('');

  const { data: features, isLoading } = useQuery({
    queryKey: ['general-features'],
    queryFn: () => getAllFeaturesAction(),
  });

  const createMutation = useMutation({
    mutationFn: () => createFeatureAction(featureName, roomName),
    onSuccess: (res) => {
      if (res.success) {
        addToast({
          title: 'Exito',
          description: 'Caracteristica guardada en el catalogo',
          color: 'success',
        });
        queryClient.invalidateQueries({ queryKey: ['general-features'] });
        onClose();
        setFeatureName('');
        setRoomName('');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFeatureAction(id),
    onSuccess: () => {
      addToast({ title: 'Eliminado', color: 'warning' });
      queryClient.invalidateQueries({ queryKey: ['general-features'] });
    },
  });

  if (isLoading) return <Spinner className='flex h-screen w-full' />;

  return (
    <div className='space-y-6 p-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Catalogo de Caracteristicas</h1>
          <p className='text-small text-default-500'>
            Gestiona las opciones disponibles para los edificios
          </p>
        </div>
        <Button
          color='primary'
          onPress={onOpen}
          startContent={<LucideIcon name='Plus' />}
        >
          Nueva Caracteristica
        </Button>
      </div>

      <Table aria-label='Catalogo de caracteristicas generales'>
        <TableHeader>
          <TableColumn>ID</TableColumn>
          <TableColumn>NOMBRE DE CARACTERISTICA</TableColumn>
          <TableColumn>AMBIENTE / AREA</TableColumn>
          <TableColumn align='center'>ACCIONES</TableColumn>
        </TableHeader>
        <TableBody emptyContent={'No hay caracteristicas creadas'}>
          {(features ?? []).map((f) => (
            <TableRow key={f.id}>
              <TableCell className='text-tiny text-default-400'>
                {f.id}
              </TableCell>
              <TableCell className='font-medium'>{f.name_gfeatures}</TableCell>
              <TableCell>
                {f.room || (
                  <span className='italic text-default-300'>General</span>
                )}
              </TableCell>
              <TableCell>
                <div className='flex justify-center'>
                  <Button
                    isIconOnly
                    color='danger'
                    variant='light'
                    onPress={() => deleteMutation.mutate(f.id)}
                    isLoading={deleteMutation.isPending}
                  >
                    <LucideIcon name='Trash2' />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Modal isOpen={isOpen} onClose={onClose} backdrop='blur'>
        <ModalContent>
          <ModalHeader>Crear nueva caracteristica maestra</ModalHeader>
          <ModalBody className='space-y-4'>
            <p className='text-small text-default-400'>
              Estas caracteristicas podran ser seleccionadas luego al crear o
              editar un edificio.
            </p>
            <Input
              label='Nombre'
              placeholder='Ej: Ceramica'
              value={featureName}
              onValueChange={setFeatureName}
              variant='bordered'
            />
            <Input
              label='Ambiente (Opcional)'
              placeholder='Ej: Baño, Dormitorios'
              value={roomName}
              onValueChange={setRoomName}
              variant='bordered'
            />
          </ModalBody>
          <ModalFooter>
            <Button variant='light' onPress={onClose}>
              Cancelar
            </Button>
            <Button
              color='primary'
              onPress={() => createMutation.mutate()}
              isLoading={createMutation.isPending}
              isDisabled={!featureName}
            >
              Guardar en Catalogo
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
