"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, X, ChevronRight } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useUploadDocument, useSaveExtractions } from "@/hooks/useAIImport";
import type { ExtractedTransaction } from "@/types/ai";
import { SUPPORTED_CURRENCIES } from "@/lib/constants";

const CATEGORIES = [
  "Salary", "Housing", "Food & dining", "Transport", "Entertainment",
  "Healthcare", "Education", "Shopping", "Utilities", "Other",
];

type Step = "upload" | "processing" | "review" | "done";

export function AIImportClient() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [extractions, setExtractions] = useState<ExtractedTransaction[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editedRows, setEditedRows] = useState<Record<number, Partial<ExtractedTransaction>>>({});
  const [savedCount, setSavedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadDocument();
  const save = useSaveExtractions();

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleProcess = async () => {
    if (!file) return;
    setError(null);
    setStep("processing");
    try {
      const result = await upload.mutateAsync(file);
      setDocumentId(result.documentId);
      setExtractions(result.extractions);
      setSelected(new Set(result.extractions.map((_, i) => i)));
      setEditedRows({});
      setStep("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setStep("upload");
    }
  };

  const handleSave = async () => {
    if (!documentId) return;
    setError(null);
    const transactions = extractions
      .filter((_, i) => selected.has(i))
      .map((t, idx) => {
        const edit = editedRows[idx] ?? {};
        return { ...t, ...edit };
      });
    try {
      const result = await save.mutateAsync({ documentId, transactions });
      setSavedCount(result.saved);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

  const toggleRow = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const updateRow = (i: number, field: keyof ExtractedTransaction, value: unknown) => {
    setEditedRows((prev) => ({
      ...prev,
      [i]: { ...(prev[i] ?? {}), [field]: value },
    }));
  };

  const getRow = (i: number) => ({ ...extractions[i], ...(editedRows[i] ?? {}) });

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Upload step
  if (step === "upload") {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-base font-semibold mb-1">Import from Document</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Upload a bank statement, card statement, or receipt. AI will extract transactions for your review.
          </p>

          <div
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "rounded-xl border-2 border-dashed p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors",
              isDragging ? "border-foreground bg-muted/40" : "border-border hover:border-foreground/40 hover:bg-muted/20"
            )}
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">Drop file here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG, JPEG — max 25MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={onFileChange}
              className="hidden"
            />
          </div>

          {file && (
            <div className="mt-3 flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
              <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="p-1 rounded hover:bg-muted text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            disabled={!file || upload.isPending}
            onClick={handleProcess}
            className="mt-4 w-full bg-foreground text-background rounded-md px-3 py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Process with AI <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Processing step
  if (step === "processing") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        <p className="text-sm font-medium">Extracting transactions…</p>
        <p className="text-xs text-muted-foreground">This may take a moment</p>
      </div>
    );
  }

  // Review step
  if (step === "review") {
    const selectedCount = selected.size;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Review Extracted Transactions</h2>
            <p className="text-sm text-muted-foreground">{extractions.length} transactions found — select which to save</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelected(new Set(extractions.map((_, i) => i)))}
              className="text-xs px-3 py-1.5 rounded border hover:bg-muted transition-colors"
            >
              Select all
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs px-3 py-1.5 rounded border hover:bg-muted transition-colors"
            >
              Deselect all
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="w-8 p-3 text-left"></th>
                  <th className="p-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                  <th className="p-3 text-left text-xs font-medium text-muted-foreground">Merchant</th>
                  <th className="p-3 text-left text-xs font-medium text-muted-foreground">Description</th>
                  <th className="p-3 text-right text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="p-3 text-left text-xs font-medium text-muted-foreground">Currency</th>
                  <th className="p-3 text-left text-xs font-medium text-muted-foreground">Type</th>
                  <th className="p-3 text-left text-xs font-medium text-muted-foreground">Category</th>
                  <th className="p-3 text-left text-xs font-medium text-muted-foreground">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {extractions.map((_, i) => {
                  const row = getRow(i);
                  const isSelected = selected.has(i);
                  return (
                    <tr
                      key={i}
                      className={cn(
                        "border-b last:border-0 transition-colors",
                        isSelected ? "bg-background" : "bg-muted/20 opacity-60"
                      )}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(i)}
                          className="rounded"
                        />
                      </td>
                      <td className="p-3 text-xs tabular-nums whitespace-nowrap">{row.date}</td>
                      <td className="p-3 text-xs max-w-[120px] truncate">{row.merchant}</td>
                      <td className="p-3 text-xs max-w-[160px] truncate text-muted-foreground">{row.description}</td>
                      <td className="p-3 text-xs text-right tabular-nums font-medium">
                        {formatCurrency(row.amount, row.currency)}
                      </td>
                      <td className="p-3">
                        <select
                          value={row.currency}
                          onChange={(e) => updateRow(i, "currency", e.target.value)}
                          className="h-7 px-1 rounded border bg-background text-xs focus:outline-none"
                        >
                          {SUPPORTED_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded-full font-medium",
                            row.type === "INCOME" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          )}
                        >
                          {row.type}
                        </span>
                      </td>
                      <td className="p-3">
                        <select
                          value={row.suggestedCategory}
                          onChange={(e) => updateRow(i, "suggestedCategory", e.target.value)}
                          className="h-7 px-1 rounded border bg-background text-xs focus:outline-none"
                        >
                          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                row.confidence >= 0.8 ? "bg-green-500" : row.confidence >= 0.5 ? "bg-yellow-500" : "bg-red-500"
                              )}
                              style={{ width: `${Math.round(row.confidence * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {Math.round(row.confidence * 100)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => { setStep("upload"); setFile(null); setExtractions([]); }}
            className="text-sm px-4 py-2 rounded-md border hover:bg-muted transition-colors"
          >
            Start over
          </button>
          <button
            onClick={handleSave}
            disabled={selectedCount === 0 || save.isPending}
            className="bg-foreground text-background rounded-md px-4 py-2 text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save selected ({selectedCount})
          </button>
        </div>
      </div>
    );
  }

  // Done step
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
      <CheckCircle2 className="h-12 w-12 text-green-500" />
      <div className="text-center">
        <p className="text-base font-semibold">{savedCount} transactions saved</p>
        <p className="text-sm text-muted-foreground mt-1">Your transactions have been imported successfully</p>
      </div>
      <div className="flex items-center gap-3 mt-2">
        <a
          href="/dashboard/transactions"
          className="bg-foreground text-background rounded-md px-4 py-2 text-sm font-medium hover:bg-foreground/90 transition-colors"
        >
          View transactions
        </a>
        <button
          onClick={() => { setStep("upload"); setFile(null); setExtractions([]); setSavedCount(0); }}
          className="text-sm px-4 py-2 rounded-md border hover:bg-muted transition-colors"
        >
          Import another
        </button>
      </div>
    </div>
  );
}
