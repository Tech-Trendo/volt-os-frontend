"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, MessageSquare, Printer } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function QuotationResponseActions({
  quotationId,
  status,
}: {
  quotationId: string;
  status: string;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [busy, setBusy] = useState(false);
  const [showRevision, setShowRevision] = useState(false);
  const [note, setNote] = useState("");

  const respond = async (action: "accept" | "revision") => {
    setBusy(true);
    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quotationId, action, note }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        notify(data.error || "Could not update quotation.", "error");
        return;
      }
      notify(data.message || "Quotation updated.");
      setShowRevision(false);
      setNote("");
      router.refresh();
    } catch {
      notify("Network error updating quotation.", "error");
    } finally {
      setBusy(false);
    }
  };

  const locked = status === "Accepted" || status === "Converted";

  return (
    <div className="mt-4 space-y-3 border-t border-line pt-4">
      <div className="flex flex-wrap items-center gap-2">
        {!locked && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => void respond("accept")}
              className="btn-accent inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Accept Quotation
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setShowRevision((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3.5 py-2 text-xs font-medium text-ink hover:bg-surface"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Request Revision
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3.5 py-2 text-xs font-medium text-muted hover:text-ink"
        >
          <Printer className="h-3.5 w-3.5" />
          Print Quote
        </button>
      </div>

      {showRevision && (
        <div className="flex flex-wrap gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Describe desired quantity, power rating, or payment terms revision..."
            className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void respond("revision")}
            className="btn-accent rounded-lg px-4 py-2 text-xs font-medium"
          >
            Send Revision Request
          </button>
        </div>
      )}
    </div>
  );
}
