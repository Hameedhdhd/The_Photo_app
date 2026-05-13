from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import uuid
import shutil
from dotenv import load_dotenv
from app.auth import get_current_user, get_optional_user

load_dotenv()

app = FastAPI(title="The Photo App API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VALID_ROOMS = ['Kitchen', 'Bathroom', 'Bedroom', 'Living Room', 'Garage', 'Office', 'Other']

class ListingResponse(BaseModel):
    title: str
    description_en: str
    description_de: str
    price: str
    category: str
    room: str | None = None
    item_id: str | None = None
    image_url: str | None = None
    user_id: str | None = None

class ItemResponse(BaseModel):
    """Response model for a single item from the database."""
    id: Optional[int] = None
    item_id: Optional[str] = None
    title: Optional[str] = None
    description_en: Optional[str] = None
    description_de: Optional[str] = None
    price: Optional[str] = None
    category: Optional[str] = None
    room: Optional[str] = None
    image_url: Optional[str] = None
    user_id: Optional[str] = None
    status: Optional[str] = None
    listing_status: Optional[str] = None
    listed_at: Optional[str] = None
    listing_url: Optional[str] = None
    favorite: Optional[bool] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class ItemListResponse(BaseModel):
    """Response model for listing items."""
    items: list[ItemResponse]
    total: int

class MarkListedRequest(BaseModel):
    """Request body for marking an item as listed."""
    platform: str = "kleinanzeigen"
    listing_url: Optional[str] = None

@app.get("/")
def read_root():
    return {"message": "Welcome to The Photo App API"}

@app.post("/api/analyze-image", response_model=ListingResponse)
async def analyze_image(
    file: UploadFile = File(...),
    room: str = Form(None),
    user_id: str = Form(None)
):
    print(f"Received upload: filename={file.filename}, content_type={file.content_type}, room={room}, user_id={user_id}")
    
    if not file.filename:
        # Set a default filename if none provided (common on web uploads)
        file.filename = "photo.jpg"
        print("No filename provided, using default: photo.jpg")

    # Security: Use UUID-based filename to prevent path traversal and race conditions
    safe_filename = f"{uuid.uuid4().hex}_{os.path.basename(file.filename)}"
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    file_path = os.path.join(temp_dir, safe_filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        if not os.environ.get("GEMINI_API_KEY"):
            response_data = ListingResponse(
                title=f"Mock AI: {file.filename}",
                description_en="Please set GEMINI_API_KEY to see real AI results. This is mock data.",
                description_de="Bitte GEMINI_API_KEY setzen, um echte KI-Ergebnisse zu sehen. Dies sind Testdaten.",
                price="45 EUR",
                category="Electronics",
                room=room,
                item_id=f"ITEM-{uuid.uuid4().hex[:8].upper()}",
                image_url=None,
                user_id=user_id
            )
        else:
            from app.vision import get_vision_engine
            vision_engine = get_vision_engine()
            if not vision_engine:
                raise HTTPException(status_code=500, detail="AI engine not initialized. Check GEMINI_API_KEY.")
            ai_result = vision_engine.analyze_image(file_path)

            # Use AI-suggested room if user didn't pick one or picked "Other"
            ai_room = ai_result.get("room", "Other")
            if ai_room not in VALID_ROOMS:
                ai_room = "Other"
            final_room = room if room and room != "Other" else ai_room

            response_data = ListingResponse(
                title=ai_result.get("title", f"Analyzed: {file.filename}"),
                description_en=ai_result.get("description_en", "No description generated."),
                description_de=ai_result.get("description_de", "Keine Beschreibung erstellt."),
                price=ai_result.get("price", "TBD"),
                category=ai_result.get("category", "Uncategorized"),
                room=final_room,
                item_id=f"ITEM-{uuid.uuid4().hex[:8].upper()}",
                image_url=None,
                user_id=user_id
            )

        # Upload image to Supabase Storage and save item to database
        from app.database import supabase
        image_public_url = None
        
        if supabase:
            try:
                # Upload image to Supabase Storage
                storage_path = f"{response_data.item_id}.jpg"
                with open(file_path, "rb") as img_file:
                    supabase.storage.from_("item_images").upload(
                        storage_path,
                        img_file,
                        {"content-type": "image/jpeg", "upsert": "true"}
                    )
                # Get public URL
                image_public_url = supabase.storage.from_("item_images").get_public_url(storage_path)
                print(f"Image uploaded: {image_public_url}")
                # Update the response with the image URL
                response_data.image_url = image_public_url
            except Exception as storage_err:
                print(f"Warning: Could not upload image to storage. Error: {storage_err}")
            
            try:
                db_data = {
                    "title": response_data.title,
                    "description_en": response_data.description_en,
                    "description_de": response_data.description_de,
                    "price": response_data.price,
                    "category": response_data.category,
                    "room": response_data.room,
                    "item_id": response_data.item_id,
                    "status": "draft",
                    "image_url": image_public_url,
                }
                if user_id:
                    db_data["user_id"] = user_id

                supabase.table("items").insert(db_data).execute()
                print(f"Successfully saved item for user {user_id or 'anonymous'} in room {room or 'none'}!")
            except Exception as db_err:
                print(f"Warning: Could not save to database. Error: {db_err}")

        return response_data

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error during image analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    finally:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass

# ============================================================
# Chrome Extension API Endpoints
# These endpoints are used by the Kleinanzeigen Sync Chrome Extension
# to fetch items and mark them as listed on marketplaces.
# ============================================================

@app.get("/api/items", response_model=ItemListResponse)
async def list_items(
    user: dict = Depends(get_current_user),
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
):
    """
    List all items for the authenticated user.
    Optionally filter by listing_status.
    Used by the Chrome Extension to show available items.
    """
    from app.database import supabase
    
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user token")
    
    try:
        query = supabase.table("items").select("*").eq("user_id", user_id)
        
        if status:
            query = query.eq("listing_status", status)
        
        query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
        
        result = query.execute()
        items = result.data or []
        
        # Get total count
        count_query = supabase.table("items").select("item_id", count="exact").eq("user_id", user_id)
        if status:
            count_query = count_query.eq("listing_status", status)
        count_result = count_query.execute()
        total = count_result.count if hasattr(count_result, 'count') and count_result.count else len(items)
        
        return ItemListResponse(items=items, total=total)
        
    except Exception as e:
        print(f"Error listing items: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list items: {str(e)}")


@app.get("/api/items/{item_id}", response_model=ItemResponse)
async def get_item(
    item_id: str,
    user: dict = Depends(get_current_user),
):
    """
    Get a single item by item_id.
    Only returns items belonging to the authenticated user.
    Used by the Chrome Extension to get item details for form filling.
    """
    from app.database import supabase
    
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user token")
    
    try:
        result = supabase.table("items").select("*").eq("item_id", item_id).eq("user_id", user_id).execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=404, detail=f"Item {item_id} not found")
        
        item = result.data[0]
        return ItemResponse(**item)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting item {item_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get item: {str(e)}")


@app.patch("/api/items/{item_id}/mark-listed", response_model=ItemResponse)
async def mark_item_listed(
    item_id: str,
    request: MarkListedRequest,
    user: dict = Depends(get_current_user),
):
    """
    Mark an item as listed on a marketplace (e.g., Kleinanzeigen).
    Updates the listing_status, listed_at timestamp, and optional listing_url.
    """
    from app.database import supabase
    
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user token")
    
    try:
        # First verify the item belongs to this user
        check = supabase.table("items").select("item_id").eq("item_id", item_id).eq("user_id", user_id).execute()
        if not check.data or len(check.data) == 0:
            raise HTTPException(status_code=404, detail=f"Item {item_id} not found")
        
        # Build update data
        listing_status = f"listed_{request.platform}"
        update_data = {
            "listing_status": listing_status,
            "listed_at": "now()",
            "updated_at": "now()",
        }
        if request.listing_url:
            update_data["listing_url"] = request.listing_url
        
        # Update the item
        result = supabase.table("items").update(update_data).eq("item_id", item_id).eq("user_id", user_id).execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=500, detail="Failed to update item")
        
        # Fetch the updated item to return
        updated = supabase.table("items").select("*").eq("item_id", item_id).execute()
        item = updated.data[0] if updated.data else result.data[0]
        
        return ItemResponse(**item)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error marking item {item_id} as listed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to mark item as listed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
