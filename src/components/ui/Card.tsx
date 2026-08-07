import { type HTMLAttributes, type ReactNode } from "react";
import "./Card.css";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  title?: ReactNode;
  children: ReactNode;
};

export function Card({ title, children, className, ...rest }: CardProps) {
  return (
    <div className={`ui-card${className ? ` ${className}` : ""}`} {...rest}>
      {title && <h2 className="ui-card__title">{title}</h2>}
      <div className="ui-card__body">{children}</div>
    </div>
  );
}
