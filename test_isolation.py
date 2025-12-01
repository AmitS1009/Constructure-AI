import requests
import time

BASE_URL = "http://localhost:8000"
EMAIL = "amit@abc"
PASSWORD = "1234"
PDF_PATH = "test_door_schedule.pdf"

def test_isolation():
    # 1. Login
    print(f"Logging in as {EMAIL}...")
    auth_response = requests.post(f"{BASE_URL}/auth/login", json={"email": EMAIL, "password": PASSWORD})
    if auth_response.status_code != 200:
        print(f"Login failed: {auth_response.text}")
        return
    token = auth_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Login successful.")

    # 2. Create Thread A
    print("Creating Thread A...")
    # Query creates thread if thread_id is missing
    # But we want to get the ID first? No, query returns it in stream.
    # Let's use a dummy query to create thread.
    # Actually, let's just use a random ID? No, DB enforces FK.
    # We can use /query to create.
    
    # Helper to create thread
    def create_thread(title):
        # We can't explicitly create thread via API easily without sending a message.
        # Let's send a message "Hello"
        resp = requests.post(f"{BASE_URL}/query", headers=headers, json={"question": "Hello", "history": []}, stream=True)
        # Parse stream to find thread_id
        thread_id = None
        for line in resp.iter_lines():
            if line:
                line = line.decode('utf-8')
                if "__THREAD_ID__:" in line:
                    thread_id = int(line.split(":")[1])
                    break
        return thread_id

    thread_a = create_thread("Thread A")
    print(f"Created Thread A: {thread_a}")
    
    thread_b = create_thread("Thread B")
    print(f"Created Thread B: {thread_b}")

    # 3. Upload PDF to Thread A
    print(f"Uploading PDF to Thread A ({thread_a})...")
    with open(PDF_PATH, "rb") as f:
        files = {"files": (PDF_PATH, f, "application/pdf")}
        data = {"thread_id": thread_a}
        upload_response = requests.post(f"{BASE_URL}/ingest", headers=headers, files=files, data=data)
    
    if upload_response.status_code != 200:
        print(f"Upload failed: {upload_response.text}")
        return
    print("Upload successful.")

    # 4. Query Thread A (Should find info)
    print("Querying Thread A about doors...")
    # We need to consume stream
    def query_thread(tid, q):
        resp = requests.post(f"{BASE_URL}/query", headers=headers, json={"question": q, "history": [], "thread_id": tid}, stream=True)
        full_text = ""
        for line in resp.iter_lines():
            if line:
                line = line.decode('utf-8')
                if "__THREAD_ID__" not in line and "__SOURCES__" not in line:
                    full_text += line
        return full_text

    ans_a = query_thread(thread_a, "What is the fire rating of D-101?")
    print(f"Thread A Answer: {ans_a[:100]}...")
    
    # 5. Query Thread B (Should NOT find info)
    print("Querying Thread B about doors...")
    ans_b = query_thread(thread_b, "What is the fire rating of D-101?")
    print(f"Thread B Answer: {ans_b[:100]}...")

    if "1hr" in ans_a and "1hr" not in ans_b:
        print("SUCCESS: Thread A has context, Thread B does not.")
    else:
        print("FAILURE: Context leakage or missing context.")
        print(f"A: {ans_a}")
        print(f"B: {ans_b}")

    # 6. Delete Thread A
    print(f"Deleting Thread A ({thread_a})...")
    del_resp = requests.delete(f"{BASE_URL}/threads/{thread_a}", headers=headers)
    print(f"Delete status: {del_resp.status_code}")

    # 7. Verify Context Gone (by querying... wait, if thread is deleted, query might fail 404)
    # If we query with deleted thread_id, backend returns 404.
    # So we can't query it.
    # But vectors are still in DB (filtered out by thread_id).
    # If we create Thread C, it shouldn't see it.
    thread_c = create_thread("Thread C")
    print(f"Created Thread C: {thread_c}")
    ans_c = query_thread(thread_c, "What is the fire rating of D-101?")
    print(f"Thread C Answer: {ans_c[:100]}...")
    
    if "1hr" not in ans_c:
        print("SUCCESS: Thread C does not see deleted context.")
    else:
        print("FAILURE: Thread C saw deleted context (Global leakage?).")

if __name__ == "__main__":
    test_isolation()
