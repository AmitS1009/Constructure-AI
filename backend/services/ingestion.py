from pdfminer.high_level import extract_pages
from pdfminer.layout import LTTextContainer
from typing import List, Dict, Any

def process_pdf(file_path: str, filename: str, chunk_size: int = 800, overlap: int = 100) -> List[Dict[str, Any]]:
    chunks = []
    chunk_id_counter = 0
    
    for page_layout in extract_pages(file_path):
        page_num = page_layout.pageid
        page_text = ""
        
        for element in page_layout:
            if isinstance(element, LTTextContainer):
                page_text += element.get_text()
                
        # Simple chunking by characters (approx tokens) for now
        # In a real app, use a proper tokenizer
        text_len = len(page_text)
        start = 0
        while start < text_len:
            end = min(start + chunk_size * 4, text_len) # approx 4 chars per token
            chunk_text = page_text[start:end]
            
            chunks.append({
                "doc_name": filename,
                "page_num": page_num,
                "chunk_id": chunk_id_counter,
                "text": chunk_text
            })
            
            chunk_id_counter += 1
            start += (chunk_size - overlap) * 4
            
    return chunks
