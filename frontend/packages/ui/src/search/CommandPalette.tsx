"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Search } from "lucide-react";
import { cn } from "@dbk/utils";
import { Dialog, DialogContent } from "../overlays/Dialog";
import { EmptyState } from "../feedback/EmptyState";

export interface CommandPaletteItem {
  id: string;
  label: string;
  group?: string;
  icon?: LucideIcon;
  keywords?: string[];
  onSelect: () => void;
}

export interface CommandPaletteProps {
  items: CommandPaletteItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeholder?: string;
  emptyMessage?: string;
}

/**
 * A generic command-palette *foundation* — filterable list, arrow-key
 * navigation, Enter to select, grouped headers — with zero knowledge of
 * what the commands actually are. A future Products-search or
 * "quick actions" palette would supply `items` and use this component as
 * the shell; building that item list is explicitly out of scope here.
 */
export function CommandPalette({
  items,
  open,
  onOpenChange,
  placeholder = "Type a command or search…",
  emptyMessage = "No matching commands",
}: CommandPaletteProps) {
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return items;
    const lower = query.toLowerCase();
    return items.filter(
      (item) => item.label.toLowerCase().includes(lower) || item.keywords?.some((k) => k.toLowerCase().includes(lower)),
    );
  }, [items, query]);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const selectItem = (item: CommandPaletteItem | undefined) => {
    if (!item) return;
    item.onSelect();
    onOpenChange(false);
  };
  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
  if (open) {
    inputRef.current?.focus();
  }
}, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton className="max-w-[560px] p-0 top-[20%] translate-y-0">
        <div className="flex items-center gap-2 border-b border-border px-[var(--space-200)]">
          <Search className="size-4 shrink-0 text-text-secondary" aria-hidden />
          <input
            role="combobox"
            ref={inputRef}
            aria-expanded={open}
            aria-controls="command-palette-list"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                selectItem(filtered[activeIndex]);
              }
            }}
            placeholder={placeholder}
            className="h-12 w-full bg-transparent text-[14px] text-text-primary placeholder:text-text-placeholder focus:outline-none"
          />
        </div>

        <div id="command-palette-list" role="listbox" className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <EmptyState title={emptyMessage} className="border-none bg-transparent py-[var(--space-400)]" />
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  onClick={() => selectItem(item)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "flex min-h-[var(--size-touch-target-min)] w-full items-center gap-2 rounded-[var(--radius-100)] px-2 text-left text-[14px] text-text-primary",
                    index === activeIndex ? "bg-background-subtle" : undefined,
                  )}
                >
                  {Icon ? <Icon className="size-4 shrink-0 text-text-secondary" aria-hidden /> : null}
                  {item.label}
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
