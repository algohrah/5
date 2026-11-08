import type { ReactNode } from 'react';
import { ShieldCheck, Star } from 'lucide-react';

export function VerifiedBadge({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';
  const text = size === 'sm' ? 'text-[9px]' : 'text-xs';
  return (
    <span className={`inline-flex items-center gap-1 ${text} font-bold text-sky-700 bg-sky-soft px-2 py-0.5 rounded ring-1 ring-sky-200/70`}>
      <ShieldCheck className={s} /> موثّق
    </span>
  );
}

export function FeaturedBadge({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';
  const text = size === 'sm' ? 'text-[8.5px] sm:text-[9.5px]' : 'text-[10px]';

  return (
    <span className={`inline-flex items-center gap-1 ${text} font-bold text-amber-900 bg-amber-100/90 px-1.5 py-0.5 rounded ring-1 ring-amber-300/60`}>
      <Star className={`${s} fill-amber-500 text-amber-500`} /> مميز
    </span>
  );
}

export function OnlineBadge() {
  return null;
}

export function Chip({ children, active, onClick }: { children: ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-cairo font-semibold transition-all duration-200 no-tap-highlight ${
        active
          ? 'bg-gold-gradient text-navy-950 shadow-gold'
          : 'bg-white/80 text-navy-700 ring-1 ring-cream-200 hover:bg-cream-100'
      }`}
    >
      {children}
    </button>
  );
}

export function MatchScore({ score }: { score: number }) {
  return null;
}
