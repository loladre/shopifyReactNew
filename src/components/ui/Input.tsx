import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ 
  error = false, 
  icon, 
  className = '', 
  ...props 
}, ref) => {
  const baseClasses = 'w-full px-4 py-3 bg-white border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200';
  
  const stateClasses = error 
    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
    : 'border-slate-300 focus:ring-purple-500 focus:border-purple-500 hover:border-slate-400';
  
  const iconClasses = icon ? 'pl-12' : '';
  
  const classes = `${baseClasses} ${stateClasses} ${iconClasses} ${className}`;

  return (
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {icon}
        </div>
      )}
      <input ref={ref} className={classes} {...props} />
    </div>
  );
});

Input.displayName = 'Input';

export default Input;