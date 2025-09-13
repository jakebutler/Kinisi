# PromptLayer “Prompt History” Tracking — Implementation Plan

## Overview
- Non-blocking PromptLayer tracking for Assessment and Revision prompts at call sites, preserving existing LangChain execution and Prompt Registry fetch behavior.
- Aligned with [DEVELOPER_WORKFLOW.md](DEVELOPER_WORKFLOW.md):
  - Tests isolate external services; all real network calls blocked.
  - Next.js API route testing uses global mocks in [jest.setup.js](jest.setup.js).
  - Build-only typecheck via [tsconfig.build.json](tsconfig.build.json).
  - Pre-PR verification: `npm run lint`, `npm test`, `npm run typecheck`, `npm run build`.

## Environment
- `PROMPTLAYER_API_KEY` in staging/prod.
- Optional: `DISABLE_PROMPTLAYER_TRACKING=true` to force no-op in dev.
- Optional: `PROMPTLAYER_FETCH_TIMEOUT_MS` (default `3000`) to bound registry calls.
- Server code uses only `OPENAI_API_KEY` (no fallback to `NEXT_PUBLIC_OPENAI_API_KEY`).

## Global checklist
- [x] Create feature branch `feat/promptlayer-tracking`
- [x] Add [utils/promptlayerClient.ts](utils/promptlayerClient.ts) (lazy client, test env no-op)
- [x] Append `trackPromptRun()` helper to [utils/promptlayer.ts](utils/promptlayer.ts) with safe try/catch
- [x] Mock `trackPromptRun` in [jest.setup.js](jest.setup.js) (no-op but assertable)
- [x] Instrument [generateAssessmentFromSurvey()](utils/assessmentChain.ts) with tags/metadata (`usedRegistry`, `ragChunksCount`)
- [x] Instrument [reviseAssessmentWithFeedback()](utils/assessmentChain.ts) with tags/metadata (`revisionOfAssessmentId`)
- [x] Wire `userId` (and `revisionOfAssessmentId`) from API routes into `assessmentChain` calls
- [x] Add unit tests asserting tracking payloads
- [x] Ensure no real network calls in tests; registry fetch continues to fallback under blocked fetch
- [x] Docs update in [DEVELOPER_WORKFLOW.md](DEVELOPER_WORKFLOW.md) (PromptLayer notes + append-only revisions)
- [x] Pre-PR verification: lint, test, typecheck, build

## Stage 1: PromptLayer Client + Tracking Helper
- Goal: Lazy client + safe non-throwing `trackPromptRun()` utility; no-ops in tests.
- Status: [x] Complete

## Stage 2: Instrument Assessment Generation (RAG-aware)
- Goal: Track generation with env/feature/version tags and rich metadata; keep LangChain path unchanged.
- Status: [x] Complete

## Stage 3: Instrument Assessment Revision
- Goal: Track revision with env/feature/version tags, optional `revisionOfAssessmentId`.
- Status: [x] Complete

## Stage 4: Pass Metadata from API Routes + Test-Safe Mocks
- Goal: Provide `userId` (and `revisionOfAssessmentId`) from API routes; ensure tests can assert calls with no network.
- Status: [x] Complete

## Stage 5: Documentation & Rollout
- Goal: Ops notes + verify Prompt History in staging/prod.
- Status: [x] Complete (docs updated; rollout verification pending platform)

## Risks & Mitigations
- ESM/CJS interop: lazy singleton and server-only require.
- Test flakiness: only mock [trackPromptRun](utils/promptlayer.ts); keep Prompt Registry behavior but blocked to force fallback.
- Privacy: redaction hook ready; currently sending formatted survey only.
- Observability drift: consistent tags (env, feature, v2) + `usedRegistry`/`ragChunksCount`.

## Definition of Done
- Tests passing; no real network calls in Jest.
- Typecheck/build succeed; lint clean.
- Prompt History entries visible with expected tags/metadata.
- Clear commit messages; small, working changes.

## Pre-PR Checklist
- `npm run lint`
- `npm test`
- `npm run typecheck`
- `npm run build`

## What’s already implemented
- [utils/promptlayerClient.ts](utils/promptlayerClient.ts) (lazy client, test/dev safe)
- [utils/promptlayer.ts](utils/promptlayer.ts) `trackPromptRun()`
- [utils/assessmentChain.ts](utils/assessmentChain.ts) instrumented generation & revision; added `opts.userId` & `revisionOfAssessmentId`
- [app/api/assessment/route.ts](app/api/assessment/route.ts) passes `userId`
- [app/api/assessment/feedback/route.ts](app/api/assessment/feedback/route.ts) passes `userId` & `revisionOfAssessmentId`; append-only revision semantics
- [jest.setup.js](jest.setup.js) mocks `trackPromptRun` to a resolved no-op

## Tests to add (next step)
- Unit: `__tests__/unit/assessmentChain.promptlayer.test.ts` (added)
  - Mocks RAG to return `[]` and no context.
  - Spies `RunnableSequence.from` to avoid LLM calls.
  - Asserts `trackPromptRun` called with correct `promptName`, `tags`, `metadata`, and validates `inputVariables.survey`.