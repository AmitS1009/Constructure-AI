import os
from typing import List
from pdfminer.high_level import extract_text
from .ingestion import process_pdf
from fastapi import UploadFile

# Simple in-memory storage for now, will replace with vector DB later
CHUNKS_DB = []

async def ingest_files(files: List[UploadFile]):
    processed_count = 0
    doc_names = []
    
    for file in files:
        content = await file.read()
        # Save temporarily to process
        temp_filename = f"temp_{file.filename}"
        with open(temp_filename, "wb") as f:
            f.write(content)
            
        try:
            chunks = process_pdf(temp_filename, file.filename)
            
            # Add to vector store
            from .vector_store import vector_store
            vector_store.add_chunks(chunks)
            
            processed_count += len(chunks)
            doc_names.append(file.filename)
        finally:
            if os.path.exists(temp_filename):
                os.remove(temp_filename)
                
    return processed_count, doc_names
