import os
import google.generativeai as genai
import faiss
import numpy as np
import pickle
from typing import List, Dict, Any

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

class VectorStore:
    def __init__(self, index_path: str = "data/vectors.index", metadata_path: str = "data/metadata.pkl"):
        self.index_path = index_path
        self.metadata_path = metadata_path
        self.dimension = 768 # Gemini embedding dimension
        self.index = None
        self.metadata = []
        
        self.load_index()

    def load_index(self):
        if os.path.exists(self.index_path) and os.path.exists(self.metadata_path):
            self.index = faiss.read_index(self.index_path)
            with open(self.metadata_path, "rb") as f:
                self.metadata = pickle.load(f)
        else:
            self.index = faiss.IndexFlatL2(self.dimension)
            self.metadata = []

    def save_index(self):
        os.makedirs(os.path.dirname(self.index_path), exist_ok=True)
        faiss.write_index(self.index, self.index_path)
        with open(self.metadata_path, "wb") as f:
            pickle.dump(self.metadata, f)

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        # Batching might be needed for large lists
        # Batching might be needed for large lists
        import time
        max_retries = 3
        base_delay = 2
        
        for attempt in range(max_retries):
            try:
                result = genai.embed_content(
                    model="models/embedding-001",
                    content=texts,
                    task_type="retrieval_document",
                    title="Construction Document"
                )
                return result['embedding']
            except Exception as e:
                if "429" in str(e) or "quota" in str(e).lower() or "resource exhausted" in str(e).lower():
                    if attempt < max_retries - 1:
                        sleep_time = base_delay * (2 ** attempt)
                        print(f"Embedding quota exceeded, retrying in {sleep_time}s...")
                        time.sleep(sleep_time)
                        continue
                raise e

    def add_chunks(self, chunks: List[Dict[str, Any]]):
        texts = [chunk["text"] for chunk in chunks]
        embeddings = self.get_embeddings(texts)
        
        vectors = np.array(embeddings).astype('float32')
        self.index.add(vectors)
        self.metadata.extend(chunks)
        self.save_index()

    def search(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        import time
        max_retries = 3
        base_delay = 2
        
        query_embedding = None
        for attempt in range(max_retries):
            try:
                result = genai.embed_content(
                    model="models/embedding-001",
                    content=query,
                    task_type="retrieval_query"
                )
                query_embedding = result['embedding']
                break
            except Exception as e:
                if "429" in str(e) or "quota" in str(e).lower() or "resource exhausted" in str(e).lower():
                    if attempt < max_retries - 1:
                        sleep_time = base_delay * (2 ** attempt)
                        print(f"Query embedding quota exceeded, retrying in {sleep_time}s...")
                        time.sleep(sleep_time)
                        continue
                raise e
        
        query_vector = np.array([query_embedding]).astype('float32')
        distances, indices = self.index.search(query_vector, k)
        
        results = []
        for i, idx in enumerate(indices[0]):
            if idx != -1:
                item = self.metadata[idx].copy()
                item["score"] = float(distances[0][i])
                results.append(item)
                
        return results

# Singleton instance
vector_store = VectorStore()
