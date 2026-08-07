import { useEffect, useRef, type FormEvent } from "react";
import { ArrowUp, Plus } from "lucide-react";
import "./Composer.css";

type ComposerProps = {
  value: string;
  placeholder: string;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Mobile keyboard hint; "decimal" brings up the number pad. */
  inputMode?: "text" | "decimal";
  onChange: (value: string) => void;
  onSubmit: () => void;
};

/** Bottom "Ask anything" pill + circular send button from the Figma Agent screen. */
export function Composer({
  value,
  placeholder,
  disabled = false,
  autoFocus = false,
  inputMode = "text",
  onChange,
  onSubmit,
}: ComposerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && !disabled) inputRef.current?.focus();
  }, [autoFocus, disabled, placeholder]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!disabled && value.trim()) onSubmit();
  };

  const canSend = !disabled && value.trim().length > 0;

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <div className="composer__field">
        <input
          ref={inputRef}
          type="text"
          inputMode={inputMode}
          className="composer__input"
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          aria-label={placeholder}
        />
        <span className="composer__plus" aria-hidden="true">
          <Plus size={16} strokeWidth={2} />
        </span>
      </div>
      <button
        type="submit"
        className={`composer__send${canSend ? " composer__send--active" : ""}`}
        disabled={!canSend}
        aria-label="Send"
      >
        <ArrowUp size={16} strokeWidth={2.4} />
      </button>
    </form>
  );
}
