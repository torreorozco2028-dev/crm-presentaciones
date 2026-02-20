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
} from '@heroui/react';
import LucideIcon from '@/components/lucide-icon';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBuildingsAction } from '../buildings/actions';
import {
  createPointOfInterestAction,
  getPointsByBuildingAction,
  deletePointOfInterestAction,
} from './actions';

export default function PointsOfInterestPage() {
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [filterBuilding, setFilterBuilding] = useState<string>('');

  const { data: buildings, isLoading: loadingBuildings } = useQuery({
    queryKey: ['buildings-list'],
    queryFn: () => getBuildingsAction(100, 1),
  });

  const { data: points, isLoading: loadingPoints } = useQuery({
    queryKey: ['points-of-interest', filterBuilding],
    queryFn: () => getPointsByBuildingAction(filterBuilding),
    enabled: !!filterBuilding,
  });

  const createMutation = useMutation({
    mutationFn: (formData: FormData) => createPointOfInterestAction(formData),
    onSuccess: (res) => {
      if (res.success) {
        addToast({
          title: 'Punto creado',
          description: 'El punto de interes se ha registrado correctamente',
          color: 'success',
        });
        queryClient.invalidateQueries({ queryKey: ['points-of-interest'] });
        onClose();
      } else {
        addToast({ title: 'Error', description: res.error, color: 'danger' });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePointOfInterestAction(id),
    onSuccess: (res) => {
      if (res.success) {
        addToast({ title: 'Punto eliminado', color: 'warning' });
        queryClient.invalidateQueries({ queryKey: ['points-of-interest'] });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate(formData);
  };

  return (
    <div className='space-y-6 p-8'>
      <div className='flex items-center justify-between'>
        <div></div>
        <Button
          color='primary'
          onPress={onOpen}
          startContent={<LucideIcon name='Plus' />}
        >
          Nuevo Punto
        </Button>
      </div>

      <div className='max-w-xs'>
        <Select
          label='Filtrar por Edificio'
          placeholder='Selecciona un edificio'
          selectedKeys={filterBuilding ? [filterBuilding] : []}
          onChange={(e) => setFilterBuilding(e.target.value)}
          variant='flat'
          isLoading={loadingBuildings}
        >
          {(buildings ?? []).map((b) => (
            <SelectItem key={b.id} textValue={b.building_title}>
              {b.building_title}
            </SelectItem>
          ))}
        </Select>
      </div>

      <Table aria-label='Lista de puntos de interes'>
        <TableHeader>
          <TableColumn>NOMBRE</TableColumn>
          <TableColumn>DESCRIPCIÓN</TableColumn>
          <TableColumn>DISTANCIA (m)</TableColumn>
          <TableColumn>COORDENADAS</TableColumn>
          <TableColumn align='center'>ACCIONES</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={
            filterBuilding
              ? 'No hay puntos registrados'
              : 'Selecciona un edificio para ver sus puntos'
          }
          isLoading={loadingPoints}
          loadingContent={<Spinner size='lg' />}
        >
          {(points ?? []).map((p) => (
            <TableRow key={p.id}>
              <TableCell className='font-medium'>{p.point_name}</TableCell>
              <TableCell className='max-w-xs truncate'>
                {p.point_description}
              </TableCell>
              <TableCell>{p.point_distance} m</TableCell>
              <TableCell>
                <span className='text-tiny text-default-400'>Lat: {p.lat}</span>
                <br />
                <span className='text-tiny text-default-400'>Lon: {p.lon}</span>
              </TableCell>
              <TableCell>
                <div className='flex justify-center gap-2'>
                  <Button
                    isIconOnly
                    size='sm'
                    color='danger'
                    variant='flat'
                    onPress={() => deleteMutation.mutate(p.id)}
                    isLoading={deleteMutation.isPending}
                  >
                    <LucideIcon name='Trash2' size='18' />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Modal isOpen={isOpen} onClose={onClose} size='2xl'>
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader>Registrar Punto de Interes</ModalHeader>
            <ModalBody className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <Select
                name='buildingId'
                label='Asociar a Edificio'
                isRequired
                variant='bordered'
                className='md:col-span-2'
              >
                {(buildings ?? []).map((b) => (
                  <SelectItem key={b.id} textValue={b.building_title}>
                    {b.building_title}
                  </SelectItem>
                ))}
              </Select>

              <Input
                name='point_name'
                label='Nombre del Lugar'
                isRequired
                variant='bordered'
              />
              <Input
                name='point_distance'
                label='Distancia (metros)'
                type='number'
                variant='bordered'
              />

              <Textarea
                name='point_description'
                label='Descripción breve'
                className='md:col-span-2'
                variant='bordered'
              />

              <Input
                name='lat'
                label='Latitud'
                placeholder='-16.5000'
                variant='bordered'
              />
              <Input
                name='lon'
                label='Longitud'
                placeholder='-68.1500'
                variant='bordered'
              />
            </ModalBody>
            <ModalFooter>
              <Button variant='light' onPress={onClose}>
                Cancelar
              </Button>
              <Button
                color='primary'
                type='submit'
                isLoading={createMutation.isPending}
              >
                Guardar Punto
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
