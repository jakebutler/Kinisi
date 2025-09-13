# PromptLayer “Prompt History” Tracking — Implementation Plan

## Overview
- Non-blocking PromptLayer tracking for Assessment and Revision prompts, preserving existing LangChain execution and Prompt Registry fetch behavior.
- Aligned with [DEVELOPER_WORKFLOW.md](cci:7://file:///Users/jacobbutler/Documents/GitHub/Kinisi/DEVELOPER_WORKFLOW.md:0:0-0:0):
  - Tests isolate external services; all real network calls blocked.
  - Next.js API route testing uses global mocks in [jest.setup.js](cci:7://file:///Users/jacobbutler/Documents/GitHub/Kinisi/jest.setup.js:0:0-0:0).
  - Build-only typecheck via [tsconfig.build.json](cci:1://file:///Users/jacobbutler/Documents/GitHub/Kinisi/__tests__/integration/api/program-revise-api.test.ts:121:18-121:44).
  - Pre-PR verification: `npm run lint`, `npm test`, `npm run typecheck`, `npm run build`.

## Environment
- `PROMPTLAYER_API_KEY` in staging/prod.
- Optional: `DISABLE_PROMPTLAYER_TRACKING=true` to force no-op in dev.

## Global checklist
- [x] Create feature branch `feat/promptlayer-tracking`
- [x] Add [utils/promptlayerClient.ts](cci:7://file:///Users/jacobbutler/Documents/GitHub/Kinisi/utils/promptlayerClient.ts:0:0-0:0) (lazy client, test env no-op)
- [x] Append [trackPromptRun()](cci:1://file:///Users/jacobbutler/Documents/GitHub/Kinisi/utils/promptlayer.ts:71:0-100:1) helper to [utils/promptlayer.ts](cci:7://file:///Users/jacobbutler/Documents/GitHub/Kinisi/utils/promptlayer.ts:0:0-0:0) with safe try/catch
- [x] Mock [trackPromptRun](cci:1://file:///Users/jacobbutler/Documents/GitHub/Kinisi/utils/promptlayer.ts:71:0-100:1) in [jest.setup.js](cci:7://file:///Users/jacobbutler/Documents/GitHub/Kinisi/jest.setup.js:0:0-0:0) (no-op but assertable)
- [x] Instrument [generateAssessmentFromSurvey()](cci:1://file:///Users/jacobbutler/Documents/GitHub/Kinisi/utils/assessmentChain.ts:82:0-178:1) with tags/metadata (`usedRegistry`, `ragChunksCount`)
- [x] Instrument [reviseAssessmentWithFeedback()](cci:1://file:///Users/jacobbutler/Documents/GitHub/Kinisi/utils/assessmentChain.ts:181:0-267:1) with tags/metadata (`revisionOfAssessmentId`)
- [x] Wire `userId` (and `revisionOfAssessmentId`) from API routes into `assessmentChain` calls
- [ ] Add unit tests asserting tracking payloads
- [ ] Ensure no real network calls in tests; registry fetch continues to fallback under blocked fetch
- [ ] Optional docs update in [DEVELOPER_WORKFLOW.md](cci:7://file:///Users/jacobbutler/Documents/GitHub/Kinisi/DEVELOPER_WORKFLOW.md:0:0-0:0) (PromptLayer notes)
- [ ] Pre-PR verification: lint, test, typecheck, build

## Stage 1: PromptLayer Client + Tracking Helper
- Goal: Lazy client + safe non-throwing [trackPromptRun()](cci:1://file:///Users/jacobbutler/Documents/GitHub/Kinisi/utils/promptlayer.ts:71:0-100:1) utility; no-ops in tests.
- Status: [x] Complete

## Stage 2: Instrument Assessment Generation (RAG-aware)
- Goal: Track generation with env/feature/version tags and rich metadata; keep LangChain path unchanged.
- Status: [x] Complete

## Stage 3: Instrument Assessment Revision
- Goal: Track revision with env/feature/version tags, optional `revisionOfAssessmentId`.
- Status: [x] Complete

## Stage 4: Pass Metadata from API Routes + Test-Safe Mocks
- Goal: Provide `userId` (and `revisionOfAssessmentId`) from API routes; ensure tests can assert calls with no network.
- Status: [x] Complete (route wiring); [ ] Tests pending

## Stage 5: Documentation & Rollout
- Goal: Ops notes + verify Prompt History in staging/prod.
- Status: [ ] Not Started

## Risks & Mitigations
- ESM/CJS interop: lazy singleton and server-only require.
- Test flakiness: only mock [trackPromptRun](cci:1://file:///Users/jacobbutler/Documents/GitHub/Kinisi/utils/promptlayer.ts:71:0-100:1); keep Prompt Registry behavior but blocked to force fallback.
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
- [utils/promptlayerClient.ts](cci:7://file:///Users/jacobbutler/Documents/GitHub/Kinisi/utils/promptlayerClient.ts:0:0-0:0) (lazy client, test/dev safe)
- [utils/promptlayer.ts](cci:7://file:///Users/jacobbutler/Documents/GitHub/Kinisi/utils/promptlayer.ts:0:0-0:0) [trackPromptRun()](cci:1://file:///Users/jacobbutler/Documents/GitHub/Kinisi/utils/promptlayer.ts:71:0-100:1)
- [utils/assessmentChain.ts](cci:7://file:///Users/jacobbutler/Documents/GitHub/Kinisi/utils/assessmentChain.ts:0:0-0:0) instrumented generation & revision; added `opts.userId` & `revisionOfAssessmentId`
- [app/api/assessment/route.ts](cci:7://file:///Users/jacobbutler/Documents/GitHub/Kinisi/app/api/assessment/route.ts:0:0-0:0) passes `userId`
- [app/api/assessment/feedback/route.ts](cci:7://file:///Users/jacobbutler/Documents/GitHub/Kinisi/app/api/assessment/feedback/route.ts:0:0-0:0) passes `userId` & `revisionOfAssessmentId`
- [jest.setup.js](cci:7://file:///Users/jacobbutler/Documents/GitHub/Kinisi/jest.setup.js:0:0-0:0) mocks [trackPromptRun](cci:1://file:///Users/jacobbutler/Documents/GitHub/Kinisi/utils/promptlayer.ts:71:0-100:1) to a resolved no-op

## Tests to add (next step)
- Unit: `__tests__/unit/assessmentChain.promptlayer.test.ts`
  - Mock RAG to return `[]` and no context.
  - Spy `RunnableSequence.from` to avoid LLM calls.
  - Assert [trackPromptRun](cci:1://file:///Users/jacobbutler/Documents/GitHub/Kinisi/utils/promptlayer.ts:71:0-100:1) called with correct `promptName`, `tags`, and `metadata`.