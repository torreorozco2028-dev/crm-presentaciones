'use client';
import { useSession } from 'next-auth/react';

export default function useUserRole() {
  const { data: session } = useSession();
  return session?.user?.role || null;
}
