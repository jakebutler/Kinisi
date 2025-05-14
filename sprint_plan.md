# 🏆 Kinisi Sprint Plan & Ticket Breakdown

This document outlines the sprint plan, individual engineering tickets, and manual testing criteria required to build the Kinisi web application based on the approved PRD.

Each sprint corresponds directly to a milestone in the PRD. All tickets are tagged for clarity (FE = Frontend, BE = Backend, LLM = LLM/Agent, INFRA = Infra, PM = Product).

---

## 🛠️ Tech Stack
- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth (Email/Password)
- **Database**: Supabase PostgreSQL
- **LLM**: OpenAI GPT-4
- **Deployment**: Netlify
- **Version Control**: GitHub

## ✨ **Sprint 1: Authentication**

### Features:

* Email/password sign-up and sign-in
* Password reset
* Auth session handling
* Mobile responsive layout

### Tickets:

1. **\[FE] Create sign-in and sign-up screens**

   * **Description**: Build mobile-friendly sign-in and sign-up forms using Tailwind. Include validation.
   * **Acceptance Criteria**:

     * User can enter email/password
     * Toggle between forms
     * Client-side form validation
   * **Labels**: frontend, auth, sprint1

2. **\[FE] Add toggle between login and register forms**

   * **Description**: UI toggle between new user registration and login views
   * **Acceptance Criteria**:

     * UI updates appropriately when toggled
     * State is preserved
   * **Labels**: frontend, ui, sprint1

3. **\[FE] Add "forgot password" flow with email reset**

   * **Description**: Implement Supabase reset password flow triggered from "Forgot Password" link
   * **Acceptance Criteria**:

     * Reset email is sent
     * User can set new password
   * **Labels**: frontend, auth, sprint1

4. **\[BE] Integrate Supabase Auth for sign-up, sign-in, and session persistence**

   * **Description**: Wire up frontend auth forms to Supabase backend and manage auth session
   * **Acceptance Criteria**:

     * User stays logged in after page reload
     * Token is stored securely
   * **Labels**: backend, auth, supabase, sprint1

5. **\[FE] Build responsive layout and top nav bar (logo left, user/sign out right)**

   * **Description**: Header component across pages
   * **Acceptance Criteria**:

     * Header layout works across screen sizes
     * Username and sign out button functional
   * **Labels**: frontend, ui, responsive, sprint1

6. **\[INFRA] Set up Supabase project, DB schema, and env config**

   * **Description**: Set up Supabase instance, basic schema, roles, and .env file for dev
   * **Acceptance Criteria**:

     * Supabase project configured
     * Local dev can connect to DB
   * **Labels**: infra, supabase, sprint1

### Testing Criteria:

* [ ] User can register a new account and stay logged in
* [ ] User can sign in/out successfully
* [ ] Password reset email is sent and works
* [ ] Auth state persists across page reload
* [ ] All views render correctly on mobile

---

## ✨ **Sprint 2: Intake Survey**

### Features:

* Intake survey form from JSON schema
* Persist user responses
* View survey results

### Tickets:

1. **\[FE] Build dynamic intake survey form from JSON schema**

   * **Description**: Render fields dynamically from provided JSON schema, validate inputs
   * **Acceptance Criteria**:

     * All required fields render correctly
     * Data passes validation
   * **Labels**: frontend, survey, sprint2

2. **\[BE] Create DB schema for storing survey responses**

   * **Description**: Design table to store structured JSON responses in Supabase
   * **Acceptance Criteria**:

     * Survey data is queryable by user ID
   * **Labels**: backend, supabase, survey, sprint2

3. **\[FE] Connect form submission to Supabase storage**

   * **Description**: On submit, write survey JSON to user record in Supabase
   * **Acceptance Criteria**:

     * Responses persist on refresh
   * **Labels**: frontend, backend, sprint2

4. **\[FE] Build "View survey results" UI for signed-in users**

   * **Description**: Show submitted responses in read-only format
   * **Acceptance Criteria**:

     * Users can verify saved answers
   * **Labels**: frontend, survey, sprint2

5. **\[FE] Add "Edit survey" button and support pre-filling form**

   * **Description**: Load existing responses into form on revisit
   * **Acceptance Criteria**:

     * Form reflects previous inputs
   * **Labels**: frontend, survey, sprint2

### Testing Criteria:

* [ ] User can complete and submit survey
* [ ] User responses are stored and visible after refresh
* [ ] Survey can be edited and resubmitted
* [ ] Survey fields match schema

---

## ✨ **Sprint 3: Personalized Assessment (LLM Agent #1)**

### Features:

* Generate Personalized Assessment from survey
* Display it alongside raw responses
* Enable chat-based feedback + updates

### Tickets:

1. **\[LLM] Design prompt and chain for Agent #1 (survey → assessment)**

   * **Description**: Define input/output structure and refine prompt via testing
   * **Acceptance Criteria**:

     * Returns coherent summary from survey inputs
   * **Labels**: llm, agent1, sprint3

2. **\[BE] Create endpoint to trigger and store assessment result**

   * **Description**: API to submit survey + store returned assessment
   * **Acceptance Criteria**:

     * Result is linked to user ID
   * **Labels**: backend, llm, sprint3

3. **\[FE] UI for viewing Personalized Assessment and raw inputs**

   * **Description**: Two-column layout with raw answers and assessment summary
   * **Acceptance Criteria**:

     * Clearly distinguishes AI-generated content
   * **Labels**: frontend, ui, sprint3

4. **\[FE] Chat interface for feedback (assessment context)**

   * **Description**: Chat box for user to improve assessment
   * **Acceptance Criteria**:

     * Freeform input sends to LLM
   * **Labels**: frontend, chat, sprint3

5. **\[LLM] Enable feedback-driven updates to assessment via chat**

   * **Description**: Prompt revision agent and return updated text
   * **Acceptance Criteria**:

     * New summaries reflect user requests
   * **Labels**: llm, chat, sprint3

6. **\[FE] UI flow: user approval step after chat-refined version**

   * **Description**: Approval button to confirm final summary
   * **Acceptance Criteria**:

     * User must approve before moving on
   * **Labels**: frontend, sprint3

### Testing Criteria:

* [ ] Personalized Assessment is generated and shown after survey
* [ ] Chat accepts user input and revises the assessment accordingly
* [ ] Final assessment is clearly marked as "Approved"
* [ ] Edge case: empty/ambiguous feedback is handled gracefully

---

## ✨ **Sprint 4: Exercise Program (LLM Agent #2)**

### Features:

* Generate exercise plan based on approved assessment
* Include sets/reps, links, variations
* UI for weekly schedule and session detail
* Chat-based updates to program

### Tickets:

1. **\[LLM] Design prompt and chain for Agent #2 (assessment → program)**

   * **Description**: Transform summary into structured workout sessions
   * **Acceptance Criteria**:

     * Output includes all required session fields
   * **Labels**: llm, agent2, sprint4

2. **\[BE] Store exercise program sessions in DB (week, session, etc.)**

   * **Description**: Design schema for multi-week session plan
   * **Acceptance Criteria**:

     * Sessions are ordered, linked, and queryable
   * **Labels**: backend, program, sprint4

3. **\[FE] Weekly schedule view with clickable session cards**

   * **Description**: Grid layout to browse sessions by week
   * **Acceptance Criteria**:

     * Sessions clickable to open detail
   * **Labels**: frontend, ui, sprint4

4. **\[FE] Session detail modal: exercise list, links, variations**

   * **Description**: Modal or drawer with session content
   * **Acceptance Criteria**:

     * All exercises and links shown
   * **Labels**: frontend, ui, sprint4

5. **\[FE] Chat interface with feedback context on program**

   * **Description**: Allow feedback on sessions or full program
   * **Acceptance Criteria**:

     * Input appears inline with sessions
   * **Labels**: frontend, chat, sprint4

6. **\[LLM] Enable program modifications via freeform chat**

   * **Description**: Use updated feedback to re-write future sessions
   * **Acceptance Criteria**:

     * User comments trigger new plan output
   * **Labels**: llm, chat, sprint4

7. **\[FE] Mark final version as "Approved" after updates**

   * **Description**: Confirm dialog to approve revised plan
   * **Acceptance Criteria**:

     * Program is locked in post-approval
   * **Labels**: frontend, sprint4

### Testing Criteria:

* [ ] Program is generated and shown after assessment approval
* [ ] Each session includes required metadata and YouTube links
* [ ] Users can view/edit individual sessions via chat
* [ ] Revisions are clearly incorporated in final approved version

---

## ✨ Sprint 5: Schedule & Calendar Integration

### Features:
- Select Program Start Date
- Generate LLM-based session schedule
- Google Calendar integration with event links
- Option to regenerate calendar

---

### Tickets:

1. **[FE] Date picker UI for start date selection**
   - **Description**: Add date selector for users to define program start date.
   - **Acceptance Criteria**:
     - Start date persists in state
     - Cannot select past dates
   - **Labels**: frontend, calendar, sprint5

2. **[LLM] Design prompt and chain for Agent #3 (program → session schedule)**
   - **Description**: Generate session-level schedule based on user availability and program structure.
   - **Acceptance Criteria**:
     - Output includes valid ISO-formatted dates/times
     - Honors user availability and frequency
   - **Labels**: llm, agent3, sprint5

3. **[BE] Store schedule: dates, times, session ID link**
   - **Description**: Create DB structure to map sessions to scheduled dates.
   - **Acceptance Criteria**:
     - Sessions are ordered and link to date/times
   - **Labels**: backend, calendar, sprint5

4. **[FE] Calendar tab UI: list or calendar view with add-to-calendar links**
   - **Description**: Visualize session schedule with event links.
   - **Acceptance Criteria**:
     - Each session clearly shows time and has a Google Calendar link
   - **Labels**: frontend, calendar, sprint5

5. **[FE] Generate Google Calendar URLs with prefilled params**
   - **Description**: Generate links using title, description, date/time, and location metadata.
   - **Acceptance Criteria**:
     - Links open Google event form with correct details
   - **Labels**: frontend, calendar, sprint5

6. **[FE] Allow re-generation of calendar based on updated preferences**
   - **Description**: Enable schedule regeneration after feedback.
   - **Acceptance Criteria**:
     - Updates schedule and replaces calendar links
   - **Labels**: frontend, calendar, sprint5

---

### Testing Criteria:
- [ ] User can select a start date and generate schedule
- [ ] Session times reflect survey time-of-day preferences
- [ ] All sessions have “Add to Calendar” links that open the correct Google form
- [ ] Users can re-generate schedule if needed

---

## ✨ Sprint 6: Assistant Chat + Feedback Routing

### Features:
- Unified assistant interface
- Handles routing across all 3 LLM agents
- Context-aware onboarding and support guidance

---

### Tickets:

1. **[LLM] Build agent routing logic (assessment, program, schedule)**
   - **Description**: Direct chat input to the correct agent based on intent classification.
   - **Acceptance Criteria**:
     - Routing is tested with multiple intents
   - **Labels**: llm, routing, assistant, sprint6

2. **[FE] Persistent assistant chat UI (shown across all tabs)**
   - **Description**: Floating or embedded chat accessible from all views.
   - **Acceptance Criteria**:
     - Chat persists on tab switches
     - Sends/receives messages without page reload
   - **Labels**: frontend, chat, ui, sprint6

3. **[FE] Add assistant messages to guide users through setup steps**
   - **Description**: Guide users based on what they’ve completed.
   - **Acceptance Criteria**:
     - Different prompts depending on user status
   - **Labels**: frontend, chat, onboarding, sprint6

4. **[LLM] Add fallback / error responses to reduce hallucination**
   - **Description**: Implement fallback logic when uncertain or out-of-scope.
   - **Acceptance Criteria**:
     - Detects and responds to unanswerable queries
   - **Labels**: llm, assistant, sprint6

5. **[FE] Support context switching (“change my schedule” → switch agent)**
   - **Description**: Allow chat to switch contexts during user conversation.
   - **Acceptance Criteria**:
     - Context clearly visible to user
     - Correct agent handles request
   - **Labels**: frontend, chat, routing, sprint6

---

### Testing Criteria:
- [ ] Assistant chat UI is available across all views
- [ ] Chat provides relevant guidance based on user progress
- [ ] Feedback is correctly routed to the right LLM agent
- [ ] Edge cases like vague input are handled with helpful fallback

---

## ✨ Sprint 7: Polish & QA

### Features:
- Mobile responsiveness
- Full QA testing
- Bug fixes and cleanup
- Logging and analytics

---

### Tickets:

1. **[FE] Final responsive pass across survey, program, calendar**
   - **Description**: Ensure mobile-first layout and breakpoints across all views.
   - **Acceptance Criteria**:
     - Layout renders correctly on phones and tablets
   - **Labels**: frontend, responsive, qa, sprint7

2. **[PM] Manual QA walkthroughs across full user flow**
   - **Description**: End-to-end test every flow from sign-up to calendar.
   - **Acceptance Criteria**:
     - All features tested and confirmed functional
   - **Labels**: product, qa, manual, sprint7

3. **[FE] Address styling and spacing bugs**
   - **Description**: Tweak margins, padding, fonts, and contrast.
   - **Acceptance Criteria**:
     - No obvious spacing or visibility issues
   - **Labels**: frontend, ui, sprint7

4. **[INFRA] Set up error logging + basic analytics**
   - **Description**: Add logging to capture client and server errors, plus GA or PostHog setup.
   - **Acceptance Criteria**:
     - Errors are logged with enough metadata
     - Page view tracking enabled
   - **Labels**: infra, logging, sprint7

---

### Testing Criteria:
- [ ] All major screens render well on mobile
- [ ] End-to-end user flow works without blockers
- [ ] No broken links, missing content, or styling issues
- [ ] Assistant is responsive and non-blocking