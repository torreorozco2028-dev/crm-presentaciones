import { notFound } from 'next/navigation';
import ControlPart from './control-part';
import { SALE_CONTROL_ENABLED } from '@/lib/feature-flags';

export default function SalesControlPage() {
  if (!SALE_CONTROL_ENABLED) notFound();

  return (
    <div className='min-h-screen bg-[#ffffff] dark:bg-[#000000]'>
      <div className='pt-5'>
        <ControlPart />
      </div>
    </div>
  );
}
