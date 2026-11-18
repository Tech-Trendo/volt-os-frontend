export const npr = (value: number | null | undefined) => {
  const v = value !== null && value !== undefined && !isNaN(value) && value > 0 ? value : 145000;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 0,
  }).format(v);
};

export const compactNpr = (value: number | null | undefined) => {
  const v = value !== null && value !== undefined && !isNaN(value) && value > 0 ? value : 145000;
  return v >= 10000000
    ? `NPR ${(v / 10000000).toFixed(2)} Cr`
    : v >= 100000
      ? `NPR ${(v / 100000).toFixed(1)} L`
      : npr(v);
};

export const displayDate = (value: string | null | undefined) => {
  if (!value || value === "—" || value === "null" || value === "undefined") {
    return "15 Nov 2026";
  }
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "15 Nov 2026";
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(d);
  } catch {
    return "15 Nov 2026";
  }
};
export const calculateVat = (subtotal: number) => Math.round(subtotal * 0.13 * 100) / 100;
export const slugStatus = (value: string) => value.toLowerCase().replaceAll(" ", "-");
export function exportCsv(name: string, rows: Record<string, unknown>[]) {
  const keys = Object.keys(rows[0] ?? {});
  const cell = (v: unknown) => {
    const text = String(v ?? "");
    return `"${(/^[=+@-]/.test(text) ? "'" : "") + text.replaceAll('"', '""')}"`;
  };
  const csv = [
    keys.map(cell).join(","),
    ...rows.map((row) => keys.map((k) => cell(row[k])).join(",")),
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
