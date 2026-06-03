"use client";

import * as React from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const baseInputClass =
  "flex h-10 w-full cursor-text rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--foreground)] shadow-sm shadow-slate-900/4 outline-none transition-all placeholder:font-normal placeholder:text-[var(--muted)] focus:border-[var(--brand-600)] focus:shadow-[var(--ring)] disabled:cursor-not-allowed disabled:bg-[var(--surface-soft)] disabled:opacity-70";

const monthNames = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const shortDayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function Input({ className, type, ...props }: InputProps) {
  if (type === "date") {
    return <DatePickerInput className={className} {...props} />;
  }

  if (type === "month") {
    return <MonthPickerInput className={className} {...props} />;
  }

  return (
    <input
      type={type}
      className={cn(
        baseInputClass,
        type === "time" &&
          "cursor-pointer [color-scheme:light] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:rounded-md [&::-webkit-calendar-picker-indicator]:p-1 [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:transition hover:[&::-webkit-calendar-picker-indicator]:bg-[var(--surface-soft)] hover:[&::-webkit-calendar-picker-indicator]:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

function DatePickerInput({
  className,
  value,
  defaultValue,
  disabled,
  name,
  id,
  placeholder = "Pilih tanggal",
  onChange,
  onBlur,
}: Omit<InputProps, "type">) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState(
    defaultValue?.toString() ?? "",
  );
  const [isOpen, setIsOpen] = React.useState(false);
  const currentValue = (isControlled ? value?.toString() : internalValue) ?? "";
  const selectedDate = React.useMemo(() => parseDateValue(currentValue), [currentValue]);
  const [viewDate, setViewDate] = React.useState(selectedDate ?? new Date());

  React.useEffect(() => {
    if (selectedDate) {
      setViewDate(selectedDate);
    }
  }, [selectedDate]);

  useCloseOnOutside(rootRef, () => setIsOpen(false));

  function updateValue(nextValue: string) {
    if (!isControlled) {
      setInternalValue(nextValue);
    }

    emitInputChange(onChange, nextValue, name, id);
  }

  function chooseDate(date: Date) {
    updateValue(toDateValue(date));
    setIsOpen(false);
    buttonRef.current?.focus();
  }

  return (
    <div ref={rootRef} className="relative w-full">
      {name ? <input type="hidden" name={name} value={currentValue} /> : null}
      <button
        id={id}
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onBlur={(event) => onBlur?.(event as unknown as React.FocusEvent<HTMLInputElement>)}
        onClick={() => setIsOpen((current) => !current)}
        className={cn(
          baseInputClass,
          "cursor-pointer items-center justify-between gap-3 text-left",
          isOpen && "border-[var(--brand-600)] shadow-[var(--ring)]",
          className,
        )}
      >
        <span className={cn("truncate", !selectedDate && "text-[var(--muted)]")}>
          {selectedDate ? formatDateDisplay(selectedDate) : placeholder}
        </span>
        <CalendarDays className="h-4 w-4 shrink-0 text-[var(--muted)]" />
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-[calc(100%+0.375rem)] z-50 w-[21rem] max-w-[calc(100vw-2rem)] rounded-md border border-[var(--border)] bg-white p-3 shadow-xl shadow-slate-900/12">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              className="min-w-0 rounded-md px-2 py-1.5 text-left text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]"
              onClick={() => setViewDate(new Date())}
            >
              {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
            </button>
            <div className="flex gap-1">
              <IconButton
                label="Bulan sebelumnya"
                onClick={() => setViewDate(addMonths(viewDate, -1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </IconButton>
              <IconButton
                label="Bulan berikutnya"
                onClick={() => setViewDate(addMonths(viewDate, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </IconButton>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[var(--muted)]">
            {shortDayNames.map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {buildCalendarDays(viewDate).map((date) => {
              const isSelected = selectedDate ? sameDay(date, selectedDate) : false;
              const isToday = sameDay(date, new Date());
              const isOutsideMonth = date.getMonth() !== viewDate.getMonth();

              return (
                <button
                  key={toDateValue(date)}
                  type="button"
                  onClick={() => chooseDate(date)}
                  className={cn(
                    "flex h-9 items-center justify-center rounded-md text-sm font-semibold transition",
                    isOutsideMonth
                      ? "text-[var(--muted)] hover:bg-[var(--surface-soft)]"
                      : "text-[var(--foreground)] hover:bg-[var(--surface-soft)]",
                    isToday && "ring-1 ring-[var(--brand-500)]",
                    isSelected &&
                      "bg-[var(--brand-700)] text-white shadow-sm shadow-teal-950/15 hover:bg-[var(--brand-700)]",
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold text-[var(--muted-strong)] transition hover:bg-[var(--surface-soft)]"
              onClick={() => updateValue("")}
            >
              <X className="h-4 w-4" />
              Clear
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold text-[var(--brand-700)] transition hover:bg-[var(--surface-soft)]"
              onClick={() => chooseDate(new Date())}
            >
              <Clock className="h-4 w-4" />
              Hari ini
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MonthPickerInput({
  className,
  value,
  defaultValue,
  disabled,
  name,
  id,
  placeholder = "Pilih bulan",
  onChange,
  onBlur,
}: Omit<InputProps, "type">) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState(
    defaultValue?.toString() ?? "",
  );
  const [isOpen, setIsOpen] = React.useState(false);
  const currentValue = (isControlled ? value?.toString() : internalValue) ?? "";
  const selectedMonth = parseMonthValue(currentValue);
  const [viewYear, setViewYear] = React.useState(
    selectedMonth?.year ?? new Date().getFullYear(),
  );

  useCloseOnOutside(rootRef, () => setIsOpen(false));

  function updateValue(nextValue: string) {
    if (!isControlled) {
      setInternalValue(nextValue);
    }

    emitInputChange(onChange, nextValue, name, id);
  }

  function chooseMonth(monthIndex: number) {
    updateValue(`${viewYear}-${String(monthIndex + 1).padStart(2, "0")}`);
    setIsOpen(false);
    buttonRef.current?.focus();
  }

  return (
    <div ref={rootRef} className="relative w-full">
      {name ? <input type="hidden" name={name} value={currentValue} /> : null}
      <button
        id={id}
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onBlur={(event) => onBlur?.(event as unknown as React.FocusEvent<HTMLInputElement>)}
        onClick={() => setIsOpen((current) => !current)}
        className={cn(
          baseInputClass,
          "cursor-pointer items-center justify-between gap-3 text-left",
          isOpen && "border-[var(--brand-600)] shadow-[var(--ring)]",
          className,
        )}
      >
        <span className={cn("truncate", !selectedMonth && "text-[var(--muted)]")}>
          {selectedMonth
            ? `${monthNames[selectedMonth.month]} ${selectedMonth.year}`
            : placeholder}
        </span>
        <CalendarDays className="h-4 w-4 shrink-0 text-[var(--muted)]" />
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-[calc(100%+0.375rem)] z-50 w-[20rem] max-w-[calc(100vw-2rem)] rounded-md border border-[var(--border)] bg-white p-3 shadow-xl shadow-slate-900/12">
          <div className="flex items-center justify-between">
            <IconButton label="Tahun sebelumnya" onClick={() => setViewYear((year) => year - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </IconButton>
            <p className="text-sm font-semibold text-[var(--foreground)]">{viewYear}</p>
            <IconButton label="Tahun berikutnya" onClick={() => setViewYear((year) => year + 1)}>
              <ChevronRight className="h-4 w-4" />
            </IconButton>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {monthNames.map((month, index) => {
              const isSelected =
                selectedMonth?.year === viewYear && selectedMonth.month === index;

              return (
                <button
                  key={month}
                  type="button"
                  onClick={() => chooseMonth(index)}
                  className={cn(
                    "rounded-md border border-transparent px-3 py-2 text-sm font-semibold transition hover:bg-[var(--surface-soft)]",
                    isSelected &&
                      "border-[var(--brand-600)] bg-[var(--brand-700)] text-white hover:bg-[var(--brand-700)]",
                  )}
                >
                  {month.slice(0, 3)}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex justify-between border-t border-[var(--border)] pt-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold text-[var(--muted-strong)] transition hover:bg-[var(--surface-soft)]"
              onClick={() => updateValue("")}
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function IconButton({
  label,
  children,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--muted-strong)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
    >
      {children}
    </button>
  );
}

function useCloseOnOutside(
  ref: React.RefObject<HTMLDivElement | null>,
  onClose: () => void,
) {
  React.useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [onClose, ref]);
}

function emitInputChange(
  onChange: InputProps["onChange"],
  nextValue: string,
  name?: string,
  id?: string,
) {
  const event = {
    target: { value: nextValue, name, id },
    currentTarget: { value: nextValue, name, id },
  } as unknown as React.ChangeEvent<HTMLInputElement>;

  onChange?.(event);
}

function parseDateValue(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function parseMonthValue(value: string) {
  if (!/^\d{4}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month] = value.split("-").map(Number);
  return { year, month: month - 1 };
}

function toDateValue(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDateDisplay(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function buildCalendarDays(viewDate: Date) {
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }).map((_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });
}

function sameDay(dateA: Date, dateB: Date) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}
