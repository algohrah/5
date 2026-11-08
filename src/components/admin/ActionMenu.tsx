import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Loader2 } from 'lucide-react';

// ============================================================
//  قائمة إجراءات موحّدة بزر (إجراءات) مع تموضع ذكي (Drop-Up / Drop-Down)
//  تستخدم موضع ثابت (fixed) لضمان عدم اقتصاصها إطلاقاً بالـ overflow
// ============================================================

export interface ActionItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'danger' | 'success';
  disabled?: boolean;
  hidden?: boolean;
  divider?: boolean;
  sectionHeader?: string;
}

interface Props {
  items: ActionItem[];
  busy?: boolean;
  label?: string;
  align?: 'left' | 'right';
  onOpenChange?: (open: boolean) => void;
}

const variantClasses: Record<string, string> = {
  default: 'text-slate-700 hover:bg-slate-50',
  primary: 'text-slate-900 hover:bg-amber-50',
  danger: 'text-rose-600 hover:bg-rose-50',
  success: 'text-emerald-600 hover:bg-emerald-50',
};

export default function ActionMenu({ items, busy, label = 'إجراءات', onOpenChange }: Props) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top?: number; bottom?: number; left: number; openUp: boolean }>({
    left: 0,
    openUp: false,
  });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    // إذا كانت المساحة بالأسفل أقل من 280 بكسل والمساحة بالأعلى كافية، تفتح للأعلى
    const openUp = spaceBelow < 280 && spaceAbove > 180;

    const menuWidth = 240;
    // الحفاظ على القائمة داخل حدود الشاشة يميناً ويساراً
    let left = rect.right - menuWidth;
    if (left < 10) left = 10;
    if (left + menuWidth > window.innerWidth - 10) {
      left = Math.max(10, window.innerWidth - menuWidth - 10);
    }

    if (openUp) {
      setCoords({
        bottom: Math.max(10, window.innerHeight - rect.top + 6),
        left,
        openUp: true,
      });
    } else {
      setCoords({
        top: Math.max(10, rect.bottom + 6),
        left,
        openUp: false,
      });
    }
  }, []);

  const toggleOpen = () => {
    if (!open) {
      updatePosition();
    }
    const next = !open;
    setOpen(next);
    if (onOpenChange) onOpenChange(next);
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const handleScrollOrResize = () => {
      updatePosition();
    };
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (buttonRef.current && buttonRef.current.contains(e.target as Node)) {
        return;
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        if (onOpenChange) onOpenChange(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onOpenChange]);

  const visible = (items || []).filter((i) => !i.hidden);

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        disabled={busy}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white font-cairo font-bold text-[11px] hover:bg-slate-800 transition-colors disabled:opacity-60 cursor-pointer shadow-xs active:scale-95"
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MoreHorizontal className="w-3.5 h-3.5" />}
        <span>{label}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: coords.openUp ? 8 : -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: coords.openUp ? 8 : -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              top: coords.top !== undefined ? `${coords.top}px` : undefined,
              bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
              left: `${coords.left}px`,
              width: '240px',
              zIndex: 999999,
            }}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 max-h-[65vh] overflow-y-auto text-right font-cairo ring-1 ring-black/5"
            dir="rtl"
          >
            {visible.map((item, i) => (
              <div key={i}>
                {item.sectionHeader && (
                  <div className="px-3 pt-2 pb-1 text-[10px] font-cairo font-extrabold text-amber-800 bg-amber-50/80 border-y border-amber-100 my-1 first:mt-0 text-right flex items-center justify-between">
                    <span>{item.sectionHeader}</span>
                  </div>
                )}
                {item.divider && !item.sectionHeader && <div className="my-1 h-px bg-slate-100" />}
                {item.label ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!item.disabled) {
                        item.onClick();
                        setOpen(false);
                        if (onOpenChange) onOpenChange(false);
                      }
                    }}
                    disabled={item.disabled}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-cairo font-bold text-right transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed
                      ${variantClasses[item.variant || 'default']}`}
                  >
                    {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                    <span className="truncate">{item.label}</span>
                  </button>
                ) : null}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
