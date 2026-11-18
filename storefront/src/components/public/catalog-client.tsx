"use client";

import React, { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { ChargerCard, type ChargerCardItem } from "./charger-card";

interface BrandOpt {
  id: string;
  name: string;
  slug: string;
}

interface CategoryOpt {
  id: string;
  name: string;
  slug: string;
}

export function CatalogClient({
  chargers,
  brands,
  categories,
  savedIds,
}: {
  chargers: ChargerCardItem[];
  brands: BrandOpt[];
  categories: CategoryOpt[];
  savedIds: string[];
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "AC" | "DC">("ALL");
  const [powerRange, setPowerRange] = useState<"ALL" | "UNDER_25" | "25_80" | "OVER_80">("ALL");
  const [connector, setConnector] = useState("ALL");
  const [brandSlug, setBrandSlug] = useState("ALL");
  const [categorySlug, setCategorySlug] = useState("ALL");
  const [sortBy, setSortBy] = useState<"order" | "power-asc" | "power-desc" | "name-asc">("order");
  const [visibleCount, setVisibleCount] = useState(6);

  const allConnectors = useMemo(() => {
    const set = new Set<string>();
    for (const c of chargers) c.connectors.forEach((conn) => set.add(conn));
    return Array.from(set).sort();
  }, [chargers]);

  const filtered = useMemo(() => {
    let list = chargers.filter((c) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.brand.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (typeFilter !== "ALL" && c.type !== typeFilter) return false;
      if (brandSlug !== "ALL" && c.brand.slug !== brandSlug) return false;
      if (categorySlug !== "ALL" && c.category?.slug !== categorySlug) return false;
      if (connector !== "ALL" && !c.connectors.includes(connector)) return false;
      if (powerRange === "UNDER_25" && c.powerKw > 25) return false;
      if (powerRange === "25_80" && (c.powerKw <= 25 || c.powerKw > 80)) return false;
      if (powerRange === "OVER_80" && c.powerKw <= 80) return false;
      return true;
    });

    if (sortBy === "power-asc") list = [...list].sort((a, b) => a.powerKw - b.powerKw);
    if (sortBy === "power-desc") list = [...list].sort((a, b) => b.powerKw - a.powerKw);
    if (sortBy === "name-asc") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [chargers, search, typeFilter, powerRange, connector, brandSlug, categorySlug, sortBy]);

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("ALL");
    setPowerRange("ALL");
    setConnector("ALL");
    setBrandSlug("ALL");
    setCategorySlug("ALL");
    setSortBy("order");
  };

  const hasActiveFilter =
    search !== "" ||
    typeFilter !== "ALL" ||
    powerRange !== "ALL" ||
    connector !== "ALL" ||
    brandSlug !== "ALL" ||
    categorySlug !== "ALL";

  const savedSet = useMemo(() => new Set(savedIds), [savedIds]);

  return (
    <div className="space-y-8">
      {/* Filter Bar */}
      <div className="rounded-2xl border border-line bg-card p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <input
              type="search"
              placeholder="Search chargers or brands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <select
            aria-label="Filter by charger type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "ALL" | "AC" | "DC")}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
          >
            <option value="ALL">All Types (AC & DC)</option>
            <option value="AC">AC Wallboxes</option>
            <option value="DC">DC Fast Chargers</option>
          </select>

          <select
            aria-label="Filter by power range"
            value={powerRange}
            onChange={(e) =>
              setPowerRange(e.target.value as "ALL" | "UNDER_25" | "25_80" | "OVER_80")
            }
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
          >
            <option value="ALL">Any Power (kW)</option>
            <option value="UNDER_25">Up to 22 kW</option>
            <option value="25_80">30 – 80 kW</option>
            <option value="OVER_80">100 kW+</option>
          </select>

          <select
            aria-label="Filter by connector"
            value={connector}
            onChange={(e) => setConnector(e.target.value)}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
          >
            <option value="ALL">All Connectors</option>
            {allConnectors.map((conn) => (
              <option key={conn} value={conn}>
                {conn}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by brand"
            value={brandSlug}
            onChange={(e) => setBrandSlug(e.target.value)}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
          >
            <option value="ALL">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCategorySlug("ALL")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                categorySlug === "ALL"
                  ? "btn-accent"
                  : "border border-line text-muted hover:text-ink"
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategorySlug(cat.slug)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  categorySlug === cat.slug
                    ? "btn-accent"
                    : "border border-line text-muted hover:text-ink"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilter && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-ink"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted" />
            <select
              aria-label="Sort chargers"
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "order" | "power-asc" | "power-desc" | "name-asc")
              }
              className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-ink"
            >
              <option value="order">Featured Order</option>
              <option value="power-asc">Power: Low to High</option>
              <option value="power-desc">Power: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-line bg-card px-6 py-16 text-center">
          <p className="text-base font-semibold text-ink">No chargers match your filters</p>
          <p className="mt-1 text-sm text-muted">
            Try adjusting power range, connector type, or clearing your search query.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="btn-accent mt-5 rounded-lg px-4 py-2 text-xs font-medium"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted">
            Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} chargers
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.slice(0, visibleCount).map((charger) => (
              <ChargerCard key={charger.id} charger={charger} initialSaved={savedSet.has(charger.id)} />
            ))}
          </div>
          {visibleCount < filtered.length && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((n) => n + 8)}
                className="rounded-lg border border-line bg-card px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-surface"
              >
                Load more chargers
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
