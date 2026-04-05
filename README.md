# Gracht Dossier

Web app for comparing Amsterdam addresses against Dutch public registers: BAG address resolve (PDOK Locatieserver), **live building facts** (PDOK BAG OGC for verblijfsobject + linked pand), plus shortlist, compare, and a print-friendly memo. Foundation, heritage, zoning, energy, and CBS sections are still stubs until those APIs are wired. See [docs/PRODUCT_SPEC_V1.md](docs/PRODUCT_SPEC_V1.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

**Disclaimer:** Informational only—not structural, legal, or investment advice.

## Requirements

- Node.js 20+ (or a version matching [Next.js 16 engines](https://nextjs.org/docs/app/getting-started/installation))

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The shortlist is stored in `localStorage` in your browser only.

### Environment variables

Copy `.env.example` to `.env.local` if you add server-side keys later (for example Amsterdam Datapunt). **PDOK Locatieserver** resolve works without any API key.

| Variable | Required | Purpose |
|----------|----------|---------|
| `AMSTERDAM_DATAPUNT_API_KEY` | No | Future: Funderingen and other gated Amsterdam APIs |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run production server after `build` |
| `npm run lint` | ESLint |
| `npm test` | Run Jest tests once |
| `npm run test:watch` | Run Jest in watch mode |

## Deploy (Vercel)

Connect the repo to [Vercel](https://vercel.com), set the same env vars in the project dashboard, and deploy. No database is required for v1.
