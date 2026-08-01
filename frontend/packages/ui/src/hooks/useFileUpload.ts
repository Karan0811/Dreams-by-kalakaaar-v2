"use client";

import * as React from "react";
import { validateImageUpload } from "@dbk/utils";

export type UploadFileStatus = "pending" | "uploading" | "success" | "error";

export interface UploadFileEntry {
  id: string;
  file: File;
  status: UploadFileStatus;
  progress: number;
  error?: string;
}

export interface UseFileUploadOptions {
  /**
   * Performs the actual upload for one file — this hook has no backend
   * knowledge of its own (per this sprint's brief: abstraction only). Call
   * `onProgress(percent)` from inside this function if the underlying
   * transport reports progress (e.g. an `XMLHttpRequest` `progress` event);
   * omit it and progress just jumps from 0 to 100 on completion.
   */
  upload: (file: File, onProgress: (percent: number) => void) => Promise<void>;
  /** Defaults to `validateImageUpload` from `@dbk/utils`. Pass your own for
   * non-image uploads, or `() => {}` to skip validation entirely. Throw a
   * `ValidationError` (or anything with a `.message`) to reject a file. */
  validate?: (file: File) => void;
  maxFiles?: number;
}

export interface UseFileUploadResult {
  files: UploadFileEntry[];
  addFiles: (fileList: FileList | File[]) => void;
  removeFile: (id: string) => void;
  retryFile: (id: string) => void;
  reset: () => void;
  isUploading: boolean;
}

/** Generic drag-and-drop/multi-file upload queue: validates each file on
 * add, uploads sequentially via the caller-supplied `upload` function,
 * tracks per-file progress/status, and supports retrying a single failed
 * file without re-uploading the rest. Pairs with `FileDropzone` and
 * `UploadProgressItem`. */
export function useFileUpload({
  upload,
  validate = validateImageUpload,
  maxFiles,
}: UseFileUploadOptions): UseFileUploadResult {
  const [files, setFiles] = React.useState<UploadFileEntry[]>([]);

  const runUpload = React.useCallback(
    (entry: UploadFileEntry) => {
      setFiles((prev) => prev.map((f) => (f.id === entry.id ? { ...f, status: "uploading", error: undefined } : f)));

      upload(entry.file, (percent) => {
        setFiles((prev) => prev.map((f) => (f.id === entry.id ? { ...f, progress: percent } : f)));
      })
        .then(() => {
          setFiles((prev) =>
            prev.map((f) => (f.id === entry.id ? { ...f, status: "success", progress: 100 } : f)),
          );
        })
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : "Upload failed. Please try again.";
          setFiles((prev) => prev.map((f) => (f.id === entry.id ? { ...f, status: "error", error: message } : f)));
        });
    },
    [upload],
  );

  const addFiles = React.useCallback(
    (fileList: FileList | File[]) => {
      const incoming = Array.from(fileList);
      const room = maxFiles ? Math.max(maxFiles - files.length, 0) : incoming.length;
      const accepted = incoming.slice(0, room);

      const entries: UploadFileEntry[] = accepted.map((file) => {
        try {
          validate(file);
          return { id: crypto.randomUUID(), file, status: "pending" as const, progress: 0 };
        } catch (error) {
          const message = error instanceof Error ? error.message : "This file can't be uploaded.";
          return { id: crypto.randomUUID(), file, status: "error" as const, progress: 0, error: message };
        }
      });

      setFiles((prev) => [...prev, ...entries]);
      entries.filter((e) => e.status === "pending").forEach(runUpload);
    },
    [files.length, maxFiles, runUpload, validate],
  );

  const removeFile = React.useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const retryFile = React.useCallback(
    (id: string) => {
      const entry = files.find((f) => f.id === id);
      if (entry) runUpload(entry);
    },
    [files, runUpload],
  );

  const reset = React.useCallback(() => setFiles([]), []);

  return {
    files,
    addFiles,
    removeFile,
    retryFile,
    reset,
    isUploading: files.some((f) => f.status === "uploading"),
  };
}
