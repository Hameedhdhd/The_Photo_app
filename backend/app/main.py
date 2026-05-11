from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import shutil

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
        from app.vision import vision_engine
        
        # If no API key is set, return mock data to prevent crashing
        if not os.environ.get("OPENAI_API_KEY"):
            return ListingResponse(
                title=f"Mock AI: {file.filename}",
                description="Please set OPENAI_API_KEY to see real AI results. This is mock data.",
                price="45 EUR",
                category="Electronics",
                image_url=None
            )
            
        ai_result = vision_engine.analyze_image(file_path)
        
        return ListingResponse(
            title=ai_result.get("title", f"Analyzed: {file.filename}"),
            description=ai_result.get("description", "No description generated."),
            price=ai_result.get("price", "TBD"),
            category=ai_result.get("category", "Uncategorized"),
            image_url=None
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up temporary file
        if os.path.exists(file_path):
            os.remove(file_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
