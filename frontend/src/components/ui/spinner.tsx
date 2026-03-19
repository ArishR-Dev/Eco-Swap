import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Inline spinner for buttons/small areas. Use AuthLoader for full-page loading. */
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin', className)} />;
}
