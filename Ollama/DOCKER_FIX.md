# Docker ChromaDB Compatibility Fix

## Issue
ChromaDB is incompatible with Pydantic 2.12+ due to unannotated attributes in the Settings class.

## Solution
1. **Pinned Pydantic version** to < 2.10 in `requirements.txt`
2. **Pinned ChromaDB** to 0.4.22 (known compatible version)
3. **Added graceful error handling** in `api_server.py` to fall back to memory store if ChromaDB fails to import

## Changes Made

### requirements.txt
```txt
pydantic>=2.0,<2.10
pydantic-settings>=2.0,<2.10
chromadb==0.4.22
```

### api_server.py
- Wrapped ChromaDB import in try/except
- Falls back to memory store if ChromaDB import fails
- All endpoints work with or without ChromaDB

## Rebuild Instructions

```bash
# Rebuild the API service
docker-compose build api

# Restart services
docker-compose up -d

# Check logs
docker-compose logs api
```

## Verification

After rebuilding, check the logs:
```bash
docker-compose logs api | grep -i chroma
```

You should see either:
- `✅ ChromaDB initialized at /app/chroma_db` (success)
- `⚠️  ChromaDB unavailable - using memory store only` (fallback)

Both modes work - the API will function with memory store if ChromaDB fails.

