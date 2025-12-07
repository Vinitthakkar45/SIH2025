# Frontend Connection Check

## Architecture Overview

```
Frontend (Next.js :3000)
    ↓
Backend API (Express :3001)  ← Frontend connects here
    ↓
Ollama API Server (Python Flask :8080)
    ↓
Ollama (Docker :11434)
```

## Frontend Configuration

### Files Updated
- ✅ `frontend/next.config.ts` - Fixed default to `http://localhost:3001`
- ✅ `frontend/app/chat/page.tsx` - Uses `NEXT_PUBLIC_API_URL` or defaults to `http://localhost:3001`

### Environment Variable
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Connection Chain Test

### 1. Test Backend (Port 3001)
```bash
# Health check
curl http://localhost:3001/health

# API health check
curl http://localhost:3001/api/health

# Test chat endpoint
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is groundwater?",
    "topK": 5,
    "chatHistory": []
  }'
```

### 2. Test Frontend → Backend Connection
```bash
# Simulate frontend request (streaming)
curl -N -X POST http://localhost:3001/api/chat/stream \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{
    "query": "What is the groundwater status in Maharashtra?",
    "topK": 5,
    "chatHistory": []
  }'
```

### 3. Test Full Chain
```bash
# 1. Check Ollama (11434)
curl http://localhost:11434/api/tags

# 2. Check Ollama API Server (8080)
curl http://localhost:8080/health

# 3. Check Backend (3001) - should be running
curl http://localhost:3001/health

# 4. Test Frontend endpoint (3000) - should be running
curl http://localhost:3000
```

## Frontend Endpoints

### Chat Page
- **URL**: `http://localhost:3000/chat`
- **API Endpoint**: `POST ${API_URL}/api/chat/stream`
- **Request Format**:
  ```json
  {
    "query": "user question",
    "chatHistory": [],
    "topK": 5
  }
  ```
- **Response Format**: Server-Sent Events (SSE)
  ```
  data: {"type":"sources","sources":[...]}
  data: {"type":"token","content":"..."}
  data: {"type":"suggestions","suggestions":[...]}
  data: {"type":"done"}
  ```

## Starting Services

### 1. Start Ollama Services
```bash
cd Ollama
docker-compose up -d
# Wait for services to be healthy
docker-compose ps
```

### 2. Start Backend
```bash
cd backend
npm install  # if needed
npm start
# Should start on http://localhost:3001
```

### 3. Start Frontend
```bash
cd frontend
npm install  # if needed
npm run dev
# Should start on http://localhost:3000
```

## Troubleshooting

### Frontend can't connect to backend
1. Check backend is running: `curl http://localhost:3001/health`
2. Check CORS configuration in `backend/src/index.ts`
3. Verify `NEXT_PUBLIC_API_URL` in frontend (should be `http://localhost:3001`)

### CORS Errors
Backend CORS is configured to allow all origins. If issues persist:
- Check browser console for specific CORS error
- Verify backend is running and accessible
- Check network tab in browser dev tools

### Streaming not working
1. Verify backend streaming endpoint: `curl -N http://localhost:3001/api/chat/stream ...`
2. Check browser supports SSE (all modern browsers do)
3. Check network tab for connection issues

## Current Status

✅ **Fixed**: `next.config.ts` now defaults to `http://localhost:3001` (backend)
✅ **Fixed**: `app/chat/page.tsx` uses correct API URL
⚠️ **Backend**: Not currently running (needs to be started)
✅ **Ollama**: Running on port 11434
✅ **Ollama API Server**: Running on port 8080
