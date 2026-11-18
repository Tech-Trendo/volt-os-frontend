export function rangeFactor(range: string, start?: string, end?: string) {
  if (range === "This quarter") return 2.7;
  if (range === "This fiscal year") return 8.4;
  if (range === "Custom range" && start && end) {
    const days = Math.max(0, Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1);
    return days / 30;
  }
  return 1;
}
