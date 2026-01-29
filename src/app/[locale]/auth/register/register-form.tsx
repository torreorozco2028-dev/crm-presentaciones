'use client';

import React, { ReactNode, useEffect, useState, useTransition } from 'react';
import { Button, Input, Checkbox, Link, Divider } from '@heroui/react';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema } from '@/schemas';
import { registerUser, verificationToken } from '../_actions/auth-actions';
import toast from 'react-hot-toast';

import { z } from 'zod';
import { useSearchParams, useRouter } from 'next/navigation';
import { FormErrors } from '@/components/form-errors';
import LucideIcon from '@/components/lucide-icon';
import AuthNavBar from '@/components/auth-nav-bar';
import { useTranslations } from 'next-intl';

export default function Component() {
  const t = useTranslations('Auth.register-form');
  const [isVisible, setIsVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [isPending, startTransition] = useTransition();
  const toggleVisibility = () => setIsVisible(!isVisible);
  const toggleConfirmVisibility = () => setIsConfirmVisible(!isConfirmVisible);
  const [allow, setAllow] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signUpSchema),
  });
  const onSubmit = handleSubmit((data) =>
    startTransition(() => {
      toast.promise(registerUser(data as z.infer<typeof signUpSchema>), {
        loading: t('loading'),
        success: (result: any) => {
          router.push('/auth/login');
          return result.success || result.error;
        },
        error: (err) => err.message,
      });
    })
  );
  useEffect(() => {
    if (token) {
      verificationToken(token).then((data) => {
        if (data.success) setAllow(true);
        if (data.error) toast.error(data.error);
      });
    }
  }, [setAllow, token]);

  return (
    <div className='flex h-screen flex-col'>
      <AuthNavBar />
      <div className='flex h-screen w-screen flex-col items-center justify-center'>
        {allow ? (
          <div className='mt-2 flex w-full max-w-sm flex-col gap-4 rounded-large border-1 border-default-100/80 bg-default-50/80 px-8 py-6 shadow-lg'>
            <p className='pb-2 text-center text-xl font-medium'>{t('title')}</p>
            <form className='flex flex-col gap-3' onSubmit={onSubmit}>
              <Input
                isRequired
                label={t('name.label')}
                isDisabled={isPending}
                {...register('name')}
                isInvalid={!!errors.name}
                errorMessage={errors?.name?.message as ReactNode}
                placeholder={t('name.placeholder')}
                type='text'
                // variant='bordered'
              />
              <Input
                isRequired
                label={t('email.label')}
                isDisabled={isPending}
                {...register('email')}
                isInvalid={!!errors.email}
                errorMessage={errors?.email?.message as ReactNode}
                placeholder={t('email.placeholder')}
                type='email'
                // variant='bordered'
              />
              <Input
                isRequired
                endContent={
                  <button type='button' onClick={toggleVisibility}>
                    {isVisible ? (
                      <LucideIcon name='EyeOff' />
                    ) : (
                      <LucideIcon name='Eye' />
                    )}
                  </button>
                }
                label={t('password.label')}
                isDisabled={isPending}
                {...register('password')}
                isInvalid={!!errors.password}
                errorMessage={errors?.password?.message as ReactNode}
                placeholder={t('password.placeholder')}
                type={isVisible ? 'text' : 'password'}
                // variant='bordered'
              />
              <Input
                isRequired
                endContent={
                  <button type='button' onClick={toggleConfirmVisibility}>
                    {isConfirmVisible ? (
                      <LucideIcon name='EyeOff' />
                    ) : (
                      <LucideIcon name='Eye' />
                    )}
                  </button>
                }
                label={t('confirmPassword.label')}
                name='confirmPassword'
                isDisabled={isPending}
                placeholder={t('confirmPassword.placeholder')}
                type={isConfirmVisible ? 'text' : 'password'}
                // variant='bordered'
              />
              <Checkbox
                isDisabled={isPending}
                isRequired
                className='py-4'
                size='sm'
              >
                {t('terms.text')}&nbsp;
                <Link href='#' size='sm'>
                  {t('terms.termsLink')}
                </Link>
                &nbsp; {t('terms.andText')}&nbsp;
                <Link href='#' size='sm'>
                  {t('terms.privacyLink')}
                </Link>
              </Checkbox>
              <Button
                isLoading={isPending}
                isDisabled={isPending}
                color='secondary'
                type='submit'
              >
                {t('signUpButton')}
              </Button>
            </form>
            <div className='flex items-center gap-4'>
              <Divider className='flex-1' />
              <p className='shrink-0 text-tiny text-default-500'>
                {t('orText')}
              </p>
              <Divider className='flex-1' />
            </div>
            <p className='text-center text-small'>
              {t('loginText')}&nbsp;
              <Link href='/auth/login' size='sm'>
                {t('loginLink')}
              </Link>
            </p>
          </div>
        ) : (
          <div className='flex w-full max-w-sm flex-col gap-4 rounded-large bg-background/60 px-8 pb-20 pt-20 shadow-small backdrop-blur-md backdrop-saturate-150 dark:bg-default-100/50'>
            <FormErrors message={t('noPermissions')} />
          </div>
        )}
      </div>
    </div>
  );
}
