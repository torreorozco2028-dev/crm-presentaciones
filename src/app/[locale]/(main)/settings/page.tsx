'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Input,
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Avatar,
  Chip,
  Divider,
  addToast,
  Spinner,
} from '@heroui/react';
import LucideIcon from '@/components/lucide-icon';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { updateUserProfile, getUserProfile } from './actions';
import { useRouter } from 'next/navigation';

export default function Settings() {
  const t = useTranslations('Settings');
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const {
    data: userData,
    isLoading,
    isFetched,
  } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => await getUserProfile(),
    retry: false,
  });

  useEffect(() => {
    if (isFetched && !userData) {
      addToast({
        title: 'Sesión inválida',
        description: 'Reingrese al sistema',
        color: 'danger',
      });
      router.push('/auth/login');
    }
    if (userData) {
      setName(userData.name || '');
    }
  }, [userData, isFetched, router]);

  const { mutate: updateUser, isPending } = useMutation({
    mutationKey: ['update-user'],
    mutationFn: async ({
      data,
      formData,
    }: {
      data: { name?: string; password?: string };
      formData?: FormData;
    }) => {
      const res = await updateUserProfile(data, formData);
      return res;
    },
    onSuccess: () => {
      addToast({
        title: t('notifications.updateSuccess'),
        color: 'success',
      });
      setIsEditing(false);
      setPassword('');
      setConfirmPassword('');
      setSelectedFile(null);
      setAvatarPreview(null);
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      router.refresh();
    },
    onError: (error: Error) => {
      addToast({
        title: t('notifications.updateError'),
        description: error.message,
        color: 'danger',
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancel = () => {
    setName(userData?.name || '');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
    setIsEditing(false);
    setAvatarPreview(null);
    setSelectedFile(null);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (password) {
      if (password.length < 8)
        newErrors.password = t('validation.passwordLength');
      if (password !== confirmPassword)
        newErrors.confirmPassword = t('validation.passwordsMatch');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    const updateData: { name?: string; password?: string } = {};
    if (name !== userData?.name) updateData.name = name;
    if (password) updateData.password = password;

    let formData: FormData | undefined = undefined;
    if (selectedFile) {
      formData = new FormData();
      formData.append('upload', selectedFile);
    }

    if (Object.keys(updateData).length > 0 || formData) {
      updateUser({ data: updateData, formData });
    } else {
      setIsEditing(false);
    }
  };

  if (isLoading) {
    return (
      <div className='flex h-[50vh] w-full flex-col items-center justify-center gap-4'>
        <Spinner size='lg' color='primary' />
        <p className='text-default-500'>{t('loading') || 'Cargando...'}</p>
      </div>
    );
  }

  if (!userData) return null;

  return (
    <div className='container mx-auto px-4 py-8'>
      <Card className='mx-auto max-w-3xl'>
        <CardHeader className='flex items-center justify-between px-6 py-4'>
          <h2 className='text-xl font-bold'>{t('title')}</h2>
          {!isEditing && (
            <Button
              color='primary'
              variant='flat'
              onPress={() => setIsEditing(true)}
              startContent={<LucideIcon name='Pencil' />}
            >
              {t('editProfile')}
            </Button>
          )}
        </CardHeader>

        <Divider />

        <form onSubmit={onSubmit}>
          <CardBody className='space-y-8 p-6'>
            <div className='flex flex-col items-center gap-8 md:flex-row md:items-start'>
              <div className='flex flex-col items-center gap-4'>
                <div className='group relative'>
                  <Avatar
                    src={avatarPreview || userData?.image || undefined}
                    name={userData?.name || 'U'}
                    className='h-32 w-32 cursor-pointer text-large'
                    isBordered
                    color='primary'
                    onClick={() => isEditing && fileInputRef.current?.click()}
                  />
                  {isEditing && (
                    <div
                      className='absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100'
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <LucideIcon name='Camera' /*className="text-white"*/ />
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className='relative'>
                    <Button
                      color='primary'
                      variant='light'
                      size='sm'
                      onPress={() => fileInputRef.current?.click()}
                      startContent={<LucideIcon name='Upload' />}
                    >
                      {t('changeImage')}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type='file'
                      accept='image/*'
                      className='hidden'
                      onChange={handleImageChange}
                    />
                  </div>
                )}
              </div>

              <div className='w-full flex-1 space-y-4'>
                <Input
                  label={t('name')}
                  placeholder='Tu nombre'
                  value={name}
                  onValueChange={setName}
                  isReadOnly={!isEditing}
                  variant={isEditing ? 'bordered' : 'flat'}
                  startContent={<LucideIcon name='User' />}
                />

                <Input
                  label={t('email')}
                  value={userData?.email || ''}
                  isReadOnly
                  variant='flat'
                  description='El correo no puede ser cambiado'
                  startContent={<LucideIcon name='Mail' />}
                />

                <div className='flex items-center gap-3 py-2'>
                  <span className='text-sm font-medium text-default-600'>
                    {t('role')}:
                  </span>
                  <Chip color='primary' variant='dot' className='capitalize'>
                    {userData?.role?.toLowerCase() || 'user'}
                  </Chip>
                </div>

                {isEditing && (
                  <div className='space-y-4 pt-4'>
                    <Divider />
                    <h3 className='text-md font-bold text-default-700'>
                      {t('changePassword')}
                    </h3>

                    <Input
                      label={t('newPassword')}
                      type='password'
                      value={password}
                      onValueChange={(val) => {
                        setPassword(val);
                        setErrors((prev) => ({ ...prev, password: '' }));
                      }}
                      isInvalid={!!errors.password}
                      errorMessage={errors.password}
                      variant='bordered'
                      startContent={<LucideIcon name='Lock' />}
                    />

                    <Input
                      label={t('confirmPassword')}
                      type='password'
                      value={confirmPassword}
                      onValueChange={(val) => {
                        setConfirmPassword(val);
                        setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                      }}
                      isInvalid={!!errors.confirmPassword}
                      errorMessage={errors.confirmPassword}
                      variant='bordered'
                      startContent={<LucideIcon name='Lock' />}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardBody>

          {isEditing && (
            <CardFooter className='flex justify-end gap-3 bg-default-50 px-6 py-4'>
              <Button
                color='danger'
                variant='light'
                onPress={handleCancel}
                isDisabled={isPending}
              >
                {t('cancel')}
              </Button>
              <Button color='primary' type='submit' isLoading={isPending}>
                {t('saveChanges')}
              </Button>
            </CardFooter>
          )}
        </form>
      </Card>
    </div>
  );
}
