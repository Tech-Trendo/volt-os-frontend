import { describe, expect, it } from "vitest";
import { sanitizeRichText } from "@/lib/sanitize";

describe("Rich text XSS sanitizer", () => {
  it("strips script tags, iframes, and inline event handlers while keeping safe formatting", () => {
    const dirty =
      '<p>Hello <strong>Nepal</strong></p><script>alert("xss")</script><iframe src="https://evil.test"></iframe><a href="javascript:alert(1)" onclick="steal()">Click</a>';
    const clean = sanitizeRichText(dirty);

    expect(clean).toContain("<p>Hello <strong>Nepal</strong></p>");
    expect(clean).not.toContain("<script");
    expect(clean).not.toContain("<iframe");
    expect(clean).not.toContain("javascript:");
    expect(clean).not.toContain("onclick");
  });
});
