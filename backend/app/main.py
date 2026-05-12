from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
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

class ListingResponse(BaseModel):
    title: str
    description_en: str
    description_de: str
    price: str
    category: str
    room: str | None = None
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
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    file_path = os.path.join(temp_dir, file.filename)

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
                image_url=None,
                user_id=user_id
            )
        else:
            from app.vision import vision_engine
            ai_result = vision_engine.analyze_image(file_path)

            response_data = ListingResponse(
                title=ai_result.get("title", f"Analyzed: {file.filename}"),
                description_en=ai_result.get("description_en", "No description generated."),
                description_de=ai_result.get("description_de", "Keine Beschreibung erstellt."),
                price=ai_result.get("price", "TBD"),
                category=ai_result.get("category", "Uncategorized"),
                room=room,
                image_url=None,
                user_id=user_id
            )

        # Save to Supabase with user_id and room
        from app.database import supabase
        if supabase:
            try:
                db_data = {
                    "title": response_data.title,
                    "description_en": response_data.description_en,
                    "description_de": response_data.description_de,
                    "price": response_data.price,
                    "category": response_data.category,
                    "room": response_data.room,
                    "status": "draft",
                }
                if user_id:
                    db_data["user_id"] = user_id

                supabase.table("items").insert(db_data).execute()
                print(f"Successfully saved item for user {user_id or 'anonymous'} in room {room or 'none'}!")
            except Exception as db_err:
                print(f"Warning: Could not save to database. Error: {db_err}")

        return response_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
