import { type InputHTMLAttributes, useId } from "react";
import "./TextField.css";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function TextField({ label, id, className, ...rest }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={`ui-textfield${className ? ` ${className}` : ""}`}>
      {label && (
        <label className="ui-textfield__label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input id={inputId} className="ui-textfield__input" {...rest} />
    </div>
  );
}
