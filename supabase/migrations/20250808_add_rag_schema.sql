-- Enable pgvector extension (idempotent)
create extension if not exists vector;
create extension if not exists pgcrypto;

-- RAG tables
create table if not exists rag_documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  content text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

create table if not exists rag_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references rag_documents(id) on delete cascade,
  content text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

-- OpenAI text-embedding-3-small -> 1536 dims
create table if not exists rag_vectors (
  chunk_id uuid primary key references rag_chunks(id) on delete cascade,
  embedding vector(1536)
);

-- Helpful indexes
create index if not exists rag_chunks_document_id_idx on rag_chunks(document_id);
create index if not exists rag_documents_created_at_idx on rag_documents(created_at);

-- Optional IVF Flat index for faster ANN search (requires pgvector >= 0.5.0)
-- You may adjust `lists` after analyzing data scale.
create index if not exists rag_vectors_embedding_ivfflat_idx
  on rag_vectors using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- RPC for similarity search
create or replace function match_rag_chunks(
  query_embedding vector(1536),
  match_count int
)
returns table (
  chunk_id uuid,
  content text,
  metadata jsonb,
  score float
)
language sql stable
as $$
  select
    c.id as chunk_id,
    c.content,
    c.metadata,
    1 - (v.embedding <=> query_embedding) as score
  from rag_chunks c
  join rag_vectors v on v.chunk_id = c.id
  order by v.embedding <=> query_embedding
  limit match_count;
$$;
