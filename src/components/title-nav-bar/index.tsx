'use client';
import { toCamelCase } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import React from 'react';

interface TitleNavBarProps {
  title: string;
  translatedTitle: string;
}

export default function TitleNavBar({
  title,
  translatedTitle,
}: TitleNavBarProps) {
  const t = useTranslations('Common');

  return (
    <div>
      <div className='font-bold uppercase text-inherit'>{translatedTitle}</div>
      <div className='text-default-500'>
        {title ? t(`intros.${toCamelCase(title)}`) : ''}
      </div>
    </div>
  );
}
