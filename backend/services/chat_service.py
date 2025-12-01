import os
import google.generativeai as genai
from typing import List, Dict, Any
from services.retrieval_service import hybrid_search

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel(os.getenv("GEMINI_MODEL_NAME", "gemini-1.5-flash"))

SYSTEM_PROMPT = """You are an assistant that answers questions about construction project documents. Always cite your sources in the form: [FILENAME - page X - chunk Y]. For each answer return:
1) A concise answer (1-4 sentences).
2) A bullet list of sources used (file, page, chunk, retrieval score).
3) If user asks for structured output, return strictly valid JSON matching the schema provided.
Be conservative—if the documents do not contain the needed info, say "Not stated in documents" and list candidate documents that might contain it.

Context: You have the following retrieved text chunks (each prefixed with >>> and a source tag): 
{context_str}

Task: Answer the user's question below using ONLY the text in the retrieved chunks. Use the retrieved text to support your answer and include explicit citations.
User question: "{user_question}"

Deliverable format:
- Plain concise answer (1-3 sentences).
- Sources: a numbered list with file name, page, chunk id, and a one-sentence justification (excerpt).
- If you are not sure, be explicit: "Could not find explicit spec in provided docs."
"""

async def generate_answer_stream(question: str, history: List[Dict[str, str]] = [], thread_id: int = None):
    # 1. Retrieve Context
    retrieved_chunks = hybrid_search(question, thread_id=thread_id)
    
    context_str = ""
    for chunk in retrieved_chunks:
        context_str += f">>> [{chunk['doc_name']} - page {chunk['page_num']} - chunk {chunk['chunk_id']}] {chunk['text']}\n\n"
        
    # 2. Construct Prompt
    prompt = SYSTEM_PROMPT.format(context_str=context_str, user_question=question)
    
    # 3. Call LLM with Retry & Streaming
    import time
    max_retries = 3
    base_delay = 2
    
    response_stream = None
    
    for attempt in range(max_retries):
        try:
            response_stream = model.generate_content(prompt, stream=True)
            break
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower() or "resource exhausted" in str(e).lower():
                if attempt < max_retries - 1:
                    sleep_time = base_delay * (2 ** attempt)
                    print(f"Quota exceeded (stream), retrying in {sleep_time}s...")
                    time.sleep(sleep_time)
                    continue
            raise e

    # Yield chunks
    full_answer = ""
    try:
        for chunk in response_stream:
            if chunk.text:
                full_answer += chunk.text
                yield chunk.text
    except Exception as e:
        yield f"\n[Error during streaming: {e}]"

    # Yield sources at the end as a special marker or just append?
    # For SSE, we can send events. But for simple stream, we might just append text.
    # Or we can yield a JSON object if using SSE.
    # Let's yield a delimiter and then the sources JSON
    import json
    yield "\n\n__SOURCES__\n"
    yield json.dumps(retrieved_chunks)
