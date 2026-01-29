'use client';

import { useRef, useState } from 'react';
import { Card, CardBody, CardHeader, Button, Image } from '@heroui/react';
import LucideIcon from '@/components/lucide-icon';
import { useTranslations } from 'next-intl';

interface AvatarUploadProps {
  onUpload: (file: File) => Promise<{ url: string }>;
}

export default function AvatarUpload({ onUpload }: AvatarUploadProps) {
  const inputFileRef = useRef<HTMLInputElement>(null);

  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const t = useTranslations('Avatar');

  const handleFileChange = (file: File) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileChange(file);
      if (inputFileRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        inputFileRef.current.files = dataTransfer.files;
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <Card className='w-full max-w-md'>
      <CardHeader className='flex flex-col items-center gap-3 pb-6'>
        <h1 className='text-2xl font-bold'>{t('title')}</h1>
        <p className='text-center text-sm text-default-500'>
          {t('description')}
        </p>
      </CardHeader>
      <CardBody>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (!inputFileRef.current?.files) {
              throw new Error('No file selected');
            }
            const file = inputFileRef.current.files[0];
            setIsUploading(true);
            try {
              const result = await onUpload(file);
              setUploadedUrl(result.url);
            } catch (error) {
              console.error('Upload failed:', error);
            } finally {
              setIsUploading(false);
            }
          }}
          className='space-y-6'
        >
          <div
            className={`rounded-lg border-2 border-dashed p-8 text-center ${isDragging ? 'border-primary bg-primary/10' : 'border-default-300'} relative cursor-pointer transition-colors`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputFileRef.current?.click()}
          >
            {previewUrl ? (
              <div className='relative mx-auto h-32 w-32'>
                <Image
                  src={previewUrl}
                  alt='Preview'
                  className='h-full w-full rounded-full object-cover'
                />
                <div className='absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity hover:opacity-100'>
                  <LucideIcon name='Pencil' />
                </div>
              </div>
            ) : (
              <div className='space-y-4'>
                <div className='flex justify-center'>
                  <LucideIcon name='Upload' />
                </div>
                <div>
                  <p className='font-medium text-default-700'>
                    {t('uploadText')}
                  </p>
                  <p className='text-sm text-default-500'>{t('fileTypes')}</p>
                </div>
              </div>
            )}
            <input
              name='file'
              ref={inputFileRef}
              type='file'
              accept='image/*'
              required
              className='hidden'
              onChange={(e) =>
                e.target.files?.[0] && handleFileChange(e.target.files[0])
              }
            />
          </div>
          <div className='flex justify-end gap-3'>
            {previewUrl && (
              <Button
                variant='light'
                onClick={() => {
                  setPreviewUrl(null);
                  setUploadedUrl(null);
                  if (inputFileRef.current) {
                    inputFileRef.current.value = '';
                  }
                }}
              >
                {t('buttons.cancel')}
              </Button>
            )}
            <Button
              color='primary'
              type='submit'
              disabled={!previewUrl || isUploading}
              isLoading={isUploading}
            >
              {t('buttons.upload')}
            </Button>
          </div>
        </form>
        {uploadedUrl && (
          <div className='mt-4 rounded-lg bg-success-50 p-4'>
            <p className='text-sm text-success-700'>
              {t('success')}{' '}
              <a
                href={uploadedUrl}
                className='underline'
                target='_blank'
                rel='noopener noreferrer'
              >
                {uploadedUrl}
              </a>
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
