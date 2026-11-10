import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type Notify = (text: string, undo?: () => void | Promise<void>) => void;
const ToastContext = createContext<Notify>(() => {});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ text: string; undo?: () => void | Promise<void>; key: number } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const notify = useCallback<Notify>((text, undo) => {
    window.clearTimeout(timer.current);
    setToast({ text, undo, key: Date.now() });
    timer.current = window.setTimeout(() => setToast(null), undo ? 5000 : 3000);
  }, []);
  return (
    <ToastContext.Provider value={notify}>
      {children}
      {toast && (
        <div className="toast" role="status" key={toast.key}>
          <span style={{ flex: 1 }}>{toast.text}</span>
          {toast.undo && (
            <button onClick={() => { void toast.undo!(); setToast(null); }}>Desfazer</button>
          )}
        </div>
      )}
    </ToastContext.Provider>
  );
}
