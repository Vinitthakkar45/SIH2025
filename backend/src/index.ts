// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import embedRouter from "./routes/embed.js";
import searchRouter from "./routes/search.js";
import chatRouter from "./routes/chat.js";
import { initEmbedder } from "./services/embeddings.js";
import { initVectorStore } from "./services/vectorStore.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api/embed", embedRouter);
app.use("/api/search", searchRouter);
app.use("/api/chat", chatRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Initialize services and start server
async function start() {
  console.log("🚀 Starting INGRES RAG Backend...\n");

  try {
    // Pre-load embedding model
    await initEmbedder();

    // Connect to ChromaDB
    await initVectorStore();

    app.listen(PORT, () => {
      console.log(`\n✅ Server running at http://localhost:${PORT}`);
      console.log(`\n📚 API Endpoints:`);
      console.log(`   POST /api/embed     - Generate embeddings`);
      console.log(`   POST /api/search    - Search similar documents`);
      console.log(`   GET  /api/search/stats - Get vector store stats`);
      console.log(`   POST /api/chat      - RAG chat (non-streaming)`);
      console.log(`   POST /api/chat/stream - RAG chat (streaming)`);
      console.log(`   GET  /api/health    - Health check`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

start();
