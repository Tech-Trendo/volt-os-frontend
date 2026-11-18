"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Heart, Zap } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export interface ChargerCardItem {
  id: string;
  slug: string;
  name: string;
  type: "AC" | "DC";
  powerKw: number;
  connectors: string[];
  priceNpr: number | null;
  showPrice: boolean;
  stockStatus: string;
  images: string[];
  brand: { name: string; slug: string };
  category?: { name: string; slug: string };
}

export function ChargerCard({
  charger,
  initialSaved = false,
}: {
  charger: ChargerCardItem;
  initialSaved?: boolean;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const { notify } = useToast();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session?.user) {
      notify("Sign in to save chargers to your wishlist.", "error");
      router.push("/login");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chargerId: charger.id }),
      });
      const data = (await res.json()) as { saved?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error || "Could not update wishlist.");
      setSaved(Boolean(data.saved));
      notify(data.saved ? "Saved to your wishlist." : "Removed from wishlist.");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Wishlist error.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Link
      href={`/chargers/${charger.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-card transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={charger.images[0] || "/uploads/chargers/abb-terra-54.jpg"}
          alt={charger.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
        />
        <span className="absolute left-3.5 top-3.5 rounded-full bg-card/90 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-ink shadow-sm border border-line">
          {charger.type} · {charger.powerKw} kW
        </span>
        <button
          type="button"
          disabled={busy}
          onClick={toggleWishlist}
          aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
          className={`absolute right-3.5 top-3.5 rounded-full border border-line bg-card/90 p-2 transition hover:scale-105 ${
            saved ? "text-rose-500" : "text-muted hover:text-ink"
          }`}
        >
          <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium text-muted">{charger.brand.name}</p>
        <h3 className="mt-1 text-base font-semibold text-ink group-hover:text-accent transition-colors">
          {charger.name}
        </h3>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {charger.connectors.map((c) => (
            <span
              key={c}
              className="rounded-md border border-line bg-surface px-2 py-0.5 text-[11px] text-muted"
            >
              {c}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-line pt-4 text-sm">
          <span className="inline-flex items-center gap-1 font-medium text-ink">
            <Zap className="h-3.5 w-3.5 text-accent" />
            {charger.powerKw} kW
          </span>
          {charger.showPrice && charger.priceNpr ? (
            <span className="font-semibold text-ink">
              NPR {charger.priceNpr.toLocaleString()}
            </span>
          ) : (
            <span className="text-xs font-medium text-muted">Request Quote</span>
          )}
        </div>
      </div>
    </Link>
  );
}
