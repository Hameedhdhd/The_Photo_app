from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import uuid
import shutil
from dotenv import load_dotenv

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
    description: str | None = None
    description_en: str | None = None  # Deprecated, kept for compatibility
    description_de: str | None = None  # Deprecated, kept for compatibility
    price: str
    category: str
    item_id: str | None = None
    image_url: str | None = None
    user_id: str | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None

@app.get("/")
def read_root():
    return {"message": "Welcome to The Photo App API", "version": "2.0.0", "status": "online"}

@app.get("/health")
def health_check():
    from app.database import supabase
    db_status = "connected" if supabase else "disconnected"
    gemini_status = "configured" if os.environ.get("GEMINI_API_KEY") else "missing"
    deepseek_status = "configured" if os.environ.get("DEEPSEEK_API_KEY") else "missing (using Gemini fallback)"
    maps_status = "configured" if os.environ.get("GOOGLE_MAPS_API_KEY") else "missing"
    return {
        "status": "healthy",
        "database": db_status,
        "ai": {"gemini": gemini_status, "deepseek": deepseek_status},
        "maps": maps_status,
    }

@app.post("/api/analyze-image", response_model=ListingResponse)
async def analyze_image(
    file: UploadFile = File(...),
    user_id: str = Form(None),
    address: str = Form(None)
):
    print(f"Received upload: filename={file.filename}, content_type={file.content_type}, user_id={user_id}, address={address}")
    
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
                description="Please set GEMINI_API_KEY to see real AI results. This is mock data.",
                description_en="Please set GEMINI_API_KEY to see real AI results. This is mock data.",
                description_de="Bitte GEMINI_API_KEY setzen, um echte KI-Ergebnisse zu sehen. Dies sind Testdaten.",
                price="45 EUR",
                category="Electronics",
                item_id=f"ITEM-{uuid.uuid4().hex[:8].upper()}",
                image_url=None,
                user_id=user_id,
                address=address,
                latitude=None,
                longitude=None
            )
        else:
            from app.vision import get_vision_engine
            from app.description_engine import get_description_engine
            
            vision_engine = get_vision_engine()
            description_engine = get_description_engine()
            
            if not vision_engine:
                raise HTTPException(status_code=500, detail="AI engine not initialized. Check GEMINI_API_KEY.")
            
            # Step 1: Gemini analyzes the image
            ai_result = vision_engine.analyze_image(file_path)
            
            # Step 2: Deepseek generates high-conversion description
            gemini_base_desc = ai_result.get("description_en", "")
            high_conversion_desc = description_engine.generate_description(
                title=ai_result.get("title", ""),
                category=ai_result.get("category", ""),
                gemini_description=gemini_base_desc,
                price=ai_result.get("price")
            )

            # Geocode address if provided
            lat, lng = None, None
            if address:
                try:
                    import requests
                    geocode_url = f"https://maps.googleapis.com/maps/api/geocode/json"
                    params = {
                        "address": address,
                        "key": os.environ.get("GOOGLE_MAPS_API_KEY", "")
                    }
                    geo_response = requests.get(geocode_url, params=params, timeout=5)
                    if geo_response.status_code == 200:
                        geo_data = geo_response.json()
                        if geo_data.get("results"):
                            location = geo_data["results"][0]["geometry"]["location"]
                            lat = location.get("lat")
                            lng = location.get("lng")
                except Exception as geocode_err:
                    print(f"Warning: Could not geocode address: {geocode_err}")

            response_data = ListingResponse(
                title=ai_result.get("title", f"Analyzed: {file.filename}"),
                description=high_conversion_desc,
                description_en=ai_result.get("description_en", "No description generated."),
                description_de=ai_result.get("description_de", "Keine Beschreibung erstellt."),
                price=ai_result.get("price", "TBD"),
                category=ai_result.get("category", "Uncategorized"),
                item_id=f"ITEM-{uuid.uuid4().hex[:8].upper()}",
                image_url=None,
                user_id=user_id,
                address=address,
                latitude=lat,
                longitude=lng
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
                    "description": response_data.description,
                    "description_en": response_data.description_en,
                    "description_de": response_data.description_de,
                    "price": response_data.price,
                    "category": response_data.category,
                    "item_id": response_data.item_id,
                    "status": "draft",  # draft until user confirms listing
                    "image_url": image_public_url,
                }
                if user_id:
                    db_data["user_id"] = user_id
                if response_data.address:
                    db_data["address"] = response_data.address
                if response_data.latitude is not None:
                    db_data["latitude"] = response_data.latitude
                if response_data.longitude is not None:
                    db_data["longitude"] = response_data.longitude

                supabase.table("items").insert(db_data).execute()
                print(f"Successfully saved item to items table!")
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)