// scripts/ingest_exercises_to_rag.js
// Ingests exercises-data/exercises.json into Supabase RAG tables with chunking and embeddings.
// Usage: npm run ingest:rag

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from '@langchain/openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY. Set it to generate embeddings.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const exercisesPath = path.resolve(process.cwd(), 'exercises-data/exercises.json');

function buildDocContent(ex) {
  const sections = [
    `Exercise: ${ex.name}`,
    `Target muscles: ${(ex.targetMuscles || []).join(', ')}`,
    `Body parts: ${(ex.bodyParts || []).join(', ')}`,
    `Equipment: ${(ex.equipments || []).join(', ')}`,
    'Instructions:',
    ...(ex.instructions || [])
  ];
  return sections.join('\n');
}

async function upsertDocumentForExercise(ex) {
  // Try to find existing document by exerciseId in metadata
  const { data: existing, error: findErr } = await supabase
    .from('rag_documents')
    .select('id')
    .contains('metadata', { exerciseId: ex.exerciseId })
    .maybeSingle();
  if (findErr && findErr.code !== 'PGRST116') throw findErr;

  if (existing?.id) return existing.id;

  const { data: inserted, error: insertErr } = await supabase
    .from('rag_documents')
    .insert([
      {
        name: ex.name,
        content: buildDocContent(ex),
        metadata: {
          exerciseId: ex.exerciseId,
          name: ex.name,
          targetMuscles: ex.targetMuscles,
          bodyParts: ex.bodyParts,
          equipments: ex.equipments,
          secondaryMuscles: ex.secondaryMuscles,
        },
      },
    ])
    .select('id')
    .single();
  if (insertErr) throw insertErr;
  return inserted.id;
}

async function rebuildChunksForDocument(docId, ex, embeddings, splitter) {
  // Remove existing chunks (vectors cascade via FK)
  const { error: delErr } = await supabase
    .from('rag_chunks')
    .delete()
    .eq('document_id', docId);
  if (delErr) throw delErr;

  const content = buildDocContent(ex);
  const parts = await splitter.splitText(content);
  if (parts.length === 0) return { count: 0 };

  // Insert chunk rows
  const chunkRows = parts.map((p, i) => ({
    document_id: docId,
    content: p,
    metadata: { exerciseId: ex.exerciseId, name: ex.name, idx: i },
  }));

  const { data: insertedChunks, error: chunksErr } = await supabase
    .from('rag_chunks')
    .insert(chunkRows)
    .select('id, content');
  if (chunksErr) throw chunksErr;

  // Embed contents in batch
  const vectors = await embeddings.embedDocuments(insertedChunks.map((c) => c.content));

  // Insert vectors
  const vectorRows = insertedChunks.map((c, i) => ({
    chunk_id: c.id,
    embedding: vectors[i],
  }));

  const { error: vecErr } = await supabase
    .from('rag_vectors')
    .insert(vectorRows);
  if (vecErr) throw vecErr;

  return { count: insertedChunks.length };
}

async function main() {
  console.log('Reading exercises from', exercisesPath);
  const raw = await fs.readFile(exercisesPath, 'utf8');
  const exercises = JSON.parse(raw);

  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 500, chunkOverlap: 50 });
  const embeddings = new OpenAIEmbeddings({ apiKey: OPENAI_API_KEY, model: 'text-embedding-3-small' });

  let totalDocs = 0;
  let totalChunks = 0;

  for (const ex of exercises) {
    try {
      const docId = await upsertDocumentForExercise(ex);
      const { count } = await rebuildChunksForDocument(docId, ex, embeddings, splitter);
      totalDocs += 1;
      totalChunks += count;
      console.log(`Ingested: ${ex.name} (doc=${docId}, chunks=${count})`);
    } catch (e) {
      console.error('Failed to ingest', ex?.name, e?.message || e);
    }
  }

  console.log(`Done. Documents: ${totalDocs}, Chunks: ${totalChunks}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
