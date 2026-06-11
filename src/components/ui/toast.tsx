"use client";

import * as React from "react";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "warn";
interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

type Listener = (t: ToastItem) => void;
let listeners: Listener[] = [];
let nextId = 1;

/** API imperativa: toast.success("Criativo aprovado") de qualquer client component. */
export const toast = {
  success: (message: string) => emit("success", message),
  error: (message: string) => emit("error", message),
  warn: (message: string) => emit("warn", message),
};

function emit(tone: ToastTone, message: string) {
  const item = { id: nextId++, tone, message };
  listeners.forEach((l) => l(item));
}

const ICONS: Record<ToastTone, React.ReactNode> = {
  success: <CheckCircle2 className="size-4 text-neon" />,
  error: <XCircle className="size-4 text-loss" />,
  warn: <AlertTriangle className="size-4 text-warn" />,
};

export function Toaster() {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  React.useEffect(() => {
    const onToast: Listener = (t) => {
      setItems((prev) => [...prev, t]);
      setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== t.id)), 4200);
    };
    listeners.push(onToast);
    return () => {
      listeners = listeners.filter((l) => l !== onToast);
    };
  }, []);

  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "pointer-events-auto flex items-center gap-2.5 rounded-md border border-line-strong glass px-3.5 py-2.5",
            "text-[13px] text-ink shadow-xl shadow-black/50 animate-rise",
          )}
        >
          {ICONS[t.tone]}
          {t.message}
        </div>
      ))}
    </div>
  );
}
