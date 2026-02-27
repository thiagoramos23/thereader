# Reader

Tailwind-first RSS/article reader monorepo with a Tauri-ready architecture.

## Packages

- `apps/web` - React + Tailwind UI
- `apps/api` - Express + SQLite ingestion/search API
- `packages/core` - Shared domain types/contracts/helpers

## Run

```bash
npm install
npm run dev
```

- Web: `http://localhost:5173`
- API: `http://localhost:4000`

## API

- `POST /api/import` with `{ "url": "https://..." }`
- `GET /api/articles?query=&limit=&offset=`
- `GET /api/articles/:id`

## Testing

```bash
npm run test
npm run test:e2e -w apps/web
```

## Troubleshooting

If you switch Node versions and see a `better-sqlite3` `NODE_MODULE_VERSION` error, run:

```bash
npm run rebuild:native
```

`npm run dev` already runs this automatically before starting the API/web processes.
