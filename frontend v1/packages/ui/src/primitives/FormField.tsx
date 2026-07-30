import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Label } from "../primitives/Label";

export interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  children: React.ReactElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>;
}

/**
 * Every form field on the platform renders through this wrapper so
 * `htmlFor`/`id`/`aria-describedby`/`aria-invalid` are wired correctly by
 * construction (11-frontend-architecture.md §11.8), rather than each feature
 * remembering to do it by hand. Pass the input/textarea/select as `children`
 * — this wrapper clones it with the correct accessibility attributes.
 */
export function FormField({ id, label, error, description, required, children }: FormFieldProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-[var(--space-050)]">
      <Label htmlFor={id}>
        {label}
        {required ? <span aria-hidden className="ml-0.5 text-error">*</span> : null}
      </Label>
      {React.cloneElement(children, {
        id,
        "aria-describedby": describedBy,
        "aria-invalid": Boolean(error),
      })}
      {description ? (
        <p id={descriptionId} className="text-[12px] text-text-secondary">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="flex items-center gap-1 text-[12px] text-error">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  );
}
