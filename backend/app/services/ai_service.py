"""
AI Analysis Service
Handles Gemini vision analysis and Deepseek description generation
"""

from app.vision import get_vision_engine
from app.description_engine import get_description_engine


class AIService:
    """Orchestrates AI analysis workflow"""
    
    @staticmethod
    def analyze_image(file_path: str) -> dict:
        """
        Analyze image with Gemini Vision
        
        Args:
            file_path: Path to image file
            
        Returns:
            dict with title, description_en, description_de, price, category
        """
        vision_engine = get_vision_engine()
        if not vision_engine:
            return {
                "title": "No AI Key",
                "description_en": "Please set GEMINI_API_KEY",
                "description_de": "Bitte GEMINI_API_KEY setzen",
                "price": "0",
                "category": "Unknown"
            }
        
        return vision_engine.analyze_image(file_path)
    
    @staticmethod
    def generate_description(title: str, category: str, gemini_desc: str, price: str = None) -> str:
        """
        Generate high-conversion product description using Deepseek
        
        Args:
            title: Product title
            category: Product category
            gemini_desc: Base description from Gemini
            price: Product price (optional)
            
        Returns:
            High-conversion description
        """
        description_engine = get_description_engine()
        if not description_engine:
            return gemini_desc
        
        return description_engine.generate_description(
            title=title,
            category=category,
            gemini_description=gemini_desc,
            price=price
        )
