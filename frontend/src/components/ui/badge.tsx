import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]',
        secondary: 'border-transparent bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]',
        destructive: 'border-transparent bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]',
        outline: 'text-[hsl(var(--foreground))]',
        success: 'border-node-teal/20 bg-node-teal/10 text-node-teal',
        warning: 'border-amber-signal/20 bg-amber-signal/10 text-amber-signal',
        danger:  'border-alert-red/20 bg-alert-red/10 text-alert-red',
        info:    'border-stech-blue/20 bg-stech-blue/10 text-stech-blue',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
