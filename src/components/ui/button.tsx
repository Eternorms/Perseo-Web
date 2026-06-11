import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 cursor-pointer select-none",
  {
    variants: {
      variant: {
        // neon = sinal: reservado à ação principal da tela
        primary: "bg-neon text-onneon hover:bg-neon-dim rounded-md shadow-neon/0 hover:shadow-neon",
        secondary: "bg-surface-3 text-ink border border-line-strong hover:border-ink-faint rounded-md",
        ghost: "text-ink-mute hover:text-ink hover:bg-surface-3 rounded-md",
        outline: "border border-line-strong text-ink hover:bg-surface-3 rounded-md",
        danger: "bg-loss/15 text-loss border border-loss/30 hover:bg-loss/25 rounded-md",
      },
      size: {
        sm: "h-8 px-3 text-xs [&_svg]:size-3.5",
        md: "h-9 px-4 text-sm [&_svg]:size-4",
        lg: "h-12 px-7 text-base [&_svg]:size-5",
        icon: "size-8 [&_svg]:size-4",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, type, ...props }: ButtonProps) {
  return <button type={type ?? "button"} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
