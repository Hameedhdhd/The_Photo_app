"""
Storage Service
Manages image uploads to Supabase Storage
"""

from app.database import supabase


class StorageService:
    """Handles image storage in Supabase"""
    
    BUCKET_NAME = "item_images"
    
    @staticmethod
    def upload_image(file_path: str, item_id: str) -> str:
        """
        Upload image to Supabase Storage
        
        Args:
            file_path: Path to image file
            item_id: Item ID for storage key
            
        Returns:
            Public URL of uploaded image, or None if failed
        """
        if not supabase:
            return None
        
        try:
            storage_path = f"{item_id}.jpg"
            
            with open(file_path, "rb") as img_file:
                supabase.storage.from_(StorageService.BUCKET_NAME).upload(
                    storage_path,
                    img_file,
                    {"content-type": "image/jpeg", "upsert": "true"}
                )
            
            # Get public URL
            public_url = supabase.storage.from_(StorageService.BUCKET_NAME).get_public_url(storage_path)
            return public_url
            
        except Exception as e:
            print(f"Storage upload error: {e}")
            return None
