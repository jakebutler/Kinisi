# 🏋️‍♀️ Product Requirements Document (PRD): Kinisi (Updated)
**Last Updated: July 29, 2024**

## 🔍 Summary
Kinisi is a mobile-responsive web app that builds personalized, adaptive exercise programs using user input and generative AI. Users complete an intake survey, review an AI-generated Personalized Assessment, receive a tailored exercise program, and get a session schedule that integrates with their Google Calendar. The system supports chat-based feedback to iteratively improve the program and schedule using LLM agents, abstracted behind a single assistant UI.

## 🎯 Goals
*   Enable users to easily receive and follow a customized physical activity plan.
*   Use AI to translate user intent and constraints into structured, actionable programs.
*   Make it easy for users to stay on track via Google Calendar integration.
*   Provide an intuitive, supportive, and adaptive experience through chat-driven feedback.

## 👥 User Personas
*   **Aspiring Exerciser**: Low activity baseline, looking to build a habit with minimal friction.
*   **Reformer**: Previously active, recovering from injury or life change.
*   **Optimizer**: Currently active and seeking better structure or goal alignment.

## 🔄 Core User Flow (Current Implementation)
1.  **Account Creation**: User signs up and logs in.
2.  **Intake Survey Completion**: User fills out a detailed survey about their health, goals, and preferences.
3.  **Personalized Assessment Generation**: An AI agent generates a summary of the user's needs and constraints.
4.  **Assessment Feedback**: The user can provide feedback to refine the assessment.

## 🧱 Features by Milestone

### ✅ Milestone 1: Authentication (Implemented)
*   Email/password sign-up, sign-in
*   Password reset via Supabase Auth
*   Mobile-responsive UI
*   Secure session handling

### ✅ Milestone 2: Intake Survey (Implemented)
*   Survey Form (from JSON schema)
*   Collects: goals, pain, fitness level, intent, equipment access, time availability, etc.
*   Survey Results Page (displays user’s raw responses)

### ✅ Milestone 3: Personalized Assessment (Implemented)
*   **Personalized Assessment**: LLM-generated summary of user’s exercise needs.
*   **Chat-based Feedback on Assessment**: Users can submit changes in natural language. The assistant updates and re-presents the summary until approved.

---

## ❗ Future Considerations (Not Yet Implemented)

### Milestone 4: Custom Exercise Program Generation
*   **LLM-generated Program**:
    *   Weekly breakdown with session number, duration, and goals
    *   Each session includes:
        *   Activity or exercise name
        *   Sets/reps or duration/intensity
        *   Equipment required
        *   YouTube tutorial links
        *   Easier and harder variations
*   **Exercise Program UI**:
    *   Paginated weekly schedule view
    *   Clickable session details
*   **Chat-based Feedback**:
    *   User can modify entire program or individual sessions

### Milestone 5: Schedule & Calendar Integration
*   Select Program Start Date
*   LLM-generated Session Schedule
*   Google Calendar Integration

### Milestone 6-7: Feedback Loop for Assessment, Program & Schedule
*   Unified Assistant Chat UI
*   Context-Aware Guidance

### Other
*   Admin/Coach portal
*   Progress tracking or journaling
*   Social features (e.g. challenges)
*   Advanced scheduling UI with drag-and-drop

## 📱 User Interface
1.  **Sign In / Create Account**
2.  **Onboarding Flow (Pre-program)**
3.  **Program Dashboard (Post-setup)**

## 💬 Assistant Agent Design
*   Chat-based interface across all stages
*   Orchestrator routes user messages to appropriate agents

## 🧠 LLM + Infra Architecture
*   **Backend**: Supabase (Auth, DB)
*   **LLM Orchestration**: LangChain / LangFlow
*   **LLMs**: OpenAI GPT (configurable for future swap-outs)

## 📊 Intake Survey Field Coverage
Includes:
*   Medical clearance
*   Pain/injury
*   Physical activity baseline
*   Readiness, confidence, and goals
*   Sleep and tobacco use
*   Activity preferences
*   Equipment access
*   Time commitment: days, session length, time of day
(Defined in `intake-survey-questions.json`)

## ✅ Success Metrics
*   **Intake survey completion rate**: >85%
*   **Program approval rate**: >75% on first version
*   **Calendar session export rate**: >70%
*   **Users updating programs via chat**: >50%
*   **Weekly active users (W1 retention)**: >30%
