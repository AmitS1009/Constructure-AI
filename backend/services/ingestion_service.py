import os
from typing import List
from pdfminer.high_level import extract_text
import os
from typing import List, Tuple
from pdfminer.high_level import extract_text
from .ingestion import process_pdf
from fastapi import UploadFile

# Simple in-memory storage for now, will replace with vector DB later
CHUNKS_DB = []

async def ingest_files(files: List[UploadFile], thread_id: int = None) -> Tuple[int, List[str]]:
    total_chunks = 0
    processed_files = []
    
    for file in files:
        # Save temp file
        file_path = f"temp_{file.filename}"
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
            
        try:
            # Process
            chunks = process_pdf(file_path, file.filename)
            
            # Add to vector store with thread_id
            from .vector_store import vector_store
            vector_store.add_chunks(chunks, thread_id=thread_id)
            
            total_chunks += len(chunks)
            processed_files.append(file.filename)
        finally:
            if os.path.exists(file_path):
                os.remove(file_path)
                
    return total_chunks, processed_files
