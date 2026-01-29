'use client';
import React from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  DropdownItem,
  Chip,
  Dropdown,
  DropdownTrigger,
  Button,
  DropdownMenu,
} from '@heroui/react';
import LucideIcon from '../lucide-icon';
import { useTranslations } from 'next-intl';

const statusColorMap = {
  active: 'success',
  paused: 'danger',
  blocked: 'warning',
  vacation: 'warning',
};
interface DataTableProps {
  actionDelete?: (e: any) => void;

  actionEdit?: (e: any) => void;

  actionView?: (e: any) => void;

  actionBlocked?: (e: any) => void;

  bottomContent?: React.ReactNode;
  headerColumns: { uid: string; name: string; sortable?: boolean }[];
  items: any[];
  topContent: React.ReactNode;
}
export default function DataTable({
  actionDelete,
  actionEdit,
  actionView,
  bottomContent,
  headerColumns,
  items,
  topContent,
}: DataTableProps) {
  const t = useTranslations('Common');
  const renderCell = React.useCallback(
    (data: any, columnKey: string) => {
      const cellValue = data[columnKey as keyof typeof data];

      let dateValue;
      let formattedDate;

      switch (columnKey) {
        case 'sku':
        case 'pty':
          return (
            <Chip color='primary' variant='flat' radius='sm'>
              {cellValue}
            </Chip>
          );
        case 'role':
          return (
            <Chip
              radius='sm'
              color={
                cellValue === 'admin'
                  ? 'primary'
                  : cellValue === 'engineer'
                    ? 'danger'
                    : 'default'
              }
              variant='dot'
            >
              {cellValue}
            </Chip>
          );
        case 'state':
          return (
            <Chip
              radius='sm'
              className='capitalize'
              color={
                statusColorMap[data.state as keyof typeof statusColorMap] as any
              }
              variant='flat'
            >
              {cellValue}
            </Chip>
          );
        case 'dateDelivered':
          dateValue = new Date(cellValue);
          formattedDate = `${(dateValue.getMonth() + 1).toString().padStart(2, '0')}/${dateValue.getDate().toString().padStart(2, '0')}/${dateValue.getFullYear()}`;
          return <div>{formattedDate}</div>;
        case 'actions':
          return (
            <div>
              <Dropdown placement='bottom-end' backdrop='blur'>
                <DropdownTrigger>
                  <Button isIconOnly size='sm' variant='light'>
                    <LucideIcon name='EllipsisVertical' />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu variant='flat'>
                  {actionView != undefined &&
                  typeof actionView === 'function' ? (
                    <DropdownItem
                      key='new-drowpdow-item'
                      startContent={<LucideIcon name='ClipboardList' />}
                      color='primary'
                      onPress={() => {
                        try {
                          actionView(data);
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                    >
                      {t('dropdown.detail')}
                    </DropdownItem>
                  ) : (
                    <DropdownItem
                      key='empty-drowpdown-item-1'
                      className='hidden'
                    />
                  )}
                  {actionEdit != undefined &&
                  typeof actionEdit === 'function' ? (
                    <DropdownItem
                      key='edit-dropdown-item'
                      startContent={<LucideIcon name='Pencil' />}
                      color='primary'
                      onPress={() => {
                        try {
                          actionEdit(data);
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                    >
                      {t('dropdown.edit')}
                    </DropdownItem>
                  ) : (
                    <DropdownItem
                      key='empty-drowpdown-item-2'
                      className='hidden'
                    />
                  )}
                  {actionDelete != undefined &&
                  typeof actionDelete === 'function' ? (
                    <DropdownItem
                      key='delete-dropdown-item'
                      startContent={<LucideIcon name='Trash' />}
                      color='danger'
                      onPress={() => {
                        try {
                          actionDelete(data);
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                    >
                      {t('dropdown.delete')}
                    </DropdownItem>
                  ) : (
                    <DropdownItem
                      key='empty-drowpdown-item-3'
                      className='hidden'
                    />
                  )}
                </DropdownMenu>
              </Dropdown>
            </div>
          );
        case 'price':
          return <> {cellValue}$</>;
        case 'area':
          return <> {cellValue} MT2</>;
        default:
          return cellValue;
      }
    },
    [actionView, t, actionEdit, actionDelete]
  );

  return (
    <>
      <Table
        topContent={topContent}
        bottomContent={bottomContent}
        aria-label='data-table'
        isStriped
        bottomContentPlacement='outside'
        topContentPlacement='outside'
        color='primary'
        removeWrapper
      >
        <TableHeader columns={headerColumns}>
          {(column) => (
            <TableColumn
              key={column.uid}
              align={column.uid === 'actions' ? 'end' : 'start'}
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={items} emptyContent={t('table.noRows')}>
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey as any)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}
