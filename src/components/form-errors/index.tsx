'use client';

import LucideIcon from '../lucide-icon';

interface FormErrorsProps {
  message?: string;
}

export const FormErrors = ({ message }: FormErrorsProps) => {
  if (!message) return null;
  return (
    <div
      className='flex items-center gap-x-2 rounded-md bg-danger-100 p-2 text-sm text-danger transition ease-in-out'
      id='form-errors'
    >
      <LucideIcon name='ShieldOff' />
      <p>{message}</p>
    </div>
  );
};
