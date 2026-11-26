# Troubleshooting

One heading per symptom: cause, then fix.

## Hooks and local tools

### Every commit fails with `sh: 0: Illegal option --`

- Cause: `husky` was run with an argument (`npx husky --version`). Husky takes it as the hooks folder and rewrites `core.hooksPath`.
- Fix: run `npx husky` with no argument, then delete the stray folder it created. Never pass arguments to `husky`.

### A commit in a new clone or worktree runs no hooks

- Cause: `core.hooksPath` is `.husky/_`, which `npm ci` creates (`prepare` script).
- Fix: `npm ci` in that folder. `git config core.hooksPath` should print `.husky/_`, and the next commit prints the lint-staged tasks.

### Windows: hooks cannot find gitleaks, actionlint, or even `npx`

- Cause: Git runs hooks outside your shell, so mise's tools are not on its `PATH`.
- Fix: add `%LOCALAPPDATA%\mise\shims` to your user `Path` ([mise docs](https://mise.jdx.dev/shell-setup.html#windows)).
- Without it, two cases (to confirm on the Windows PC):
    - Node is installed outside mise: the secret scan falls back to a short regex list, actionlint is skipped with a note, and the commit goes through.
    - Node comes only from mise: `npx` and `npm` are missing too, and the commit fails.
- CI runs the other checks, but the gitleaks scan and the commit-msg rule run only in the hooks. GitHub push protection still blocks known token formats.

### `npm run media:video` fails on Windows

- Cause: it is a bash script that uses GNU `mktemp`.
- Fix: run it from Git Bash.

### `npm run check` fails at `npm audit`

- Cause: the audit needs the npm registry.
- Fix: run it online.

## Browser tests

### `CI=1 npx playwright test` fails at startup

- Cause: port 4173 or 4174 is taken (`npm run preview`, `npm run cv:pdf`). `CI=1` also turns on `forbidOnly` and the CI reporter.
- Fix: stop the other server. Prefer letting CI run Firefox and WebKit.

### A Firefox or WebKit failure you cannot reproduce

- Cause: those engines run in CI only ([ADR 0010](adr/0010-test-policy.md)).
- Fix: read the trace in the `playwright-report` artifact of the failed run.

### Browser tests cancelled with "The operation was canceled"

- Cause: the Ubuntu mirror was slow, and installing the browsers' system packages ate the job's time (`Fetched 140 MB in 12min`, in the browsers step's log).
- Fix: re-run the failed jobs. If it keeps happening, raise `timeout-minutes` of the `e2e` job in `ci.yml`.

## GitHub and Vercel

### A PR into `main` waits for a check that never comes

- Cause: a job was renamed, and the branch rule still expects the old `name:` ([checks.md](checks.md#ci)).
- Fix: update the required checks (Settings → Branches), or restore the name.

### A Dependabot PR targets `main`

- Fix: retarget it to `dev` ([operations.md](operations.md#dependency-updates)).

### Renovate opens nothing, or its log shows `config-validation`

- Cause and fix: [operations.md](operations.md#dependency-updates) (it reads `renovate.json` from `main`).

### Uptime or weekly rebuild stopped running

- Cause: scheduled workflows stop after 60 days without activity, and run late ([operations.md](operations.md#scheduled-jobs)).
- Fix: turn them back on in the Actions tab.

### Weekly rebuild fails with "VERCEL_DEPLOY_HOOK is not set"

- Cause: the repo secret is missing.
- Fix: create a Deploy Hook for `main` in Vercel and store its URL as `VERCEL_DEPLOY_HOOK` ([operations.md](operations.md#vercel)).

### A Vercel preview link asks for a login

- Cause: previews are behind Vercel Authentication.
- Fix: sign in to Vercel, or check production after the release.

## Editor and history

### VSCodium flags `.github/actions/setup/action.yml` ("Required property is missing: on / jobs")

- Cause: its GitHub Actions extension validates the file as a workflow when it is opened from a diff or source-control view (`git:` URI).
- Fix: nothing to fix. Open the file itself, and the errors go away.

### `git pull` in a clone from before 2026-10-07 shows unrelated history

- Cause: the history was rewritten that day (old media removed).
- Fix: clone again.
