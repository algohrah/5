import { Link } from 'react-router-dom';

interface LogoProps {
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ variant = 'dark', size = 'md' }: LogoProps) {
  const textColor = variant === 'light' ? 'text-white' : 'text-[#7B113A]';
  const subColor = variant === 'light' ? 'text-[#F3DB83]' : 'text-[#A16207]';
  const sizes = {
    sm: { mark: 'w-8.5 h-8.5', text: 'text-base', sub: 'text-[10px]' },
    md: { mark: 'w-10.5 h-10.5', text: 'text-xl', sub: 'text-[11px]' },
    lg: { mark: 'w-13.5 h-13.5', text: 'text-2xl', sub: 'text-xs' },
  };
  const s = sizes[size];

  return (
    <Link to="/" className="group flex items-center gap-2.5 no-tap-highlight select-none" aria-label="منصة تلاقي - أول منصة زواج في قطر">
      <div className={`${s.mark} relative flex-shrink-0 rounded-xl bg-gradient-to-tr from-[#680E30] to-[#8C1442] p-1.5 shadow-md shadow-[#7B113A]/20 ring-1 ring-[#D4AF37]/40 transition-transform duration-300 group-hover:-translate-y-0.5 flex items-center justify-center`}>
        <svg viewBox="0 0 64 64" className="h-full w-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="qatarGoldGrad" x1="10" y1="8" x2="54" y2="58" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFF2B2" />
              <stop offset="0.45" stopColor="#E5C378" />
              <stop offset="1" stopColor="#B38A38" />
            </linearGradient>
          </defs>
          {/* Subtle Islamic Arch & Intertwined Rings */}
          <path d="M32 8C20 8 12 18 12 32C12 44 22 54 32 58C42 54 52 44 52 32C52 18 44 8 32 8Z" stroke="url(#qatarGoldGrad)" strokeWidth="2.5" strokeOpacity="0.4" />
          <path d="M26 34C26 29.58 29.58 26 34 26C38.42 26 42 29.58 42 34C42 38.42 38.42 42 34 42C29.58 42 26 38.42 26 34Z" stroke="url(#qatarGoldGrad)" strokeWidth="3" />
          <path d="M22 30C22 25.58 25.58 22 30 22C34.42 22 38 25.58 38 30C38 34.42 34.42 38 30 38C25.58 38 22 34.42 22 30Z" stroke="#FFFFFF" strokeWidth="2.5" strokeOpacity="0.9" />
          <circle cx="34" cy="26" r="2.5" fill="#FFF2B2" />
        </svg>
      </div>
      <div className="flex flex-col text-right justify-center">
        <span className={`font-['Cairo'] font-black tracking-tight leading-none ${s.text} ${textColor}`}>
          تلاقي
        </span>
        <span className={`${s.sub} font-['Cairo'] font-extrabold tracking-wide ${subColor} mt-1.5 leading-none`}>
          أول منصة زواج في قطر
        </span>
      </div>
    </Link>
  );
}
