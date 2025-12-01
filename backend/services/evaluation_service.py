from typing import List, Dict, Any
from .chat_service import generate_answer

# Hardcoded test cases
TEST_CASES = [
    {
        "id": "test_01",
        "question": "What is the fire rating for corridor partitions?",
        "expected_keywords": ["1 hour", "1-hour", "60 min", "fire rating"],
        "type": "factual"
    },
    {
        "id": "test_02",
        "question": "What is the material for door D-101?",
        "expected_keywords": ["hollow metal", "steel", "HM"],
        "type": "factual"
    },
    {
        "id": "test_03",
        "question": "Does the lobby floor have terrazzo?",
        "expected_keywords": ["yes", "terrazzo", "finish"],
        "type": "factual"
    },
    {
        "id": "test_04",
        "question": "What is the thickness of the exterior glass?",
        "expected_keywords": ["6mm", "double glazed", "insulating"],
        "type": "factual"
    },
    {
        "id": "test_05",
        "question": "Is there a requirement for LEED certification?",
        "expected_keywords": ["LEED", "certification", "silver", "gold", "platinum"],
        "type": "factual"
    }
]

async def run_evals() -> Dict[str, Any]:
    results = []
    passed_count = 0
    
    for test in TEST_CASES:
        # Run the query through the RAG pipeline
        response = await generate_answer(test["question"])
        answer = response["answer"].lower()
        
        # Check for expected keywords
        found_keywords = [kw for kw in test["expected_keywords"] if kw.lower() in answer]
        
        # Determine status
        if found_keywords:
            status = "PASS"
            passed_count += 1
        else:
            status = "FAIL" # Or PARTIAL if we had more complex logic
            
        results.append({
            "id": test["id"],
            "question": test["question"],
            "answer": response["answer"],
            "expected_keywords": test["expected_keywords"],
            "found_keywords": found_keywords,
            "status": status,
            "sources": [s["doc_name"] for s in response["sources"]]
        })
        
    return {
        "summary": {
            "total": len(TEST_CASES),
            "passed": passed_count,
            "failed": len(TEST_CASES) - passed_count,
            "accuracy": f"{(passed_count / len(TEST_CASES)) * 100:.1f}%"
        },
        "details": results
    }
