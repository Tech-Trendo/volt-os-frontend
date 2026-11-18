import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { getStorefrontSession } from "@/lib/auth";
import { getErpApiBase, resolveMediaUrl } from "@/lib/erp-client";
import type { PublicCharger } from "@/lib/cms";
import { ChargerCard } from "@/components/public/charger-card";

export const dynamic = "force-dynamic";

interface WishlistRow {
  id: string;
  chargerId: string;
  charger: PublicCharger;
  createdAt: string;
}

export default async function WishlistPage() {
  const session = await getStorefrontSession();
  if (!session?.accessToken) redirect("/login?callbackUrl=/wishlist");

  let items: WishlistRow[] = [];
  try {
    const res = await fetch(`${getErpApiBase()}/public/wishlist`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as { items?: WishlistRow[] };
      items = (data.items ?? []).map((row) => ({
        ...row,
        charger: {
          ...row.charger,
          images: (row.charger.images ?? []).map(resolveMediaUrl),
        },
      }));
    }
  } catch {
    items = [];
  }

  return (
    <div className="w-full px-4 py-14 sm:px-6 lg:px-10 xl:px-14">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">My Wishlist</h1>
      <p className="mt-2 text-sm text-muted">
        Saved EV chargers you are comparing for your home or commercial installation.
      </p>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-line bg-card px-6 py-16 text-center">
          <Heart className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-3 text-base font-semibold text-ink">Your wishlist is empty</p>
          <p className="mt-1 text-sm text-muted">
            Browse our catalog and click the heart icon on any charger to save it here.
          </p>
          <Link
            href="/chargers"
            className="btn-accent mt-5 inline-block rounded-xl px-5 py-2.5 text-sm font-medium"
          >
            Browse Chargers
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((w) => (
            <ChargerCard key={w.id} charger={w.charger} initialSaved />
          ))}
        </div>
      )}
    </div>
  );
}
