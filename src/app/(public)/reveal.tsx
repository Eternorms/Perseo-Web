"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealTag = "div" | "article" | "figure";

/**
 * Scroll-reveal: filho entra com fade/slide quando cruza o viewport.
 * One-shot (desconecta após revelar). Sem IntersectionObserver (ou sem JS,
 * via <noscript> no layout) o conteúdo fica visível — nunca some.
 */
export function Reveal({
  as: Tag = "div",
  className,
  delay = 0,
  children,
}: {
  as?: RevealTag;
  className?: string;
  /** stagger em ms — vira transition-delay do item */
  delay?: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const style: CSSProperties | undefined = delay > 0 ? { transitionDelay: `${delay}ms` } : undefined;

  return (
    <Tag
      // ref de elemento genérico — as três tags são HTMLElement
      ref={ref as React.Ref<never>}
      className={cn("reveal", visible && "is-visible", className)}
      style={style}
    >
      {children}
    </Tag>
  );
}
