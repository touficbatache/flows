# Flows

A flowchart editor for sketching automations: triggers, AI agents, conditions, actions, databases and APIs. Draw a flow by hand, or describe it in a sentence and let AI draft it. Each save creates a new version you can go back to.

Built with React, Vite, React Flow and shadcn/ui on the front end, and a small Node server with Prisma and PostgreSQL behind it.

## Features

- Drag-and-drop canvas with nodes, edges, undo and redo.
- Node styles with emoji or image icons, custom styles and a "recently used" list.
- **Generate with AI:** type a prompt, get a draft flowchart (OpenAI).
- Versioned saves, and a read-only preview of each version.

## Run it locally

You need Node.js 18+ and a PostgreSQL database.

```sh
npm install
cp .env.example .env      # then fill in DATABASE_URL and OPENAI_API_KEY
npx prisma migrate deploy
npm run server            # API on http://localhost:3001
npm run dev               # app on http://localhost:8080 (proxies /api to the server)
```

`OPENAI_API_KEY` is only needed for AI generation. Everything else works without it.

## Before you deploy

The API has no authentication and allows requests from any origin. Anyone who can reach it can read and change flowcharts, and spend your OpenAI credit through `/api/ai/flowchart`. Keep it local, or put it behind authentication before you host it.

## License

MIT, see [LICENSE](LICENSE).
