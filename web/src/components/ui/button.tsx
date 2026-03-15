import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[var(--accent)] text-white hover:opacity-90',
        secondary: 'bg-[var(--border)] text-[var(--text-h)] hover:bg-[var(--code-bg)]',
        outline: 'border border-[var(--border)] bg-transparent hover:bg-[var(--accent-bg)]',
        ghost: 'hover:bg-[var(--accent-bg)]',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        default: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-base',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      data-slot="button"
      {...props}
    />
  )
)
Button.displayName = 'Button'

export { Button, buttonVariants }
