// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import embedRouter from "./routes/embed.js";
import searchRouter from "./routes/search.js";
import chatRouter from "./routes/chat.js";
import collectionsRouter from "./routes/collections.js";
import { initEmbedder } from "./services/embeddings.js";
import { initVectorStore } from "./services/vectorStore.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - CORS configuration
app.use(cors({
  origin: true, // Allow all origins (or specify: ['http://10.22.37.166:3000', 'http://localhost:3000'])
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api/embed", embedRouter);
app.use("/api/search", searchRouter);
app.use("/api/chat", chatRouter);
app.use("/api/collections", collectionsRouter);

// Health check endpoints
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Initialize services and start server
async function start() {
  console.log("🚀 Starting INGRES RAG Backend...\n");

  try {
    // Pre-load embedding model
    await initEmbedder();

    // Connect to ChromaDB (non-blocking - will fail gracefully if not available)
    try {
    await initVectorStore();
    } catch (error) {
      console.warn(`⚠️  ChromaDB not available. Some endpoints may not work.`);
      console.warn(`   Start ChromaDB with: docker-compose up -d`);
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`\n✅ Server running at http://0.0.0.0:${PORT}`);
      console.log(`   Accessible at http://localhost:${PORT}`);
      console.log(`   Accessible at http://10.22.37.166:${PORT}`);
      console.log(`\n📚 API Endpoints:`);
      console.log(`   GET  /health        - Health check`);
      console.log(`   POST /api/embed     - Generate embeddings`);
      console.log(`   POST /api/search    - Search similar documents`);
      console.log(`   GET  /api/search/stats - Get vector store stats`);
      console.log(`   POST /api/chat      - RAG chat (non-streaming)`);
      console.log(`   POST /api/chat/stream - RAG chat (streaming)`);
      console.log(`   POST /api/collections/:name/add - Add documents to collection`);
      console.log(`   POST /api/collections/:name/query - Query collection`);
      console.log(`   GET  /api/health    - Health check`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

start();
