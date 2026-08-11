"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface CustomDropdownOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
}

interface CustomDropdownProps {
  options: CustomDropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  dropUp?: boolean;
}

export function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  className = "",
  dropUp = false,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-xs transition hover:border-neutral-300 focus:border-neutral-900 focus:outline-none"
      >
        <span className="truncate font-medium text-neutral-800">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-neutral-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-neutral-800" : ""
          }`}
        />
      </button>

      {isOpen ? (
        <div
          className={`absolute left-0 right-0 z-50 max-h-60 overflow-auto rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl animate-in fade-in-50 zoom-in-95 ${
            dropUp ? "bottom-full mb-1.5" : "top-full mt-1.5"
          }`}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`cursor-pointer flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition ${
                  isSelected
                    ? "bg-neutral-900 font-medium text-white"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                <div className="flex flex-col">
                  <span>{option.label}</span>
                  {option.sublabel ? (
                    <span
                      className={`text-[11px] ${
                        isSelected ? "text-neutral-300" : "text-neutral-400"
                      }`}
                    >
                      {option.sublabel}
                    </span>
                  ) : null}
                </div>
                {isSelected ? <Check size={14} className="shrink-0 ml-2" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
