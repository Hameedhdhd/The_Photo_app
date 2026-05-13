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
    description_en: str
    description_de: str
    price: str
    category: str
    room: str | None = None
    item_id: str | None = None
    image_url: str | None = None
    user_id: str | None = None

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)