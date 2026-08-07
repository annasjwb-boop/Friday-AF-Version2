import { type ButtonHTMLAttributes, type ReactNode } from "react";
import "./IconButton.css";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
};

export function IconButton({
  label,
  children,
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={`ui-icon-button${className ? ` ${className}` : ""}`}
      aria-label={label}
      {...rest}
    >
      {children}
    </button>
  );
}
