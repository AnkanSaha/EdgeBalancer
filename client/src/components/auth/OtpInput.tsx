'use client';

import { useEffect, useRef } from 'react';

const LENGTH = 6;

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * One real input stretched invisibly over six boxes, so paste, backspace, the mobile numeric
 * keypad and one-time-code autofill all work without managing six refs.
 */
export function OtpInput({ value, onChange, onComplete, error, disabled, autoFocus = true }: OtpInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (value.length === LENGTH) onComplete(value);
    // onComplete is re-created each render by callers; keying off the value alone keeps this
    // to exactly one submit per completed code.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const boxColor = (filled: boolean) => {
    if (error) return 'var(--red)';
    return filled ? 'var(--accent)' : 'var(--line)';
  };

  return (
    <div
      className={error ? 'shake' : undefined}
      onClick={() => inputRef.current?.focus()}
      style={{ position: 'relative', width: '100%' }}
    >
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={LENGTH}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, LENGTH))}
        aria-label="6-digit authentication code"
        aria-invalid={!!error}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          opacity: 0, cursor: 'text', zIndex: 1,
        }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${LENGTH}, 1fr)`, gap: 'clamp(6px, 2vw, 10px)' }}>
        {Array.from({ length: LENGTH }).map((_, index) => {
          const char = value[index];
          const isNext = index === value.length && !disabled;

          return (
            <div
              key={index}
              style={{
                aspectRatio: '3 / 4',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--mono)', fontSize: 'clamp(18px, 5vw, 22px)',
                color: error ? 'var(--red)' : 'var(--text)',
                background: char ? 'var(--accent-dim)' : 'var(--bg-1)',
                border: `1px solid ${boxColor(!!char)}`,
                borderRadius: 'var(--radius)',
                transform: char ? 'scale(1.06)' : 'scale(1)',
                transition: 'transform 140ms cubic-bezier(0.4, 0, 0.2, 1), border-color 140ms, background 140ms',
                opacity: disabled ? 0.5 : 1,
              }}
            >
              {char || (isNext ? (
                <span style={{
                  width: 2, height: '45%', background: 'var(--accent)',
                  animation: 'pulse 1s ease-in-out infinite',
                }} />
              ) : null)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
