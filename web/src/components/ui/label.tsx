import { type LabelHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium leading-none text-[var(--text-h)] peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      data-slot="label"
      {...props}
    />
  )
)
Label.displayName = 'Label'

export { Label }
