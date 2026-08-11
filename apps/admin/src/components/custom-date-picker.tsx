"use client";

import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD string
  onChange: (value: string) => void;
  placeholder?: string;
  dropUp?: boolean;
}

export function CustomDatePicker({
  value,
  onChange,
  placeholder = "Select expiration date",
  dropUp = false,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current selected date or default to today for calendar view
  const parsedDate = value ? new Date(value + "T00:00:00Z") : new Date();
  const [viewYear, setViewYear] = useState<number>(parsedDate.getUTCFullYear());
  const [viewMonth, setViewMonth] = useState<number>(parsedDate.getUTCMonth()); // 0-indexed

  useEffect(() => {
    if (value) {
      const d = new Date(value + "T00:00:00Z");
      if (!isNaN(d.getTime())) {
        setViewYear(d.getUTCFullYear());
        setViewMonth(d.getUTCMonth());
      }
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const formattedMonth = String(viewMonth + 1).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");
    const dateStr = `${viewYear}-${formattedMonth}-${formattedDay}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleAddDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const dateStr = d.toISOString().split("T")[0];
    onChange(dateStr);
    setIsOpen(false);
  };

  // Generate calendar grid days
  const firstDayOfMonth = new Date(Date.UTC(viewYear, viewMonth, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();

  const formattedDisplay = value
    ? new Date(value + "T00:00:00Z").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
    : "";

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="cursor-pointer flex flex-1 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-xs transition hover:border-neutral-300 focus:border-neutral-900 focus:outline-none"
        >
          <CalendarIcon size={16} className="text-neutral-500 shrink-0" />
          <span className={`truncate text-xs font-medium ${formattedDisplay ? "text-neutral-900" : "text-neutral-400"}`}>
            {formattedDisplay || placeholder}
          </span>
        </button>

        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            title="Clear Expiration Date"
            className="cursor-pointer rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      {isOpen ? (
        <div
          className={`absolute left-0 z-50 w-72 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl animate-in fade-in-50 zoom-in-95 ${
            dropUp ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          {/* Quick Presets */}
          <div className="mb-3 flex flex-wrap gap-1 border-b border-neutral-100 pb-3 text-[11px]">
            <button
              type="button"
              onClick={() => handleAddDays(30)}
              className="cursor-pointer rounded-md bg-neutral-100 px-2 py-1 font-medium text-neutral-700 hover:bg-neutral-900 hover:text-white transition"
            >
              +30 Days
            </button>
            <button
              type="button"
              onClick={() => handleAddDays(90)}
              className="cursor-pointer rounded-md bg-neutral-100 px-2 py-1 font-medium text-neutral-700 hover:bg-neutral-900 hover:text-white transition"
            >
              +90 Days
            </button>
            <button
              type="button"
              onClick={() => handleAddDays(365)}
              className="cursor-pointer rounded-md bg-neutral-100 px-2 py-1 font-medium text-neutral-700 hover:bg-neutral-900 hover:text-white transition"
            >
              +1 Year
            </button>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="cursor-pointer rounded-md bg-red-50 px-2 py-1 font-medium text-red-600 hover:bg-red-600 hover:text-white transition"
            >
              Never
            </button>
          </div>

          {/* Month / Year Header */}
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-900">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="cursor-pointer rounded-md p-1 text-neutral-600 hover:bg-neutral-100 transition"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="cursor-pointer rounded-md p-1 text-neutral-600 hover:bg-neutral-100 transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-semibold text-neutral-400">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const formattedMonth = String(viewMonth + 1).padStart(2, "0");
              const formattedDay = String(day).padStart(2, "0");
              const currentCellDate = `${viewYear}-${formattedMonth}-${formattedDay}`;
              const isSelected = value === currentCellDate;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`cursor-pointer h-7 w-7 rounded-lg text-xs font-medium transition flex items-center justify-center ${
                    isSelected
                      ? "bg-neutral-900 text-white font-bold"
                      : "text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
