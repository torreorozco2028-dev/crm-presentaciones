import { Button, Pagination } from '@heroui/react';
import { useTranslations } from 'next-intl';
import React from 'react';

interface DataTableFooterProps {
  pages: number;
  page: number;
  setPage: (num: number) => void;
  onPageChange: (e: number) => void;
}
export default function DataTableFooter({
  pages,
  page,
  setPage,
  onPageChange,
}: DataTableFooterProps) {
  const t = useTranslations('Common');
  const onNextPage = React.useCallback(() => {
    if (page < pages) {
      setPage(page + 1);
      onPageChange(page + 1);
    }
  }, [page, pages, setPage, onPageChange]);
  const onPreviousPage = React.useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
      onPageChange(page - 1);
    }
  }, [page, setPage, onPageChange]);
  return (
    <>
      <div className='flex items-center justify-between px-2 py-2'>
        <Pagination
          isCompact
          showControls
          showShadow
          variant='light'
          color='primary'
          initialPage={1}
          page={page}
          total={pages}
          onChange={(e) => {
            setPage(e);
            onPageChange(e);
          }}
          isDisabled={pages > 1 ? false : true}
        />
        <div className='hidden w-[30%] justify-end gap-2 sm:flex'>
          <Button
            isDisabled={pages === 1}
            size='md'
            variant='light'
            onPress={() => {
              onPreviousPage();
            }}
          >
            {t('pagination.previous')}
          </Button>
          <Button
            isDisabled={pages === 1}
            size='md'
            variant='light'
            onPress={() => {
              onNextPage();
            }}
          >
            {t('pagination.next')}
          </Button>
        </div>
      </div>
    </>
  );
}
