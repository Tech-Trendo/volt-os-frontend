import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearFallbackCache, fetchErpPublic } from "@/lib/erp-client";

describe("ERP-to-Storefront Sync & Last-Good Fallback Cache", () => {
  beforeEach(async () => {
    await clearFallbackCache();
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await clearFallbackCache();
  });

  it("serves updated ERP content immediately when fetched and falls back to last-good cache during ERP outage", async () => {
    const fetchMock = vi
      .fn()
      // 1st call: ERP serves v1 content
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ headline: "Nepal EV Charging v1" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      // 2nd call: ERP updated to v2 content (e.g. after CMS edit + webhook revalidation)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ headline: "Nepal EV Charging v2 - Updated" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      // 3rd call: ERP is temporarily down
      .mockRejectedValueOnce(new Error("ECONNREFUSED"));

    vi.stubGlobal("fetch", fetchMock);

    const v1 = await fetchErpPublic<{ headline: string }>("/public/pages/home", {
      tags: ["pages", "page:home"],
      fallbackValue: { headline: "Fallback" },
    });
    expect(v1.headline).toBe("Nepal EV Charging v1");

    const v2 = await fetchErpPublic<{ headline: string }>("/public/pages/home", {
      tags: ["pages", "page:home"],
      fallbackValue: { headline: "Fallback" },
    });
    expect(v2.headline).toBe("Nepal EV Charging v2 - Updated");

    // During ERP outage, storefront stays up using last-good v2 cached response
    const duringOutage = await fetchErpPublic<{ headline: string }>("/public/pages/home", {
      tags: ["pages", "page:home"],
      fallbackValue: { headline: "Fallback" },
    });
    expect(duringOutage.headline).toBe("Nepal EV Charging v2 - Updated");
  });
});
