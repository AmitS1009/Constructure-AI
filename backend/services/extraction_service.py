import os
import json
import google.generativeai as genai
from typing import List, Dict, Any
from .retrieval_service import hybrid_search

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel(os.getenv("GEMINI_MODEL_NAME", "gemini-1.5-flash"))

EXTRACTION_PROMPT = """You are extracting a door schedule. Input: a set of retrieved text chunks. Output: JSON array of door objects with exact keys: mark, location, width_mm, height_mm, fire_rating, material, source_references (array of {{file,page,chunk,excerpt}}). 
Rules:
- Output MUST be valid JSON only (no extra commentary).
- If a field is missing, set its value to null.
- For numeric fields convert to integers (mm).
- For conflicting values, include both candidate values separated by ' / ' and add a note inside source_references.
Return only JSON.

Context:
{context_str}
"""

async def extract_door_schedule() -> List[Dict[str, Any]]:
    # 1. Retrieve Context
    # We search for "door schedule" and "door list" to get relevant chunks
    # In a real system, we might want to scan all docs or use a classifier
    chunks = hybrid_search("door schedule door list door types", k=15)
    
    context_str = ""
    for chunk in chunks:
        context_str += f">>> [{chunk['doc_name']} - page {chunk['page_num']} - chunk {chunk['chunk_id']}] {chunk['text']}\n\n"
        
    # 2. Call LLM
    prompt = EXTRACTION_PROMPT.format(context_str=context_str)
    response = model.generate_content(prompt)
    
    # 3. Parse JSON
    try:
        text = response.text
        # Clean up markdown code blocks if present
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]
            
        data = json.loads(text.strip())
        return data
    except Exception as e:
        print(f"Error parsing JSON: {e}")
        return []
