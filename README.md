# Flows

A flowchart editor for sketching automations: triggers, AI agents, conditions, actions, databases and APIs. Draw a flow by hand, or describe it in a sentence and let AI draft it. Each save creates a new version you can go back to.

Built with React, Vite, React Flow and shadcn/ui on the front end, and a small Node server with Prisma and PostgreSQL behind it.

> **Status: local prototype, no longer developed.** Flows runs on `localhost` only. It was built to validate the editor and the AI drafting flow, and development stopped before the multi-user layer (see [Roadmap](#roadmap-discontinued)). Do not deploy it as is.

## Features

- Drag-and-drop canvas with nodes, edges, undo and redo.
- Node styles with emoji or image icons, custom styles and a "recently used" list.
- **Generate with AI:** type a prompt, get a draft flowchart (OpenAI).
- Versioned saves, and a read-only preview of each version.

## Run it locally

You need Node.js 20.19+ (or 22.13+) and a PostgreSQL database: a plain `postgresql://` URL or a Prisma Postgres / Accelerate `prisma+postgres://` URL both work.

```sh
npm install
cp .env.example .env      # then fill in DATABASE_URL and OPENAI_API_KEY
npx prisma migrate deploy
npm run server            # API on http://localhost:3001
npm run dev               # app on http://localhost:8080 (proxies /api to the server)
```

`OPENAI_API_KEY` is only needed for AI generation. Everything else works without it.

## Why it is localhost only

The API has no authentication and accepts requests from any origin. Anyone who can reach it can read and change every flowchart, and spend the server's OpenAI credit through `/api/ai/flowchart`. That is fine on your own machine and unsafe anywhere else.

## Roadmap (discontinued)

The next phase was planned but never built:

- **Authentication and SSO:** sign-in with OAuth 2.0 / OpenID Connect (Google, Microsoft) and SAML SSO for companies, with sessions handled server-side.
- **Workspaces and access control:** per-user and team workspaces, owner / editor / viewer roles, and share links scoped to a single flowchart version.
- **API hardening:** an origin allowlist instead of `*`, input validation on every route, rate limiting and per-user quotas on AI generation, and audit logs of who changed what.
- **Real-time collaboration:** several people editing the same canvas with live cursors.
- **Export:** turn a flowchart into a runnable automation for tools like n8n.

## License

MIT, see [LICENSE](LICENSE).
