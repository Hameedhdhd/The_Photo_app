"""
Database Service
Handles item persistence in Supabase
"""

from app.database import supabase


class DatabaseService:
    """Manages item database operations"""
    
    TABLE_NAME = "items"
    
    @staticmethod
    def save_item(item_data: dict) -> bool:
        """
        Save item to database
        
        Args:
            item_data: Dictionary with item fields
            
        Returns:
            True if successful, False otherwise
        """
        if not supabase:
            return False
        
        try:
            supabase.table(DatabaseService.TABLE_NAME).insert([item_data]).execute()
            return True
        except Exception as e:
            print(f"Database save error: {e}")
            return False
