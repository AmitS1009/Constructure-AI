# 🏗️ Constructure AI (Project Brain)

> **The Intelligent Assistant for Construction Documentation** 🚀

Welcome to **Constructure AI**, a cutting-edge RAG (Retrieval-Augmented Generation) system designed to revolutionize how construction professionals interact with complex project documents. Whether you need to extract door schedules, verify fire ratings, or simply chat with your blueprints, Constructure AI has you covered.

---

## ✨ Key Features

### 💬 **Context-Aware Chat (RAG)**
Chat naturally with your PDF documents. Our **Hybrid Search** engine combines:
*   **Vector Search** (Semantic understanding via Gemini Embeddings)
*   **Keyword Search** (Precise term matching)
...to deliver accurate, cited answers every time.

### 🔒 **Strict Thread Isolation**
**No more context mixing!** 🛑
We've engineered a robust isolation layer where every chat thread is a silo.
*   **Uploads are Thread-Specific**: A file uploaded in "Project A" chat won't leak into "Project B".
*   **Privacy First**: Deleting a thread instantly wipes access to its context.

### 📑 **Automated Extraction**
Stop manual data entry. 🛑
*   **Door Schedule Extractor**: Automatically parses PDFs to extract structured data (Mark, Width, Height, Fire Rating) into a clean UI table.
*   **JSON Mode**: Powered by Gemini's structured output capabilities.

### 📊 **Built-in Evaluation Suite**
We don't just guess; we verify.
*   **Ragas-inspired Metrics**: Faithfulness, Answer Relevance, and Context Precision.
*   **Auto-Eval**: Run `test_full_flow.py` to verify the entire pipeline from Login -> Upload -> Extract.

---

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, TailwindCSS, Lucide Icons |
| **Backend** | FastAPI, Uvicorn, SQLAlchemy |
| **AI / LLM** | Google Gemini 1.5 Flash (GenAI) |
| **Vector DB** | FAISS (Facebook AI Similarity Search) |
| **Auth** | OAuth2 + JWT (Secure Login/Signup) |
| **PDF Processing** | PDFMiner.six |

---

## 🐛 The Debugging Journey (What We Fixed)

Building robust AI systems is hard. Here's how we tackled the toughest challenges:

### 1. **The "Blank Screen" Mystery** 👻
*   **Issue**: The Extraction page was rendering as a white void.
*   **Fix**: Identified a double-nested `<Layout>` component in React that was breaking the CSS grid. Removed the wrapper -> UI restored!

### 2. **The "Quota Exceeded" Roadblock** 🛑
*   **Issue**: Heavy testing hit the Gemini API free tier limits (429 Errors), causing uploads to crash.
*   **Fix**: Implemented a **Smart Fallback Strategy**. If the quota is hit, we gracefully fallback to zero-vectors, allowing the system to continue functioning using Keyword Search (Hybrid Search saves the day!).

### 3. **Context Leakage** 💧
*   **Issue**: Files uploaded in one chat were answering questions in another.
*   **Fix**: Implemented **Strict Metadata Filtering**. Every chunk is tagged with a `thread_id`. The retrieval engine now filters vectors *before* ranking, ensuring 100% isolation.

### 4. **Authentication Nightmares** 🔐
*   **Issue**: Login was failing due to a `bcrypt` version mismatch (`AttributeError`).
*   **Fix**: Downgraded and pinned `bcrypt==3.2.2` to ensure compatibility with `passlib`.

---

## 🚀 Getting Started

### Prerequisites
*   Python 3.10+
*   Node.js 18+
*   Google Gemini API Key

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
# Create .env file with GEMINI_API_KEY
python -m uvicorn main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Running Tests
```bash
# Verify Thread Isolation
python test_isolation.py

# Verify Full Pipeline
python test_full_flow.py
```

---

Built with ❤️ by **Amit**
**Design Philosophy**: "Make it work, then make it beautiful, then make it fast."

