import { ChromaClient, Collection } from "chromadb";
import { embed } from "./embeddings.js";

let client: ChromaClient | null = null;
let collection: Collection | null = null;

const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";
const COLLECTION_NAME = process.env.COLLECTION_NAME || "ingres_groundwater";

export interface ChunkDocument {
  id: string;
  text: string;
  metadata: Record<string, unknown>;
}

export interface SearchResult {
  id: string;
  text: string;
  metadata: Record<string, unknown>;
  distance: number;
}

/**
 * Sanitize metadata for ChromaDB - no nulls, no nested objects
 * ChromaDB only accepts: string, number, boolean
 */
function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, string | number | boolean> {
  const sanitized: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (value === null || value === undefined) {
      // Skip null/undefined values - don't include them
      continue;
    } else if (typeof value === "string") {
      sanitized[key] = value;
    } else if (typeof value === "number") {
      // Handle NaN and Infinity
      if (Number.isFinite(value)) {
        sanitized[key] = value;
      }
    } else if (typeof value === "boolean") {
      sanitized[key] = value;
    } else if (typeof value === "object") {
      // Flatten nested objects with prefix
      const nested = sanitizeMetadata(value as Record<string, unknown>);
      for (const [nestedKey, nestedValue] of Object.entries(nested)) {
        sanitized[`${key}_${nestedKey}`] = nestedValue;
      }
    }
    // Skip functions, symbols, etc.
  }

  return sanitized;
}

/**
 * Initialize ChromaDB client and get/create collection
 */
export async function initVectorStore(): Promise<Collection> {
  if (collection) return collection;

  console.log(`🔄 Connecting to ChromaDB at ${CHROMA_URL}...`);

  client = new ChromaClient({ path: CHROMA_URL });

  // Get or create the collection
  collection = await client.getOrCreateCollection({
    name: COLLECTION_NAME,
    metadata: {
      description: "INGRES Groundwater Data Embeddings",
      "hnsw:space": "cosine", // Use cosine similarity
    },
  });

  const count = await collection.count();
  console.log(`✅ Connected to ChromaDB. Collection "${COLLECTION_NAME}" has ${count} documents.`);

  return collection;
}

/**
 * Add documents to the vector store
 */
export async function addDocuments(documents: ChunkDocument[], embeddings: number[][]): Promise<void> {
  const coll = await initVectorStore();

  // ChromaDB has a limit on batch size, so we chunk the inserts
  const BATCH_SIZE = 100;

  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batchDocs = documents.slice(i, i + BATCH_SIZE);
    const batchEmbeddings = embeddings.slice(i, i + BATCH_SIZE);

    await coll.add({
      ids: batchDocs.map((d) => d.id),
      embeddings: batchEmbeddings,
      documents: batchDocs.map((d) => d.text),
      metadatas: batchDocs.map((d) => sanitizeMetadata(d.metadata)),
    });
  }
}

/**
 * Search for similar documents
 */
export async function searchSimilar(
  query: string,
  topK: number = 5,
  filters?: {
    state?: string;
    year?: string;
    categorization?: string;
  }
): Promise<SearchResult[]> {
  const coll = await initVectorStore();

  // Generate embedding for the query
  const queryEmbedding = await embed(query);

  // Build where filter if provided
  let whereFilter: Record<string, unknown> | undefined;
  if (filters) {
    const conditions: Record<string, unknown>[] = [];
    if (filters.state) conditions.push({ state: filters.state });
    if (filters.year) conditions.push({ year: filters.year });
    if (filters.categorization) conditions.push({ categorization: filters.categorization });

    if (conditions.length === 1) {
      whereFilter = conditions[0];
    } else if (conditions.length > 1) {
      whereFilter = { $and: conditions };
    }
  }

  const results = await coll.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
    where: whereFilter,
  });

  // Transform results
  const searchResults: SearchResult[] = [];
  if (results.ids[0]) {
    for (let i = 0; i < results.ids[0].length; i++) {
      searchResults.push({
        id: results.ids[0][i],
        text: results.documents?.[0]?.[i] || "",
        metadata: (results.metadatas?.[0]?.[i] as ChunkDocument["metadata"]) || {},
        distance: results.distances?.[0]?.[i] || 0,
      });
    }
  }

  return searchResults;
}

/**
 * Get collection statistics
 */
export async function getStats(): Promise<{ count: number; collectionName: string }> {
  const coll = await initVectorStore();
  const count = await coll.count();
  return { count, collectionName: COLLECTION_NAME };
}

/**
 * Reset the collection (delete all documents)
 */
export async function resetCollection(): Promise<void> {
  if (!client) {
    client = new ChromaClient({ path: CHROMA_URL });
  }

  try {
    await client.deleteCollection({ name: COLLECTION_NAME });
    console.log(`🗑️ Collection "${COLLECTION_NAME}" deleted.`);
  } catch {
    console.log(`Collection "${COLLECTION_NAME}" doesn't exist, creating new one.`);
  }

  collection = null;
  await initVectorStore();
}
