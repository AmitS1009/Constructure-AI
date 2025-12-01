from database import engine, SessionLocal
from models_db import Base, User
from sqlalchemy import text

print("--- DEBUGGING DATABASE ---")

try:
    # 1. Test Connection
    print("Testing connection...")
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print(f"Connection successful: {result.scalar()}")

    # 2. Create Tables
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created.")

    # 3. Test User Creation
    print("Testing user creation...")
    db = SessionLocal()
    try:
        test_user = User(email="debug@example.com", hashed_password="hashed_debug_password")
        db.add(test_user)
        db.commit()
        print("User created successfully.")
        
        # Cleanup
        db.delete(test_user)
        db.commit()
        print("Cleanup successful.")
    except Exception as e:
        print(f"User creation failed: {e}")
        db.rollback()
    finally:
        db.close()

except Exception as e:
    print(f"DATABASE ERROR: {e}")
