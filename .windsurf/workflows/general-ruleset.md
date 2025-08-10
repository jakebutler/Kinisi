---
description: General coding ruleset
---

**AI Coding Assistant Development Guidelines**
==============================================

*Adapted for* ***Claude Code, Windsurf, Cursor, and Replit****. Platform-specific adjustments are in italics.*

* * * * *

**Philosophy**
--------------

### **Core Beliefs**

-   **Incremental progress over big bangs** -- Commit small, working changes that compile and pass tests.

-   **Learning from existing code** -- Study patterns before implementing.

-   **Pragmatic over dogmatic** -- Adapt to project realities.

-   **Clear intent over clever code** -- Favor boring, obvious solutions.

### **Simplicity Means**

-   Single responsibility per function/class.

-   Avoid premature abstractions.

-   No clever tricks -- pick the boring solution.

-   If you need to explain it verbally, it's too complex.

* * * * *

**Process**
-----------

### **1\. Planning & Staging**

Break work into 3--5 stages, documented in IMPLEMENTATION_PLAN.md:

```
## Stage N: [Name]
**Goal**: [Specific deliverable]
**Success Criteria**: [Testable outcomes]
**Tests**: [Specific test cases]
**Status**: [Not Started|In Progress|Complete]
```

-   Update status as you progress.

-   Remove file when all stages are done.

*Platform notes:*

-   **Claude Code** -- Paste plan into context for multi-turn coherence.

-   **Windsurf** -- Link plan to branch-specific tasks.

-   **Cursor** -- Use /plan command to feed implementation steps.

-   **Replit** -- Keep plan visible in side-by-side markdown tab.

### **2\. Implementation Flow**

1.  **Understand** -- Study existing patterns.

2.  **Test** -- Write test first (red).

3.  **Implement** -- Minimal code to pass (green).

4.  **Refactor** -- With tests passing.

5.  **Commit** -- With clear message linking to plan.

*Platform notes:*

-   **Claude Code** -- Provide relevant code excerpts in context.

-   **Windsurf** -- Use AI "agent" to run TDD loops.

-   **Cursor** -- Inline generate functions, then /fix linting issues.

-   **Replit** -- Use built-in test runner before committing.

### **3\. When Stuck (After 3 Attempts)**

**Stop after 3 failed tries.** Then:

1.  Document what failed.

2.  Research 2--3 similar implementations.

3.  Question fundamentals.

4.  Try a different angle.

*Platform notes:*

-   **Claude Code** -- Summarize failures for context.

-   **Windsurf** -- Branch off for alternative approaches.

-   **Cursor** -- Use /explain to analyze failure points.

-   **Replit** -- Share logs in multiplayer mode for feedback.

* * * * *

**Technical Standards**
-----------------------

### **Architecture Principles**

-   Composition over inheritance; use DI.

-   Interfaces over singletons.

-   Explicit over implicit.

-   Test-driven when possible; never disable tests.

### **Code Quality**

-   Every commit must compile, pass all tests, include tests for new functionality, follow formatting/linting.

-   Run formatters/linters before committing.

-   Ensure commit message explains "why".

### **Error Handling**

-   Fail fast with descriptive messages.

-   Include debugging context.

-   Handle errors at the right level.

-   Never silently swallow exceptions.

* * * * *

**Decision Framework**
----------------------

When multiple valid approaches exist, choose by:

1.  Testability

2.  Readability

3.  Consistency

4.  Simplicity

5.  Reversibility

* * * * *

**Project Integration**
-----------------------

### **Learning the Codebase**

-   Find 3 similar components.

-   Identify common patterns.

-   Use same libraries/utilities.

-   Follow existing test patterns.

### **Tooling**

-   Use project's existing build system, test framework, formatter/linter.

-   Don't add new tools without strong justification.

* * * * *

**Quality Gates**
-----------------

**Definition of Done:**

-   Tests written and passing.

-   Code follows conventions.

-   No linter/formatter warnings.

-   Commit messages are clear.

-   Matches implementation plan.

-   No TODOs without issue numbers.

**Test Guidelines:**

-   Test behavior, not implementation.

-   One assertion per test when possible.

-   Clear test names.

-   Use existing helpers.

-   Deterministic tests.

* * * * *

**Important Reminders**
-----------------------

**NEVER:**

-   Use --no-verify.

-   Disable tests instead of fixing them.

-   Commit code that doesn't compile.

-   Assume without verifying.

**ALWAYS:**

-   Commit working code incrementally.

-   Update plan documentation.

-   Learn from existing implementations.

-   Stop after 3 failed attempts.

* * * * *

**Gaps Addressed from Original Ruleset**
----------------------------------------

-   Added platform-specific instructions for Claude Code, Windsurf, Cursor, Replit.

-   Explicit AI context management strategies.

-   Clarified TDD workflow per platform.

-   Added guidance for failure documentation.

-   Defined deterministic test requirement.