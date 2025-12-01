# Project Brain

## Overview
**Project Brain** is a production-like AI assistant designed for the construction industry. It serves as a "Project Brain" for a single construction project, allowing users to ingest PDF documents (specifications, drawings, schedules) and interact with them through a RAG (Retrieval-Augmented Generation) pipeline.

The system features a **FastAPI backend** for heavy lifting (ingestion, vector search, LLM interaction) and a modern **React (Vite)** frontend for a seamless user experience. It uses **Google's Gemini API** for both embeddings and text generation.

## Features
- **PDF Ingestion**: Upload and chunk construction documents.
- **RAG Chat**: Ask questions about the project with precise source citations.
- **Structured Extraction**: Automatically extract specific data (e.g., Door Schedules) into structured tables.
- **Evaluation Suite**: Built-in testing to measure RAG performance against ground-truth queries.
- **Hybrid Retrieval**: Combines vector similarity with keyword search for better accuracy.

---

## How to Run Locally

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **Gemini API Key** (Get one from Google AI Studio)

### 1. Environment Setup
Create a `.env` file in the root directory (copy from `.env.example`):
```bash
cp .env.example .env
```
**Required Environment Variables:**
```env
GEMINI_API_KEY=your_actual_api_key_here
GEMINI_MODEL_NAME=gemini-2.5-flash  # or gemini-1.5-flash
```

### 2. Run Backend (FastAPI)
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the server:
   ```bash
   python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
   *The API will be available at `http://localhost:8000`*

### 3. Run Frontend (React + Vite)
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The UI will be available at `http://localhost:5173` (or 5174 if port is busy)*

---

## Deployment

### Deployed Vercel URL
*Placeholder*: `https://project-brain-frontend.vercel.app` (Not currently deployed)

To deploy the frontend to Vercel:
1. Push code to GitHub.
2. Import repo in Vercel.
3. Set Root Directory to `frontend`.
4. Add Environment Variable: `VITE_API_URL=https://your-backend-url.com`.

---

## Technical Notes

### Chunking & Indexing
- **Chunking**: We use `pdfminer.six` to extract text page-by-page. Text is chunked into segments of approximately 800 characters with a 100-character overlap to preserve context across boundaries.
- **Indexing**: Chunks are embedded using `Gemini embedding-001` (768 dimensions) and stored in a **FAISS** (Facebook AI Similarity Search) index for efficient similarity retrieval. Metadata (doc name, page number, text) is stored alongside.

### RAG Pipeline
1. **Hybrid Search**: When a user asks a question, we perform two searches:
   - **Vector Search**: Finds conceptually similar chunks.
   - **Keyword Search**: Finds exact text matches (boosts specific terms like "Door Type A").
2. **Reranking**: Results are merged and reranked based on a combined score.
3. **Generation**: The top 5 relevant chunks are fed into the **Gemini 2.5 Flash** model with a system prompt that enforces strict citation rules (`[File - Page X]`).

### Structured Extraction
For the "Door Schedule" task, we bypass the standard chat loop. We retrieve chunks relevant to "doors", "frames", and "hardware", and then prompt the LLM with a **strict JSON schema**. This forces the model to output structured data (Mark, Width, Height, Fire Rating) instead of free text, which the frontend then renders as a table.

### Tools Used
- **Ingestion**: `pdfminer.six` (Python)
- **Vector DB**: `faiss-cpu` (Python)
- **LLM**: `google-generativeai` (Python SDK)
- **Evaluation**: Custom Python script (`evaluation_service.py`) that runs test cases and checks for expected keywords in the response.

---

## Future Improvements & Retrospective

If I had more time, I would introduce the following enhancements:

1.  **Memory & Persistence**: Currently, chat history is ephemeral. I would implement a database (PostgreSQL/SQLite) to store conversation threads (`thread_id`), allowing users to revisit past discussions and maintaining context over long sessions.
2.  **Authentication**: A login page would be added to secure project data and allow multiple users to have private workspaces.
3.  **Advanced Evaluation**: With more project data, I would implement a more robust evaluation framework (using RAGAS or DeepEval) to quantitatively measure faithfulness and answer relevance, rather than just keyword matching.
4.  **Model Upgrades**: While Gemini is powerful, integrating paid APIs like **OpenAI (GPT-4o)** or **Anthropic (Claude 3.5 Sonnet)** could potentially offer better reasoning capabilities for complex construction queries and more reliable structured data extraction.
