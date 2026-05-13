import json
import os
from PIL import Image

class VisionEngine:
    def __init__(self):
        api_key = os.environ.get("GEMINI_API_KEY")
        self.client = None
        self._initialized = False
        if api_key:
            self._init_client(api_key)

    def _init_client(self, api_key):
        try:
            from google import genai
            self.client = genai.Client(api_key=api_key)
            self._initialized = True
        except ImportError:
            print("google-genai is not installed")
        except Exception as e:
            print(f"Failed to initialize Gemini client: {e}")

    def analyze_image(self, image_path):
        """Analyzes a single image for the FastAPI backend using Gemini."""
        if not self.client:
            raise ValueError("Gemini client is not initialized. Please set GEMINI_API_KEY.")

        prompt = self._get_single_image_prompt()

        # Load image with PIL
        pil_image = Image.open(image_path)

        # We must explicitly instruct it to return ONLY JSON, no markdown
        full_prompt = prompt + "\n\nCRITICAL: Return ONLY a raw JSON object. Do not wrap it in ```json blocks or any markdown."

        response = self.client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[full_prompt, pil_image],
        )

        text = response.text.strip()

        # Clean up any potential markdown formatting if the AI disobeys
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]

        return json.loads(text.strip())

    def _get_single_image_prompt(self):
        return """
        Analyze this image of a product for sale on a marketplace like eBay Kleinanzeigen.

        Extract and return the following information as a JSON object:
        {
          "title": "A short, catchy title for the listing",
          "description_en": "A detailed description of the item in English, highlighting features and potential condition based on the image.",
          "description_de": "The exact same detailed description, but translated into fluent, natural German.",
          "price": "A suggested price in EUR (e.g., '45 EUR' or 'VB 50 EUR')",
          "category": "The most appropriate category for this item",
          "room": "The room where this item would most likely be found. Must be exactly one of: Kitchen, Bathroom, Bedroom, Living Room, Garage, Office, Other"
        }
        """

# Lazy singleton — avoids import-time crash if API key is missing
_vision_engine = None

def get_vision_engine():
    global _vision_engine
    if _vision_engine is None:
        _vision_engine = VisionEngine()
    return _vision_engine