# Volt OS Public EV Charger Storefront (Stateless Next.js)

This Next.js App Router application is the customer-facing storefront for the Volt OS EV Charger Import ERP. It owns **no database** for CMS content or customer enquiries—the Django ERP (`../backend`) is the single source of truth.

## Key Capabilities

- **100% ERP-Driven Content**: Hero, About, Services, Chargers catalog, Brands, Categories, Testimonials, FAQs, Navigation, Footer, Contact details, SEO metadata, and theme accent color are fetched from `/api/public/*` on the Django ERP.
- **Instant ERP → Storefront Sync**: When a Super Admin publishes a change in the ERP CMS, Django sends an HMAC-SHA256 signed webhook to `POST /api/revalidate`, which validates the timestamp and signature and triggers `revalidateTag` / `revalidatePath`.
- **Resilient Availability**: Public API reads persist a last-good cache so the storefront remains available if the ERP is briefly restarting or offline.
- **Lossless Storefront → ERP Enquiries**: Contact and "Request a Quote" forms post to `POST /api/enquiries`, which signs requests with API key + HMAC-SHA256 and forwards them to Django's `POST /api/public/enquiries` (creating `sales/enquiries` with `source="Website"`, matching/creating Leads & Customers, alerting ERP staff, and emailing the customer). If the ERP is unreachable, enquiries are saved to `.data/enquiry-retry-queue.json` and flushed automatically (or via `POST /api/enquiries/flush`) with idempotency keys so nothing is lost or duplicated.
- **Draft Preview Mode**: Super Admins can open `/?preview_token=<signed_token>` from the ERP CMS to inspect unpublished drafts without exposing them to normal visitors.
- **Customer Accounts**: Registration, login, password reset, saved wishlist, and live "My Enquiries" tracking authenticate directly against the Django ERP.

## Local Setup

1. Copy `.env.example` to `.env` and verify the shared secrets match your Django ERP backend.
2. Ensure the Django ERP backend is running on `http://127.0.0.1:8000`.
3. Install dependencies and run the storefront on port `3001`:

```sh
npm install
npx next dev -p 3001
```

## Scripts

- `npm run dev` — Start Next.js dev server
- `npm run build` — Production build
- `npm run typecheck` — TypeScript check
- `npm test` — Run Vitest unit & integration tests (enquiry queue, webhook HMAC verification, fallback cache sync, permissions, sanitization)
