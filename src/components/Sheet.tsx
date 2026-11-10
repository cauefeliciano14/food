import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, X } from "lucide-react";
import { useBack } from "../lib/back";

/**
 * Bottom sheet.
 * - Drag it down by the grip/title (or anywhere when scrolled to the top) to close.
 * - Android back goes to `onBack` (previous step) when given, else closes.
 * - The X closes it entirely.
 */
export function Sheet({ title, onClose, onBack, children }: {
  title: string;
  onClose: () => void;
  /** previous step in a multi-step flow; shows a back arrow */
  onBack?: () => void;
  children: ReactNode;
}) {
  const [closing, setClosing] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const sheetRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y0: number; x0: number; t0: number; dy: number; active: boolean; fromHandle: boolean } | null>(null);

  // Play the slide-down before unmounting.
  const requestClose = useCallback(() => {
    setClosing(true);
    window.setTimeout(() => onCloseRef.current(), 170);
  }, []);

  useBack(!closing, () => (onBack ? onBack() : requestClose()), 1);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const setY = (y: number, animate: boolean) => {
    const el = sheetRef.current;
    if (!el) return;
    el.style.transition = animate ? "transform 0.2s ease-out" : "none";
    el.style.transform = y ? `translateY(${y}px)` : "";
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const el = sheetRef.current;
    if (!el) return;
    const t = e.touches[0];
    const target = e.target as HTMLElement;
    const fromHandle = !!target.closest(".sheet-drag");
    // From the content: only when it's already scrolled to the top, and not on form fields / sliders.
    if (!fromHandle && (el.scrollTop > 0 || target.closest("input, textarea, select, .swipe"))) return;
    drag.current = { y0: t.clientY, x0: t.clientX, t0: Date.now(), dy: 0, active: false, fromHandle };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const d = drag.current;
    if (!d) return;
    const t = e.touches[0];
    const dy = t.clientY - d.y0;
    const dx = t.clientX - d.x0;
    if (!d.active) {
      if (Math.abs(dy) < 8 && Math.abs(dx) < 8) return;
      // Sideways or upward: let the content handle it.
      if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) { drag.current = null; return; }
      d.active = true;
    }
    d.dy = Math.max(0, dy);
    setY(d.dy, false);
  };

  const onTouchEnd = () => {
    const d = drag.current;
    drag.current = null;
    if (!d?.active) return;
    const speed = d.dy / Math.max(1, Date.now() - d.t0);
    const h = sheetRef.current?.offsetHeight ?? 600;
    if (d.dy > Math.min(140, h * 0.3) || speed > 0.6) {
      setY(h, true);
      setClosing(true);
      window.setTimeout(() => onCloseRef.current(), 180);
    } else {
      setY(0, true);
    }
  };

  return (
    <div className={`sheet-backdrop ${closing ? "closing" : ""}`} onClick={requestClose}>
      <div ref={sheetRef} className="sheet" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd}>
        <div className="sheet-drag">
          <div className="sheet-grip" />
          <div className="sheet-head">
            {onBack && (
              <button className="icon-btn" onClick={onBack} aria-label="Voltar">
                <ChevronLeft size={24} />
              </button>
            )}
            <h2>{title}</h2>
            <button className="icon-btn" onClick={requestClose} aria-label="Fechar">
              <X size={22} />
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
