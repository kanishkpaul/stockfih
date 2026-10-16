import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "ghost"; size?: "default" | "sm" | "lg";
};
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) =>
    <button ref={ref} className={`button ${variant} ${size} ${className}`} {...props} />,
);
Button.displayName = "Button";
