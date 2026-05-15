"""
Description Engine: Uses Deepseek API to generate high-conversion product descriptions.
This module integrates with Gemini's visual analysis results to produce compelling listings.
"""

import os
import json
import httpx
from typing import Dict, Optional

class DescriptionEngine:
    """
    Generates product descriptions using Deepseek V3 API.
    The formula is customizable to match marketplace best practices.
    """
    
    def __init__(self):
        self.api_key = os.environ.get("DEEPSEEK_API_KEY")
        self.base_url = "https://api.deepseek.com/v1/chat/completions"
        self._initialized = False
        
        if self.api_key:
            self._initialized = True
        else:
            print("Warning: DEEPSEEK_API_KEY not set. Description generation will use fallback.")
    
    def generate_description(
        self, 
        title: str,
        category: str,
        gemini_description: str,
        price: Optional[str] = None
    ) -> str:
        """
        Generate a high-conversion description using Deepseek.
        
        Args:
            title: Product title from Gemini
            category: Product category
            gemini_description: Basic description from Gemini
            price: Suggested price (optional)
            
        Returns:
            High-conversion product description
        """
        if not self._initialized:
            # Fallback: return Gemini description with formatting
            return self._fallback_description(title, gemini_description, price)
        
        # Build the prompt with your formula
        prompt = self._build_prompt(title, category, gemini_description, price)
        
        try:
            response = httpx.post(
                self.base_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "deepseek-chat",
                    "messages": [
                        {"role": "system", "content": "You are an expert copywriter for online marketplaces. You create compelling, conversion-focused product descriptions."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 500
                },
                timeout=30.0
            )
            response.raise_for_status()
            
            result = response.json()
            description = result["choices"][0]["message"]["content"].strip()
            
            return description
            
        except httpx.HTTPError as e:
            print(f"Deepseek API error: {e}")
            return self._fallback_description(title, gemini_description, price)
        except Exception as e:
            print(f"Error generating description: {e}")
            return self._fallback_description(title, gemini_description, price)
    
    def _build_prompt(
        self,
        title: str,
        category: str,
        gemini_description: str,
        price: Optional[str] = None
    ) -> str:
        """
        Build the prompt for Deepseek using the high-conversion formula.
        
        FORMULA:
        1. Hook - Grab attention in the first line
        2. Benefits - What problem does it solve? What value does it provide?
        3. Features - Key specifications and details
        4. Condition - Honest assessment of item condition
        5. Call to Action - Why buy now?
        """
        
        price_line = f"Price: {price}\n" if price else ""
        
        prompt = f"""Create a high-conversion product description for a marketplace listing.

PRODUCT DETAILS:
Title: {title}
Category: {category}
{price_line}Base Analysis: {gemini_description}

YOUR FORMULA:
1. **Hook** (1 sentence): Start with a compelling reason to buy this item
2. **Benefits** (2-3 sentences): Explain what problem this solves and the value it provides
3. **Features** (bullet list): List 3-5 key specifications or details
4. **Condition** (1-2 sentences): Honest description of the item's condition
5. **Call to Action** (1 sentence): Why should someone buy this NOW?

REQUIREMENTS:
- Keep it conversational but professional
- Use bullet points for features
- Be honest about condition (don't oversell)
- End with urgency or value proposition
- Write in a tone that builds trust
- Length: 200-300 words total

Generate ONLY the description, no additional text or formatting."""
        
        return prompt
    
    def _fallback_description(
        self,
        title: str,
        gemini_description: str,
        price: Optional[str] = None
    ) -> str:
        """
        Fallback description when Deepseek is unavailable.
        Formats Gemini's output into a structured listing.
        """
        
        price_line = f"\n💰 **Price:** {price}" if price else ""
        
        return f"""**{title}**

{gemini_description}{price_line}

✅ Ready for pickup!

Contact me if you're interested or have questions."""


# Lazy singleton
_description_engine = None

def get_description_engine() -> DescriptionEngine:
    """Get or create the DescriptionEngine singleton."""
    global _description_engine
    if _description_engine is None:
        _description_engine = DescriptionEngine()
    return _description_engine