"""
Geocoding Service
Converts addresses to geographic coordinates using Nominatim
"""

import requests


class GeocodingService:
    """Handles address to coordinates conversion"""
    
    NOMINATIM_API = "https://nominatim.openstreetmap.org/search"
    
    @staticmethod
    def geocode(address: str) -> tuple:
        """
        Convert address string to latitude and longitude
        
        Args:
            address: Address string to geocode
            
        Returns:
            tuple: (latitude, longitude) or (None, None) if failed
        """
        if not address or address.strip() == "":
            return None, None
        
        try:
            response = requests.get(
                GeocodingService.NOMINATIM_API,
                params={
                    "q": address,
                    "format": "json",
                    "limit": 1
                },
                headers={"User-Agent": "ListItFast/1.0"},
                timeout=8
            )
            
            if response.status_code != 200:
                return None, None
            
            data = response.json()
            if not data:
                return None, None
            
            lat = float(data[0]["lat"])
            lng = float(data[0]["lon"])
            
            return lat, lng
            
        except Exception as e:
            print(f"Geocoding error for '{address}': {e}")
            return None, None
