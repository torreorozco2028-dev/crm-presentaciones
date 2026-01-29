'use client';

import {
  Button,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
} from '@heroui/react';
import React from 'react';
import LucideIcon from '../lucide-icon';
import { useTranslations } from 'next-intl';

interface DataTableHeaderProps {
  children: React.ReactNode;
  columnsFilter: { name: string; uid: string; sortable?: boolean }[];
  onNew: any;
  buttonNewLabel?: string;
  onSearch: (e: any) => void;
  setVisibleColumns: React.Dispatch<React.SetStateAction<Set<string>>>;
  visibleColumns: Set<string>;
  searchTerms?: string;
}

export default function DataTableHeader({
  onNew,
  buttonNewLabel,
  columnsFilter,
  visibleColumns,
  setVisibleColumns,
  onSearch,
  children,
  searchTerms,
}: DataTableHeaderProps) {
  const t = useTranslations('Users');
  return (
    <>
      <div className='flex flex-col gap-4'>
        <div className='flex items-end justify-between gap-3'>
          <Input
            isClearable
            size='md'
            placeholder={t('search.label')}
            value={searchTerms}
            onValueChange={onSearch}
            startContent={<LucideIcon name='Search' />}
            className='max-w-xs text-slate-950 dark:text-white/90'
          />
          <div className='flex gap-3'>
            <Dropdown>
              <DropdownTrigger className='hidden sm:flex'>
                <Button
                  size='md'
                  endContent={<LucideIcon name='ChevronDown' />}
                  variant='light'
                  className='uppercase'
                >
                  {t('dropdown.columns')}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label='dropdown columns'
                closeOnSelect={false}
                selectedKeys={visibleColumns}
                selectionMode='multiple'
                onSelectionChange={setVisibleColumns as any}
              >
                {columnsFilter.map((column) => (
                  <DropdownItem
                    key={column.uid}
                    className='capitalize'
                    textValue={column.name}
                  >
                    <span className='capitalize'>{column.name}</span>
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Button
              size='md'
              startContent={<LucideIcon name='Plus' />}
              color='primary'
              variant='light'
              onPress={() => onNew()}
            >
              {buttonNewLabel ? buttonNewLabel : t('addNew')}
            </Button>
          </div>
        </div>
        <Divider />
      </div>
      {children}
    </>
  );
}
