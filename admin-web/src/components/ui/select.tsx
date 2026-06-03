"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  children: React.ReactNode;
};

export function Select({
  className,
  children,
  value,
  defaultValue,
  disabled,
  name,
  id,
  onChange,
  onBlur,
}: SelectProps) {
  const options = React.useMemo(() => parseOptions(children), [children]);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const listboxId = React.useId();
  const isControlled = value !== undefined;
  const initialValue =
    defaultValue?.toString() ?? options.find((option) => !option.disabled)?.value ?? "";
  const [internalValue, setInternalValue] = React.useState(initialValue);
  const [isOpen, setIsOpen] = React.useState(false);
  const currentValue = (isControlled ? value?.toString() : internalValue) ?? "";
  const selectedOption = options.find((option) => option.value === currentValue);

  React.useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  React.useEffect(() => {
    if (!isControlled && !currentValue && options.length) {
      setInternalValue(options.find((option) => !option.disabled)?.value ?? "");
    }
  }, [currentValue, isControlled, options]);

  function emitChange(nextValue: string) {
    const event = {
      target: { value: nextValue, name, id },
      currentTarget: { value: nextValue, name, id },
    } as unknown as React.ChangeEvent<HTMLSelectElement>;

    onChange?.(event);
  }

  function selectOption(option: SelectOption) {
    if (option.disabled) {
      return;
    }

    if (!isControlled) {
      setInternalValue(option.value);
    }

    emitChange(option.value);
    setIsOpen(false);
    buttonRef.current?.focus();
  }

  function moveSelection(direction: 1 | -1) {
    const enabledOptions = options.filter((option) => !option.disabled);
    if (!enabledOptions.length) {
      return;
    }

    const currentIndex = Math.max(
      0,
      enabledOptions.findIndex((option) => option.value === currentValue),
    );
    const nextIndex = (currentIndex + direction + enabledOptions.length) % enabledOptions.length;
    selectOption(enabledOptions[nextIndex]);
  }

  return (
    <div ref={rootRef} className="relative w-full">
      {name ? <input type="hidden" name={name} value={currentValue} /> : null}
      <button
        id={id}
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        disabled={disabled}
        onBlur={(event) => onBlur?.(event as unknown as React.FocusEvent<HTMLSelectElement>)}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            if (isOpen) {
              moveSelection(1);
            } else {
              setIsOpen(true);
            }
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();
            if (isOpen) {
              moveSelection(-1);
            } else {
              setIsOpen(true);
            }
          }

          if (event.key === "Escape") {
            setIsOpen(false);
          }
        }}
        className={cn(
          "flex h-10 w-full cursor-pointer items-center justify-between gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left text-sm font-medium text-[var(--foreground)] shadow-sm shadow-slate-900/4 outline-none transition-all hover:border-[var(--brand-300)] hover:bg-white focus:border-[var(--brand-600)] focus:shadow-[var(--ring)] disabled:cursor-not-allowed disabled:bg-[var(--surface-soft)] disabled:opacity-70",
          isOpen && "border-[var(--brand-600)] shadow-[var(--ring)]",
          className,
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-[var(--muted)]")}>
          {selectedOption?.label || "Pilih data"}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[var(--muted)] transition-transform",
            isOpen && "rotate-180 text-[var(--brand-700)]",
          )}
        />
      </button>

      {isOpen ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.375rem)] z-50 max-h-64 overflow-y-auto rounded-md border border-[var(--border)] bg-white p-1 shadow-xl shadow-slate-900/12"
        >
          {options.map((option) => {
            const isSelected = option.value === currentValue;

            return (
              <button
                key={`${option.value}-${option.label}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                onClick={() => selectOption(option)}
                className={cn(
                  "flex min-h-9 w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-[var(--foreground)] outline-none transition hover:bg-[var(--surface-soft)] focus:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:text-[var(--muted)] disabled:opacity-60",
                  isSelected && "bg-[var(--brand-50)] text-[var(--brand-800)]",
                )}
              >
                <span className="truncate">{option.label}</span>
                {isSelected ? <Check className="h-4 w-4 shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function parseOptions(children: React.ReactNode) {
  const options: SelectOption[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement<React.OptionHTMLAttributes<HTMLOptionElement>>(child)) {
      return;
    }

    if (child.type !== "option") {
      return;
    }

    options.push({
      value: child.props.value?.toString() ?? textFromNode(child.props.children),
      label: textFromNode(child.props.children),
      disabled: child.props.disabled,
    });
  });

  return options;
}

function textFromNode(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(textFromNode).join("");
  }

  return "";
}
