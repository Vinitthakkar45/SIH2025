// Load environment variables FIRST before any other imports
import dotenv from "dotenv";

import express from "express";
import cors from "cors";

import embedRouter from "./routes/embed.js";
import searchRouter from "./routes/search.js";
import chatRouter from "./routes/chat.js";
import gwChatRouter from "./routes/gwChat.js";
import { initLocationSearch } from "./services/locationSearch.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api/embed", embedRouter);
app.use("/api/search", searchRouter);
app.use("/api/chat", chatRouter);
app.use("/api/gw-chat", gwChatRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Initialize services and start server
async function start() {
  console.log("🚀 Starting INGRES RAG Backend...\n");

  try {
    // Initialize location search for groundwater queries
    await initLocationSearch();

    app.listen(PORT, () => {
      console.log(`\n✅ Server running at http://localhost:${PORT}`);
      console.log(`\n📚 API Endpoints:`);
      console.log(`   POST /api/embed     - Generate embeddings`);
      console.log(`   POST /api/search    - Search similar documents`);
      console.log(`   GET  /api/search/stats - Get vector store stats`);
      console.log(`   POST /api/chat      - RAG chat (non-streaming)`);
      console.log(`   POST /api/chat/stream - RAG chat (streaming)`);
      console.log(`   POST /api/gw-chat   - Groundwater chat (non-streaming)`);
      console.log(`   POST /api/gw-chat/stream - Groundwater chat (streaming)`);
      console.log(`   GET  /api/health    - Health check`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

start();
