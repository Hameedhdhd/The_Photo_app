from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json
import os
import re
import uuid
import shutil
from dotenv import load_dotenv
from app.auth import get_current_user, get_optional_user

load_dotenv()

app = FastAPI(title="The Photo App API", version="1.0.0")

# ============================================================
# Description Formatting - Single source of truth
# Used by API responses, Chrome extension, and frontend preview
# ============================================================

def dedup_brand_in_title(title: str) -> str:
    """Remove duplicate brand at start of title (e.g., 'Gorenje Gorenje X' → 'Gorenje X')."""
    if not title:
        return title
    parts = title.split(None, 1)  # Split on first whitespace
    if len(parts) >= 2:
        first_word = parts[0]
        rest = parts[1]
        if rest.lower().startswith(first_word.lower()):
            return rest
    return title

def detect_brand(title: str) -> str:
    brands = r'\b(Philips|Bosch|Siemens|Samsung|LG|Sony|Panasonic|JBL|Bose|Apple|Dyson|Nespresso|De\'Longhi|Melitta|Krups|AEG|Miele|Liebherr|Grundig|Technics|Pioneer|Yamaha|Harman|Kardon|Beats|Sennheiser|AKG|Shure|Lenovo|Dell|HP|Asus|Acer|Microsoft|Google|Nokia|Motorola|OnePlus|Xiaomi|Huawei|Gorenje|Bauknecht|Haier|Beko|Candy|Indesit|Whirlpool|Zanussi|Tefal|Rowenta|Braun|Jura|Severin|Clatronic|Kärcher|Metabo|Bosch|Makita|Hilti|Worx|Ryobi)\b'
    m = re.match(brands, title or '', re.IGNORECASE)
    if m:
        return m.group(1).capitalize()
    return ''

def detect_model(title: str) -> str:
    model_regex = r'\b([A-Z]{1,4}[-]?\d{3,}[A-Z0-9/\-]*)\b'
    for m in re.finditer(model_regex, title or ''):
        candidate = m.group(1)
        if len(candidate) >= 4 and re.search(r'\d', candidate):
            return candidate
    return ''

def format_description(title: str, description_de: str, description_en: str,
                       specs: dict = None, programs_de: list = None, programs_en: list = None,
                       features_de: list = None, features_en: list = None,
                       condition: str = None, category: str = None) -> str:
    """Build the professional bilingual Kleinanzeigen description."""
    title_upper = (title or 'UNTITLED').upper()
    desc_de = (description_de or '').strip()
    desc_en = (description_en or '').strip()
    brand = detect_brand(title or '')
    model = detect_model(title or '')
    specs = specs or {}
    programs_de = programs_de or []
    programs_en = programs_en or []
    features_de = features_de or []
    features_en = features_en or []

    # German spec lines
    de_specs = []
    if category: de_specs.append(f'▸ Kategorie: {category}')
    if brand: de_specs.append(f'▸ Marke: {brand}')
    if model: de_specs.append(f'▸ Modell: {model}')
    for k, v in specs.items():
        # Skip Marke/Modell if already shown above
        if k in ('Marke', 'Modell') and (brand or model):
            continue
        de_specs.append(f'▸ {k}: {v}')

    # English spec lines
    en_specs = []
    if category: en_specs.append(f'▸ Category: {category}')
    if brand: en_specs.append(f'▸ Brand: {brand}')
    if model: en_specs.append(f'▸ Model: {model}')
    for k, v in specs.items():
        # Skip Marke/Modell if already shown above
        if k in ('Marke', 'Modell') and (brand or model):
            continue
        en_key = {'Kapazität': 'Capacity', 'Tiefe': 'Depth', 'Schleuderdrehzahl': 'Spin Speed',
                  'Energieeffizienz': 'Energy Efficiency', 'Leistung': 'Power', 'Gewicht': 'Weight',
                  'Größe': 'Size', 'Farbe': 'Color', 'Material': 'Material',
                  'Funktionen': 'Features', 'Zustand': 'Condition'}.get(k, k)
        en_specs.append(f'▸ {en_key}: {v}')

    # Assemble German section
    result = f'✦ {title_upper} ✦\n\n'
    if de_specs: result += '\n'.join(de_specs) + '\n\n'
    if desc_de: result += desc_de + '\n\n'
    if programs_de:
        result += 'Programme & Funktionen:\n'
        for p in programs_de:
            result += f'• {p}\n'
        result += '\n'
    if features_de:
        result += 'Weitere Merkmale:\n'
        for f in features_de:
            result += f'• {f}\n'
        result += '\n'
    if condition:
        # Translate condition for German section
        de_condition = {'Neuwertig': 'Neuwertig', 'Sehr Gut': 'Sehr Gut', 'Gut': 'Gut', 'Fair': 'Akzeptabel', 'Defekt': 'Defekt'}.get(condition, condition)
        result += f'Zustand: {de_condition}\n\n'
    result += 'Privatverkauf: Keine Garantie, Gewährleistung oder Rücknahme.'

    # Separator
    result += '\n\n─────────────────────────────────\n\n'

    # Assemble English section
    result += f'✦ {title_upper} ✦\n\n'
    if en_specs: result += '\n'.join(en_specs) + '\n\n'
    if desc_en: result += desc_en + '\n\n'
    if programs_en:
        result += 'Programs & Functions:\n'
        for p in programs_en:
            result += f'• {p}\n'
        result += '\n'
    if features_en:
        result += 'Additional Features:\n'
        for f in features_en:
            result += f'• {f}\n'
        result += '\n'
    if condition:
        en_condition = {'Neuwertig': 'Like New', 'Sehr Gut': 'Very Good', 'Gut': 'Good', 'Fair': 'Fair', 'Defekt': 'For Part'}.get(condition, condition)
        result += f'Condition: {en_condition}\n\n'
    result += 'Private sale: No warranty, guarantee, or returns.'

    return result.strip()


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
    formatted_description: str
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
    formatted_description: Optional[str] = None
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

class FormatDescriptionRequest(BaseModel):
    """Request body for formatting a description."""
    title: str
    description_de: str
    description_en: str
    specs: Optional[dict] = None
    programs_de: Optional[list] = None
    programs_en: Optional[list] = None
    features_de: Optional[list] = None
    features_en: Optional[list] = None
    condition: Optional[str] = None
    category: Optional[str] = None

class FormatDescriptionResponse(BaseModel):
    formatted_description: str

class MarkListedRequest(BaseModel):
    """Request body for marking an item as listed."""
    platform: str = "kleinanzeigen"
    listing_url: Optional[str] = None

@app.post("/api/format-description", response_model=FormatDescriptionResponse)
async def format_description_endpoint(request: FormatDescriptionRequest):
    """Format a description for Kleinanzeigen. Single source of truth for formatting."""
    return FormatDescriptionResponse(
        formatted_description=format_description(
            request.title, request.description_de, request.description_en,
            specs=request.specs, programs_de=request.programs_de, programs_en=request.programs_en,
            features_de=request.features_de, features_en=request.features_en,
            condition=request.condition, category=request.category
        )
    )

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
            _title = f"Mock AI: {file.filename}"
            _desc_en = "Please set GEMINI_API_KEY to see real AI results. This is mock data."
            _desc_de = "Bitte GEMINI_API_KEY setzen, um echte KI-Ergebnisse zu sehen. Dies sind Testdaten."
            response_data = ListingResponse(
                title=_title,
                description_en=_desc_en,
                description_de=_desc_de,
                formatted_description=format_description(_title, _desc_de, _desc_en),
                price="45 EUR",
                category="Electronics",
                room=room,
                item_id=f"ITEM-{uuid.uuid4().hex[:8].upper()}",
                image_url=None,
                user_id=user_id
            )
        else:
            from app.vision import get_vision_engine, get_deepseek_engine
            vision_engine = get_vision_engine()
            if not vision_engine:
                raise HTTPException(status_code=500, detail="AI engine not initialized. Check GEMINI_API_KEY.")

            # Step 1: Gemini identifies the product from image
            gemini_result = vision_engine.analyze_image(file_path)
            print(f"Gemini identification: {json.dumps(gemini_result, ensure_ascii=False)[:200]}")

            # Step 2: DeepSeek generates rich listing text
            deepseek_engine = get_deepseek_engine()
            ai_result = deepseek_engine.generate_listing(gemini_result)
            print(f"DeepSeek listing generated: {ai_result.get('title', 'no title')}")

            # Use AI-suggested room if user didn't pick one or picked "Other"
            ai_room = ai_result.get("room", gemini_result.get("room", "Other"))
            if ai_room not in VALID_ROOMS:
                ai_room = "Other"
            final_room = room if room and room != "Other" else ai_room

            _title = dedup_brand_in_title(ai_result.get("title", gemini_result.get("name", f"Analyzed: {file.filename}")))
            _desc_en = ai_result.get("description_en", "No description generated.")
            _desc_de = ai_result.get("description_de", "Keine Beschreibung erstellt.")
            _category = ai_result.get("category", gemini_result.get("category", "Uncategorized"))
            _specs = ai_result.get("specs", {})
            _programs_de = ai_result.get("programs_de", [])
            _programs_en = ai_result.get("programs_en", [])
            _features_de = ai_result.get("features_de", [])
            _features_en = ai_result.get("features_en", [])
            # Ensure price is always a string
            _price = str(ai_result.get("price") or gemini_result.get("estimated_price_eur") or "TBD")
            response_data = ListingResponse(
                title=_title,
                description_en=_desc_en,
                description_de=_desc_de,
                formatted_description=format_description(
                    _title, _desc_de, _desc_en,
                    specs=_specs, programs_de=_programs_de, programs_en=_programs_en,
                    features_de=_features_de, features_en=_features_en, category=_category
                ),
                price=_price,
                category=_category,
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
                # Add extra_data if column exists
                extra_data = {
                    "specs": _specs if os.environ.get("GEMINI_API_KEY") else {},
                    "programs_de": _programs_de if os.environ.get("GEMINI_API_KEY") else [],
                    "programs_en": _programs_en if os.environ.get("GEMINI_API_KEY") else [],
                    "features_de": _features_de if os.environ.get("GEMINI_API_KEY") else [],
                    "features_en": _features_en if os.environ.get("GEMINI_API_KEY") else [],
                }
                if user_id:
                    db_data["user_id"] = user_id

                try:
                    db_data["extra_data"] = extra_data
                    supabase.table("items").insert(db_data).execute()
                except Exception as col_err:
                    # extra_data column may not exist yet — retry without it
                    if 'extra_data' in str(col_err):
                        db_data.pop("extra_data", None)
                        supabase.table("items").insert(db_data).execute()
                    else:
                        raise
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
        
        # Add formatted_description to each item
        for item in items:
            extra = item.pop('extra_data', None) or {}
            item['formatted_description'] = format_description(
                item.get('title', ''), item.get('description_de', ''), item.get('description_en', ''),
                specs=extra.get('specs'), programs_de=extra.get('programs_de'),
                programs_en=extra.get('programs_en'), features_de=extra.get('features_de'),
                features_en=extra.get('features_en'), category=item.get('category')
            )
        
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
        extra = item.pop('extra_data', None) or {}
        item['formatted_description'] = format_description(
            item.get('title', ''), item.get('description_de', ''), item.get('description_en', ''),
            specs=extra.get('specs'), programs_de=extra.get('programs_de'),
            programs_en=extra.get('programs_en'), features_de=extra.get('features_de'),
            features_en=extra.get('features_en'), category=item.get('category')
        )
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
        extra = item.pop('extra_data', None) or {}
        item['formatted_description'] = format_description(
            item.get('title', ''), item.get('description_de', ''), item.get('description_en', ''),
            specs=extra.get('specs'), programs_de=extra.get('programs_de'),
            programs_en=extra.get('programs_en'), features_de=extra.get('features_de'),
            features_en=extra.get('features_en'), category=item.get('category')
        )
        return ItemResponse(**item)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error marking item {item_id} as listed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to mark item as listed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
