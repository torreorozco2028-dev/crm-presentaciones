'use client';

import { useTranslations } from 'next-intl';
import { z } from 'zod';

export type InviteFormData = {
  email: string;
};

export const useInviteFormValidation = () => {
  const t = useTranslations('Users.invite.form.validations.email');

  const schema = z.object({
    email: z
      .string()
      .min(1, { message: t('required') })
      .email({ message: t('invalid') }),
  });

  return {
    schema,
  };
};
