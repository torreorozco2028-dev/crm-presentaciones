'use client';

import { upload } from '@vercel/blob/client';
import AvatarUpload from '@/components/avatar-upload';

export default function AvatarUploadPage() {
  const handleUpload = async (file: File) => {
    const blob = await upload(file.name, file, {
      access: 'public',
      handleUploadUrl: '/api/avatar/upload',
    });
    return { url: blob.url };
  };

  return (
    <div className='flex min-h-[50vh] items-center justify-center'>
      <AvatarUpload onUpload={handleUpload} />
    </div>
  );
}
