import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, onFocus, ...props }, ref) => {
    const selectOnFocus: React.FocusEventHandler<HTMLInputElement> = (e) => {
      const el = e.currentTarget;
      // Defer so click-induced mouseup (and number-spinner focus quirks)
      // don't immediately collapse the selection.
      requestAnimationFrame(() => {
        try {
          el.select();
        } catch {
          // Some input types (e.g. number in Safari) can throw on select(); ignore.
        }
        try {
          if (window.matchMedia("(max-width: 767px)").matches) {
            el.scrollIntoView({ block: "center", behavior: "smooth" });
          }
        } catch {
          // ignore
        }
      });
      onFocus?.(e);
    };
    return (
      <input
        type={type}
        ref={ref}
        onFocus={selectOnFocus}
        className={cn(
          "flex min-h-11 h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
