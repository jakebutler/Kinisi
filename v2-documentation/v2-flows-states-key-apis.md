flowchart TD
  %% User & Start
  U[User (auth via Supabase)] -->|first login after email confirm| Start[Start Onboarding]

  Start --> Survey[POST /api/assessment\n(Submit surveyResponses)]
  Survey -->|Backend: generateAssessmentFromSurvey()| AssDraft[Assessment (Draft)\nassessments table]
  AssDraft -->|Approve -> POST /api/assessment/approve| AssApproved[Assessment (Approved)]
  AssDraft -->|Feedback -> POST /api/assessment/feedback| AssDraft

  AssApproved -->|POST /api/program/create (assessment)| ProgramDraft[ExerciseProgram (Draft)\nexercise_programs.program_json]
  ProgramDraft -->|Approve -> POST /api/program/[id]/approve| ProgramApproved[ExerciseProgram (Approved)]
  ProgramDraft -->|Feedback -> POST /api/program/[id]/feedback or /revise| ProgramDraft

  ProgramApproved -->|POST /api/program/[id]/start-date| SetStart[Set start_date]
  SetStart -->|POST /api/program/[id]/schedule| Scheduled[Scheduled Sessions\nsessions + session_exercises]
  Scheduled --> ActiveState[User Status = Active]

  %% Notes / Storage
  subgraph Storage["Supabase DB (RLS enforced)"]
    direction TB
    SR[survey_responses]
    AS[assessments]
    EP[exercise_programs]
    SESS[sessions]
    SESS_EX[session_exercises]
    EX[exercises (read-only)]
    PF[program_feedback]
    RAG_DOCS[rag_documents]
    RAG_CHUNKS[rag_chunks]
    RAG_VECTORS[rag_vectors]
  end

  Survey --> SR
  AssDraft --> AS
  ProgramDraft --> EP
  Scheduled --> SESS
  Scheduled --> SESS_EX
  ProgramDraft --> PF

  %% LLM/RAG Integration
  Survey -->|retrieveRagChunksForSurvey()| RAG_CHUNKS
  RAG_CHUNKS --> RAG_VECTORS
  Survey -->|callLLMWithPrompt() / Langchain| LLM[/OpenAI via Langchain/]

  LLM --> AssDraft
  LLM --> ProgramDraft

  %% Legend
  classDef apiCall fill:#f9f,stroke:#333,stroke-width:1px;
  class Survey,AssDraft,ProgramDraft,SetStart apiCall