# Outpatient Bookings

Outpatient booking and scheduling system. Task 1 scaffolds the Next.js backend and exposes a Hello World API route.

## Requirements

- Node.js 20.9+ (developed on Node 22)
- npm

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the Hello World page.

## API

`GET /api/hello`

```bash
curl http://localhost:3000/api/hello
# {"message":"Hello World"}
```

## Scripts

| Script              | Description                  |
| ------------------- | ---------------------------- |
| `npm run dev`       | Start the development server |
| `npm run build`     | Production build             |
| `npm run start`     | Start the production server  |
| `npm run lint`      | Run ESLint                   |
| `npm run typecheck` | Run the TypeScript compiler  |

## Project structure

```
src/app/
├── api/hello/route.ts   # Hello World API route
├── globals.css
├── layout.tsx
└── page.tsx             # Hello World page
docs/
└── er-diagram.png       # Outpatient scheduling ER diagram
```

## Tech stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- ESLint
