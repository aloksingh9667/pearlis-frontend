# Pearlis — Luxury Jewelry Store

## Project Overview
A React + Vite SPA for a luxury jewelry e-commerce platform called "Pearlis". It includes a full shopping experience (products, cart, checkout, orders, wishlist), user authentication, blog, gallery, videos, and an admin dashboard.

## Architecture

### Monorepo Structure (pnpm workspaces)
- `artifacts/pearlis/` — Main React frontend app (`@workspace/pearlis`)
- `lib/api-client-react/` — Shared API client library (`@workspace/api-client-react`)

### Tech Stack
- **Framework**: React 19 + Vite 7
- **Routing**: Wouter
- **State/Data**: TanStack React Query
- **Styling**: Tailwind CSS v4 + shadcn/ui components (Radix UI)
- **Auth**: JWT tokens stored in localStorage + Google OAuth (`@react-oauth/google`)
- **Backend**: External API at `https://pearlis-api.onrender.com` (proxied via Vite's `/api` route)
- **Language**: TypeScript

### Key Configuration
- Frontend runs on port 5000 (`PORT=5000` env var required by `vite.config.ts`)
- Vite config has `allowedHosts: true` and `host: '0.0.0.0'` for Replit proxy compatibility
- API requests to `/api/*` are proxied to the backend via Vite dev proxy in development
- In **production** (Cloudflare Pages), the `VITE_API_URL` env var must be set to `https://pearlis-api.onrender.com` — all API calls route through `src/lib/apiUrl.ts` helper
- The generated API client (`@workspace/api-client-react`) uses `setBaseUrl()` called in `main.tsx` with `VITE_API_URL`
- All raw `fetch()` calls throughout pages use `apiUrl()` from `src/lib/apiUrl.ts` to prepend the correct origin
- Google OAuth configurable via `VITE_GOOGLE_CLIENT_ID` env var

## Development

### Running the App
```bash
PORT=5000 pnpm --filter @workspace/pearlis run dev
```

### Installing Dependencies
```bash
pnpm install
```

### Building for Production
```bash
pnpm run build
# Output goes to dist/ (copied from artifacts/pearlis/dist/public)
```

## Deployment
- Type: Static site
- Build command: `pnpm run build`
- Public dir: `dist`

## Features

### User-Facing
- Product catalogue, search, wishlist, cart, checkout (Razorpay + COD)
- Order detail page with live status stepper, printable PDF invoice
- **Return/Refund Request**: Banner on delivered orders opens a modal with reason selector, return policy, description, and API call to `POST /api/orders/:id/return-request`
- Blog / Journal, Gallery, Videos lookbook, Newsletter signup
- Google OAuth + email/password authentication

### Admin Dashboard (`/admin/*`)
- Dashboard, Reports (analytics with period switcher), Products, Categories, Orders
- **Returns & Refunds** (`/admin/returns`): View all return requests, filter by status, expand each request to add an admin note and approve/reject/reset
- Coupons, Reviews moderation, Stock Alerts, Newsletter subscribers
- Journal (blog) management, Videos management, Page Content editor

### Backend Routes (Express + Drizzle + PostgreSQL)
- `POST /api/orders/:id/return-request` — customer submits a return request
- `GET /api/admin/return-requests?status=` — admin list with optional status filter
- `PATCH /api/admin/return-requests/:id` — admin updates status + note
- Return requests stored in `return_requests` table (auto-created via raw SQL if not exists)

## Mobile Responsiveness
All admin pages use `overflow-x-auto` on tables. Additional mobile fixes applied:
- Orders: mobile accordion card view (< md), table view (≥ md)
- Coupons: stats grid `grid-cols-1 sm:grid-cols-3`
- Blogs: modal form grid `grid-cols-1 sm:grid-cols-2`
- Reviews: removed extra padding wrapper that doubled the gutter
- Reports: period switcher uses `flex-wrap` and `whitespace-nowrap` buttons

## Workflow
- **Start application**: `PORT=5000 pnpm --filter @workspace/pearlis run dev` on port 5000

## GitHub Sync
Both frontend and backend repos are linked via `GITHUB_ACCESS_TOKEN` secret.

- **Frontend repo**: https://github.com/aloksingh9667/pearlis-frontend
- **Backend repo**: https://github.com/aloksingh9667/pearlis-backend
- **Backend code**: cloned into `/backend/` folder (excluded from frontend tracking via `.gitignore`)

To push changes to both repos at once, run:
```bash
bash push-all.sh
```
