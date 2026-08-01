"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@dbk/utils";
import { Input, type InputProps } from "./Input";

export interface SearchInputProps extends Omit<InputProps, "type"> {
  onClear?: () => void;
}

/** Search field with a leading icon and a clear button that only appears
 * once there's a value (§14's Search Input row). Forwards its ref/props so
 * it works as a controlled or uncontrolled input, including with
 * react-hook-form's `register()`. */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, value, defaultValue, ...props }, ref) => {
    const innerRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

    const hasValue = value !== undefined ? Boolean(value) : undefined;

    return (
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-[var(--size-icon-md)] -translate-y-1/2 text-text-secondary"
          aria-hidden
        />
        <Input
          ref={innerRef}
          type="search"
          value={value}
          defaultValue={defaultValue}
          className={cn("pl-10", onClear ? "pr-10" : undefined, className)}
          {...props}
        />
        {onClear && (hasValue ?? Boolean(innerRef.current?.value)) ? (
          <button
            type="button"
            onClick={() => {
              if (innerRef.current) innerRef.current.value = "";
              onClear();
            }}
            aria-label="Clear search"
            className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>
    );
  },
);
SearchInput.displayName = "SearchInput";
