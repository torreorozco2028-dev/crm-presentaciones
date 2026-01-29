'use client';

import React, { ReactNode, useState, useTransition } from 'react';
import { Button, Input } from '@heroui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema } from '@/schemas';
import { z } from 'zod';
import { login } from '../_actions/auth-actions';
import { FormErrors } from '@/components/form-errors';
import AuthNavBar from '@/components/auth-nav-bar';
import LucideIcon from '@/components/lucide-icon';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function Component() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const [error, setError] = useState<string | undefined>('');
  const [isVisible, setIsVisible] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const toggleVisibility = () => setIsVisible(!isVisible);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signInSchema),
  });
  const onSubmit = handleSubmit(async (data) =>
    startTransition(async () => {
      try {
        await login(data as z.infer<typeof signInSchema>);

        router.push('/users');
      } catch (error) {
        console.log(error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError(String(error));
        }
      }
    })
  );
  return (
    <div className='flex h-screen flex-col'>
      <AuthNavBar />
      <div className='flex h-screen w-screen items-center justify-center overflow-hidden p-2 sm:p-4 lg:p-8'>
        {/* Login Form */}
        <div className='flex w-full max-w-sm flex-col gap-4 rounded-large border-1 border-default-100/80 bg-default-50/80 px-8 pb-10 pt-6 shadow-lg'>
          <p className='pb-2 text-center text-xl font-medium'>
            {t('login-form.accessYourAccount')}
          </p>
          <form className='flex flex-col gap-3' onSubmit={onSubmit}>
            <Input
              label={t('login-form.emailAddress')}
              isDisabled={isPending}
              {...register('email')}
              isInvalid={!!errors.email}
              errorMessage={errors?.email?.message as ReactNode}
              placeholder={t('login-form.enterYourEmail')}
              type='email'
            />
            <Input
              endContent={
                <button type='button' onClick={toggleVisibility}>
                  {isVisible ? (
                    <LucideIcon name='EyeOff' />
                  ) : (
                    <LucideIcon name='Eye' />
                  )}
                </button>
              }
              label={t('login-form.password')}
              isDisabled={isPending}
              {...register('password')}
              isInvalid={!!errors.password}
              errorMessage={errors?.password?.message as ReactNode}
              placeholder={t('login-form.enterYourPassword')}
              type={isVisible ? 'text' : 'password'}
            />

            <FormErrors message={error} />
            <Button
              isLoading={isPending}
              color='primary'
              variant='solid'
              type='submit'
            >
              {t('login-form.logInButton')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
