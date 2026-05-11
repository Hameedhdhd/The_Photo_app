import base64
import json
import os
from openai import OpenAI

class VisionEngine:
    def __init__(self):
        # Using environment variable for API key. 
        # Don't instantiate if no key is present to avoid OpenAI error on boot/import
        api_key = os.environ.get("OPENAI_API_KEY")
        self.openai_client = OpenAI(api_key=api_key) if api_key else None

    def encode_image(self, image_path):
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')

    def analyze_image(self, image_path):
        """Analyzes a single image for the FastAPI backend."""
        if not self.openai_client:
            raise ValueError("OpenAI client is not initialized. Please set OPENAI_API_KEY.")
            
        base64_image = self.encode_image(image_path)
        prompt = self._get_single_image_prompt()

        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                    }
                ]
            }
        ]

        response = self.openai_client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            response_format={"type": "json_object"},
            max_tokens=1000
        )
        return json.loads(response.choices[0].message.content)

    def _get_single_image_prompt(self):
        return """
        Analyze this image of a product for sale on a marketplace like eBay Kleinanzeigen.
        
        Extract and return the following information as a JSON object:
        {
          "title": "A short, catchy title for the listing",
          "description": "A detailed description of the item, highlighting features and potential condition based on the image.",
          "price": "A suggested price in EUR (e.g., '45 EUR' or 'VB 50 EUR')",
          "category": "The most appropriate category for this item"
        }
        """

vision_engine = VisionEngine()
