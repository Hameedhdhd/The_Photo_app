"""
The Photo App - Premium API
Modular, scalable backend with separated concerns
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import uuid
from pathlib import Path
from dotenv import load_dotenv

from app.services import (
    FileHandler,
    AIService,
    GeocodingService,
    StorageService,
    DatabaseService,
)

# Load from the unified master .env (backend/.env)
load_dotenv(Path(__file__).parent.parent / ".env")

app = FastAPI(
    title="The Photo App API",
    version="2.0.0 - Premium",
    description="Premium marketplace backend with modular architecture"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Models
# ============================================================================

class ListingResponse(BaseModel):
    """Response model for item analysis"""
    title: str
    description: str | None = None
    description_en: str | None = None
    description_de: str | None = None
    price: str
    category: str
    item_id: str | None = None
    image_url: str | None = None
    user_id: str | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class RadiusSearchResult(BaseModel):
    """Result item from radius search"""
    item_id: str
    title: str
    price: str
    address: str | None = None
    image_url: str | None = None
    distance_km: float


# ============================================================================
# Routes
# ============================================================================

@app.get("/")
def read_root():
    """API health check"""
    return {
        "message": "Welcome to The Photo App API",
        "version": "2.0.0",
        "status": "online"
    }


@app.get("/health")
def health_check():
    """Detailed health check with service status"""
    from app.database import supabase
    
    db_status = "connected" if supabase else "disconnected"
    gemini_status = "configured" if os.environ.get("GEMINI_API_KEY") else "missing"
    deepseek_status = "configured" if os.environ.get("DEEPSEEK_API_KEY") else "missing"
    
    return {
        "status": "healthy",
        "database": db_status,
        "ai": {
            "gemini": gemini_status,
            "deepseek": deepseek_status
        },
        "geocoding": "nominatim (openstreetmap) - free, no API key required"
    }


@app.post("/api/analyze-image", response_model=ListingResponse)
async def analyze_image(
    file: UploadFile = File(...),
    user_id: str = Form(None),
    address: str = Form(None)
):
    """
    Analyze image and create marketplace listing
    
    Steps:
    1. Save uploaded file
    2. Analyze with Gemini Vision
    3. Generate description with Deepseek
    4. Geocode address
    5. Upload image to storage
    6. Save to database
    """
    
    print(f"[API] Received: {file.filename}, user={user_id}, address={address}")
    
    file_path = None
    item_id = None
    
    try:
        # Step 1: Save upload
        if not file.filename:
            file.filename = "photo.jpg"
        
        file_path = FileHandler.save_upload(file, file.filename)
        item_id = f"ITEM-{uuid.uuid4().hex[:8].upper()}"
        print(f"[API] File saved: {file_path}, item_id={item_id}")
        
        # Step 2 & 3: AI Analysis
        print("[API] Starting AI analysis...")
        ai_result = AIService.analyze_image(file_path)
        high_conversion_desc = AIService.generate_description(
            title=ai_result.get("title", ""),
            category=ai_result.get("category", ""),
            gemini_desc=ai_result.get("description_en", ""),
            price=ai_result.get("price")
        )
        
        # Step 4: Geocoding
        print("[API] Geocoding address...")
        lat, lng = None, None
        if address:
            lat, lng = GeocodingService.geocode(address)
            if lat and lng:
                print(f"[API] Geocoded: {address} → ({lat}, {lng})")
        
        # Step 5: Upload image
        print("[API] Uploading image...")
        image_url = StorageService.upload_image(file_path, item_id)
        if image_url:
            print(f"[API] Image URL: {image_url}")
        
        # Step 6: Save to database
        print("[API] Saving to database...")
        db_data = {
            "item_id": item_id,
            "title": ai_result.get("title", "Unknown"),
            "description": high_conversion_desc,
            "description_en": ai_result.get("description_en", ""),
            "description_de": ai_result.get("description_de", ""),
            "price": ai_result.get("price", "0"),
            "category": ai_result.get("category", "Other"),
            "status": "draft",
            "address": address,
            "latitude": lat,
            "longitude": lng,
            "image_url": image_url,
            "user_id": user_id
        }
        
        db_saved = DatabaseService.save_item(db_data)
        if db_saved:
            print("[API] Item saved successfully!")
        
        # Return response
        return ListingResponse(
            title=ai_result.get("title", f"Analyzed: {file.filename}"),
            description=high_conversion_desc,
            description_en=ai_result.get("description_en", ""),
            description_de=ai_result.get("description_de", ""),
            price=ai_result.get("price", "0"),
            category=ai_result.get("category", "Other"),
            item_id=item_id,
            image_url=image_url,
            user_id=user_id,
            address=address,
            latitude=lat,
            longitude=lng
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[API ERROR] {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    finally:
        # Cleanup temp file
        if file_path:
            FileHandler.cleanup(file_path)


@app.get("/api/items", response_model=list[RadiusSearchResult])
async def get_items(
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    category: str = Query(None, description="Filter by category"),
):
    """
    Get paginated list of items (optimized for mobile apps)
    
    Example: /api/items?limit=20&offset=0&category=Electronics
    """
    from app.database import supabase
    
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        # Build query with pagination
        query = supabase.table("items").select(
            "item_id, title, price, address, image_url, latitude, longitude, category"
        ).eq("status", "listed").order("created_at", desc=True)
        
        if category and category != "All":
            query = query.eq("category", category)
        
        # Add pagination
        query = query.range(offset, offset + limit - 1)
        
        response = query.execute()
        items = response.data or []
        
        results = [
            RadiusSearchResult(
                item_id=item["item_id"],
                title=item["title"],
                price=item["price"],
                address=item.get("address"),
                image_url=item.get("image_url"),
                distance_km=0  # Not applicable for regular items fetch
            )
            for item in items
        ]
        
        print(f"[API] Fetched {len(results)} items (limit={limit}, offset={offset})")
        return results
    
    except Exception as e:
        print(f"[API ERROR] Items fetch failed: {e}")
        raise HTTPException(status_code=500, detail=f"Fetch failed: {str(e)}")


@app.get("/api/search-radius", response_model=list[RadiusSearchResult])
async def search_radius(
    latitude: float = Query(..., description="Search center latitude"),
    longitude: float = Query(..., description="Search center longitude"),
    radius_km: float = Query(25.0, description="Search radius in kilometers"),
    category: str = Query(None, description="Filter by category"),
    min_price: float = Query(None, description="Minimum price"),
    max_price: float = Query(None, description="Maximum price"),
):
    """
    Search for items within a radius using PostGIS
    
    Example: /api/search-radius?latitude=53.5511&longitude=9.9936&radius_km=25
    """
    from app.database import supabase
    
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        # Build the PostGIS SQL query
        radius_meters = radius_km * 1000  # Convert km to meters
        
        # Query using Supabase RPC with PostGIS
        # Since Supabase REST doesn't support PostGIS functions directly,
        # we'll use a stored procedure approach or raw SQL via the query endpoint
        
        # For now, we'll fetch all items and filter in Python (suboptimal but works)
        # In production, you'd create a PostgreSQL function
        
        response = supabase.table("items").select(
            "item_id, title, price, address, image_url, latitude, longitude"
        ).eq("status", "listed").execute()
        
        items = response.data
        results = []
        
        for item in items:
            if item.get("latitude") and item.get("longitude"):
                # Simple distance calculation (Haversine formula)
                from math import radians, cos, sin, asin, sqrt
                
                lat1, lon1 = radians(latitude), radians(longitude)
                lat2, lon2 = radians(item["latitude"]), radians(item["longitude"])
                
                dlat = lat2 - lat1
                dlon = lon2 - lon1
                a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
                c = 2 * asin(sqrt(a))
                r = 6371  # Earth's radius in km
                distance = c * r
                
                if distance <= radius_km:
                    # Apply additional filters
                    if category and item.get("category") != category:
                        continue
                    
                    if min_price and float(item.get("price", 0)) < min_price:
                        continue
                    
                    if max_price and float(item.get("price", 0)) > max_price:
                        continue
                    
                    results.append(RadiusSearchResult(
                        item_id=item["item_id"],
                        title=item["title"],
                        price=item["price"],
                        address=item.get("address"),
                        image_url=item.get("image_url"),
                        distance_km=round(distance, 2)
                    ))
        
        # Sort by distance
        results.sort(key=lambda x: x.distance_km)
        
        print(f"[API] Radius search: center=({latitude},{longitude}), radius={radius_km}km, results={len(results)}")
        
        return results
        
    except Exception as e:
        print(f"[API ERROR] Radius search failed: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


# ============================================================================
# Startup
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
