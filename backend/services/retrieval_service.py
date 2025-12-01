from typing import List, Dict, Any
from .vector_store import vector_store
import re

def keyword_search(query: str, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Simple keyword search that looks for exact matches of query terms in chunks.
    """
    query_terms = set(re.findall(r'\w+', query.lower()))
    results = []
    
    for chunk in chunks:
        chunk_text = chunk["text"].lower()
        score = 0
        for term in query_terms:
            if term in chunk_text:
                score += 1
        
        if score > 0:
            item = chunk.copy()
            item["score"] = score * 0.1 # Weight keyword matches lower than vector similarity usually
            results.append(item)
            
    return sorted(results, key=lambda x: x["score"], reverse=True)

def hybrid_search(query: str, k: int = 5) -> List[Dict[str, Any]]:
    # 1. Vector Search
    vector_results = []
    try:
        vector_results = vector_store.search(query, k=k*2) # Get more candidates
    except Exception as e:
        print(f"Vector search failed (likely quota): {e}. Falling back to keyword search.")
        vector_results = []
    
    # 2. Keyword Search (on all metadata in memory - simple version)
    # In a real DB, this would be a SQL LIKE or FTS query
    keyword_results = keyword_search(query, vector_store.metadata)
    
    # 3. Merge and Rerank
    # Normalize scores? For now, just prefer vector results but boost if keyword match exists
    
    combined_results = {}
    
    for res in vector_results:
        key = f"{res['doc_name']}_{res['chunk_id']}"
        combined_results[key] = res
        combined_results[key]["final_score"] = res["score"]
        
    for res in keyword_results[:k*2]:
        key = f"{res['doc_name']}_{res['chunk_id']}"
        if key in combined_results:
            combined_results[key]["final_score"] += res["score"]
        else:
            combined_results[key] = res
            combined_results[key]["final_score"] = res["score"]
            
    # Sort by final score
    sorted_results = sorted(combined_results.values(), key=lambda x: x["final_score"], reverse=True)
    
    return sorted_results[:k]
