'use client';
import React from 'react';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
} from '@heroui/react';
import LucideIcon from '../lucide-icon';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';

export default function UserDropdownMenu({ user }: any) {
  const t = useTranslations('Common');
  return (
    <Dropdown placement='bottom-end' backdrop='blur'>
      <DropdownTrigger>
        <Avatar
          name={user.user.name?.toUpperCase()}
          isBordered
          as='button'
          color='success'
          src={user.user.image || ''}
          className='transition-transform'
        />
      </DropdownTrigger>
      <DropdownMenu aria-label='User options' variant='flat'>
        <DropdownItem
          key='profile'
          className='h-14 gap-4'
          textValue='info'
          startContent={<LucideIcon name='CircleUserRound' />}
        >
          <p>{user.user.name}</p>
          <p className='font-semibold'>{user.user.email}</p>
        </DropdownItem>
        <DropdownItem
          key='user-settings'
          href='/settings'
          startContent={<LucideIcon name='UserCog' />}
        >
          {t('dropdown.settings')}
        </DropdownItem>
        <DropdownItem
          key='sign-out-alternative'
          color='danger'
          startContent={<LucideIcon name='CirclePower' />}
          onPress={() => signOut({ callbackUrl: '/auth/login' })}
        >
          {t('dropdown.signOutBtn')}
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
