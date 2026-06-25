# 🤖 Codebase Personality Profiler

> An AI-powered tool that ingests a GitHub repository, computes behavioral metrics, and generates a witty, evidence-based "personality" report — complete with archetypes, trait scores, contributor intelligence, and shareable badges.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite)

---

## ✨ Features

- **Repository Analysis** — Fetches commit history, pull requests, and contributor data from GitHub's API
- **Metrics Engine** — Calculates fix ratios, feature ratios, refactor ratios, bus factor, commit time-of-day distribution, and collaboration index
- **AI Personality Profiling** — Uses OpenAI (or a witty mock fallback) to assign a codebase archetype and generate humorous trait scores
- **Contributor Intelligence** — Per-contributor profiles with archetypes, commit stats, streaks, and roasts
- **Code Health Dashboard** — Risk scoring, hotspots, language distribution, and dependency analysis
- **Repo Comparison** — Side-by-side analysis of two repositories
- **Shareable Reports** — Permanent permalink to read-only reports with embeddable SVG badges for README.md
- **Interactive Charts** — Radar charts, bar charts, heatmaps, treemaps, area charts, and collaboration graphs

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A GitHub Personal Access Token (optional but recommended to avoid rate limits)
- An OpenAI API key (optional — a mock engine runs if not provided)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd "codebase personality profile"

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to SQLite database
npx prisma db push
```

### Environment Configuration

Create a `.env` file (already exists) and fill in your keys:

```env
DATABASE_URL=file:./dev.db
GITHUB_TOKEN=your_github_personal_access_token
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

> **Note:** The app runs fully without `GITHUB_TOKEN` and `OPENAI_API_KEY`. A mock personality engine is used as fallback and GitHub's unauthenticated API limit applies (60 req/hr).

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🏗️ Architecture

```
src/
├── app/
│   ├── page.tsx               # Main UI — homepage, analysis dashboard
│   ├── layout.tsx             # Root layout with fonts & metadata
│   ├── report/[id]/page.tsx   # Public permalink report page
│   └── api/
│       ├── analyze/route.ts   # POST — fetches GitHub data, computes metrics, calls OpenAI, stores to DB
│       ├── report/route.ts    # GET  — retrieves a stored report by ID
│       └── badge/[owner]/[repo]/route.ts  # GET — serves SVG status badge
├── components/
│   ├── Heatmap.tsx            # Custom commit activity heatmap
│   ├── CollaborationGraph.tsx # SVG-based contributor collaboration graph
│   └── Treemap.tsx            # File churn treemap visualization
└── lib/
    ├── github.ts              # GitHub REST API client (commits, PRs, contributors, stats)
    ├── metrics.ts             # Pure metrics computation (ratios, bus factor, time-of-day, etc.)
    ├── contributors.ts        # Per-contributor metric aggregation & collaboration graph
    ├── repoHealth.ts          # Repository health & risk scoring engine
    ├── prompt.ts              # OpenAI prompt construction templates
    ├── openai.ts              # OpenAI API calls + mock personality engine fallback
    └── prisma.ts              # Prisma client singleton with better-sqlite3 driver adapter
```

---

## 📊 Metrics Computed

| Metric | Description |
|---|---|
| Fix Ratio | % of commits mentioning fix, bug, patch, hotfix |
| Feature Ratio | % of commits mentioning feat, feature, add, implement |
| Refactor Ratio | % of commits mentioning refactor, cleanup, restructure |
| Test Ratio | % of commits mentioning test, spec, jest, cypress |
| Bus Factor | Number of contributors owning >50% of commits |
| Collaboration Index | Average number of distinct authors per file |
| Time-of-Day Distribution | Morning / Afternoon / Evening / Night commit split |
| Risk Score | Composite health risk score (0–100) |

---

## 🔧 Personality Archetypes (Mock Engine)

When no OpenAI API key is set, the app uses a deterministic mock engine:

| Archetype | Trigger Condition |
|---|---|
| The Nocturnal Firefighter | Fix ratio > 50% |
| The Quality Assurance Bureaucrat | Test ratio > 25% |
| The Solo Crusader | Bus factor = 1 |
| The Chaotic Startup | Default / mixed signals |

---

## 🗃️ Database

The app uses **SQLite** via [Prisma 7](https://www.prisma.io/) with the `@prisma/adapter-better-sqlite3` driver adapter. The database file is `dev.db` in the project root.

Models: `Repository`, `Metric`, `Contributor`, `ContributorMetric`, `ContributorProfile`

---

## 📦 Key Dependencies

| Package | Purpose |
|---|---|
| `next` 16 | Full-stack React framework |
| `prisma` + `@prisma/client` v7 | ORM for SQLite persistence |
| `@prisma/adapter-better-sqlite3` | Prisma 7 SQLite driver adapter |
| `openai` | AI personality profile generation |
| `axios` | GitHub API HTTP client |
| `recharts` | Chart library (radar, bar, area, pie) |
| `swr` | Data fetching hooks |
| `zod` | Schema validation |

---

## 📄 License

MIT — built by Antigravity AI Pair Programmer.
