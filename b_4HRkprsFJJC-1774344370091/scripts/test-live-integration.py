import requests
import time
import uuid
import sys

# Configuration
API_URL = "http://localhost:8000/api/v1"
API_KEY = "dev-api-key-12345" # Must match main.py default or .env
WORKSPACE_ID = "workspace-123"

HEADERS = {
    "X-Api-Key": API_KEY,
    "X-Workspace-Id": WORKSPACE_ID,
    "Content-Type": "application/json"
}

def track(session_id, step, event_type="page_view", field=None):
    payload = {
        "event_type": event_type,
        "session_id": session_id,
        "step": step,
        "field": field,
        "workspace_id": WORKSPACE_ID,
        "metadata": {"source": "integration-test", "os": "windows"}
    }
    try:
        resp = requests.post(f"{API_URL}/events", json=payload, headers=HEADERS)
        print(f"  [→] {event_type:12} | {step:10} | {field or '-':10} | Status: {resp.status_code}")
    except Exception as e:
        print(f"  [!] Failed to track: {e}")

def simulate_user_journey():
    session_id = f"live-test-{uuid.uuid4().hex[:6]}"
    print(f"\n[START] Starting live journey for session: {session_id}")
    
    # Step 1: Landing & Login
    track(session_id, "step-1")
    time.sleep(0.5)
    
    # Step 2: Personal Details
    track(session_id, "step-2")
    time.sleep(0.5)
    
    # Simulate a friction point: Password error
    track(session_id, "step-1", event_type="input_error", field="password")
    print("  [!] Simulated friction: Password validation error")
    
    # Step 3: Phone Verification
    track(session_id, "step-3")
    time.sleep(0.5)
    
    # Step 4: Completion (optional skip for some users to simulate drop-off)
    if uuid.uuid4().int % 2 == 0:
        track(session_id, "step-4")
        print("  [OK] Journey Completed!")
    else:
        print("  [x] User dropped off at Step 3.")

if __name__ == "__main__":
    print("-" * 60)
    print("Drop-off Intelligence: End-to-End Integration Tester")
    print("-" * 60)
    
    # Run 3 test journeys
    for i in range(3):
        simulate_user_journey()
        
    print("\n[FINISH] Test batch complete. Check your dashboard for real-time updates!")
    print("-" * 60)
