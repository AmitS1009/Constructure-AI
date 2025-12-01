import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

print("Searching for a working model...")
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        # Prefer flash or pro
        if 'flash' in m.name or 'pro' in m.name:
            print(f"FOUND_MODEL={m.name}")
            # Try to use it
            try:
                model = genai.GenerativeModel(m.name)
                model.generate_content("Hi")
                print(f"VERIFIED_MODEL={m.name}")
                break
            except:
                continue
