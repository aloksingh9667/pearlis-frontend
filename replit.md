# Pearlis — Luxury Jewelry Store

A React + Vite SPA for a luxury jewelry e-commerce platform. Includes full shopping experience, user authentication, blog, gallery, videos, and an admin dashboard.

## Run & Operate

```bash
# Install dependencies
pnpm install

# Start dev server (port 5000)
PORT=5000 pnpm --filter @workspace/pearlis run dev

# Build for production
pnpm run build  # output goes to dist/
```

**Required env vars:**
- `PORT=5000` — dev server port (set in workflow)
- `VITE_GOOGLE_CLIENT_ID` — optional, enables Google OAuth login

## Stack

- **Framework**: React 19 + Vite 7
- **Routing**: Wouter
- **State/Data**: TanStack React Query
- **Styling**: Tailwind CSS v4 + Radix UI (shadcn-style components)
- **Auth**: JWT tokens in localStorage + Google OAuth (`@react-oauth/google`)
- **Backend**: External API at `https://pearlis-api.onrender.com` (proxied via Vite `/api`)
- **Language**: TypeScript
- **Package manager**: pnpm workspaces

## Where things live

- `artifacts/pearlis/` — Main React app (`@workspace/pearlis`)
- `artifacts/pearlis/src/pages/` — All page components
- `artifacts/pearlis/src/components/` — Shared UI components
- `artifacts/pearlis/src/contexts/AuthContext.tsx` — Auth state
- `artifacts/pearlis/src/lib/apiUrl.ts` — API URL helper used by all raw fetch calls
- `lib/api-client-react/src/generated/api.ts` — Generated TanStack Query hooks (Orval)
- `artifacts/pearlis/vite.config.ts` — Vite + proxy config

## Architecture decisions

- API calls in dev are proxied by Vite (`/api` → `https://pearlis-api.onrender.com`); no CORS issues
- `VITE_API_URL` is injected at build time for production; empty string in dev so proxy handles it
- Auth is custom JWT (not Replit Auth / Supabase / Clerk) — token stored in localStorage
- Monorepo with pnpm workspaces: frontend app + shared API client library
- Google OAuth is optional; app degrades gracefully without `VITE_GOOGLE_CLIENT_ID`

## Product

- Product catalogue, search, wishlist, cart, checkout (Razorpay + COD)
- Order tracking with status stepper, printable PDF invoice
- Return/refund request flow for delivered orders
- Blog / Journal, Gallery, Videos lookbook, Newsletter signup
- Admin dashboard: products, orders, users, coupons, reviews, stock alerts, reports, returns

## User preferences

_Populate as you build_

## Gotchas

- `vite.config.ts` requires `PORT` env var in development (throws if missing and not production)
- Replit plugins (`@replit/vite-plugin-*`) are conditionally loaded only in dev + Replit env
- Backend API is hosted externally on Render (cold starts may cause slow initial API responses)

## Pointers

- Workflow: `Start application` runs `PORT=5000 pnpm --filter @workspace/pearlis run dev`
- Frontend GitHub: https://github.com/aloksingh9667/pearlis-frontend
- Backend GitHub: https://github.com/aloksingh9667/pearlis-backend
