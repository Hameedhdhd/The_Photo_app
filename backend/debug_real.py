import requests
import os
from PIL import Image

# Create a small, valid test image so Gemini doesn't fail on a dummy text file
image = Image.new('RGB', (100, 100), color = 'red')
image.save("test_real.jpg")

url = "http://127.0.0.1:8000/api/analyze-image"
files = {'file': open('test_real.jpg', 'rb')}

try:
    print("Sending real test image to API...")
    response = requests.post(url, files=files)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
finally:
    if os.path.exists("test_real.jpg"):
        os.remove("test_real.jpg")
