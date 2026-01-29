'use client';

import { invite } from '@/app/[locale]/auth/_actions/auth-actions';
import LucideIcon from '@/components/lucide-icon';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Input,
  Modal,
  ModalContent,
  Avatar,
  ModalHeader,
  ModalBody,
  ModalFooter,
  addToast,
} from '@heroui/react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { useMutation } from '@tanstack/react-query';
import {
  useInviteFormValidation,
  InviteFormData,
} from './hooks/use-invite-form-validation';

interface TeamInviteProps {
  isOpen: boolean;
  onOpenChange: () => void;
  onClose: () => void;
}

export default function TeamInvite({
  isOpen,
  onOpenChange,
  onClose,
}: TeamInviteProps) {
  const t = useTranslations('Users.invite');
  const { schema } = useInviteFormValidation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormData>({
    defaultValues: { email: '' },
    resolver: zodResolver(schema),
  });

  const { mutate: inviteUser, isPending } = useMutation({
    mutationKey: ['invite-user'],
    mutationFn: async (email: string) => {
      const response = await invite(email);
      // Si la respuesta trae un error definido por nosotros en la action
      if (response && 'error' in response) {
        throw new Error(response.error as string);
      }
      return response;
    },
    onSuccess: (data: any) => {
      addToast({
        title: t('invite.successTitle'),
        description: data.success || t('invite.successDefault'),
        color: 'success',
      });
      reset({ email: '' });
      onClose();
    },
    onError: (error: Error) => {
      addToast({
        title: t('invite.errorTitle'),
        description: error.message,
        color: 'danger',
      });
    },
  });

  const onSubmit: SubmitHandler<InviteFormData> = (data) => {
    inviteUser(data.email);
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement='top-center'
      isDismissable
      backdrop='blur'
      isKeyboardDismissDisabled={true}
      hideCloseButton={true}
    >
      <ModalContent>
        {(onCloseModal) => (
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader className='flex gap-3'>
              <Avatar src='/logo.png' className='bg-transparent' />
              <div className='flex flex-col'>
                <p className='text-md font-bold'>StructSoft</p>
                <p className='text-small text-default-500'>{t('form.title')}</p>
              </div>
            </ModalHeader>
            <ModalBody>
              <div className='flex flex-col gap-4 pb-4'>
                <Input
                  {...register('email')}
                  size='md'
                  type='email'
                  placeholder='you@example.com'
                  labelPlacement='outside'
                  label={t('form.input.label')}
                  startContent={<LucideIcon name='Mail' />}
                  isInvalid={!!errors.email}
                  color={errors.email ? 'danger' : 'default'}
                  errorMessage={errors.email?.message}
                  isDisabled={isPending}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                onPress={() => {
                  onCloseModal();
                  reset({ email: '' });
                }}
                color='danger'
                variant='light'
                isDisabled={isPending}
              >
                {t('form.closeBtn.label')}
              </Button>
              <Button color='primary' type='submit' isLoading={isPending}>
                {t('form.submitBtn.label')}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
