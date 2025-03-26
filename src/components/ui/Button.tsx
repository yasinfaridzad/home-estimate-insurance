import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'success' | 'destructive'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
    
    const variants = {
      default: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
      destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
    }

    return (
      <button
        className={cn(baseStyles, variants[variant], className)}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button } 