from fastapi import FastAPI, Depends, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import json
import os
from dotenv import load_dotenv

from database import engine, get_db, SessionLocal
import models_db
from routers import auth
from services.ingestion_service import ingest_files
from services.chat_service import generate_answer_stream
from services.extraction_service import extract_door_schedule
from services.evaluation_service import run_evals
from models import IngestResponse, QueryRequest

load_dotenv()

# Create Tables
models_db.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Project Brain API", version="0.2.0")

# CORS
origins = [
    "http://localhost:5173",
    "https://constructure-ai-murex.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])

@app.post("/ingest", response_model=IngestResponse)
async def ingest_endpoint(files: List[UploadFile] = File(...), thread_id: int = Form(None), db: Session = Depends(get_db), current_user: models_db.User = Depends(auth.get_current_user)):
    print(f"Received ingestion request for {len(files)} files, thread_id={thread_id}")
    try:
        count, docs = await ingest_files(files, thread_id=thread_id)
        print(f"Ingestion successful: {count} chunks, {docs}")
        return IngestResponse(
            message=f"Successfully processed {count} chunks from {len(docs)} files.",
            chunks_count=count,
            documents=docs
        )
    except Exception as e:
        print(f"Ingestion failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query")
async def query_endpoint(request: QueryRequest, db: Session = Depends(get_db), current_user: models_db.User = Depends(auth.get_current_user)):
    # ... (keep existing code)
    # 1. Handle Thread
    thread_id = request.thread_id
    if not thread_id:
        new_thread = models_db.Thread(user_id=current_user.id, title=request.question[:30] + "...")
        db.add(new_thread)
        db.commit()
        db.refresh(new_thread)
        thread_id = new_thread.id
    else:
        # Verify thread belongs to user
        thread = db.query(models_db.Thread).filter(models_db.Thread.id == thread_id, models_db.Thread.user_id == current_user.id).first()
        if not thread:
            raise HTTPException(status_code=404, detail="Thread not found")

    # 2. Save User Message
    user_msg = models_db.Message(thread_id=thread_id, role="user", content=request.question)
    db.add(user_msg)
    db.commit()

    # 3. Stream Response
    async def stream_generator():
        full_answer = ""
        sources_data = []
        is_sources = False
        
        # Send thread_id as first event
        yield f"__THREAD_ID__:{thread_id}\n\n"
        
        async for chunk in generate_answer_stream(request.question, request.history, thread_id=thread_id):
            if chunk == "\n\n__SOURCES__\n":
                yield chunk
                is_sources = True
                continue
            
            if is_sources:
                try:
                    sources_data = json.loads(chunk)
                except:
                    pass
                yield chunk
            else:
                full_answer += chunk
                yield chunk
        
        # Save Assistant Message
        # Use new session as the outer one might be closed
        with SessionLocal() as db_inner:
            assistant_msg = models_db.Message(
                thread_id=thread_id, 
                role="assistant", 
                content=full_answer,
                sources=sources_data
            )
            db_inner.add(assistant_msg)
            db_inner.commit()

    return StreamingResponse(stream_generator(), media_type="text/event-stream")

@app.get("/threads")
def get_threads(skip: int = 0, limit: int = 20, db: Session = Depends(get_db), current_user: models_db.User = Depends(auth.get_current_user)):
    threads = db.query(models_db.Thread).filter(models_db.Thread.user_id == current_user.id).order_by(models_db.Thread.created_at.desc()).offset(skip).limit(limit).all()
    return threads

@app.get("/threads/{thread_id}/messages")
def get_messages(thread_id: int, db: Session = Depends(get_db), current_user: models_db.User = Depends(auth.get_current_user)):
    thread = db.query(models_db.Thread).filter(models_db.Thread.id == thread_id, models_db.Thread.user_id == current_user.id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    return thread.messages

@app.delete("/threads/{thread_id}")
def delete_thread(thread_id: int, db: Session = Depends(get_db), current_user: models_db.User = Depends(auth.get_current_user)):
    thread = db.query(models_db.Thread).filter(models_db.Thread.id == thread_id, models_db.Thread.user_id == current_user.id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    # Delete associated messages first (cascade should handle this if configured, but explicit is safe)
    db.query(models_db.Message).filter(models_db.Message.thread_id == thread_id).delete()
    db.delete(thread)
    db.commit()
    return {"status": "success", "message": "Thread deleted"}

@app.post("/extract/door-schedule")
async def extract_door_schedule_endpoint(current_user: models_db.User = Depends(auth.get_current_user)):
    print("Received extraction request")
    try:
        data = await extract_door_schedule()
        print(f"Extraction result: {len(data)} items")
        return {"data": data}
    except Exception as e:
        print(f"Extraction failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/eval/run-tests")
async def run_tests_endpoint(current_user: models_db.User = Depends(auth.get_current_user)):
    report = await run_evals()
    return report

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "Project Brain Backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
