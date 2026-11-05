# Prepare repo for public release

Make this repo safe and presentable to publish publicly: no secrets or personal data in the history or tracked files, the metadata a public project needs, and a git hook that blocks future leaks.

Difficulty: 2.9

## Scope

- In: secret and personal-data scan of the git history and tracked files; README; LICENSE; `package.json` metadata (name, description, repository, license, files); a git hook that blocks commits containing sensitive data.
- Out: publishing to npm, CI setup, and feature changes.

## Acceptance criteria

- [x] Scan of git history and tracked files finds no secrets, tokens, or personal paths, or every finding is removed or rewritten
  - 2026-11-05: met — gitleaks git/dir clean, path rg clean (plan item: rerun scans)
  - 2026-11-05: verified — gitleaks git/dir clean; path grep over tracked files clean
- [x] README and LICENSE exist at the repo root
  - 2026-11-05: met — both exist at repo root (plan item: add LICENSE)
  - 2026-11-05: verified — both present at repo root
- [x] `package.json` has description, license, repository, and files fields
  - 2026-11-05: met — author and repository added (plan item: package.json fields)
  - 2026-11-05: verified — description, license, author, repository, files all present
- [x] A git hook rejects commits that contain secret-like strings or personal paths, and it is documented for setup
  - 2026-11-05: met — scratch-repo test plus README setup docs (plan item: document hook setup)
  - 2026-11-05: verified — hook rejects a personal path and fake token in scratch repo, also without `rg` on PATH; setup in README
- [x] `npm run typecheck` and `npm test` pass
  - 2026-11-05: met — typecheck clean, 33 tests passed (plan item: run typecheck and tests)
  - 2026-11-05: verified — typecheck clean; 5 suites / 33 tests pass

## Origin

Captured from the dashboard TODO inbox on 2026-11-05:
- prepare for push to a public repo

## Decisions

- **Keep `.tasks/` tracked and neutralize personal paths; no history rewrite.** *Why:* the notes are fine to publish. The only personal data is home-directory workspace paths (`README.md:17`, `.tasks/DONE-codeblock-style-spike.md:5`), which are low-sensitivity, and there is no remote yet. `~/.config/opencode/...` stays because it is OpenCode's standard path.
- **History scan is clean.** *Why:* `gitleaks git .` found no leaks in 3 commits. A manual `rg` over `git log -p` only matched npm package names (`js-tokens`, `gtoken`).
- **Keep `matt.aschmann@gmail.com` as the commit and `author` identity.** *Why:* it is already public in `opencode-ping`, including its `package.json` `author` field.
- **Add `LICENSE` (MIT, "Copyright (c) 2026 Matt Aschmann").** *Why:* `package.json` already says MIT, and the wording matches `../opencode-keepalive/LICENSE`.
- **Add `author` and `repository` (`https://github.com/mattaschmann/opencode-copy-code.git`) to `package.json`.** *Why:* the GitHub account is `mattaschmann`. The `maschmann` URL in `opencode-kirocli-bridge` is wrong and should not be copied.
- **Add a tracked `.githooks/pre-commit` shell script, enabled with `git config core.hooksPath .githooks`.** It runs `gitleaks git --staged --no-banner`, and it runs `grep` over the staged diff for `/Users/<name>`, `/home/<name>` and the home-directory workspace prefix. It skips `.githooks/` so it doesn't flag its own regex. If `gitleaks` is missing, it warns and skips that check. *Why:* it adds no npm dependency, and nothing changes git config on `npm install`.
- **Test the hook in a scratch repo under `$TMPDIR`.** *Why:* the user stages files, and testing must not touch this repo's index.

## Implementation Plan

- [x] Replace home-directory workspace paths in `README.md` (install example becomes `/path/to/opencode-copy-code`) and in `.tasks/DONE-codeblock-style-spike.md` with neutral wording (criteria: 1)
  - 2026-11-05: done — neutral wording in `README.md` and the spike task; path `rg` over tracked files is clean
- [x] Add `LICENSE` with MIT text, "Copyright (c) 2026 Matt Aschmann" (criteria: 2)
  - 2026-11-05: done — `LICENSE` added, text copied from `opencode-keepalive`
- [x] Add `author` and `repository` to `package.json` (criteria: 3)
  - 2026-11-05: done — both fields added to `package.json`
- [x] Write `.githooks/pre-commit` (executable), run `git config core.hooksPath .githooks`, and check in a scratch repo that it rejects a staged personal path and a fake secret and accepts a clean commit
  - 2026-11-05: done — hook written, `core.hooksPath` set; scratch repo accepted a clean commit and rejected a personal path and a fake token
- [x] Document hook setup in the `README.md` Development section and list `.githooks/` in the `AGENTS.md` Project Structure (criteria: 4)
  - 2026-11-05: done — README Development section and AGENTS.md Project Structure updated
- [x] Rerun `gitleaks git .`, `gitleaks dir .`, and the path `rg` over tracked files, and confirm all are clean (criteria: 1)
  - 2026-11-05: done — `gitleaks git .` and `gitleaks dir .` report no leaks; path `rg` clean
- [x] Run `npm run typecheck` and `npm test` (criteria: 5)
  - 2026-11-05: done — typecheck clean, 5 suites / 33 tests passed

## Checkpoint

**Goal:** Make the repo safe and presentable for public release.
**Key decisions:** keep `.tasks/` tracked, neutral paths, no history rewrite; MIT `LICENSE`; `author`/`repository` fields; tracked `.githooks/pre-commit` with gitleaks and path `rg`.
**Done:** all 7 plan items
**Next:** none, wrapped
**Blockers:** none
**Criteria:** 5/5 acceptance criteria met
**Key files:** `.githooks/pre-commit`, `README.md`, `LICENSE`, `package.json`, `AGENTS.md`

## Wrap notes

- 2026-11-05: review found the hook let personal paths through when `rg` was missing. Fixed by switching to `grep -E`; README and AGENTS.md updated. `npm audit` reports 6 pre-existing low-severity vulnerabilities, left as is.
