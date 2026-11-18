const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "h2",
  "h3",
  "h4",
  "blockquote",
  "a",
  "span",
]);

/**
 * Strips dangerous tags, event handlers, and javascript:/data: URLs from rich text HTML.
 */
export function sanitizeRichText(dirty: string): string {
  if (!dirty) return "";

  // Remove script, style, iframe, object, embed, form blocks completely
  let cleaned = dirty
    .replace(/<(script|style|iframe|object|embed|svg|math|form)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<(script|style|iframe|object|embed|svg|math|form|input|button)[^>]*\/?>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // Process remaining HTML tags against strict allowlist
  cleaned = cleaned.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (match, rawTag: string, rawAttrs: string) => {
    const tag = rawTag.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";

    if (match.startsWith("</")) {
      return `</${tag}>`;
    }

    if (tag === "a") {
      const hrefMatch = rawAttrs.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const href = (hrefMatch?.[1] ?? hrefMatch?.[2] ?? hrefMatch?.[3] ?? "").trim();
      const safeHref =
        href.startsWith("https://") ||
        href.startsWith("http://") ||
        href.startsWith("/") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
          ? href.replace(/"/g, "&quot;")
          : "#";
      return `<a href="${safeHref}" rel="noopener noreferrer">`;
    }

    return tag === "br" ? "<br />" : `<${tag}>`;
  });

  return cleaned.trim();
}
