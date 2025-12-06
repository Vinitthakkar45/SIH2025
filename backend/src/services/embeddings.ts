import { pipeline, Pipeline } from "@xenova/transformers";

// Singleton pattern for embedding model
let embedder: Pipeline | null = null;
let isLoading = false;

const MODEL_NAME = "Xenova/bge-small-en-v1.5";

/**
 * Initialize the embedding model (downloads on first run, then cached)
 */
export async function initEmbedder(): Promise<Pipeline> {
  if (embedder) return embedder;

  if (isLoading) {
    // Wait for the model to finish loading
    while (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return embedder!;
  }

  isLoading = true;
  console.log(`🔄 Loading embedding model: ${MODEL_NAME}...`);
  console.log("   (First run will download ~50MB, subsequent runs use cache)");

  try {
    embedder = await pipeline("feature-extraction", MODEL_NAME, {
      quantized: true, // Use quantized model for faster inference
    });
    console.log("✅ Embedding model loaded successfully!");
    return embedder;
  } finally {
    isLoading = false;
  }
}

/**
 * Generate embedding for a single text
 */
export async function embed(text: string): Promise<number[]> {
  const model = await initEmbedder();
  const output = await model(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}

/**
 * Generate embeddings for multiple texts (batch processing)
 */
export async function embedBatch(
  texts: string[],
  batchSize: number = 32,
  onProgress?: (current: number, total: number) => void
): Promise<number[][]> {
  const model = await initEmbedder();
  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchEmbeddings = await Promise.all(
      batch.map(async (text) => {
        const output = await model(text, { pooling: "mean", normalize: true });
        return Array.from(output.data as Float32Array);
      })
    );
    embeddings.push(...batchEmbeddings);

    if (onProgress) {
      onProgress(Math.min(i + batchSize, texts.length), texts.length);
    }
  }

  return embeddings;
}

/**
 * Get embedding dimension (384 for bge-small)
 */
export function getEmbeddingDimension(): number {
  return 384;
}
