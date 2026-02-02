/**
 * AIF-BIN Embeddings Service
 * Uses Transformers.js to generate real 384-dimensional vector embeddings
 * Same models as Pro CLI (all-MiniLM-L6-v2)
 */

import { pipeline, env } from '@xenova/transformers';

// Configure Transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

// Singleton pipeline instance
let embeddingPipeline: any = null;
let isLoading = false;
let loadError: string | null = null;

// Available models (same as Pro CLI)
export const EMBEDDING_MODELS = {
  'minilm': {
    name: 'Xenova/all-MiniLM-L6-v2',
    dimensions: 384,
    description: 'Fast, good quality (default)',
  },
  'bge-small': {
    name: 'Xenova/bge-small-en-v1.5',
    dimensions: 384,
    description: 'Optimized for retrieval',
  },
  'bge-base': {
    name: 'Xenova/bge-base-en-v1.5',
    dimensions: 768,
    description: 'Best quality retrieval',
  },
} as const;

export type ModelId = keyof typeof EMBEDDING_MODELS;

let currentModel: ModelId = 'minilm';

/**
 * Initialize the embedding pipeline (lazy load)
 */
export async function initEmbeddings(
  modelId: ModelId = 'minilm',
  onProgress?: (progress: number, status: string) => void
): Promise<void> {
  if (embeddingPipeline && currentModel === modelId) {
    return; // Already loaded
  }

  if (isLoading) {
    // Wait for current load to complete
    while (isLoading) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (loadError) throw new Error(loadError);
    return;
  }

  isLoading = true;
  loadError = null;

  try {
    const model = EMBEDDING_MODELS[modelId];
    onProgress?.(0, `Loading ${modelId} model...`);

    embeddingPipeline = await pipeline('feature-extraction', model.name, {
      progress_callback: (data: any) => {
        if (data.status === 'progress' && data.progress) {
          onProgress?.(data.progress, `Downloading ${modelId}...`);
        }
      },
    });

    currentModel = modelId;
    onProgress?.(100, 'Model ready');
  } catch (err: any) {
    loadError = err.message || 'Failed to load embedding model';
    throw err;
  } finally {
    isLoading = false;
  }
}

/**
 * Generate embeddings for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!embeddingPipeline) {
    await initEmbeddings();
  }

  const output = await embeddingPipeline(text, {
    pooling: 'mean',
    normalize: true,
  });

  // Convert to plain array
  return Array.from(output.data);
}

/**
 * Generate embeddings for multiple texts (batch)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!embeddingPipeline) {
    await initEmbeddings();
  }

  const embeddings: number[][] = [];
  
  for (const text of texts) {
    const output = await embeddingPipeline(text, {
      pooling: 'mean',
      normalize: true,
    });
    embeddings.push(Array.from(output.data));
  }

  return embeddings;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same dimensions');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Search for similar chunks using embeddings
 */
export async function semanticSearch(
  query: string,
  chunks: Array<{ content: string; embedding?: number[]; label?: string }>,
  topK: number = 5
): Promise<Array<{ index: number; score: number; content: string; label?: string }>> {
  const queryEmbedding = await generateEmbedding(query);

  const results = chunks
    .map((chunk, index) => {
      if (!chunk.embedding) {
        return { index, score: 0, content: chunk.content, label: chunk.label };
      }
      const score = cosineSimilarity(queryEmbedding, chunk.embedding);
      return { index, score, content: chunk.content, label: chunk.label };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return results;
}

/**
 * Get current model info
 */
export function getCurrentModel(): { id: ModelId; dimensions: number; name: string } {
  const model = EMBEDDING_MODELS[currentModel];
  return {
    id: currentModel,
    dimensions: model.dimensions,
    name: model.name,
  };
}

/**
 * Check if embeddings are ready
 */
export function isReady(): boolean {
  return embeddingPipeline !== null;
}

/**
 * Get loading status
 */
export function getStatus(): { loading: boolean; error: string | null; ready: boolean } {
  return {
    loading: isLoading,
    error: loadError,
    ready: embeddingPipeline !== null,
  };
}
