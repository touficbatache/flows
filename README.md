# Flows

Collaborative flowchart editor for designing automations with natural language or by hand, and generating shareable, versioned documentation with your team.

Describe an automation in plain language and let AI draft the flowchart, or build it node by node from triggers, AI agents, conditions, actions, databases and APIs. Every save becomes a new version with its own read-only page you can share, so the flowchart doubles as living documentation of how the automation works.

Built with React, Vite, React Flow and shadcn/ui on the front end, and a small Node server with Prisma and PostgreSQL behind it.

> **Status: local prototype, no longer developed.** The editor, AI drafting, versioning and shareable version pages are built and run on `localhost`. The team layer (accounts, workspaces, roles, live co-editing) was designed, but development stopped before it was built (see [Roadmap](#roadmap-the-team-layer-not-built)). Do not deploy it as is.

## Features

- **Natural language or by hand:** type a prompt and get a draft flowchart (OpenAI), then refine it on a drag-and-drop canvas with undo and redo.
- **Automation building blocks:** triggers, AI agents, conditions, actions, databases and APIs, with emoji or image icons, custom styles and a "recently used" list.
- **Versioned documentation:** each save creates a new version, and you can go back to any earlier one.
- **Shareable pages:** every version has a read-only preview link to share with the people who need to understand the flow.

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

## Roadmap: the team layer (not built)

The collaboration layer was planned but never built:

- **Authentication and SSO:** sign-in with OAuth 2.0 / OpenID Connect (Google, Microsoft) and SAML SSO for companies, with sessions handled server-side.
- **Workspaces and access control:** per-user and team workspaces, owner / editor / viewer roles, and share links scoped to a single flowchart version.
- **API hardening:** an origin allowlist instead of `*`, input validation on every route, rate limiting and per-user quotas on AI generation, and audit logs of who changed what.
- **Real-time collaboration:** several people editing the same canvas with live cursors.
- **Export:** turn a flowchart into a runnable automation for tools like n8n.

## License

MIT, see [LICENSE](LICENSE).
