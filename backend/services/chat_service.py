import os
import google.generativeai as genai
from typing import List, Dict, Any
from .retrieval_service import hybrid_search

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

async def generate_answer(question: str, history: List[Dict[str, str]] = []) -> Dict[str, Any]:
    # 1. Retrieve Context
    retrieved_chunks = hybrid_search(question)
    
    context_str = ""
    for chunk in retrieved_chunks:
        context_str += f">>> [{chunk['doc_name']} - page {chunk['page_num']} - chunk {chunk['chunk_id']}] {chunk['text']}\n\n"
        
    # 2. Construct Prompt
    # Note: History handling can be improved by appending previous QA pairs to the prompt or using Gemini's chat history object
    # For now, we'll just use the system prompt + current question for simplicity in this prototype
    
    prompt = SYSTEM_PROMPT.format(context_str=context_str, user_question=question)
    
    # 3. Call LLM with Retry
    import time
    max_retries = 3
    base_delay = 2
    
    for attempt in range(max_retries):
        try:
            response = model.generate_content(prompt)
            break
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower() or "resource exhausted" in str(e).lower():
                if attempt < max_retries - 1:
                    sleep_time = base_delay * (2 ** attempt)
                    print(f"Quota exceeded, retrying in {sleep_time}s...")
                    time.sleep(sleep_time)
                    continue
            raise e
    answer_text = response.text
    
    # 4. Format Response
    return {
        "answer": answer_text,
        "sources": retrieved_chunks
    }
