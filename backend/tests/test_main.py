import pytest
from fastapi.testclient import TestClient
from app.main import app
import os

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to The Photo App API"}

def test_analyze_image_no_file():
    response = client.post("/api/analyze-image")
    # FastAPI automatically returns 422 Unprocessable Entity when a required file is missing
    assert response.status_code == 422

def test_analyze_image_mock():
    # Create a dummy image file for testing
    test_image_path = "test_image.jpg"
    with open(test_image_path, "wb") as f:
        f.write(b"dummy image content")

    try:
        # Temporarily unset API key to ensure mock response is returned
        original_api_key = os.environ.get("GEMINI_API_KEY")
        if "GEMINI_API_KEY" in os.environ:
            del os.environ["GEMINI_API_KEY"]

        with open(test_image_path, "rb") as f:
            response = client.post(
                "/api/analyze-image",
                files={"file": ("test_image.jpg", f, "image/jpeg")}
            )
        
        if response.status_code != 200:
            print(f"Error response: {response.json()}")
            
        assert response.status_code == 200
        data = response.json()
        assert "Mock AI: test_image.jpg" in data["title"]
        assert "price" in data
        assert "category" in data
        
    finally:
        # Restore API key and cleanup file
        if original_api_key is not None:
            os.environ["GEMINI_API_KEY"] = original_api_key
        if os.path.exists(test_image_path):
            os.remove(test_image_path)
