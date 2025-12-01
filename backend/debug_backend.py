import os
import sys
import asyncio
from dotenv import load_dotenv

# Load env
load_dotenv()

print("--- DEBUGGING BACKEND ---")

# 1. Check Env
api_key = os.getenv("GEMINI_API_KEY")
model_name = os.getenv("GEMINI_MODEL_NAME")
print(f"API Key present: {bool(api_key)}")
print(f"Model Name: {model_name}")

# 2. Test Gemini Direct
print("\n--- Testing Gemini API Direct ---")
try:
    import google.generativeai as genai
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(model_name)
    response = model.generate_content("Test")
    print("Gemini API: SUCCESS")
except Exception as e:
    print(f"Gemini API: FAILED - {e}")

# 3. Test Vector Store
print("\n--- Testing Vector Store ---")
try:
    from services.vector_store import load_vector_store
    index, chunks = load_vector_store()
    print(f"Vector Store: Loaded. Index size: {index.ntotal if index else 'None'}, Chunks: {len(chunks)}")
except Exception as e:
    print(f"Vector Store: FAILED - {e}")

# 4. Test Retrieval
print("\n--- Testing Retrieval ---")
try:
    from services.retrieval_service import hybrid_search
    results = hybrid_search("Hello")
    print(f"Retrieval: SUCCESS. Found {len(results)} results.")
except Exception as e:
    print(f"Retrieval: FAILED - {e}")

# 5. Test Chat Service
print("\n--- Testing Chat Service ---")
try:
    from services.chat_service import generate_answer
    # We need to run async function
    res = asyncio.run(generate_answer("Hello"))
    print(f"Chat Service: SUCCESS. Answer: {res['answer'][:50]}...")
except Exception as e:
    print(f"Chat Service: FAILED - {e}")
