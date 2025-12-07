// Load environment variables FIRST before any other imports
import dotenv from "dotenv";

import express from "express";
import cors from "cors";

import gwChatRouter from "./routes/gwChat.js";
import { initLocationSearch } from "./services/locationSearch.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api/gw-chat", gwChatRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Initialize services and start server
async function start() {
  try {
    // Initialize location search for groundwater queries
    await initLocationSearch();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    process.exit(1);
  }
}

start();
