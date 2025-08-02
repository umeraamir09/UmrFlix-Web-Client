'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StyledInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const StyledInput = React.forwardRef<HTMLInputElement, StyledInputProps>(
  ({ className, type, label, ...props }, ref) => {
    const id = React.useId();
    const [showPassword, setShowPassword] = React.useState(false);
    const handleTogglePassword = () => setShowPassword((prev) => !prev);
    const inputType = type === 'password' && showPassword ? 'text' : type;

    return (
      <div className="relative w-full">
        <input
          type={inputType}
          className={cn(
            'peer block w-full rounded-md border border-gray-500 bg-black px-4 pb-2.5 pt-5 text-base text-white',
            'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white',
            className
          )}
          id={id}
          ref={ref}
          placeholder=" " // Placeholder with a space is crucial for the label animation
          {...props}
        />
        <label
          htmlFor={id}
          className={cn(
            'absolute left-4 top-4 origin-[0] -translate-y-3 scale-75 transform text-base text-gray-400 duration-150',
            'peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100',
            'peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-gray-200'
          )}
        >
          {label}
        </label>
        {type === 'password' && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400"
            onClick={handleTogglePassword}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
    );
  }
);
StyledInput.displayName = 'StyledInput';

// Email variant
const EmailInput = React.forwardRef<HTMLInputElement, Omit<StyledInputProps, 'type'>>(
  (props, ref) => <StyledInput type="name" {...props} ref={ref} />
);
EmailInput.displayName = 'EmailInput';

// Password variant
const PasswordInput = React.forwardRef<HTMLInputElement, Omit<StyledInputProps, 'type'>>(
  (props, ref) => <StyledInput type="password" {...props} ref={ref} />
);
PasswordInput.displayName = 'PasswordInput';

export { StyledInput, EmailInput, PasswordInput };

