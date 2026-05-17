"""
File Handler Service
Manages file uploads and temporary file handling
"""

import os
import uuid
import shutil
from pathlib import Path


class FileHandler:
    """Handles file uploads and temporary file management"""
    
    TEMP_DIR = "temp_uploads"
    
    @staticmethod
    def ensure_temp_dir():
        """Create temp directory if it doesn't exist"""
        os.makedirs(FileHandler.TEMP_DIR, exist_ok=True)
    
    @staticmethod
    def save_upload(file, filename: str = None) -> str:
        """
        Save uploaded file to temporary location
        
        Args:
            file: File object from request
            filename: Optional filename override
            
        Returns:
            Path to saved file
        """
        FileHandler.ensure_temp_dir()
        
        if not filename or filename.strip() == "":
            filename = "photo.jpg"
        
        # Generate unique filename to prevent collisions
        safe_filename = f"{uuid.uuid4().hex}_{os.path.basename(filename)}"
        file_path = os.path.join(FileHandler.TEMP_DIR, safe_filename)
        
        # Write file to disk
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return file_path
    
    @staticmethod
    def cleanup(file_path: str) -> None:
        """
        Delete temporary file
        
        Args:
            file_path: Path to file to delete
        """
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass  # File may have already been deleted
