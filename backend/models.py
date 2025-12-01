from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ChunkMetadata(BaseModel):
    doc_name: str
    page_num: int
    chunk_id: int
    text: str

class IngestResponse(BaseModel):
    message: str
    chunks_count: int
    documents: List[str]

class QueryRequest(BaseModel):
    question: str
    history: Optional[List[Dict[str, str]]] = []

class QueryResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]
