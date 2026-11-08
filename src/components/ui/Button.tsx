import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

type Variant = 'gold' | 'navy' | 'outline' | 'ghost' | 'rose';
type Size = 'sm' | 'md' | 'lg';

interface BaseProps {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  disabled?: boolean;
  id?: string;
}

const base = 'inline-flex items-center justify-center gap-2 font-cairo font-extrabold no-tap-highlight transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7B113A]/25 active:scale-[0.985]';

const variants: Record<Variant, string> = {
  gold: 'bg-gradient-to-r from-[#8B1D41] via-[#7B113A] to-[#680E30] text-white shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:brightness-105 active:scale-[0.98]',
  navy: 'bg-[#7B113A] text-white shadow-soft hover:-translate-y-0.5 hover:bg-[#680E30] active:scale-[0.98]',
  outline: 'border border-[#7B113A]/30 bg-white/90 text-[#7B113A] shadow-soft hover:-translate-y-0.5 hover:bg-[#FDF2F4] hover:border-[#7B113A]',
  ghost: 'text-neutral-700 hover:bg-[#F7EFE6] hover:text-[#7B113A]',
  rose: 'bg-[#7B113A] text-white shadow-soft hover:-translate-y-0.5 hover:bg-[#680E30]',
};

const sizes: Record<Size, string> = {
  sm: 'min-h-11 px-3 py-2 text-xs sm:px-4 sm:text-sm rounded-xl',
  md: 'min-h-11 px-4 py-2.5 text-sm sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl',
  lg: 'min-h-12 px-6 py-3 text-sm sm:px-8 sm:py-4 sm:text-base rounded-2xl sm:rounded-[1.15rem]',
};

function classNames({ variant, size, fullWidth, disabled, className }: Required<Pick<BaseProps, 'variant' | 'size'>> & Pick<BaseProps, 'fullWidth' | 'disabled' | 'className'>) {
  return `${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-55 cursor-not-allowed pointer-events-none grayscale-[.15]' : ''} ${className || ''}`;
}

export function Button({
  children, variant = 'gold', size = 'md', className = '', fullWidth, type = 'button', onClick, disabled, id,
}: BaseProps) {
  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classNames({ variant, size, fullWidth, disabled, className })}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  children, to, variant = 'gold', size = 'md', className = '', fullWidth, onClick, id,
}: BaseProps & { to: string; onClick?: () => void }) {
  return (
    <Link
      id={id}
      to={to}
      onClick={onClick}
      className={classNames({ variant, size, fullWidth, disabled: false, className })}
    >
      {children}
    </Link>
  );
}
