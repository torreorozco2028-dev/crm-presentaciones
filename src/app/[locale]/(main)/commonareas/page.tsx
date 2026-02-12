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
  AvatarGroup,
  Avatar,
} from '@heroui/react';
import LucideIcon from '@/components/lucide-icon';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBuildingsAction } from '../buildings/actions';
import {
  createCommonAreaAction,
  getCommonAreasByBuildingAction,
  deleteCommonAreaAction,
} from './actions';

export default function CommonAreasPage() {
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [filterBuilding, setFilterBuilding] = useState<string>('');

  const { data: buildings, isLoading: loadingBuildings } = useQuery({
    queryKey: ['buildings-list'],
    queryFn: () => getBuildingsAction(100, 1),
  });

  const { data: areas, isLoading: loadingAreas } = useQuery({
    queryKey: ['common-areas', filterBuilding],
    queryFn: () => getCommonAreasByBuildingAction(filterBuilding),
    enabled: !!filterBuilding,
  });

  const createMutation = useMutation({
    mutationFn: (formData: FormData) => createCommonAreaAction(formData),
    onSuccess: (res) => {
      if (res.success) {
        addToast({
          title: 'Area comun creada',
          description: 'Se registro correctamente',
          color: 'success',
        });
        queryClient.invalidateQueries({ queryKey: ['common-areas'] });
        onClose();
      } else {
        addToast({ title: 'Error', description: res.error, color: 'danger' });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCommonAreaAction(id),
    onSuccess: (res) => {
      if (res.success) {
        addToast({ title: 'area eliminada', color: 'warning' });
        queryClient.invalidateQueries({ queryKey: ['common-areas'] });
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
        <div>
          <h1 className='text-2xl font-bold text-foreground'>
            Areas Comunes
          </h1>
          <p className='text-default-500'>
            Administra los espacios 
          </p>
        </div>
        <Button
          color='primary'
          onPress={onOpen}
          startContent={<LucideIcon name='Plus' />}
        >
          Nueva Area
        </Button>
      </div>

      <div className='max-w-xs'>
        <Select
          label="Filtrar por Edificio"
          placeholder="Selecciona un edificio"
          selectedKeys={filterBuilding ? [filterBuilding] : []}
          onChange={(e) => setFilterBuilding(e.target.value)}
          variant="flat"
        >
          {(buildings ?? []).map((b) => (
            <SelectItem key={b.id} textValue={b.building_title}>
              {b.building_title}
            </SelectItem>
          ))}
        </Select>
      </div>

      <Table aria-label='Lista de areas comunes'>
        <TableHeader>
          <TableColumn>AREA</TableColumn>
          <TableColumn>DESCRIPCION</TableColumn>
          <TableColumn>GALERIA</TableColumn>
          <TableColumn align='center'>ACCIONES</TableColumn>
        </TableHeader>
        <TableBody 
          emptyContent={filterBuilding ? 'No hay areas registradas' : 'Selecciona un edificio para ver sus areas'}
          isLoading={loadingAreas}
          loadingContent={<Spinner size="lg" />}
        >
          {(areas ?? []).map((a) => {
            const images = a.batch_images ? JSON.parse(a.batch_images) : [];
            return (
              <TableRow key={a.id}>
                <TableCell className="font-bold">{a.common_area_name}</TableCell>
                <TableCell className="max-w-md text-default-500">{a.common_area_description}</TableCell>
                <TableCell>
                  <AvatarGroup isBordered max={3} size="sm" total={images.length}>
                    {images.map((img: string, index: number) => (
                      <Avatar key={index} src={img} />
                    ))}
                  </AvatarGroup>
                </TableCell>
                <TableCell>
                  <div className='flex justify-center gap-2'>
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Modal isOpen={isOpen} onClose={onClose} size='2xl' scrollBehavior="inside">
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader>Registrar Nueva area Comun</ModalHeader>
            <ModalBody className='space-y-4'>
              <Select
                name='buildingId'
                label='Edificio'
                isRequired
                variant='bordered'
              >
                {(buildings ?? []).map((b) => (
                  <SelectItem key={b.id} textValue={b.building_title}>
                    {b.building_title}
                  </SelectItem>
                ))}
              </Select>

              <Input
                name='common_area_name'
                label='Nombre del Área'
                placeholder="Ej: Piscina"
                isRequired
                variant='bordered'
              />
              
              <Textarea
                name='common_area_description'
                label='Descripción'
                variant='bordered'
              />

              <div className="rounded-lg border-2 border-dashed border-default-200 p-4">
                <p className='mb-2 text-small font-bold text-default-600'>
                  Fotos del Area
                </p>
                <Input
                  name='batch_images'
                  type='file'
                  accept='image/*'
                  multiple
                  variant="flat"
                  labelPlacement="outside"
                />
                <p className="mt-1 text-tiny text-default-400">
                  Puedes seleccionar varias imágenes a la vez
                </p>
              </div>
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
                Guardar Area
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}