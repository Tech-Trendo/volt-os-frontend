"use client";

import React, { useState } from "react";
import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

export function ChargerGallery({
  images,
  name,
  chargerId,
  initialSaved,
}: {
  images: string[];
  name: string;
  chargerId: string;
  initialSaved: boolean;
}) {
  const safeImages = images.length > 0 ? images : ["/uploads/chargers/abb-terra-54.jpg"];
  const [activeIdx, setActiveIdx] = useState(0);
  const [saved, setSaved] = useState(initialSaved);
  const { data: session } = useSession();
  const router = useRouter();
  const { notify } = useToast();

  const toggleSave = async () => {
    if (!session?.user) {
      notify("Sign in to save chargers to your wishlist.", "error");
      router.push("/login");
      return;
    }
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chargerId }),
    });
    const data = (await res.json()) as { saved?: boolean; error?: string };
    if (res.ok) {
      setSaved(Boolean(data.saved));
      notify(data.saved ? "Saved to your wishlist." : "Removed from wishlist.");
    } else {
      notify(data.error || "Unable to update wishlist.", "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={safeImages[activeIdx]}
          alt={name}
          className="h-full w-full object-cover"
        />
        <button
          type="button"
          onClick={() => void toggleSave()}
          className={`absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-xs font-medium shadow-sm ${
            saved ? "text-rose-500" : "text-muted hover:text-ink"
          }`}
        >
          <Heart className={`h-3.5 w-3.5 ${saved ? "fill-current" : ""}`} />
          {saved ? "Saved" : "Save"}
        </button>
      </div>

      {safeImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto">
          {safeImages.map((img, i) => (
            <button
              key={`${img}-${i}`}
              type="button"
              onClick={() => setActiveIdx(i)}
              className={`h-20 w-24 shrink-0 overflow-hidden rounded-xl border p-1.5 transition ${
                activeIdx === i ? "border-accent ring-1 ring-accent" : "border-line bg-card"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`${name} view ${i + 1}`} className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
