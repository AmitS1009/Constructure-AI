try:
    import fastapi
    import uvicorn
    import dotenv
    import google.generativeai
    import faiss
    import numpy
    import pypdf
    import pdfminer
    import multipart
    import requests
    print("All imports successful")
except ImportError as e:
    print(f"ImportError: {e}")
