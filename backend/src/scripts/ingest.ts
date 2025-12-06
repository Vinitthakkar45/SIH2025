import * as fs from "fs";
import * as readline from "readline";
import * as path from "path";
import dotenv from "dotenv";

import { initEmbedder, embedBatch } from "../services/embeddings.js";
import { initVectorStore, addDocuments, resetCollection, ChunkDocument } from "../services/vectorStore.js";

dotenv.config();

const CHUNKS_FILE = path.join(process.cwd(), "..", "output", "semantic_chunks.jsonl");
const BATCH_SIZE = 50; // Process 50 documents at a time

/**
 * Semantic chunk from the Python chunker - matches the actual output schema
 */
interface SemanticChunk {
  id: string;
  state: string | null;
  district: string | null;
  block: string | null;
  year: string | null;
  source_type: string | null;
  source: string | null;
  categorization: string | null;
  text: string;
  metadata: Record<string, unknown>;
  watershed?: string | null; // Added for state reports with multiple watersheds
}

/**
 * Read JSONL file line by line (memory efficient for large files)
 */
async function* readJsonlFile(filePath: string): AsyncGenerator<SemanticChunk> {
  const fileStream = fs.createReadStream(filePath, { encoding: "utf-8" });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (line.trim()) {
      try {
        yield JSON.parse(line) as SemanticChunk;
      } catch (e) {
        console.warn("Failed to parse line:", line.substring(0, 100));
      }
    }
  }
}

/**
 * Count total lines in file
 */
async function countLines(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    let count = 0;
    fs.createReadStream(filePath)
      .on("data", (chunk: string | Buffer) => {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        for (let i = 0; i < buffer.length; i++) {
          if (buffer[i] === 10) count++; // newline character
        }
      })
      .on("end", () => resolve(count))
      .on("error", reject);
  });
}

/**
 * Convert SemanticChunk to ChunkDocument with all metadata merged
 */
function chunkToDocument(chunk: SemanticChunk): ChunkDocument {
  // Merge top-level fields with nested metadata
  // This preserves all the dynamic keys from different chunk types
  const metadata: Record<string, unknown> = {
    // Top-level location/source fields
    state: chunk.state,
    district: chunk.district,
    block: chunk.block,
    year: chunk.year,
    source_type: chunk.source_type,
    source: chunk.source,
    categorization: chunk.categorization,
    watershed: chunk.watershed, // For state reports with multiple watersheds
    // Spread the nested metadata (contains numeric metrics)
    ...chunk.metadata,
  };

  return {
    id: chunk.id,
    text: chunk.text,
    metadata,
  };
}

/**
 * Main ingestion function
 */
async function ingest() {
  console.log("🚀 INGRES Data Ingestion Pipeline\n");
  console.log("=".repeat(50));

  // Check if file exists
  if (!fs.existsSync(CHUNKS_FILE)) {
    console.error(`❌ File not found: ${CHUNKS_FILE}`);
    console.log("\nMake sure semantic_chunks.jsonl exists in the output folder.");
    process.exit(1);
  }

  // Count total documents
  console.log("\n📊 Counting documents...");
  const totalDocs = await countLines(CHUNKS_FILE);
  console.log(`   Found ${totalDocs.toLocaleString()} documents to process.`);

  // Initialize services
  console.log("\n🔧 Initializing services...");
  await initEmbedder();
  await resetCollection(); // Start fresh

  // Process in batches
  console.log(`\n📥 Processing documents (batch size: ${BATCH_SIZE})...\n`);

  let batch: ChunkDocument[] = [];
  let processed = 0;
  const startTime = Date.now();

  for await (const chunk of readJsonlFile(CHUNKS_FILE)) {
    // Convert chunk to document format
    const doc = chunkToDocument(chunk);
    batch.push(doc);

    // Process batch when full
    if (batch.length >= BATCH_SIZE) {
      await processBatch(batch, processed, totalDocs);
      processed += batch.length;
      batch = [];
    }
  }

  // Process remaining documents
  if (batch.length > 0) {
    await processBatch(batch, processed, totalDocs);
    processed += batch.length;
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("\n" + "=".repeat(50));
  console.log(`✅ Ingestion complete!`);
  console.log(`   Total documents: ${processed.toLocaleString()}`);
  console.log(`   Time elapsed: ${elapsed}s`);
  console.log(`   Avg speed: ${(processed / parseFloat(elapsed)).toFixed(1)} docs/sec`);
  console.log("\n🎉 Your RAG system is ready to use!");
}

/**
 * Process a batch of documents
 */
async function processBatch(batch: ChunkDocument[], processed: number, total: number) {
  const texts = batch.map((d) => d.text);

  // Generate embeddings
  const embeddings = await embedBatch(texts, 16);

  // Add to vector store
  await addDocuments(batch, embeddings);

  const progress = (((processed + batch.length) / total) * 100).toFixed(1);
  const bar = "█".repeat(Math.floor(parseFloat(progress) / 5)) + "░".repeat(20 - Math.floor(parseFloat(progress) / 5));

  process.stdout.write(`\r   [${bar}] ${progress}% (${(processed + batch.length).toLocaleString()}/${total.toLocaleString()})`);
}

// Run ingestion
ingest().catch((error) => {
  console.error("\n❌ Ingestion failed:", error);
  process.exit(1);
});
