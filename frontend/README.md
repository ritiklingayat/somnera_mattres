# Somnera Mattress

Frontend-only local application built with React and Vite.

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

The catalog, categories, uploaded product images, customer accounts, carts,
wishlists, orders, coupons, and distributor requests are stored locally in the
browser using IndexedDB. Small login/session values use browser storage.

No Java, Spring Boot, Maven, database server, API server, Docker, or other
backend installation is required.

Admin demo credentials:

- Admin ID: `admin`
- Password: `admin`

Frontend-only authentication is intended for local/offline demonstration and
is not secure enough for a public production admin system.

Because application data is stored in browser IndexedDB, it is specific to the
current browser and device. Clearing site data removes locally added records
and uploaded images. Developers can import and call `resetLocalDatabase()`
from `src/db/database.js` to restore the seed catalog.
