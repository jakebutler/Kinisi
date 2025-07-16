## Project Overview

Kinisi is an AI-Powered Exercise Program Generator. It is a mobile-responsive web application designed to build personalized and adaptive exercise programs. The application achieves this by utilizing user input gathered through an intake survey and then leveraging generative AI to create tailored assessments and exercise routines.

Key features include:
- User authentication (email/password)
- A comprehensive intake survey with dynamic form generation
- AI-generated personalized assessments based on survey responses
- Custom exercise program generation
- Session scheduling with calendar integration capabilities (Note: actual integration might be a future feature, the description implies planning for it)
- Chat-based feedback mechanism for refining exercise programs

## Technologies Used

-   **Frontend**: Next.js 14 with TypeScript.
    *   *Why*: Next.js provides a robust framework for building server-rendered React applications, which is beneficial for SEO and initial page load performance. TypeScript adds static typing, improving code quality and maintainability, especially for larger projects.
-   **Styling**: Tailwind CSS.
    *   *Why*: Tailwind CSS is a utility-first CSS framework that allows for rapid UI development directly within the HTML, promoting consistency and reducing the need for custom CSS.
-   **Authentication**: Supabase Auth.
    *   *Why*: Supabase provides a managed authentication service that simplifies implementing secure user sign-up, login, and session management using email/password, social logins, and more. It integrates seamlessly with its database offering.
-   **Database**: Supabase PostgreSQL.
    *   *Why*: Supabase uses PostgreSQL as its underlying database, offering a powerful, open-source relational database solution. It's directly integrated with Supabase's other backend services, making data access straightforward.
-   **AI/LLM**: OpenAI GPT-3.5 Turbo (configurable to GPT-4) via Langchain.
    *   *Why*: OpenAI's GPT models are advanced language models capable of generating human-like text, making them suitable for creating personalized assessments from survey data. Langchain is a framework that simplifies the development of applications powered by language models, providing tools and abstractions for managing prompts, chains, and integrations.
-   **Deployment**: Netlify.
    *   *Why*: Netlify offers a simple and powerful platform for deploying modern web applications, with features like continuous integration/continuous deployment (CI/CD), serverless functions, and easy configuration for Next.js projects.

## Directory and File Structure

The project follows a structure typical for Next.js applications, with additions for tests and specific utilities.

-   `kinisi-app/`
    -   `app/`: Contains the core application logic using the Next.js App Router.
        -   `api/`: Houses backend API route handlers. For example, `assessment/route.ts` handles requests related to generating fitness assessments.
        -   `dashboard/`: Components and logic for the user's main dashboard page after login.
        -   `login/`: Components and logic for the user login page.
        -   `register/`: Components and logic for the user registration page.
        -   `forgot-password/`: Components and logic for the password reset functionality.
        -   `survey/`: Components related to the user intake survey.
            -   `intake-survey-questions.json`: A JSON schema file that defines the structure, questions, and validation rules for the user intake survey. This allows for dynamic form generation.
        -   `layout.tsx`: The main layout component for the application, often including global elements like navigation bars and footers.
        -   `globals.css`: Global styles for the application.
    -   `components/`: Contains reusable React components used throughout the application.
        -   `context/`: React context providers. For instance, `AuthContext.tsx` manages the global authentication state (user session, loading status).
        -   `ui/`: General user interface components, such as `NavBar.tsx` or `ProtectedRoute.tsx` (which restricts access to certain routes based on authentication status).
    -   `public/`: Stores static assets like images, fonts, and icons that are served directly by the web server.
    -   `utils/`: Contains utility functions, helper scripts, and client library initializations.
        -   `supabaseClient.ts`: Initializes and exports the Supabase client, configured with the project's URL and anonymous key, enabling interaction with Supabase services (Auth, Database).
        -   `assessmentChain.ts`: Implements the logic for interacting with the OpenAI language model via Langchain. It includes functions to generate personalized assessments from survey data (`generateAssessmentFromSurvey`) and to revise assessments based on user feedback (`reviseAssessmentWithFeedback`).
        -   `surveyResponses.ts`: (Note: This file was observed in `ls` but its specific content was not inspected; assume it contains utilities related to processing or managing survey responses if it exists, otherwise it might be part of another utility or component).
    -   `__tests__/`: Directory for unit and integration tests.
        -   Uses Jest as the testing framework with `ts-jest` for TypeScript support.
        -   Examples: `assessmentChain.test.ts` (tests for the AI assessment generation logic), `assessmentFeedbackApi.test.ts` (tests for the assessment feedback API endpoint).
    -   `e2e/`: Directory for end-to-end tests.
        -   Uses Playwright as the testing framework.
        -   Example: `assessmentFeedback.spec.ts` (tests the complete user flow of providing feedback on an assessment).
    -   `node_modules/`: Contains all project dependencies.
    -   `.gitignore`: Specifies intentionally untracked files that Git should ignore.
    -   `next.config.ts`: Configuration file for Next.js.
    -   `jest.config.mjs`: Configuration file for Jest.
    -   `playwright.config.ts`: Configuration file for Playwright.
    -   `package.json`: Lists project dependencies, scripts (e.g., `dev`, `build`, `test`), and other metadata.
    -   `tsconfig.json`: Configuration file for the TypeScript compiler.
    -   `README.md`: General information about the project, setup, and contribution guidelines.
    -   `PROJECT_DOCUMENTATION.md`: This file - detailed documentation about the project's architecture and workings.

## Authentication Flow

User authentication in Kinisi is handled by **Supabase Auth**.

1.  **Registration/Login**: Users can register for a new account or log in with existing credentials (email/password) through dedicated pages (`app/register/` and `app/login/`).
2.  **Supabase Interaction**: When a user signs up or logs in, the application communicates with Supabase Auth. Supabase verifies the credentials and, upon success, issues a session token (typically a JSON Web Token - JWT).
3.  **Session Management**:
    *   The Supabase client library (`utils/supabaseClient.ts`) handles the storage and refreshing of this session token automatically.
    *   The `components/context/AuthContext.tsx` plays a crucial role in managing the authentication state globally within the application. It:
        *   Subscribes to Supabase's `onAuthStateChange` listener. This listener detects changes in the authentication state (e.g., user logs in, logs out, token refreshed).
        *   Makes the current user object and session information available to any component within the `AuthProvider`'s scope.
        *   Provides a `loading` state to indicate whether the initial session information is being fetched.
        *   Offers a `signOut` function to log the user out.
4.  **Protected Routes**:
    *   The application uses a `components/ui/ProtectedRoute.tsx` component (or similar mechanism).
    *   This component wraps pages or layouts that require authentication (e.g., the `app/dashboard/`).
    *   It checks the authentication state via the `useAuth()` hook (from `AuthContext.tsx`). If the user is not authenticated, they are typically redirected to the login page.
5.  **API Requests**: Authenticated API requests to Supabase (e.g., for database operations) automatically include the user's JWT, allowing Supabase to enforce row-level security policies based on the user's identity. For internal API routes within the Next.js app, the user's session or ID might be passed along or verified as needed.

## Automated Testing

The project employs a combination of unit/integration tests and end-to-end tests to ensure code quality and application stability.

### Unit/Integration Tests

-   **Framework**: [Jest](https://jestjs.io/) is used as the primary testing framework, along with `ts-jest` to support tests written in TypeScript.
-   **Location**: Test files are co-located within the `__tests__/` directory at the root of the project. Test filenames typically follow the pattern `*.test.ts` (e.g., `assessmentChain.test.ts`).
-   **Configuration**: Jest's configuration is defined in `jest.config.mjs`.
-   **Coverage**:
    *   The current test suite includes coverage for critical utility functions, particularly the AI-driven assessment logic in `utils/assessmentChain.ts` (see `__tests__/assessmentChain.test.ts`).
    *   API endpoint logic also has test coverage, for example, `__tests__/assessmentFeedbackApi.test.ts` tests the feedback mechanism for assessments.
    *   **Guideline**: Developers should write unit or integration tests for new utility functions, complex business logic, API route handlers, and critical React components (especially those with internal logic, though UI-centric component testing might lean more towards E2E or visual regression tests).
-   **Running Tests**: Tests can be executed using the `npm test` script defined in `package.json`.

### End-to-End (E2E) Tests

-   **Framework**: [Playwright](https://playwright.dev/) is used for end-to-end testing. Playwright allows for testing web applications across different browsers (Chromium, Firefox, WebKit).
-   **Location**: E2E test files are located in the `e2e/` directory (e.g., `e2e/assessmentFeedback.spec.ts`).
-   **Configuration**: Playwright's configuration is defined in `playwright.config.ts`. This includes settings like the base URL for the application (`http://localhost:3000`), browser configurations, and reporting options.
-   **Coverage**:
    *   E2E tests are designed to simulate real user scenarios and verify critical user flows. For example, `assessmentFeedback.spec.ts` likely tests the entire process of a user receiving an assessment and providing feedback.
    *   **Guideline**: Developers should add E2E tests for new major features, significant UI changes that impact user workflows, and to cover the most critical paths through the application (e.g., registration, login, survey completion, assessment generation).
-   **Running Tests**: E2E tests are typically run using Playwright's CLI commands (e.g., `npx playwright test`). Specific scripts might be added to `package.json` for convenience. Reports (like the HTML reporter) can be generated to view test results.

## APIs and Integrations

The application leverages both internal APIs (built as part of the Next.js app) and external third-party services.

### Internal APIs (Next.js API Routes)

-   **Location**: Defined within the `app/api/` directory using Next.js API Routes.
-   **Purpose**: These routes handle backend logic, data processing, and communication with external services like Supabase or OpenAI, without exposing sensitive keys or complex logic to the client-side.
-   **Example: `/api/assessment` (POST)**
    *   **File**: `app/api/assessment/route.ts`
    *   **Functionality**: This endpoint is responsible for generating a personalized fitness assessment.
    *   **Process**:
        1.  It receives `surveyResponses` (the user's answers to the intake survey) and a `userId` in the request body.
        2.  It calls the `generateAssessmentFromSurvey` function from `utils/assessmentChain.ts`, which uses Langchain and OpenAI to produce the assessment text based on the survey responses.
        3.  It retrieves the `survey_response_id` for the user from the Supabase `survey_responses` table.
        4.  It then stores the generated `assessment`, along with the `userId` and `survey_response_id`, into the Supabase `assessments` table.
        5.  It returns the generated `assessment` and the new `assessmentId` to the client.
-   Other API routes may exist for features like handling assessment feedback (e.g., `app/api/assessment/feedback/route.ts`).

### External APIs / Third-Party Integrations

-   **Supabase**
    *   **Service Type**: Backend-as-a-Service (BaaS)
    *   **Modules Used**:
        *   **Supabase Auth**: Manages user authentication (sign-up, login, session management). Client-side interactions are mediated through the `AuthContext` and the Supabase JS library.
        *   **Supabase Database (PostgreSQL)**: Provides the relational database for storing all persistent application data, including user profiles, survey responses, generated assessments, exercise programs, etc. The `utils/supabaseClient.ts` file initializes the Supabase client used for database operations. Row-Level Security (RLS) policies are typically configured within Supabase to control data access.
    *   **Integration**: The application interacts with Supabase services via the `supabase-js` client library.
-   **OpenAI**
    *   **Service Type**: AI / Large Language Model (LLM) Provider
    *   **Model(s) Used**: Primarily GPT-3.5 Turbo (default, with the option to configure for GPT-4 or other models supported by Langchain).
    *   **Purpose**:
        *   Generates personalized fitness assessments based on user survey data.
        *   Revises these assessments based on user feedback.
    *   **Integration**:
        *   Handled through the `utils/assessmentChain.ts` module.
        *   The [Langchain](https://js.langchain.com/) library (`langchain` npm package) is used as an abstraction layer to simplify interactions with the OpenAI API. This includes managing prompt templates, chaining calls to the LLM, and parsing outputs.
        *   API requests to OpenAI are made server-side (e.g., within API routes or server components) to protect the API key.
-   **Netlify**
    *   **Service Type**: Deployment and Hosting Platform
    *   **Purpose**: Used for continuous deployment (CD) from the Git repository and for hosting the production version of the Kinisi web application. Netlify handles build processes for Next.js applications and provides features like CDN distribution, serverless functions (which can host Next.js API routes), and custom domain management.

## How the App Works - Core Loop

The Kinisi application guides users through a process of providing information to receive a personalized exercise program. Here’s a typical user flow:

1.  **Authentication**:
    *   A new user registers for an account, or an existing user logs in. This is managed by Supabase Auth.
    *   Upon successful authentication, the user gains access to protected areas of the application, like the dashboard.

2.  **Intake Survey**:
    *   The user is prompted to complete an intake survey. This survey is dynamically generated based on the schema defined in `app/survey/intake-survey-questions.json`.
    *   The survey collects information about the user's health status, fitness goals, activity preferences, available equipment, and time commitment.
    *   Survey responses are submitted to the application.

3.  **Assessment Generation**:
    *   The submitted survey responses are sent to the internal API endpoint `/api/assessment`.
    *   This API route triggers the `generateAssessmentFromSurvey` function located in `utils/assessmentChain.ts`.
    *   This function formats the survey data and uses Langchain to send a request to the OpenAI GPT model (e.g., GPT-3.5 Turbo).
    *   The LLM generates a personalized assessment that summarizes the user's goals, relevant health information, and provides encouragement.
    *   The generated assessment text is then stored in the Supabase `assessments` table, linked to the user and their survey response.

4.  **Assessment Display and Feedback**:
    *   The personalized assessment is displayed to the user in the application's UI (likely on their dashboard or a dedicated assessment page).
    *   The user has the opportunity to review their assessment and provide feedback via a chat-based interface or a dedicated feedback form.
    *   User feedback can trigger a revision process. The `reviseAssessmentWithFeedback` function in `utils/assessmentChain.ts` takes the original assessment, survey data, and user feedback to generate a revised assessment using the LLM. The updated assessment is then stored and displayed.

5.  **Exercise Program Generation (Conceptual - Details may evolve)**:
    *   Once the user is satisfied with their assessment, the application (or a subsequent process) uses this assessment (and potentially the original survey data) to generate a tailored exercise program.
    *   (The exact mechanism for program generation, whether LLM-based, rule-based, or a hybrid, would be detailed here as the feature is fully implemented.)
    *   The program would likely include specific exercises, sets, repetitions, frequency, and potentially instructional videos or descriptions.

6.  **Scheduling and Engagement**:
    *   The generated exercise program can be scheduled, possibly integrating with a calendar view within the app.
    *   Users follow their program, and the app might include features for tracking progress, marking sessions as complete, and providing ongoing motivation.

This loop—survey, AI-driven assessment, feedback, and program generation—forms the core of the Kinisi user experience, aiming to provide adaptive and personalized fitness guidance.
