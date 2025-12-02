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
**No context mixing!** 🛑
I've engineered a robust isolation layer where every chat thread is a silo.
*   **Uploads are Thread-Specific**: A file uploaded in "Project A" chat won't leak into "Project B".
*   **Privacy First**: Deleting a thread instantly wipes access to its context.

### 📑 **Automated Extraction**
Stop manual data entry. 🛑
*   **Door Schedule Extractor**: Automatically parses PDFs to extract structured data (Mark, Width, Height, Fire Rating) into a clean UI table.
*   **JSON Mode**: Powered by Gemini's structured output capabilities.

### 📊 **Built-in Evaluation Suite**
I don't just guess; I verify.
*   **Ragas-inspired Metrics**: Faithfulness, Answer Relevance, and Context Precision.
*   **Auto-Eval**: Run `test_full_flow.py` to verify the entire pipeline from Login -> Upload -> Extract.

---

**Screen Shots**
---
Login :
<img width="1917" height="860" alt="image" src="https://github.com/user-attachments/assets/16863d5b-a828-476a-aea8-cb13df43b803" />

Chat :
<img width="1917" height="868" alt="image" src="https://github.com/user-attachments/assets/9caf3e14-c593-4433-8c7c-14cf445c7033" />

Extraction : 
<img width="1919" height="867" alt="image" src="https://github.com/user-attachments/assets/ba97e47a-e336-43e7-9720-d3e855ba2716" />

Evaluation :
<img width="1919" height="865" alt="image" src="https://github.com/user-attachments/assets/6dc5c176-3ff2-488f-9884-384facadfe05" />


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

## 🐛 The Debugging Journey: A Technical Deep Dive

Building a production-grade RAG system isn't just about connecting APIs. On production level It's more about handling edge cases, ensuring data privacy, and managing system constraints. Here are the critical engineering challenges I solved:

### 1. 🛑 Solving the "Context Leakage" Crisis (Data Privacy)
*   **The Problem**: In the initial RAG implementation, all uploaded documents went into a shared vector index. This meant a user asking about "Project A" in one thread could accidentally retrieve confidential details from "Project B".
*   **The Fix**: I architected a **Strict Thread Isolation** layer.
    *   **Ingestion**: Modified the vector store to tag every document chunk with a unique `thread_id` in its metadata.
    *   **Retrieval**: Rewrote the `hybrid_search` algorithm to enforce a strict filter: `WHERE thread_id = current_thread_id`.
    *   **Result**: 100% data isolation. Deleting a thread now cryptographically "shreds" access to its documents by removing the retrieval key.

### 2. 📉 Handling API Rate Limits (Resilience Engineering)
*   **The Problem**: During high-load ingestion, the Google Gemini API would throw `429 Resource Exhausted` errors, causing the entire upload pipeline to crash.
*   **The Fix**: I implemented a **Graceful Degradation Strategy**.
    *   Added **Exponential Backoff** retries for transient failures.
    *   Created a **Zero-Vector Fallback**: If the embedding API fails after retries, I inject a zero-vector placeholder but keep the text metadata. This allows the system to seamlessly switch to **Keyword-Only Search** for those specific chunks, ensuring no data is ever lost.

### 3. 👻 The "Ghost UI" (Frontend Architecture)
*   **The Problem**: The Extraction page was rendering as a blank white screen, despite no console errors.
*   **The Fix**: A deep dive into the React component tree revealed a **Double-Nested Layout** issue. The `Extraction` page was wrapping itself in `<Layout>`, while `App.jsx` was *also* wrapping it. This caused conflicting CSS Grid definitions (`flex-1` fighting for height). Removing the redundant wrapper resolved the rendering pipeline.

### 4. 🔐 Dependency Hell: The Bcrypt Incompatibility
*   **The Problem**: The authentication system crashed with `AttributeError: module 'bcrypt' has no attribute '__about__'`, breaking the login flow.
*   **The Fix**: Investigated the dependency tree and found a conflict between `passlib` (used for password hashing) and newer versions of `bcrypt`. I pinned the dependency to `bcrypt==3.2.2`, ensuring stable cryptographic operations.

### 5. 📜 Infinite Scroll & Flexbox Physics
*   **The Problem**: Chat history wasn't scrolling, trapping users at the top of long conversations.
*   **The Fix**: The Flexbox container was missing a critical constraint. I applied `min-h-0` to the scrollable child, forcing the browser to calculate height based on the parent's constraint rather than the content's intrinsic size.

### 6. 📦 Missing Dependencies (Environment Drift)
*   **The Problem**: The backend failed to start with `ModuleNotFoundError: No module named 'sqlalchemy'`, even though it worked previously.
*   **The Fix**: Identified that the user's environment (`conda env: vehicle`) was missing dependencies. Ran `pip install -r requirements.txt` to align the environment with the project's needs.

### 7. ⚪ The "Blank Screen" of Death (Component Crash)
*   **The Problem**: The frontend rendered a completely white screen. Console logs revealed `[error]... at Layout`.
*   **The Fix**: A regression was introduced where the `NavItem` component definition was accidentally removed from `Layout.jsx` during an edit. Restoring the component definition brought the UI back to life.

### 8. 🌑 Dark Mode & The "Black Screen" Confusion
*   **The Problem**: Users reported the screen was "black" after login.
*   **The Fix**: Clarified that this was the intended **Dark Mode** design (`#1a1625`). However, to improve UX, I verified that content was actually rendering and not just a void.

### 9. 🔄 The "Auto-Login" Loop & Missing Logout
*   **The Problem**: Users couldn't see the login page because the app automatically redirected them to Home (due to a persisted token), and there was no way to sign out.
*   **The Fix**: Implemented a **Logout Button** in the sidebar that clears the `localStorage` token and redirects the user back to the login screen, giving them control over their session.

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

---

## 🔮 Future Roadmap & Scalability

While the current system is production-ready for small-to-medium workloads, I have a clear path to enterprise scale:

### 1. 🚀 Breaking the Rate Limit Barrier (Cost vs. Scale)
*   **Current State**: I utilize the **Gemini Free Tier** for embeddings, which imposes strict rate limits (hence our robust retry/fallback logic).
*   **Future Upgrade**: Moving to **Paid Tier APIs** (e.g., OpenAI `text-embedding-3-small` Anthropicor Gemini Pro) would instantly remove the 429 errors and allow for massive parallel ingestion.

### 2. 🗄️ From In-Memory to Distributed Vector DB
*   **Current State**: I use **FAISS** in local mode for lightning-fast, zero-latency retrieval.
*   **Future Upgrade**: For managing millions of documents, I would migrate to a distributed vector database like **Pinecone**, **Weaviate**, or **Milvus**. This would enable:
    *   Horizontal scaling.
    *   Cloud-native persistence.
    *   Advanced metadata filtering at scale.

### 3. 👁️ OCR for Scanned Blueprints
*   **Current State**: I process digital PDFs using `pdfminer.six`.
*   **Future Upgrade**: Integrating **Tesseract** or **Google Cloud Vision** to extract text from scanned images and blueprints, unlocking a massive new category of data.

---

Built with ❤️ by **Amit Kushwaha** : 
**Design Philosophy**: "Make it work, then make it beautiful, then make it fast."
