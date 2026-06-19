# Contributing to WorkNow Korea

Thanks for helping build WorkNow Korea. This guide keeps the codebase safe to
commit, push, deploy, and roll back.

## Ground rules

- **Never commit secrets.** Real values live in `.env` (gitignored). Only
  `.env.example` is tracked, with placeholders. Run `npm run secrets:check`
  before every commit.
- **Do not commit** `node_modules`, `.next`, `/uploads`, local databases, or logs.
- Keep PRs focused. One concern per PR.

## Branch strategy

| Branch      | Purpose                                  |
| ----------- | ---------------------------------------- |
| `main`      | Stable, deployable. Protected.           |
| `staging`   | Pre-production testing / staging deploy. |
| `feature/*` | New work, branched off `main`.           |

Flow: `feature/*` → PR into `main` → merge into `staging` for staging deploy →
promote to production after smoke tests.

## Development workflow

```bash
git checkout main && git pull
git checkout -b feature/my-change

# ... make changes ...

npm run secrets:check
npm run typecheck
npm run build

git add .
git commit -m "feat: short description"
git push -u origin feature/my-change
# open a PR into main
```

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):
`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `ci:`.

## Required checks before merge

CI (`.github/workflows/ci.yml`) runs on every PR:

1. `npm ci`
2. `npx prisma generate`
3. `npm run secrets:check`
4. `npm run typecheck`
5. `npm run build`

All must pass. Do not merge red builds.

## Local validation suite

```bash
npm run secrets:check
npm run db:check-users
npm run test:matching
npm run storage:check
npm run rate-limit:check
npm run typecheck
npm run build
```

## Reporting issues

Use the GitHub issue templates: **Bug report**, **Feature request**, or
**Pilot incident** (for problems found during the live worker pilot).
