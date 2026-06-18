'use client'
import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  containerClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', containerClassName = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className={`flex flex-col gap-1 ${containerClassName}`}>
        {label && <label htmlFor={inputId} className="text-sm font-medium text-gray-700">{label}{props.required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}</label>}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-teal-700 ${error ? 'border-red-500' : 'border-gray-300'} ${className}`}
          {...props}
        />
        {error && <p id={`${inputId}-error`} className="text-xs text-red-600">{error}</p>}
        {helperText && !error && <p className="text-xs text-gray-500">{helperText}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
