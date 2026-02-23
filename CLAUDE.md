# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Application

**Quick start (Git Bash on Windows):**
```bash
chmod +x run.sh && ./run.sh
```

**Manual start:**
```bash
cd backend
uv run uvicorn app:app --reload --port 8000
```

Requires a `.env` file in the project root:
```
ANTHROPIC_API_KEY=your_key_here
```

App runs at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

## Installing Dependencies

```bash
uv sync
```

No test suite is configured in this project.

## Architecture

This is a RAG (Retrieval-Augmented Generation) chatbot with a FastAPI backend and a static HTML/JS/CSS frontend served by the same server.

### Request lifecycle

1. `frontend/script.js` — POSTs `{ query, session_id }` to `/api/query`
2. `backend/app.py` — validates with Pydantic, delegates to `RAGSystem.query()`
3. `backend/rag_system.py` — the central orchestrator; fetches conversation history, calls `AIGenerator`
4. `backend/ai_generator.py` — makes the first Claude API call with a tool definition; if Claude decides to search (`stop_reason == "tool_use"`), it executes the tool and makes a second Claude API call with the results before returning a final answer
5. `backend/search_tools.py` — `CourseSearchTool` executes the search via `VectorStore` and records sources for the UI
6. `backend/vector_store.py` — wraps ChromaDB; maintains two collections: `course_catalog` (course titles/metadata) and `course_content` (chunked lesson text); course name resolution uses semantic search against the catalog before filtering content

### Document ingestion

On startup, `app.py` calls `rag_system.add_course_folder("../docs")`, which skips already-indexed courses. Documents in `docs/` must follow a specific format:

```
Course Title: ...
Course Link: ...
Course Instructor: ...

Lesson 0: Title
Lesson Link: ...
[lesson body text]
```

`backend/document_processor.py` parses this format, splits lesson text into sentence-aware chunks (800 chars, 100 char overlap), and wraps each as a `CourseChunk` for storage.

### Key configuration (`backend/config.py`)

| Setting | Value |
|---|---|
| Claude model | `claude-sonnet-4-20250514` |
| Embedding model | `all-MiniLM-L6-v2` (sentence-transformers) |
| Chunk size | 800 chars |
| Chunk overlap | 100 chars |
| Max search results | 5 |
| Max conversation history | 2 exchanges (4 messages) |
| ChromaDB path | `backend/chroma_db/` |

### Adding a new tool for Claude

1. Subclass `Tool` (ABC) in `backend/search_tools.py`
2. Implement `get_tool_definition()` returning an Anthropic tool schema dict
3. Implement `execute(**kwargs)` returning a string result
4. Register it: `self.tool_manager.register_tool(MyTool())` in `RAGSystem.__init__`

The `ToolManager` dispatches tool calls by name and aggregates sources from any tool that exposes a `last_sources` attribute.
