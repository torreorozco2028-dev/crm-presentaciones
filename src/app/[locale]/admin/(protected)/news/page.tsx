'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
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
  Chip,
  Card,
  CardBody,
  Switch,
  Pagination,
} from '@heroui/react';
import LucideIcon from '@/components/lucide-icon';
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { getBuildingsAction } from '../buildings/actions';
import {
  createNewsAction,
  updateNewsAction,
  deleteNewsAction,
  toggleNewsPublishedAction,
  getNewsByBuildingAction,
} from './actions';
import useUserRole from '@/lib/getUserRole';
import { parseImageBatch } from '@/lib/presentation-gallery';
import { newsBodyToText } from '@/lib/news-html';
import { compressImage } from '@/lib/compress-image';
import {
  NEWS_TITLE_COLORS,
  newsTitleClass as newsTitleClassPreview,
  parseNewsTitleColor,
} from '@/lib/news-title-color';
import RichTextEditor from '@/components/rich-text-editor';

type NewsItem = Awaited<
  ReturnType<typeof getNewsByBuildingAction>
>['items'][number];

const today = () => new Date().toISOString().slice(0, 10);

function formatDate(value: string) {
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
}

export default function NewsPage() {
  const queryClient = useQueryClient();
  const role = useUserRole();
  const isAdmin = role === 'admin';
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [showProgress, setShowProgress] = useState(true);
  const [titleColor, setTitleColor] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [page, setPage] = useState(1);
  const [isPreparing, setIsPreparing] = useState(false);

  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [newPreviewUrls, setNewPreviewUrls] = useState<string[]>([]);
  const batchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      newPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newPreviewUrls]);

  const { data: buildings, isLoading: loadingBuildings } = useQuery({
    queryKey: ['buildings-list'],
    queryFn: () => getBuildingsAction(100, 1),
  });

  const { data: newsPage, isLoading: loadingNews } = useQuery({
    queryKey: ['building-news', selectedBuilding, page],
    queryFn: () => getNewsByBuildingAction(selectedBuilding, page),
    enabled: !!selectedBuilding && isAdmin,
    placeholderData: keepPreviousData,
  });
  const news = newsPage?.items;
  const totalPages = newsPage?.totalPages ?? 1;

  // Si se borra la ultima noticia de la ultima pagina, vuelve a una valida.
  useEffect(() => {
    if (newsPage && page > newsPage.totalPages) setPage(newsPage.totalPages);
  }, [newsPage, page]);

  const onMutationResult =
    (okTitle: string, color: 'success' | 'warning' = 'success') =>
    (res: { success: boolean; error?: string; warning?: string }) => {
      if (res.success) {
        addToast({ title: okTitle, color });
        if (res.warning) {
          addToast({
            title: 'Sin miniatura',
            description: res.warning,
            color: 'warning',
          });
        }
        queryClient.invalidateQueries({ queryKey: ['building-news'] });
        handleModalClose();
      } else {
        addToast({ title: 'Error', description: res.error, color: 'danger' });
      }
    };

  const createMutation = useMutation({
    mutationFn: (formData: FormData) => createNewsAction(formData),
    onSuccess: onMutationResult('Noticia creada'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      updateNewsAction(id, formData),
    onSuccess: onMutationResult('Noticia actualizada'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNewsAction(id),
    onSuccess: (res) => {
      if (res.success) {
        addToast({ title: 'Noticia eliminada', color: 'warning' });
        queryClient.invalidateQueries({ queryKey: ['building-news'] });
      } else {
        addToast({ title: 'Error', description: res.error, color: 'danger' });
      }
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) =>
      toggleNewsPublishedAction(id, value),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['building-news'] });
      } else {
        addToast({ title: 'Error', description: res.error, color: 'danger' });
      }
    },
  });

  const clearImageState = () => {
    newPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    setNewPreviewUrls([]);
    setCurrentImages([]);
    setRemovedImages([]);
    if (batchInputRef.current) batchInputRef.current.value = '';
  };

  const handleModalClose = () => {
    onClose();
    setEditing(null);
    clearImageState();
  };

  const openCreateModal = () => {
    setEditing(null);
    clearImageState();
    setIsPublished(false);
    setShowProgress(true);
    setTitleColor('');
    setBodyHtml('');
    onOpen();
  };

  const openEditModal = (item: NewsItem) => {
    clearImageState();
    setEditing(item);
    setIsPublished(item.is_published);
    setShowProgress(item.show_progress);
    setTitleColor(parseNewsTitleColor(item.title_color) ?? '');
    setBodyHtml(item.body ?? '');
    setCurrentImages(parseImageBatch(item.batch_images));
    onOpen();
  };

  const removeExistingImage = (url: string) => {
    setCurrentImages((prev) => prev.filter((img) => img !== url));
    setRemovedImages((prev) => (prev.includes(url) ? prev : [...prev, url]));
  };

  const handleBatchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setNewPreviewUrls((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return files.map((f) => URL.createObjectURL(f));
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set('is_published', String(isPublished));
    formData.set('show_progress', String(showProgress));
    formData.set('title_color', titleColor);

    // Reduce las fotos en el navegador: sube menos peso y carga mas rapido.
    setIsPreparing(true);
    try {
      const files = (formData.getAll('batch_images') as File[]).filter(
        (f) => f.size > 0
      );
      const compressed = await Promise.all(files.map(compressImage));
      formData.delete('batch_images');
      compressed.forEach((file) => formData.append('batch_images', file));

      const thumbnail = formData.get('video_thumbnail');
      if (thumbnail instanceof File && thumbnail.size > 0) {
        formData.set('video_thumbnail', await compressImage(thumbnail));
      }
    } finally {
      setIsPreparing(false);
    }

    if (editing?.id) {
      formData.append('removed_batch_images', JSON.stringify(removedImages));
      formData.append(
        'ordered_existing_batch_images',
        JSON.stringify(currentImages)
      );
      updateMutation.mutate({ id: editing.id, formData });
    } else {
      formData.append('buildingId', selectedBuilding);
      createMutation.mutate(formData);
    }
  };

  if (role && !isAdmin) {
    return (
      <div className='p-8 text-default-500'>
        Solo los administradores pueden gestionar las noticias.
      </div>
    );
  }

  return (
    <div className='space-y-6 p-4 sm:p-6 lg:p-8'>
      <div>
        <h1 className='text-2xl font-bold text-foreground'>Noticias</h1>
        <p className='text-default-500'>
          Publica los avances de obra de tus proyectos
        </p>
      </div>

      <Card className='border border-default-200 shadow-sm'>
        <CardBody>
          <Select
            label='Seleccionar Edificio'
            isLoading={loadingBuildings}
            selectedKeys={selectedBuilding ? [selectedBuilding] : []}
            onSelectionChange={(keys) => {
              setSelectedBuilding((Array.from(keys)[0] as string) ?? '');
              setPage(1);
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

      {selectedBuilding && (
        <Card className='border border-default-200 shadow-sm'>
          <CardBody className='space-y-4'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <h2 className='text-xl font-semibold'>
                Avances de obra
                {newsPage && (
                  <Chip size='sm' variant='flat' className='ml-2'>
                    {newsPage.total}
                  </Chip>
                )}
              </h2>
              <Button
                color='primary'
                startContent={<LucideIcon name='Plus' size='20' />}
                onPress={openCreateModal}
                className='w-full sm:w-auto'
              >
                Nueva Noticia
              </Button>
            </div>

            {loadingNews && (
              <div className='flex justify-center py-6'>
                <Spinner size='lg' />
              </div>
            )}

            {!loadingNews && (news ?? []).length === 0 && (
              <p className='rounded-lg border border-dashed border-default-300 p-6 text-center text-sm text-default-500'>
                Aún no hay noticias para este edificio
              </p>
            )}
            <div className='space-y-3'>
              {(news ?? []).map((item) => {
                const images = parseImageBatch(item.batch_images);
                return (
                  <Card key={item.id} className='border border-default-200'>
                    <CardBody className='space-y-3'>
                      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                        <div className='min-w-0 space-y-1'>
                          <div className='flex flex-wrap items-center gap-2'>
                            <p className='font-semibold'>{item.title}</p>
                            <Chip
                              size='sm'
                              variant='flat'
                              color={item.is_published ? 'success' : 'default'}
                            >
                              {item.is_published ? 'Publicada' : 'Borrador'}
                            </Chip>
                            {item.progress_percent != null && (
                              <Chip size='sm' variant='flat' color='primary'>
                                {item.progress_percent}% de obra
                              </Chip>
                            )}
                            {item.video_url && (
                              <Chip
                                size='sm'
                                variant='flat'
                                startContent={
                                  <LucideIcon name='Youtube' size='14' />
                                }
                              >
                                Video
                              </Chip>
                            )}
                          </div>
                          <p className='text-tiny text-default-400'>
                            {formatDate(item.news_date)}
                          </p>
                          {item.body && (
                            <p className='line-clamp-2 text-sm text-default-500'>
                              {newsBodyToText(item.body)}
                            </p>
                          )}
                        </div>
                        <div className='flex shrink-0 items-center justify-end gap-2'>
                          <Switch
                            size='sm'
                            isSelected={item.is_published}
                            isDisabled={toggleMutation.isPending}
                            onValueChange={(value) =>
                              toggleMutation.mutate({ id: item.id, value })
                            }
                            aria-label='Publicar noticia'
                          />
                          <Button
                            isIconOnly
                            size='sm'
                            color='primary'
                            variant='flat'
                            onPress={() => openEditModal(item)}
                            aria-label='Editar'
                          >
                            <LucideIcon name='Pencil' size='18' />
                          </Button>
                          <Button
                            isIconOnly
                            size='sm'
                            color='danger'
                            variant='flat'
                            onPress={() => {
                              if (window.confirm('¿Eliminar esta noticia?')) {
                                deleteMutation.mutate(item.id);
                              }
                            }}
                            isLoading={deleteMutation.isPending}
                            aria-label='Eliminar'
                          >
                            <LucideIcon name='Trash2' size='18' />
                          </Button>
                        </div>
                      </div>
                      {images.length > 0 && (
                        <div className='flex gap-1'>
                          {images.slice(0, 6).map((img, idx) => (
                            <div
                              key={idx}
                              className='relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-default-200'
                            >
                              <Image
                                src={img}
                                alt={`foto ${idx + 1}`}
                                fill
                                className='object-cover'
                              />
                            </div>
                          ))}
                          {images.length > 6 && (
                            <div className='flex h-10 w-10 items-center justify-center rounded-md border border-default-200 bg-default-100 text-tiny text-default-500'>
                              +{images.length - 6}
                            </div>
                          )}
                        </div>
                      )}
                    </CardBody>
                  </Card>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className='flex justify-center pt-2'>
                <Pagination
                  showControls
                  page={page}
                  total={totalPages}
                  onChange={setPage}
                />
              </div>
            )}
          </CardBody>
        </Card>
      )}
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
              {editing ? 'Editar Noticia' : 'Nueva Noticia'}
            </ModalHeader>
            <ModalBody className='flex-1 space-y-4 overflow-y-auto'>
              <Input
                name='title'
                label='Título'
                placeholder='Ej: Avance de estructura, piso 5'
                defaultValue={editing?.title ?? ''}
                maxLength={150}
                isRequired
                variant='bordered'
              />
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <Input
                  name='news_date'
                  type='date'
                  label='Fecha'
                  defaultValue={editing?.news_date ?? today()}
                  isRequired
                  variant='bordered'
                />
                <Input
                  name='progress_percent'
                  type='number'
                  min={0}
                  max={100}
                  step={1}
                  label='Avance de obra (%)'
                  description='Opcional'
                  defaultValue={
                    editing?.progress_percent != null
                      ? String(editing.progress_percent)
                      : ''
                  }
                  variant='bordered'
                />
              </div>
              <Switch isSelected={showProgress} onValueChange={setShowProgress}>
                Mostrar avance de obra en la landing
              </Switch>

              <div className='space-y-2'>
                <p className='text-small text-default-600'>Color del título</p>
                <div className='flex flex-wrap items-center gap-2'>
                  <button
                    type='button'
                    onClick={() => setTitleColor('')}
                    aria-pressed={titleColor === ''}
                    className={`rounded-full border px-3 py-1 text-tiny ${
                      titleColor === ''
                        ? 'border-primary bg-primary/10'
                        : 'border-default-300'
                    }`}
                  >
                    Por defecto
                  </button>
                  {Object.entries(NEWS_TITLE_COLORS).map(([key, c]) => (
                    <button
                      key={key}
                      type='button'
                      title={c.label}
                      aria-label={c.label}
                      aria-pressed={titleColor === key}
                      onClick={() => setTitleColor(key)}
                      className={`h-7 w-7 rounded-full border-2 ${
                        titleColor === key
                          ? 'border-foreground'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.swatch }}
                    />
                  ))}
                </div>
                <p
                  className={`text-lg font-bold ${newsTitleClassPreview(titleColor)}`}
                >
                  Así se verá el título
                </p>
              </div>

              <RichTextEditor
                name='body'
                label='Detalle del avance'
                defaultValue={editing?.body ?? ''}
                value={bodyHtml}
                onChange={setBodyHtml}
              />

              <Input
                name='video_url'
                type='url'
                label='Link de video (YouTube o TikTok)'
                description='Opcional. Pega el link de un video de YouTube o TikTok.'
                placeholder='https://www.youtube.com/watch?v=...'
                defaultValue={editing?.video_url ?? ''}
                variant='bordered'
              />

              <div>
                <label
                  htmlFor='video_thumbnail'
                  className='mb-1 block text-small font-medium text-default-700'
                >
                  Miniatura del video (opcional)
                </label>
                <input
                  id='video_thumbnail'
                  name='video_thumbnail'
                  type='file'
                  accept='image/*'
                  className='block w-full text-small text-default-600 file:mr-3 file:rounded-lg file:border-0 file:bg-default-100 file:px-3 file:py-2 file:text-small file:font-medium'
                />
                <p className='mt-1 text-tiny text-default-500'>
                  Solo para TikTok. Si no subes ninguna, se intenta obtener
                  automáticamente.
                  {editing?.video_thumbnail_url &&
                    ' Si subes una nueva, reemplaza la actual.'}
                </p>
              </div>

              <div className='rounded-lg border border-default-200 p-3'>
                <div className='mb-3 flex items-center justify-between'>
                  <p className='text-small font-semibold text-default-700'>
                    Fotos del avance
                  </p>
                  <Button
                    size='sm'
                    variant='flat'
                    color='primary'
                    onPress={() => batchInputRef.current?.click()}
                    startContent={<LucideIcon name='ImagePlus' size='16' />}
                  >
                    {editing ? 'Añadir fotos' : 'Seleccionar fotos'}
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

                {currentImages.length > 0 && (
                  <div className='mb-3'>
                    <p className='mb-2 text-tiny font-medium uppercase tracking-wider text-default-500'>
                      Fotos actuales — clic en ✕ para quitar
                    </p>
                    <div className='grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5'>
                      {currentImages.map((url, idx) => (
                        <div
                          key={`${url}-${idx}`}
                          className='relative h-16 w-full overflow-hidden rounded-md border border-default-200'
                        >
                          <Image
                            src={url}
                            alt={`Foto ${idx + 1}`}
                            fill
                            className='object-cover'
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

                {newPreviewUrls.length > 0 && (
                  <div className='space-y-2 rounded-md border border-primary/30 bg-primary/5 p-2'>
                    <Chip size='sm' color='primary' variant='flat'>
                      {newPreviewUrls.length} foto(s) nueva(s) seleccionada(s)
                    </Chip>
                    <div className='grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5'>
                      {newPreviewUrls.map((url, idx) => (
                        <div
                          key={`new-${url}-${idx}`}
                          className='relative h-16 w-full overflow-hidden rounded-md border border-default-200'
                        >
                          <Image
                            src={url}
                            alt={`Nueva foto ${idx + 1}`}
                            fill
                            unoptimized
                            className='object-cover'
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentImages.length === 0 && newPreviewUrls.length === 0 && (
                  <div className='flex h-14 items-center justify-center rounded-md border border-dashed border-default-300 text-tiny text-default-400'>
                    Sin fotos
                  </div>
                )}
              </div>

              <Switch isSelected={isPublished} onValueChange={setIsPublished}>
                Publicar en la landing
              </Switch>
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
                isLoading={
                  isPreparing ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
                className='w-full sm:w-auto'
              >
                {editing ? 'Guardar Cambios' : 'Crear Noticia'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
