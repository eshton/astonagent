import { useEffect, useRef, useState, type KeyboardEvent } from "react";

export interface ComposerProps {
  onSubmit: (text: string) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function Composer({
  onSubmit,
  onStop,
  isStreaming = false,
  placeholder = "Message...",
  disabled = false,
}: ComposerProps) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-grow
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const submit = () => {
    const text = value.trim();
    if (!text || isStreaming) return;
    onSubmit(text);
    setValue("");
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="aston-composer">
      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKey}
        placeholder={placeholder}
        disabled={disabled}
        aria-label="Message input"
      />
      {isStreaming && onStop ? (
        <button type="button" data-variant="stop" onClick={onStop} aria-label="Stop">
          Stop
        </button>
      ) : (
        <button
          type="button"
          onClick={submit}
          disabled={disabled || isStreaming || !value.trim()}
          aria-label="Send"
        >
          Send
        </button>
      )}
    </div>
  );
}
