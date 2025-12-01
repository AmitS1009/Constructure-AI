import requests
import os

BASE_URL = "http://localhost:8000"
EMAIL = "amit@abc"
PASSWORD = "1234"
PDF_PATH = "test_door_schedule.pdf"

def test_full_flow():
    # 1. Login
    print(f"Logging in as {EMAIL}...")
    auth_response = requests.post(f"{BASE_URL}/auth/login", json={"email": EMAIL, "password": PASSWORD})
    if auth_response.status_code != 200:
        print(f"Login failed: {auth_response.text}")
        return
    
    token = auth_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Login successful. Token received.")

    # 2. Upload PDF
    print(f"Uploading {PDF_PATH}...")
    if not os.path.exists(PDF_PATH):
        print(f"Error: {PDF_PATH} not found. Run create_pdf.py first.")
        return

    with open(PDF_PATH, "rb") as f:
        files = {"files": (PDF_PATH, f, "application/pdf")}
        # Note: requests handles multipart boundary automatically when 'files' is passed
        upload_response = requests.post(f"{BASE_URL}/ingest", headers=headers, files=files)
    
    if upload_response.status_code != 200:
        print(f"Upload failed: {upload_response.text}")
        return
    
    print(f"Upload successful: {upload_response.json()}")

    # 3. Extract Door Schedule
    print("Extracting door schedule...")
    extract_response = requests.post(f"{BASE_URL}/extract/door-schedule", headers=headers)
    
    if extract_response.status_code != 200:
        print(f"Extraction failed: {extract_response.text}")
        return
    
    data = extract_response.json()["data"]
    print(f"Extraction successful. Found {len(data)} items.")
    print(data)

if __name__ == "__main__":
    test_full_flow()
