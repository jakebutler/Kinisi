# Branch Cleanup Proposal

## Overview
This document outlines a proposal for cleaning up old branches in the Kinisi repository. After analyzing all branches, we've identified numerous branches that can be safely deleted as they have already been merged to main.

## Current Branch Status

### Protected Branches (DO NOT DELETE)
- `main` - Default branch, should never be deleted

### Active Branches (DO NOT DELETE)
- `merge-dependency-prs` - Currently active (last commit: 2025-10-22)
- `backup/pre-restructure` - Backup branch (last commit: 2025-05-15)
- `docs/stagewise-cli` - Documentation branch (last commit: 2025-08-05)
- `feature/assessment-feedback-db-and-tests` - Active feature branch (last commit: 2025-05-14)

## Local Branches Safe for Deletion (Already Merged)

### Recently Merged (Within last 3 months)
1. `dependency-PR-cleanup` (2025-10-22)
2. `feat/issue-166-promptlayer-append-revisions` (2025-10-22)
3. `feat/promptlayer-tracking` (2025-09-13)
4. `chore/test-stabilization-onboarding-and-auth` (2025-09-12)
5. `feature/assessment-auth-rag-tracking` (2025-09-11)
6. `fix/dashboard-integration-tests` (2025-09-11)
7. `chore/refactor-design-tokens-gradients` (2025-08-23)
8. `fix/coderabbit-135-api-hardening` (2025-08-21)
9. `chore/ci-dynamic-directives-2025-08-21` (2025-08-21)
10. `feat/program-schedule-tests` (2025-08-21)
11. `fix/program-rls-auth` (2025-08-20)
12. `feature/secure-registration` (2025-08-19)
13. `feature/fix-rls-ssr-tests-2025-08-10` (2025-08-11)
14. `feat/beta-signup-hardening` (2025-08-09)
15. `chore/next-mocks-typecheck-2025-08-07` (2025-08-09)
16. `feature/promptlayer-integration` (2025-08-06)
17. `feature/assessment-approval-ui-fix` (2025-08-04)

### Older Merged (More than 3 months ago)
18. `feature/ci-automation-updates` (2025-07-26)
19. `chore/fix-all-typescript-eslint-vercel-errors` (2025-07-25)
20. `feature/fitness-program-generation` (2025-07-16)
21. `feature/assessmentchat-authcontext-test-fixes` (2025-07-16)
22. `feature/enhance-dashboard-ux` (2025-07-16)
23. `feature/add-stagewise-toolbar` (2025-07-16)
24. `feature/survey-enhancements` (2025-05-30)

## Remote Branches Safe for Deletion (Already Merged)

### Standard Feature/Chore Branches
1. `origin/chore/ci-dynamic-directives-2025-08-21`
2. `origin/chore/next-mocks-typecheck-2025-08-07`
3. `origin/chore/refactor-design-tokens-gradients`
4. `origin/chore/test-stabilization-onboarding-and-auth`
5. `origin/code-cleanup`
6. `origin/feat/beta-signup-hardening`
7. `origin/feat/dependabot-setup`
8. `origin/feat/issue-166-promptlayer-append-revisions`
9. `origin/feat/program-schedule-tests`
10. `origin/feat/promptlayer-tracking`
11. `origin/feature/assessment-approval-ui-fix`
12. `origin/feature/ci-automation-updates`
13. `origin/feature/fix-rls-ssr-tests-2025-08-10`
14. `origin/feature/promptlayer-integration`
15. `origin/feature/secure-registration`
16. `origin/fix/coderabbit-135-api-hardening`
17. `origin/fix/dashboard-integration-tests`
18. `origin/fix/program-rls-auth`
19. `origin/fix/tech-debt`

## Remote Branches to Keep (Not Merged)

### Active or Special Purpose
1. `origin/dependabot/github_actions/actions/labeler-6`
2. `origin/dependabot/github_actions/actions/setup-node-6`
3. `origin/dependabot/github_actions/actions/stale-10`
4. `origin/dependabot/npm_and_yarn/eslint-config-next-15.5.6`
5. `origin/dependabot/npm_and_yarn/langchain/core-0.3.78`
6. `origin/dependabot/npm_and_yarn/openai-5.13.1`
7. `origin/dependabot/npm_and_yarn/openai-6.6.0`
8. `origin/dependabot/npm_and_yarn/supabase/ssr-0.6.1`
9. `origin/dependabot/npm_and_yarn/supabase/ssr-0.7.0`
10. `origin/dependabot/npm_and_yarn/tailwindcss/postcss-4.1.15`
11. `origin/docs-update-july-29`
12. `origin/docs/stagewise-cli`
13. `origin/feature/assessment-feedback-db-and-tests`
14. `origin/feature/survey-enhancements`
15. `origin/merge-dependency-prs`
16. `origin/refactor/remove-duplicate-logic`

## Cleanup Commands

### To delete local merged branches:
```bash
git branch -d chore/ci-dynamic-directives-2025-08-21
git branch -d chore/fix-all-typescript-eslint-vercel-errors
git branch -d chore/next-mocks-typecheck-2025-08-07
git branch -d chore/refactor-design-tokens-gradients
git branch -d chore/test-stabilization-onboarding-and-auth
git branch -d dependency-PR-cleanup
git branch -d feat/beta-signup-hardening
git branch -d feat/issue-166-promptlayer-append-revisions
git branch -d feat/program-schedule-tests
git branch -d feat/promptlayer-tracking
git branch -d feature/add-stagewise-toolbar
git branch -d feature/assessment-approval-ui-fix
git branch -d feature/assessment-auth-rag-tracking
git branch -d feature/assessmentchat-authcontext-test-fixes
git branch -d feature/ci-automation-updates
git branch -d feature/enhance-dashboard-ux
git branch -d feature/fitness-program-generation
git branch -d feature/fix-rls-ssr-tests-2025-08-10
git branch -d feature/promptlayer-integration
git branch -d feature/secure-registration
git branch -d feature/survey-enhancements
git branch -d fix/coderabbit-135-api-hardening
git branch -d fix/dashboard-integration-tests
git branch -d fix/program-rls-auth
```

### To delete remote merged branches:
```bash
git push origin --delete chore/ci-dynamic-directives-2025-08-21
git push origin --delete chore/next-mocks-typecheck-2025-08-07
git push origin --delete chore/refactor-design-tokens-gradients
git push origin --delete chore/test-stabilization-onboarding-and-auth
git push origin --delete code-cleanup
git push origin --delete feat/beta-signup-hardening
git push origin --delete feat/dependabot-setup
git push origin --delete feat/issue-166-promptlayer-append-revisions
git push origin --delete feat/program-schedule-tests
git push origin --delete feat/promptlayer-tracking
git push origin --delete feature/assessment-approval-ui-fix
git push origin --delete feature/ci-automation-updates
git push origin --delete feature/fix-rls-ssr-tests-2025-08-10
git push origin --delete feature/promptlayer-integration
git push origin --delete feature/secure-registration
git push origin --delete fix/coderabbit-135-api-hardening
git push origin --delete fix/dashboard-integration-tests
git push origin --delete fix/program-rls-auth
git push origin --delete fix/tech-debt
```

## Summary
- **Total branches**: 48 (29 local, 19 remote-only)
- **Safe to delete**: 42 (24 local, 18 remote)
- **Keep**: 6 branches (main, merge-dependency-prs, backup/pre-restructure, docs/stagewise-cli, feature/assessment-feedback-db-and-tests, and all dependabot branches)

This cleanup will significantly reduce branch clutter while preserving all important and active work.