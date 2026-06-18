'use client'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Spinner } from './Spinner'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, className = '', disabled, ...props }, ref) => {
    const base = 'ripple inline-flex items-center justify-center rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
    const variants = {
      primary: 'bg-teal-700 text-white hover:bg-teal-800 active:bg-teal-900',
      secondary: 'bg-teal-100 text-teal-800 hover:bg-teal-200',
      outline: 'border border-teal-300 text-teal-700 hover:bg-teal-50',
      ghost: 'text-teal-700 hover:bg-teal-50',
    }
    const sizes = {
      sm: 'px-3 py-2 text-sm gap-1.5 min-h-[48px]',
      md: 'px-4 py-2.5 text-sm gap-2 min-h-[48px]',
      lg: 'px-6 py-3 text-base gap-2 min-h-[48px]',
    }
    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled ?? loading}
        {...props}
      >
        {loading && <Spinner className="h-4 w-4" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
