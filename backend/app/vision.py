import json
import os
from PIL import Image


class VisionEngine:
    """Gemini: image identification only (cheap, fast)."""

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
        """Backward compatibility for single image path."""
        return self.analyze_images([image_path])

    def analyze_images(self, image_paths: list[str]):
        """Identify product from one or more images. Returns minimal JSON for DeepSeek to expand."""
        if not self.client:
            raise ValueError("Gemini client is not initialized. Please set GEMINI_API_KEY.")

        prompt = self._get_image_prompt()
        
        # Open all images
        pil_images = []
        for path in image_paths:
            try:
                pil_images.append(Image.open(path))
            except Exception as e:
                print(f"Error opening image {path}: {e}")

        if not pil_images:
            raise ValueError("No valid images provided for analysis.")

        full_prompt = prompt + "\n\nReturn ONLY raw JSON. No markdown."

        # Pass prompt and all images to Gemini
        contents = [full_prompt] + pil_images
        
        response = self.client.models.generate_content(
            model="gemini-2.0-flash", # Use latest stable
            contents=contents,
        )

        text = response.text.strip()
        # Clean markdown wrapping
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]

        return json.loads(text.strip())

    def _get_image_prompt(self):
        return """Identify this product from the provided photo(s). Return JSON:
{"name":"product name","brand":"brand or empty","model":"model or empty","visible_features":["feature1","feature2"],"category":"category","condition":"brief condition","estimated_price_eur":"number","room":"one of: Kitchen,Bathroom,Bedroom,Living Room,Garage,Office,Other"}
Only include what you can actually see or confidently infer. If multiple photos are provided, they are of the same item from different angles."""


class DeepSeekEngine:
    """DeepSeek: text generation only (cheap, rich output)."""

    def __init__(self):
        api_key = os.environ.get("DEEPSEEK_API_KEY")
        self.client = None
        if api_key:
            self._init_client(api_key)

    def _init_client(self, api_key):
        try:
            from openai import OpenAI
            self.client = OpenAI(
                api_key=api_key,
                base_url="https://api.deepseek.com"
            )
        except ImportError:
            print("openai is not installed (pip install openai)")
        except Exception as e:
            print(f"Failed to initialize DeepSeek client: {e}")

    def generate_listing(self, gemini_result: dict) -> dict:
        """Take Gemini's identification and generate rich Kleinanzeigen listing."""
        if not self.client:
            # Fallback: return Gemini result with basic descriptions
            return self._fallback(gemini_result)

        system_prompt = """You are a professional Kleinanzeigen (German marketplace) listing writer.
Given product identification data, generate a compelling marketplace listing.
Return ONLY raw JSON, no markdown."""

        user_prompt = f"""Product identified from photo:
{json.dumps(gemini_result, ensure_ascii=False)}

Generate a Kleinanzeigen listing. Return JSON:
{{
  "title": "Product title without repeating brand (e.g., 'GORENJE REALSLIM WASCHMASCHINE 7KG')",
  "specs": {{"Energieeffizienz": "A (-10%)", "Kapazität": "7 kg", "Schleuderdrehzahl": "1400 U/min", "Tiefe": "46.5 cm", "Funktionen": "ConnectLife, SteamTech"}},
  "programs_de": ["Extra Hygiene", "Baby-Programm", "Schnellwäsche 20'"],
  "programs_en": ["Extra Hygiene", "Baby Program", "Quick Wash 20'"],
  "features_de": ["Frontlader-Design", "Made in Europe"],
  "features_en": ["Front-loading design", "Made in Europe"],
  "description_de": "2-3 compelling selling paragraphs in German",
  "description_en": "2-3 compelling selling paragraphs in English",
  "price": "estimated price number in EUR",
  "category": "best fit category",
  "room": "one of: Kitchen,Bathroom,Bedroom,Living Room,Garage,Office,Other"
}}

Rules:
- title: USE UPPERCASE FOR THE PRODUCT NAME (e.g. GORENJE REALSLIM WASCHMASCHINE 7KG).
- specs: technical specs as German key:value pairs (Kategorie, Marke, Modell, Energieeffizienz, Kapazität, Schleuderdrehzahl, Tiefe, Funktionen, etc.) — be thorough.
- programs_de/en: operating programs/modes this device has (washing programs, cooking modes, etc.)
- features_de/en: additional notable features.
- description: 2-3 compelling, honest selling paragraphs.
- price: realistic used-market price in EUR (just the number, as string).
- No condition field — condition is chosen by the user, not AI.
"""

        try:
            response = self.client.chat.completions.create(
                model="deepseek-chat",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=1500,
            )

            text = response.choices[0].message.content.strip()
            start = text.find('{')
            end = text.rfind('}')
            if start != -1 and end != -1:
                text = text[start:end+1]

            return json.loads(text.strip())
        except Exception as e:
            import traceback
            print(f"DeepSeek error, falling back: {e}")
            return self._fallback(gemini_result)

    def _fallback(self, gemini_result: dict) -> dict:
        """Fallback if DeepSeek is unavailable — use Gemini data directly."""
        name = gemini_result.get("name", "Product")
        brand = gemini_result.get("brand", "")
        model = gemini_result.get("model", "")
        features = gemini_result.get("visible_features", [])

        # Avoid duplicate brand in title
        if brand and name.lower().startswith(brand.lower()):
            title = name.upper()
        elif brand:
            title = f"{brand} {name}".strip().upper()
        else:
            title = name.upper()

        specs = {}
        if brand: specs["Marke"] = brand
        if model: specs["Modell"] = model
        for feat in features:
            feat_lower = feat.lower()
            if "kg" in feat_lower or "kapazität" in feat_lower:
                specs["Kapazität"] = feat
            elif "rpm" in feat_lower or "u/min" in feat_lower or "schleuder" in feat_lower:
                specs["Schleuderdrehzahl"] = feat
            elif "cm" in feat_lower or "tiefe" in feat_lower or "slim" in feat_lower:
                specs["Tiefe"] = feat
            elif "energie" in feat_lower or "energy" in feat_lower:
                specs["Energieeffizienz"] = feat

        remaining_features = [f for f in features if f not in specs.values()]

        return {
            "title": title,
            "specs": specs,
            "programs_de": [],
            "programs_en": [],
            "features_de": remaining_features,
            "features_en": remaining_features,
            "description_de": f"Zum Verkauf steht {title}. {', '.join(features)}.",
            "description_en": f"For sale is {title}. {', '.join(features)}.",
            "price": gemini_result.get("estimated_price_eur", "TBD"),
            "category": gemini_result.get("category", "Other"),
            "room": gemini_result.get("room", "Other"),
        }


# Lazy singletons
_vision_engine = None
_deepseek_engine = None


def get_vision_engine():
    global _vision_engine
    if _vision_engine is None:
        _vision_engine = VisionEngine()
    return _vision_engine


def get_deepseek_engine():
    global _deepseek_engine
    if _deepseek_engine is None:
        _deepseek_engine = DeepSeekEngine()
    return _deepseek_engine
