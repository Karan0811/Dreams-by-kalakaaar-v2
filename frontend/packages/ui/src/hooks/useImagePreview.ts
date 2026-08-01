"use client";

import * as React from "react";

/** Turns a `File | null` into a preview URL, revoking the previous object
 * URL whenever `file` changes or the component unmounts — get this wrong
 * by hand and object URLs leak for the life of the tab. Returns `null`
 * when `file` is `null`. */
export function useImagePreview(file: File | null): string | null {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return previewUrl;
}
