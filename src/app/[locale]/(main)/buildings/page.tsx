'use client';

import React, { useState } from 'react';
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Button, Input, Textarea, Select, SelectItem, Modal, ModalContent, 
  ModalHeader, ModalBody, ModalFooter, useDisclosure, addToast, 
  Spinner, Card, CardBody, Chip
} from '@heroui/react';
import LucideIcon from '@/components/lucide-icon';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getBuildingsAction, 
  createBuildingAction, 
  deleteBuildingAction 
} from './actions';
import { getAllFeaturesAction } from '../general_features/actions';

export default function BuildingsPage() {
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  const { data: buildings, isLoading: loadingBuildings } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => getBuildingsAction(10, 1) 
  });

  const { data: featureCatalog } = useQuery({
    queryKey: ['general-features'],
    queryFn: () => getAllFeaturesAction()
  });

  const createMutation = useMutation({
    mutationFn: (formData: FormData) => createBuildingAction(formData),
    onSuccess: (res) => {
      if (res.success) {
        addToast({ title: "Edificio creado", description: "Se ha registrado correctamente con sus imagenes", color: "success" });
        queryClient.invalidateQueries({ queryKey: ['buildings'] });
        onClose();
        setSelectedFeatures([]);
      } else {
        addToast({ title: "Error", description: res.error, color: "danger" });
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBuildingAction(id),
    onSuccess: (res) => {
      if (res.success) {
        addToast({ title: "Edificio eliminado", color: "warning" });
        queryClient.invalidateQueries({ queryKey: ['buildings'] });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    formData.append('featureIds', JSON.stringify(selectedFeatures));
    
    createMutation.mutate(formData);
  };

  if (loadingBuildings) return <Spinner className="flex h-screen w-full" />;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion de Edificios</h1>
          <p className="text-default-500">Administra tus proyectos inmobiliarios y sus archivos</p>
        </div>
        <Button color="primary" onPress={onOpen} startContent={<LucideIcon name="Plus" />}>
          Nuevo Edificio
        </Button>
      </div>

      <Table aria-label="Lista de edificios">
        <TableHeader>
          <TableColumn>VISTA</TableColumn>
          <TableColumn>EDIFICIO</TableColumn>
          <TableColumn>UBICACION</TableColumn>
          <TableColumn>CARACTERISTICAS</TableColumn>
          <TableColumn>NUMEROGARAGES</TableColumn>
          <TableColumn>NUMEROSTORAGES</TableColumn>
          <TableColumn align="center">ACCIONES</TableColumn>
        </TableHeader>
        <TableBody emptyContent={"No hay edificios registrados"}>
          {(buildings ?? []).map((b) => (
            <TableRow key={b.id}>
              <TableCell>
                <img 
                  src={b.prymary_image || ''} 
                  alt={b.building_title} 
                  className="w-12 h-12 rounded-md object-cover bg-default-100" 
                />
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-bold">{b.building_title}</span>
                  <span className="text-tiny text-default-400">{b.total_floors} Pisos</span>
                </div>
              </TableCell>
              <TableCell>{b.building_location}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {b.buildingToFeatures?.map((rel: any) => (
                    <Chip key={rel.feature.id} size="sm" variant="flat">
                      {rel.feature.name_gfeatures}
                    </Chip>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-bold">{b.number_garages}</span>
                </div>
              </TableCell>
                <TableCell>
                <div className="flex flex-col">
                  <span className="font-bold">{b.number_storages}</span>
                </div>
              </TableCell>
                <TableCell>
                <div className="flex justify-center gap-2">
                    <Button 
                    isIconOnly 
                    size="sm"
                    color="danger" 
                    variant="flat" 
                    onPress={() => deleteMutation.mutate(b.id)}
                    isLoading={deleteMutation.isPending}
                    >
                    <LucideIcon name="Trash2" size="18" /> 
                    </Button>
                </div>
                </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader>Registrar Nuevo Proyecto</ModalHeader>
            <ModalBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input name="building_title" label="Nombre del Edificio" isRequired variant="bordered" />
              <Input name="building_location" label="Ubicación" isRequired variant="bordered" />
              
              <Textarea 
                name="building_description" 
                label="Descripción" 
                className="md:col-span-2" 
                variant="bordered"
              />

              <Input name="total_floors" label="Total Pisos" type="number" variant="bordered" />
              <div className="grid grid-cols-2 gap-2">
                <Input name="number_garages" label="Garajes" type="number" variant="bordered" />
                <Input name="number_storages" label="Depósitos" type="number" variant="bordered" />
              </div>

              <div className="md:col-span-2 border-t pt-4 mt-2">
                <p className="text-small font-bold mb-2">Archivos y Multimedia</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    name="primary_image" 
                    label="Imagen Principal (JPG/PNG)" 
                    type="file" 
                    accept="image/*" 
                    isRequired 
                    labelPlacement="outside"
                  />
                  <Input 
                    name="plan_image" 
                    label="Plano General (SVG/IMG)" 
                    type="file" 
                    accept="image/*" 
                    isRequired 
                    labelPlacement="outside"
                  />
                  <Input 
                    name="batch_images" 
                    label="Galería de Fotos" 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    className="md:col-span-2"
                    labelPlacement="outside"
                  />
                </div>
              </div>

              <div className="md:col-span-2 border-t pt-4">
                <p className="text-small font-bold mb-2">Asociar Características</p>
                <Select
                  label="Selecciona las características"
                  selectionMode="multiple"
                  placeholder="Selecciona una o mas..."
                  selectedKeys={selectedFeatures}
                  onSelectionChange={(keys) => setSelectedFeatures(Array.from(keys) as string[])}
                  variant="bordered"
                >
                  {(featureCatalog ?? []).map((f) => (
                    <SelectItem key={f.id} textValue={f.name_gfeatures}>
                      {f.name_gfeatures} ({f.room || 'General'})
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>Cancelar</Button>
              <Button 
                color="primary" 
                type="submit" 
                isLoading={createMutation.isPending}
              >
                Guardar Edificio
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}