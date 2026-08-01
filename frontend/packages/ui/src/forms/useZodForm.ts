import { useForm, type UseFormProps, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

/**
 * Collapses the repeated `useForm({ resolver: zodResolver(schema) })`
 * boilerplate seen in every existing form (LoginForm, SignupForm, ...) into
 * one call. Deliberately *not* a new Form/FormProvider/Controller-based
 * component system: the platform's established pattern is
 * `register("field")` passed straight into the existing `FormField`
 * wrapper (primitives/FormField.tsx), which already works and is simpler
 * than a Context-based alternative. This hook only removes the resolver
 * boilerplate — it doesn't change how forms are wired up.
 */
export function useZodForm<TSchema extends z.ZodType<FieldValues>>(
  schema: TSchema,
  options?: Omit<UseFormProps<z.infer<TSchema>>, "resolver">,
) {
  return useForm<z.infer<TSchema>>({
    resolver: zodResolver(schema),
    ...options,
  });
}
