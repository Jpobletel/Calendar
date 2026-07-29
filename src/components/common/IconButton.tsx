import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'ghost' | 'solid' | 'danger';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  variant?: Variant;
}

const VARIANT_CLASS: Record<Variant, string> = {
  ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  solid: 'bg-brand-600 text-white hover:bg-brand-700',
  danger: 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950',
};

export function IconButton({ icon, label, variant = 'ghost', className = '', ...rest }: IconButtonProps) {
  return (
    <button
      {...rest}
      aria-label={label}
      title={label}
      className={`flex h-touch w-touch shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${VARIANT_CLASS[variant]} ${className}`}
    >
      {icon}
    </button>
  );
}
