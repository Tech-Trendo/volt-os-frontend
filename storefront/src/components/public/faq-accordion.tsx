"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export function FaqAccordion({ faqs }: { faqs: FaqEntry[] }) {
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null);
  const [activeCat, setActiveCat] = useState("All");

  const categories = ["All", ...Array.from(new Set(faqs.map((f) => f.category)))];
  const visible = activeCat === "All" ? faqs : faqs.filter((f) => f.category === activeCat);

  return (
    <div className="space-y-6">
      {categories.length > 2 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCat(cat)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                activeCat === cat ? "btn-accent" : "border border-line bg-card text-muted hover:text-ink"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
        {visible.map((item) => {
          const open = openId === item.id;
          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : item.id)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-surface/60"
                aria-expanded={open}
              >
                <span className="text-sm font-semibold text-ink sm:text-base">{item.question}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
                />
              </button>
              {open && (
                <div className="px-6 pb-5 text-sm leading-relaxed text-muted">{item.answer}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
