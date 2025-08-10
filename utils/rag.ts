// utils/rag.ts
// Retrieval utilities for RAG using Supabase pgvector and OpenAI embeddings

import { supabase } from "./supabaseClient";
import { OpenAIEmbeddings } from "@langchain/openai";

let _embeddings: OpenAIEmbeddings | null = null;

function getEmbeddings(): OpenAIEmbeddings | null {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) return null;
  if (_embeddings) return _embeddings;
  _embeddings = new OpenAIEmbeddings({
    apiKey,
    model: "text-embedding-3-small", // 1536 dims expected by migration
  });
  return _embeddings;
}

function formatSurveyToQueryText(survey: Record<string, any>): string {
  try {
    return Object.entries(survey || {})
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : typeof v === "object" ? JSON.stringify(v) : String(v)}`)
      .join("\n");
  } catch {
    return JSON.stringify(survey || {});
  }
}

export type RagChunk = {
  chunk_id: string;
  content: string;
  metadata?: Record<string, any> | null;
  score?: number;
};

export async function retrieveRagChunksByText(query: string, k = 5): Promise<RagChunk[]> {
  const embeddings = getEmbeddings();
  if (!embeddings) {
    // No embeddings configured; return empty to gracefully degrade
    return [];
  }
  const vector = await embeddings.embedQuery(query);
  const { data, error } = await (supabase as any).rpc("match_rag_chunks", {
    query_embedding: vector,
    match_count: k,
  });
  if (error) throw new Error(error.message || String(error));
  return (data || []) as RagChunk[];
}

export async function retrieveRagChunksForSurvey(
  survey: Record<string, any>,
  k = 5
): Promise<RagChunk[]> {
  const text = formatSurveyToQueryText(survey);
  return retrieveRagChunksByText(text, k);
}

export function formatChunksAsContext(chunks: RagChunk[], bullet = true): string {
  if (!chunks || chunks.length === 0) return "";
  const lines = chunks.map((c) => {
    const title = c.metadata?.name || c.metadata?.exercise_id || "chunk";
    return `${bullet ? "- " : ""}${title}: ${c.content}`;
  });
  return lines.join("\n");
}
