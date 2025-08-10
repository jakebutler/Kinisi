Phase 1: RAG-Only Implementation Guide (Supabase + LangChain + PromptLayer)

This document provides an end-to-end guide for implementing a Retrieval-Augmented Generation (RAG) MVP within your existing Supabase project. The goal is to allow the system to select custom exercises from a static library based on a user’s intake survey, using LangChain and PromptLayer.

⸻

📐 Architecture Overview

Components:
	•	Frontend: Vibe-coded UI in Windsurf IDE
	•	Backend: Supabase (existing project) with new RAG tables
	•	LLM Integration: LangChain with OpenAI API
	•	Prompt Observability: PromptLayer

Flow:
	1.	User completes intake survey
	2.	Intake data + static exercise library go to RAG engine
	3.	LangChain retrieves relevant chunks from vector DB
	4.	LLM generates a personalized assessment with exercises

⸻

📁 Supabase Schema Proposal (in existing project)

🧠 1. rag_documents

Stores raw exercise data (title, content, metadata).

create table rag_documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  content text not null,
  metadata jsonb,
  created_at timestamp default now()
);

📐 2. rag_chunks

Chunked text from rag_documents used for vector storage and retrieval.

create table rag_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references rag_documents(id) on delete cascade,
  content text not null,
  metadata jsonb,
  created_at timestamp default now()
);

🔢 3. rag_vectors

Embeddings for each chunk.

create table rag_vectors (
  chunk_id uuid primary key references rag_chunks(id) on delete cascade,
  embedding vector(1536) -- for OpenAI embedding model size
);

Note: Supabase supports vector type natively using pgvector.

⚙️ 4. Enable pgvector extension

create extension if not exists vector;


⸻

🧱 LangChain Setup

1. Ingest Exercise Data
	•	Load your exercise JSON file
	•	Split into documents (e.g., one per exercise)
	•	Chunk each document (e.g., using RecursiveCharacterTextSplitter)
	•	Create metadata per chunk (e.g., body part, equipment)

from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
chunks = splitter.split_documents(documents)

2. Generate Embeddings

Use OpenAI or another embedding model.

from langchain.embeddings import OpenAIEmbeddings
embeddings = OpenAIEmbeddings()

3. Store Embeddings in Supabase

Use Supabase client to insert vectors:

supabase.table("rag_vectors").insert({
    "chunk_id": chunk_id,
    "embedding": embedding_vector.tolist()
})


⸻

🔍 Retrieval Logic
	1.	Embed the user query (e.g., structured version of intake survey).
	2.	Perform cosine similarity search using Supabase SQL:

select chunk_id, content, metadata
from rag_chunks
join rag_vectors using (chunk_id)
order by rag_vectors.embedding <#> '[embedding]'::vector
limit 5;

	3.	Return top n chunks to LangChain as context.

⸻

🧠 Generation Prompt (via PromptLayer)

You are a fitness programming expert. Using the following intake data and reference exercise snippets, generate a personalized assessment including 3–5 recommended exercises.

Intake:
{{ survey_data }}

Context:
{{ retrieved_chunks }}

Instructions:
- Respect user injuries and equipment constraints
- Avoid repeating similar movements
- Include variety in target muscles

Track this with PromptLayer tags like:

pl_tags=["phase1", "assessment_generation"]


⸻

🚀 Deployment Checklist
	•	Create tables (rag_documents, rag_chunks, rag_vectors)
	•	Enable pgvector extension in Supabase
	•	Load static exercise library into rag_documents
	•	Chunk + embed documents, insert into Supabase
	•	Set up LangChain retrieval + PromptLayer generation flow
	•	Wire up Windsurf frontend to intake survey and show assessment output

⸻

✅ Next Steps After MVP
	1.	Phase 2 (MCP Layer)
	•	Add constraint handler agents (injuries, muscle splits, avoidance)
	•	Use LangGraph or LangChain agents
	2.	Phase 3 (REST API)
	•	Expose assessment generator via endpoint for mobile or third-party use

⸻

Let me know if you want:
	•	Supabase insert scripts for exercise JSON
	•	A dummy .env and LangChain starter repo
	•	UI wireframes for assessment display
	•	LangSmith setup alongside PromptLayer for testing