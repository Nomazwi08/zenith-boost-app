# Aivora — AI Workplace Productivity Assistant

Aivora is a modern, SaaS-style web application that unifies three AI-powered productivity tools into a single polished dashboard:

- 🧠 **AI Task Planner** — turn goals into structured, prioritized project plans with milestones, schedules, and risk analysis.
- 🔎 **AI Research Assistant** — generate balanced, well-structured research reports with executive summaries, findings, and recommendations.
- 💬 **AI Chatbot** — a threaded, streaming productivity copilot with persistent conversation history.

Built for professionals and business users who want a clean, fast, accessible workspace for everyday knowledge work.

---

## ✨ Features

- **Unified dashboard** with sidebar navigation across Planner, Research, Chat, History, and Settings
- **Multi-thread chat** with streaming responses and per-conversation URLs
- **Persistent history** — plans, reports, and threads saved to your account
- **Authentication** via email/password and Google OAuth
- **Per-user data isolation** enforced by Row-Level Security
- **Markdown rendering** with export to PDF and Markdown
- **Light & dark themes**
- **Fully responsive**, accessible (WCAG-conscious), and keyboard-friendly

---

## 🧱 Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | [TanStack Start](https://tanstack.com/start) (React 19 + Vite 7, SSR) |
| Routing | TanStack Router (file-based) |
| Data | TanStack Query |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Backend | Lovable Cloud (Postgres, Auth, RLS) |
| AI | Lovable AI Gateway (`google/gemini-3-flash-preview`) via Vercel AI SDK |
| Language | TypeScript (strict) |

---

## 📂 Project Structure

```
src/
├── components/            # Reusable UI (sidebar, topbar, markdown, toolbar…)
├── integrations/
│   ├── lovable/           # Lovable auth wrapper
│   └── supabase/          # Client, server client, auth middleware
├── lib/
│   ├── ai-gateway.server.ts   # AI SDK gateway factory
│   ├── prompts.ts             # System/user prompt templates
│   ├── plans.functions.ts     # Task Planner server functions
│   ├── research.functions.ts  # Research server functions
│   └── threads.functions.ts   # Chat thread server functions
├── routes/
│   ├── __root.tsx
│   ├── index.tsx              # Marketing landing
│   ├── auth.tsx               # Sign in / sign up
│   ├── _authenticated/        # Gated app shell
│   │   ├── dashboard.tsx
│   │   ├── planner.*.tsx
│   │   ├── research.*.tsx
│   │   ├── chat.*.tsx
│   │   ├── history.tsx
│   │   └── settings.tsx
│   └── api/chat.ts            # Streaming chat endpoint
└── styles.css
supabase/
└── migrations/                # Schema, RLS, and grants
```

---

## 🚀 Getting Started

### Prerequisites
- [Bun](https://bun.sh) (recommended) or Node.js 20+
- A Lovable Cloud project (auto-provisioned when running inside Lovable)

### Install & run

```bash
bun install
bun run dev
```

The app boots at `http://localhost:8080`.

### Environment

The following variables are wired automatically by Lovable Cloud and must exist in `.env`:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
LOVABLE_API_KEY=...     # server-only, used by the AI Gateway
```

Never commit real secrets — `.env` is git-ignored by default.

---

## 🔐 Security Model

- All app data lives in Postgres tables under the `public` schema.
- **Row-Level Security** is enabled on every table; policies scope rows to `auth.uid()`.
- Roles (if added later) must live in a dedicated `user_roles` table checked via a `SECURITY DEFINER` function — never on the profile row.
- Server-only code (AI keys, admin operations) is isolated in `*.server.ts` and `*.functions.ts` modules.

---

## 🧪 Scripts

```bash
bun run dev         # start dev server
bun run build       # production build
bun run typecheck   # TypeScript check
bun run lint        # eslint
```

---

## 📦 Deployment

Deploy directly from Lovable with one click, or connect your GitHub repo and host anywhere that supports edge/serverless React (Cloudflare Workers, Vercel, Netlify).

---

## 📄 License

MIT © Aivora
