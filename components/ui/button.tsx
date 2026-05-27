import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-cyan-300 text-slate-950 shadow-[0_0_0_1px_rgba(125,211,252,0.12)] hover:bg-cyan-200",
        secondary:
          "border border-white/12 bg-white/5 text-slate-100 hover:bg-white/8",
        ghost: "text-slate-300 hover:bg-white/6 hover:text-white",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 px-5 text-[15px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ className, variant, size }))}
      ref={ref}
      {...props}
    />
  ),
);

Button.displayName = "Button";

export { Button, buttonVariants };
