'use client';

import React, { useState, useMemo } from 'react';
import { useDisclosure, addToast } from '@heroui/react';
import { useDebounceCallback } from 'usehooks-ts';
import {
  deleteUser,
  getTotalUsers,
  searchUsers,
} from './_actions/users-actions';
import DataTable from '@/components/data-table';
import DataTableHeader from '@/components/data-table/data-table-header';
import DataTableFooter from '@/components/data-table/data-table-footer';
import TeamInvite from './users-invite-form';
import { useTranslations } from 'next-intl';

interface UsersTableProps {
  data: any[];
  total: number;
}

const INITIAL_VISIBLE_COLUMNS = ['name', 'email', 'state', 'role', 'actions'];

export default function UsersTable({ data, total }: UsersTableProps) {
  const t = useTranslations('Users');
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState<number>(total);
  const [items, setItems] = useState<any[]>(data);
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const [visibleColumns, setVisibleColumns] = useState(
    new Set(INITIAL_VISIBLE_COLUMNS)
  );

  const columns = useMemo(
    () => [
      { name: t('users-table.name'), uid: 'name', sortable: true },
      { name: t('users-table.email'), uid: 'email', sortable: true },
      { name: t('users-table.status'), uid: 'state', sortable: true },
      { name: t('users-table.role'), uid: 'role' },
      { name: t('users-table.startedAt'), uid: 'createdAt' },
      { name: t('users-table.actions'), uid: 'actions' },
    ],
    [t]
  );

  const headerColumns = useMemo(() => {
    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns, columns]);

  const onSearch = useDebounceCallback(async (term?: string) => {
    const userItems = await searchUsers(10, 0, term);
    const newTotal = term ? userItems.length : (await getTotalUsers()) || 0;

    setItems(userItems);
    setTotalRows(newTotal);
    setPage(1);
  }, 300);

  const onPageChange = async (pNum: number) => {
    const offset = (pNum - 1) * 10;
    const items = await searchUsers(10, offset);
    setItems(items);
    setPage(pNum);
  };

  const onDelete = async (user: any) => {
    const result = await deleteUser(user.id);

    if (result.success) {
      addToast({
        title: t('users-table.deleteSuccess'),
        color: 'success',
      });
      onSearch('');
    } else {
      addToast({
        title: t('users-table.deleteError'),
        color: 'danger',
      });
    }
  };

  return (
    <>
      <DataTable
        headerColumns={headerColumns}
        items={items}
        actionDelete={onDelete}
        topContent={
          <DataTableHeader
            columnsFilter={columns}
            onNew={onOpen}
            buttonNewLabel={t('users-table.invite')}
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
            onSearch={onSearch}
          >
            <TeamInvite
              onOpenChange={onOpenChange}
              isOpen={isOpen}
              onClose={onClose}
            />
          </DataTableHeader>
        }
        bottomContent={
          <DataTableFooter
            page={page}
            pages={Math.ceil(totalRows / 10)}
            onPageChange={onPageChange}
            setPage={setPage}
          />
        }
      />
    </>
  );
}
