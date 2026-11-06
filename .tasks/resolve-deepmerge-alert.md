# Resolve deepmerge Dependabot alert

Clear Dependabot alert #1 (GHSA-gcqx-w48m-w2h4, CVE-2026-93753, low): `deepmerge` `mergeObject()` allows prototype poisoning. No patched version exists yet; this task waits for one.

Difficulty: 1.0

## Scope

- In: check whether a fix is available, upgrade `deepmerge` (or the `jest` chain that pulls it in), and confirm the alert closes.
- Out: replacing Jest, and any change to shipped plugin code.

## Context

- Alert: https://github.com/mattaschmann/opencode-copy-code/security/dependabot/1
- Affected range: `>= 4.2.0, <= 4.3.1`. Locked at 4.3.1, which is the latest release (last published 2023-03).
- Dev-only, indirect: `jest@30.5.2` → `@jest/core` → `jest-config` → `deepmerge`. It only merges Jest config, so it is not in the shipped plugin and gets no outside input.
- Check for a fix: `npm view deepmerge versions --json` for a release above 4.3.1, and `gh api repos/{owner}/{repo}/dependabot/alerts/1 --jq '.security_vulnerability.first_patched_version'` for a patched version.

## Acceptance criteria

- [ ] `npm ls deepmerge` shows a version outside the affected range, or the alert is dismissed as not used with the user's approval
- [ ] Dependabot alert #1 is closed
- [ ] `npm run typecheck` and `npm test` pass

## Implementation Plan

- [ ] Check whether `deepmerge` has a patched release, or whether a newer `jest` depends on one
- [ ] If a patched `deepmerge` exists but Jest still pins the old one, add an `overrides` entry in `package.json`; otherwise bump `jest`
- [ ] Run `npm install`, then `npm ls deepmerge` to confirm the new version
- [ ] Run `npm run typecheck` and `npm test`
- [ ] Confirm alert #1 shows as fixed

## Origin

Raised on 2026-11-06 after reviewing the repo's Dependabot alerts.

## Decisions

- **Wait for an upstream fix instead of dismissing or patching.** *Why:* no patched version exists, and the risk is low (dev-only, no outside input). Revisit if the alert's severity changes.
