from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Use localhost for local dev if not in docker, else use db service name
# But for local dev without docker, we might need localhost.
# The docker-compose sets DATABASE_URL=postgresql://postgres:postgres@db:5432/project_brain
# If running locally, user needs to change 'db' to 'localhost' or we handle it here.

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/project_brain")

# If running outside docker but env says 'db', fallback to localhost for convenience if 'db' not resolvable?
# Actually, let's just rely on the env var. If user runs locally, they should update .env or we assume they use docker.
# However, for the user's convenience running locally:
if "db" in DATABASE_URL and os.environ.get("OS") == "Windows_NT":
     # Crude check if running locally on windows without docker networking
     # But wait, user might be running python locally.
     pass

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
