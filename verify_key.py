import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

candidates = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-1.5-pro-latest",
    "gemini-1.0-pro",
    "gemini-pro"
]

print("Testing models...")
for model_name in candidates:
    try:
        print(f"Testing {model_name}...", end=" ")
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Hi")
        print("SUCCESS")
        print(f"WORKING_MODEL={model_name}")
        break
    except Exception as e:
        print(f"FAILED ({e})")
