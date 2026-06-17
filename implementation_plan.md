# Codebase Personality Profiler Implementation Plan

## Goal Description
Build a full‑stack web application that ingests a GitHub repository, computes a suite of behavioral metrics, and generates a witty, evidence‑based "personality" report using the OpenAI API. The UI must be visually striking, modern, and highly shareable.

## User Review Required
> [!IMPORTANT] All core architectural decisions are listed below. Please confirm the overall approach, technology choices, and any optional features (GitHub OAuth, deployment target, database provider). If you have preferences for design style (dark mode, color palette) or want to omit any optional component, let me know.

## Open Questions
- **Database**: Use PostgreSQL locally (Docker) or an external managed instance?
- **Authentication**: Enable GitHub OAuth now or defer?
- **Deployment**: Deploy to Vercel (recommended) or another platform?
- **OpenAI Model**: Use `gpt-4o-mini` (cost‑effective) or a higher‑tier model?
- **Design Theme**: Preferred primary colors or gradient style?

## Proposed Changes
---
### Project Initialization
#### [NEW] Project Root
- `c:/Users/iRepair/Downloads/codebase personality profile/` (project root)

#### [NEW] Next.js App with TypeScript
- Run: `npx -y create-next-app@latest ./ --ts --eslint --tailwind`
  - Initializes `package.json`, `next.config.js`, `tsconfig.json`, Tailwind config, basic pages.

---
### Core Packages
#### [MODIFY] `package.json`
- Add dependencies: `prisma`, `@prisma/client`, `dotenv`, `axios`, `recharts`, `openai`, `zod`, `swr`.
- Add devDependencies: `tailwindcss-animate`, `@types/node`, `@types/react`.

---
### Styling & Aesthetics
#### [NEW] `styles/globals.css`
- Import Tailwind, set dark mode `media`, define custom color palette (HSL based, vibrant gradients).
- Add glassmorphism utilities.

#### [NEW] `components/ThemeProvider.tsx`
- Context to toggle light/dark, apply CSS variables.

---
### Database & ORM
#### [NEW] `prisma/schema.prisma`
```prisma
 datasource db {
   provider = "postgresql"
   url      = env("DATABASE_URL")
 }
 generator client {
   provider = "prisma-client-js"
 }
 
 model Repository {
   id          Int      @id @default(autoincrement())
   owner       String
   name        String
   url         String
   createdAt   DateTime @default(now())
   metrics     Metric[]
 }
 
 model Metric {
   id                Int      @id @default(autoincrement())
   repositoryId      Int
   type              String
   value             Float
   detailsJson       Json?
   createdAt         DateTime @default(now())
   repository        Repository @relation(fields: [repositoryId], references: [id])
 }
```
- Run `npx prisma generate` and migrations later.

---
### Environment Configuration
#### [NEW] `.env`
```
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/codebase_profiler
GITHUB_TOKEN=your_github_pat
OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```
- Add `.env.example` for reference.

---
### Backend API Routes (Next.js API)
#### [NEW] `pages/api/analyze.ts`
- Accept repo identifier (URL or `owner/name`).
- Validate input, fetch repo data via GitHub GraphQL/REST using `axios`.
- Store raw commit data in temporary memory (or optional DB tables).
- Compute metrics (see Metrics Engine section).
- Call OpenAI with structured prompt and metric payload.
- Return JSON: `{ profile, traits, visualData, evidence }`.

#### [NEW] `pages/api/github.ts`
- Helper functions: `fetchRepoMeta`, `fetchCommits`, `fetchPullRequests`, `fetchContributors`.
- Pagination handling, rate‑limit back‑off.

#### [NEW] `pages/api/metrics.ts`
- Pure functions to calculate each metric group (activity, stability, churn, deadline, team, testing).
- Exported for unit testing.

---
### LLM Prompt Construction
#### [NEW] `lib/prompt.ts`
- Template literal that inserts metric JSON, trait scores, and sample commits.
- Ensures no hallucination: include `evidence` array.

---
### Frontend UI
#### [NEW] `pages/index.tsx`
- Hero section with input box for repo URL/name, animated search button.
- Real‑time validation via SWR.

#### [NEW] `components/ReportCard.tsx`
- Expandable accordion for each trait: shows score, explanation, evidence list, metaphor.
- Uses Tailwind glass style, smooth transitions.

#### [NEW] `components/Charts.tsx`
- Recharts implementations:
  - Heatmap (custom cell grid) for commit activity.
  - Bar chart for time‑of‑day distribution.
  - Pie chart for commit type breakdown.
  - Stacked bar for contributor activity.
  - Horizontal bar for file churn ranking.
  - Radar chart for trait scores.

#### [NEW] `components/ShareCard.tsx`
- Generates a shareable PNG using `html2canvas` client‑side.
- Includes repo name, overall personality, radar chart.

---
### Authentication (Optional)
#### [NEW] `pages/api/auth/[...nextauth].ts`
- Configure `next-auth` with GitHub provider.
- Protect `/api/analyze` endpoint to require login if user opts in.

---
### Testing
#### [NEW] `__tests__/metrics.test.ts`
- Unit tests for each metric calculation using Jest.
- Mock GitHub data fixtures.

#### [NEW] `cypress/` end‑to‑end test suite
- Simulate user flow: enter repo, wait for report, verify visual components.

---
### Deployment Scripts
#### [NEW] `vercel.json`
- Define builds, environment variables, and routes.

---
### Documentation
#### [NEW] `README.md`
- Project overview, setup instructions, Docker compose for PostgreSQL, env vars, linting, testing, deployment.
- Include a screenshot mockup (generated image placeholder).

---
## Verification Plan
### Automated Tests
- Run `npm test` (Jest) for metric logic.
- Execute `npx cypress run` for UI flow.
- Lint with `npm run lint` (ESLint + Prettier).

### Manual Verification
- Clone a public repo (e.g., `facebook/react`).
- Verify the generated profile includes correct metrics (e.g., fix ratio matches observed commits).
- Check visualizations render correctly on desktop and mobile.
- Test share card generation and download.

---
## Timeline (approx.)
1. Project scaffolding & Tailwind theme – 1 hour
2. Prisma schema, DB setup – 30 min
3. GitHub data collection layer – 1 hour
4. Metrics engine implementation – 2 hours
5. OpenAI prompt & integration – 30 min
6. Frontend pages & components – 3 hours
7. Visualizations – 2 hours
8. Optional auth – 30 min
9. Testing & CI – 1 hour
10. Documentation & polishing – 1 hour

Total ~12 hours of work.

---
## Next Steps
- Await your confirmation on the above plan and answers to the open questions.
- Once approved, I will create the project skeleton, set up the database, and begin implementing the backend data collection.
