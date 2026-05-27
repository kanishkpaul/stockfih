import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "min-h-40 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export { Textarea };
