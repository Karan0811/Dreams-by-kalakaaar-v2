"use client";

import * as React from "react";
import { logger } from "@dbk/utils";

export interface UseClipboardResult {
  copy: (text: string) => Promise<void>;
  hasCopied: boolean;
}

/** `hasCopied` flips back to `false` after `resetMs` — wire it to a "Copied!"
 * label swap on a copy button. Falls back to `document.execCommand` only if
 * the async Clipboard API is unavailable (older Safari / non-HTTPS). */
export function useClipboard(resetMs = 2000): UseClipboardResult {
  const [hasCopied, setHasCopied] = React.useState(false);

  const copy = React.useCallback(
    async (text: string) => {
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(text);
        } else {
          const textarea = document.createElement("textarea");
          textarea.value = text;
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        }
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), resetMs);
      } catch (error) {
        logger.warn("Clipboard copy failed", { error: String(error) });
      }
    },
    [resetMs],
  );

  return { copy, hasCopied };
}
