"use client";

import { useMutation } from "@tanstack/react-query";
import type { ExtractedTransaction } from "@/services/aiExtraction";

export interface UploadResult {
  documentId: string;
  extractionId: string;
  extractions: ExtractedTransaction[];
}

export interface SaveResult {
  saved: number;
}

export function useUploadDocument() {
  return useMutation<UploadResult, Error, File>({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/ai/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Upload failed");
      }
      return res.json();
    },
  });
}

export function useSaveExtractions() {
  return useMutation<SaveResult, Error, { documentId: string; transactions: ExtractedTransaction[] }>({
    mutationFn: async ({ documentId, transactions }) => {
      const res = await fetch("/api/ai/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, transactions }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Save failed");
      }
      return res.json();
    },
  });
}
