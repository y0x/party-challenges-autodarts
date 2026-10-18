# Contributing

## Setup

You need Node.js (see `.nvmrc`) and pnpm (the version in `package.json` → `packageManager`; run `corepack enable`).

```sh
pnpm install   # also installs the git hooks
pnpm dev       # Chrome with the extension loaded (pnpm dev:firefox for Firefox)
```

## Checks

```sh
pnpm lint        # Biome: formatting, lint rules and import order (pnpm lint:fix to fix)
pnpm typecheck
pnpm test
```

CI runs the same checks and builds the Chrome package on every pull request.

## Commit messages

Commits follow [Conventional Commits](https://www.conventionalcommits.org/), checked by commitlint in a git hook
and in CI. The type decides the next release:

| Commit | Release |
|---|---|
| `fix: …` | patch (1.0.**1**) |
| `feat: …` | minor (1.**1**.0) |
| `feat!: …` or a `BREAKING CHANGE:` footer | major (**2**.0.0) |
| `chore:`, `docs:`, `test:`, `refactor:`, `ci:`, `build:`, `style:` | none |

Pull requests are rebase-merged: every commit lands on `main` as it is and counts for the release notes, so keep
the history clean (squash fixups locally with `git rebase -i` before merging).
