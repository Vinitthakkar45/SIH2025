import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import os from "os";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const OLLAMA_API_URL = process.env.LLM_API_URL || "http://localhost:11434";
const OLLAMA_MODEL =
  process.env.LLM_MODEL ||
  "aispin/qwen2.5-7b-instruct-abliterated-v2.q4_k_s.gguf";

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(
  logsDir,
  `llm-server-${new Date().toISOString().split("T")[0]}.log`
);

// Logger utility
function log(level: string, message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...(data && { data }),
  };

  const logLine = JSON.stringify(logEntry);
  console.log(
    `[${timestamp}] [${level}] ${message}`,
    data ? JSON.stringify(data) : ""
  );

  // Write to file
  fs.appendFileSync(logFile, logLine + "\n");
}

// Function to get all local IP addresses
function getLocalIPs(): string[] {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];

  for (const name of Object.keys(interfaces)) {
    const addrs = interfaces[name] || [];
    for (const addr of addrs) {
      if (addr.family === "IPv4" && !addr.internal) {
        ips.push(addr.address);
      }
    }
  }

  return ips;
}

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  // Log incoming request
  log("INFO", `[${requestId}] Incoming ${req.method} ${req.path}`, {
    ip: req.ip,
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    headers: req.headers,
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any) {
    const duration = Date.now() - startTime;

    // Log response
    log("INFO", `[${requestId}] Response ${req.method} ${req.path}`, {
      requestId,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get("content-length"),
    });

    // Log response body for errors
    if (res.statusCode >= 400) {
      log("WARN", `[${requestId}] Error Response`, {
        statusCode: res.statusCode,
        body: typeof data === "string" ? data : JSON.stringify(data),
      });
    }

    return originalSend.call(this, data);
  };

  next();
});

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["*"],
    credentials: false,
  })
);
app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/health", (req, res) => {
  const response = {
    status: "ok",
    model: OLLAMA_MODEL,
    ollama_url: OLLAMA_API_URL,
    server_ips: getLocalIPs(),
    timestamp: new Date().toISOString(),
  };

  log("DEBUG", "Health check endpoint called", { response });
  res.json(response);
});

/**
 * POST /api/generate
 * Simple LLM generation endpoint
 */
app.post("/api/generate", async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);

  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      log("WARN", `[${requestId}] Invalid prompt in request`, {
        prompt,
        type: typeof prompt,
      });
      res.status(400).json({ error: "Missing or invalid 'prompt' field" });
      return;
    }

    log("INFO", `[${requestId}] Generating response for prompt`, {
      promptLength: prompt.length,
      promptPreview: prompt.substring(0, 100),
    });

    const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      log("ERROR", `[${requestId}] Ollama API error`, {
        status: response.status,
        error,
      });
      throw new Error(`Ollama error: ${error}`);
    }

    const data = await response.json();

    log("INFO", `[${requestId}] Response generated successfully`, {
      responseLength: data.response?.length || 0,
      responsePreview: data.response?.substring(0, 100) || "",
      done: data.done,
    });

    res.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log("ERROR", `[${requestId}] Generate endpoint error`, {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    res.status(500).json({ error: errorMessage });
  }
});

/**
 * POST /api/stream
 * Streaming LLM generation endpoint
 */
app.post("/api/stream", async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);

  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      log("WARN", `[${requestId}] Invalid prompt in stream request`, {
        prompt,
        type: typeof prompt,
      });
      res.status(400).json({ error: "Missing or invalid 'prompt' field" });
      return;
    }

    log("INFO", `[${requestId}] Starting stream for prompt`, {
      promptLength: prompt.length,
      promptPreview: prompt.substring(0, 100),
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      log("ERROR", `[${requestId}] Ollama API stream error`, {
        status: response.status,
        error,
      });
      res.write(
        `data: ${JSON.stringify({ error: `Ollama error: ${error}` })}\n\n`
      );
      res.end();
      return;
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let tokenCount = 0;
    let totalResponseLength = 0;

    if (!reader) {
      log("ERROR", `[${requestId}] No response body reader available`);
      res.write(`data: ${JSON.stringify({ error: "No response body" })}\n\n`);
      res.end();
      return;
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim()) {
            try {
              const chunk = JSON.parse(line);
              if (chunk.response) {
                tokenCount++;
                totalResponseLength += chunk.response.length;
              }
              res.write(`data: ${JSON.stringify(chunk)}\n\n`);
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);

      log("INFO", `[${requestId}] Stream completed successfully`, {
        tokensStreamed: tokenCount,
        totalResponseLength,
      });
    } finally {
      reader.cancel();
      res.end();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log("ERROR", `[${requestId}] Stream endpoint error`, {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    res.end();
  }
});

// 404 handler
app.use((req, res) => {
  log("WARN", `404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({ error: "Not found" });
});

// 404 handler
app.use((req, res) => {
  log("WARN", `404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({ error: "Not found" });
});

// Start server
const server = app.listen(PORT, "0.0.0.0", async () => {
  const localIPs = getLocalIPs();
  log("INFO", "🚀 Simple LLM Server Starting", {
    port: PORT,
    model: OLLAMA_MODEL,
    ollama_url: OLLAMA_API_URL,
  });

  console.log(`\n🚀 Simple LLM Server - Network Ready`);
  console.log(`📍 Localhost: http://localhost:${PORT}`);
  console.log(`📍 Network IPs (use from other PCs):`);
  localIPs.forEach((ip) => {
    console.log(`   http://${ip}:${PORT}`);
  });
  console.log(`\n🤖 Model: ${OLLAMA_MODEL}`);
  console.log(`🔗 Ollama: ${OLLAMA_API_URL}`);
  console.log(`📋 Logs: ${logFile}`);
  console.log(`\n📡 Endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   POST /api/generate - Generate text (non-streaming)`);
  console.log(`   POST /api/stream - Generate text (streaming)\n`);

  log("INFO", "Server ready to accept requests", { logFile });
});

// Graceful shutdown
process.on("SIGINT", async () => {
  log("INFO", "Server shutting down...");
  server.close(() => {
    log("INFO", "Server closed");
    process.exit(0);
  });
});
