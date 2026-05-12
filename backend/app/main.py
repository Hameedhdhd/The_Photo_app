from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import shutil
from dotenv import load_dotenv

# Load backend environment variables
load_dotenv()

app = FastAPI(title="The Photo App API", version="1.0.0")

# Enable CORS for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ListingResponse(BaseModel):
    title: str
    description: str
    price: str
    category: str
    image_url: str | None = None

@app.get("/")
def read_root():
    return {"message": "Welcome to The Photo App API"}

@app.post("/api/analyze-image", response_model=ListingResponse)
async def analyze_image(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    # Save the file temporarily
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    file_path = os.path.join(temp_dir, file.filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Call the actual Vision API
        # Only import and instantiate if we are not mocking
        
        # If no API key is set, return mock data to prevent crashing
        if not os.environ.get("GEMINI_API_KEY"):
            return ListingResponse(
                title=f"Mock AI: {file.filename}",
                description="Please set GEMINI_API_KEY to see real AI results. This is mock data.",
                price="45 EUR",
                category="Electronics",
                image_url=None
            )
            
        from app.vision import vision_engine
        ai_result = vision_engine.analyze_image(file_path)
        
        # Format the response
        response_data = ListingResponse(
            title=ai_result.get("title", f"Analyzed: {file.filename}"),
            description=ai_result.get("description", "No description generated."),
            price=ai_result.get("price", "TBD"),
            category=ai_result.get("category", "Uncategorized"),
            image_url=None
        )
        
        # Save to database if connected
        from app.database import supabase
        if supabase:
            try:
                # We don't have user_auth yet, so we insert anonymously for now
                db_data = {
                    "title": response_data.title,
                    "description": response_data.description,
                    "price": response_data.price,
                    "category": response_data.category,
                    "status": "draft"
                }
                # This assumes an 'items' table exists in your Supabase database
                supabase.table("items").insert(db_data).execute()
                print("Successfully saved analyzed item to Supabase!")
            except Exception as db_err:
                # We catch the error so the API doesn't fail if the table isn't created yet
                print(f"Warning: Could not save to database. Have you created the 'items' table? Error: {db_err}")

        return response_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up temporary file
        if os.path.exists(file_path):
            os.remove(file_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
