"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@dbk/utils";
import { Input } from "../primitives/Input";
import { Popover, PopoverAnchor, PopoverContent } from "../overlays/Popover";

export interface AutocompleteOption {
  value: string;
  label: string;
}

export interface AutocompleteProps {
  options: AutocompleteOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  emptyMessage?: string;
  id?: string;
  hasError?: boolean;
  disabled?: boolean;
}

/**
 * A deliberately minimal combobox — Popover + Input + a manually-managed
 * ARIA combobox pattern — rather than adopting `cmdk`. That's the right
 * trade-off while every use case is a short, client-side-filterable list
 * (category picker, tag picker); if a future screen needs fuzzy search over
 * thousands of items server-side, that's a real reason to add `cmdk` or a
 * dedicated async-search component at that point, not something to build in
 * speculatively now.
 */
export function Autocomplete({
  options,
  value,
  onChange,
  placeholder = "Search…",
  emptyMessage = "No matches",
  id,
  hasError,
  disabled,
}: AutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const listboxId = React.useId();

  const selected = options.find((o) => o.value === value) ?? null;
  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  function selectOption(option: AutocompleteOption) {
    onChange(option.value);
    setQuery("");
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const option = filtered[activeIndex];
      if (option) selectOption(option);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          hasError={hasError}
          disabled={disabled}
          placeholder={placeholder}
          value={open ? query : (selected?.label ?? "")}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
      </PopoverAnchor>
      <PopoverContent
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="max-h-64 w-(--radix-popover-trigger-width) overflow-y-auto p-1"
      >
        <ul id={listboxId} role="listbox">
          {filtered.length === 0 ? (
            <li className="px-2 py-2 text-[13px] text-text-secondary">{emptyMessage}</li>
          ) : (
            filtered.map((option, index) => (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => selectOption(option)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "flex min-h-[var(--size-touch-target-min)] w-full items-center justify-between gap-2 rounded-[var(--radius-100)] px-2 py-2 text-left text-[14px] text-text-primary",
                    index === activeIndex ? "bg-background-subtle" : undefined,
                  )}
                >
                  {option.label}
                  {option.value === value ? <Check className="size-4 text-brand-primary" aria-hidden /> : null}
                </button>
              </li>
            ))
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
