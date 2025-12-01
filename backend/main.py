from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="Project Brain API", version="0.1.0")

# CORS
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from services.ingestion_service import ingest_files
from services.chat_service import generate_answer
from models import IngestResponse, QueryRequest, QueryResponse
from fastapi import UploadFile, File
from typing import List

@app.post("/ingest", response_model=IngestResponse)
async def ingest_endpoint(files: List[UploadFile] = File(...)):
    count, docs = await ingest_files(files)
    return IngestResponse(
        message=f"Successfully processed {count} chunks from {len(docs)} files.",
        chunks_count=count,
        documents=docs
    )

@app.post("/query", response_model=QueryResponse)
async def query_endpoint(request: QueryRequest):
    result = await generate_answer(request.question, request.history)
    return QueryResponse(
        answer=result["answer"],
        sources=result["sources"]
    )

from services.extraction_service import extract_door_schedule

@app.post("/extract/door-schedule")
async def extract_door_schedule_endpoint():
    data = await extract_door_schedule()
    return {"data": data}

from services.evaluation_service import run_evals

@app.post("/eval/run-tests")
async def run_tests_endpoint():
    report = await run_evals()
    return report

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "Project Brain Backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
