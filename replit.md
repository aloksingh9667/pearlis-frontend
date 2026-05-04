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
- API requests to `/api/*` are proxied to the backend (configurable via `RENDER_API_URL` env var)
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

## Workflow
- **Start application**: `PORT=5000 pnpm --filter @workspace/pearlis run dev` on port 5000
