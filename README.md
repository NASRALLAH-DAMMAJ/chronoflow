# ChronoFlow

> Where did my time actually go?

A 24-hour circular time-blocking app that helps you see, understand, and remember how you spend your days.

Built for the [GitHub ReadME Hackathon](https://github-readme-generation.devpost.com/).

## How it works

1. **Plan** — Add blocks to your day on the circular 24h dial
2. **Live** — Go about your day
3. **Review** — Mark the day as complete at night
4. **Remember** — Navigate any past day in the archive

## Features

- **24h Circular Dial** — See your entire day at a glance. Drag to move blocks, drag edges to resize.
- **Dark / Light Theme** — Toggle or follows system preference.
- **Date Navigation** — Browse any past or future day with prev/next buttons or the date picker.
- **Night Review** — Complete your day and track your streak.
- **Zero Dependencies** — Pure React + Canvas 2D. No calendar library, no router, no backend. Everything runs in your browser and saves to localStorage.

## Tech Stack

- **React 18** — UI framework
- **Vite 6** — Build tool
- **Canvas 2D API** — Dial rendering
- **CSS Custom Properties** — Design tokens & theming
- **localStorage** — All data stored client-side

## Getting Started

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173

## Build

```bash
pnpm build
pnpm preview
```

## License

MIT
