# volt-os-frontend

Frontend deployment repository for **Volt OS — Enterprise EV Infrastructure ERP & Storefront**.

## Structure

- `src/` & root Vite config — Volt OS ERP workspace (React 19, TypeScript, TanStack Router/Query, Tailwind CSS v4, Leaflet, Recharts).
- `storefront/` — Public Next.js Storefront (`storefront/vercel.json` builds both the ERP SPA into `storefront/public/erp-app/` and the Next.js storefront in a single Vercel deployment).

## Deploy on Vercel

1. Import `Tech-Trendo/volt-os-frontend` in Vercel.
2. Set **Root Directory** to `storefront`.
   - `storefront/vercel.json` automatically installs root + storefront dependencies, builds the ERP SPA (`npm run build:erp-spa`), and builds the Next.js app.
3. Configure environment variables (`ERP_API_BASE_URL`, `ERP_PUBLIC_ORIGIN`, `VITE_API_BASE_URL`, `VITE_STOREFRONT_URL`, `VITE_ERP_BASE_PATH`, `ERP_FRONTEND_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `CMS_WEBHOOK_SECRET`, `STOREFRONT_ENQUIRY_API_KEY`, `STOREFRONT_ENQUIRY_HMAC_SECRET`).
4. Deploy.
