import { Button } from '@heroui/react';
import LucideIcon from '../lucide-icon';
import { signOut } from 'next-auth/react';
export default function SignOutBtnMobile() {
  return (
    <Button
      color='danger'
      onPress={() => signOut({ callbackUrl: '/auth/login' })}
    >
      <LucideIcon name='CirclePower' />
      Sign out
    </Button>
  );
}
