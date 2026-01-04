import { forwardRef } from 'react';

const IconButton = forwardRef(({ 
  children, 
  className = '', 
  variant = 'ghost',
  size = 'md',
  ...props 
}, ref) => {
  const sizes = {
    sm: 'w-6 h-6 p-1',
    md: 'w-8 h-8 p-1.5',
    lg: 'w-10 h-10 p-2',
  };

  return (
    <button
      ref={ref}
      className={`
        rounded-lg flex items-center justify-center
        transition-all duration-200
        text-gray-400 hover:text-gray-200
        ${sizes[size]}
        ${className}
      `}
      style={{ backgroundColor: 'transparent' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#3A3A3A';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
      {...props}
    >
      {children}
    </button>
  );
});

IconButton.displayName = 'IconButton';

export default IconButton;