import requests
import os

# Create a dummy image
with open("test.jpg", "wb") as f:
    f.write(b"dummy_image_data")

# Point to localhost to trigger the error locally
url = "http://127.0.0.1:8000/api/analyze-image"
files = {'file': open('test.jpg', 'rb')}

try:
    response = requests.post(url, files=files)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
finally:
    os.remove("test.jpg")
