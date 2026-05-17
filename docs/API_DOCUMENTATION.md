# The Photo App — API Documentation

**Version**: 2.0.0 (Premium)  
**Base URL**: See `.env` or config  
**Authentication**: Supabase JWT tokens

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Endpoints](#endpoints)
4. [Error Handling](#error-handling)
5. [Examples](#examples)
6. [Rate Limiting](#rate-limiting)

---

## Overview

The Photo App API provides endpoints for:
- **Image Analysis**: AI-powered product/item recognition
- **Marketplace**: Item listing, search, pagination
- **Location-based Search**: Radius-based item discovery
- **Geocoding**: Address to coordinates conversion

### Key Features
- ✅ RESTful design
- ✅ Centralized error handling
- ✅ Pagination support
- ✅ PostGIS spatial queries
- ✅ AI integration (Gemini + Deepseek)

---

## Authentication

All endpoints require authentication via Supabase JWT token in the `Authorization` header.

```bash
Authorization: Bearer <jwt-token>
```

Obtain token via Supabase client:
```javascript
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
```

---

## Endpoints

### 1. Health Check

**GET** `/`

Check API health and service status.

**Response**:
```json
{
  "message": "Welcome to The Photo App API",
  "version": "2.0.0",
  "status": "online"
}
```

---

### 2. Analyze Image (AI Processing)

**POST** `/api/analyze-image`

Analyze product photo and generate marketplace listing.

**Request** (multipart/form-data):
```bash
curl -X POST http://localhost:8000/api/analyze-image \
  -H "Authorization: Bearer <token>" \
  -F "file=@photo.jpg" \
  -F "room=Kitchen" \
  -F "user_id=user123" \
  -F "address=Berlin, Germany"
```

**Form Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `file` | File | Yes | Image file (JPEG/PNG, max 10MB) |
| `room` | String | Yes | Room category (Kitchen, Bedroom, etc.) |
| `user_id` | String | No | User ID for attribution |
| `address` | String | No | Item location/address |

**Response** (200 OK):
```json
{
  "title": "Stainless Steel Blender",
  "description": "High-powered kitchen blender, like new condition...",
  "description_en": "Professional grade blender...",
  "description_de": "Professioneller Mixer...",
  "price": "45.00",
  "category": "Kitchen Appliances",
  "item_id": "ITEM-A1B2C3D4",
  "image_url": "https://storage.example.com/items/ITEM-A1B2C3D4.jpg",
  "user_id": "user123",
  "address": "Berlin, Germany",
  "latitude": 52.52,
  "longitude": 13.405
}
```

**Error Response** (400/500):
```json
{
  "detail": "Analysis failed: Invalid image format",
  "error_code": "FILE_ERROR",
  "status_code": 400
}
```

---

### 3. Get Items (Paginated)

**GET** `/api/items`

Fetch paginated list of marketplace items.

**Query Parameters**:
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `limit` | Integer | 20 | Items per page (1-100) |
| `offset` | Integer | 0 | Pagination offset |
| `category` | String | None | Filter by category |

**Request**:
```bash
curl "http://localhost:8000/api/items?limit=20&offset=0&category=Electronics" \
  -H "Authorization: Bearer <token>"
```

**Response** (200 OK):
```json
[
  {
    "item_id": "ITEM-A1B2C3D4",
    "title": "Stainless Steel Blender",
    "price": "45.00",
    "address": "Berlin, Germany",
    "image_url": "https://storage.example.com/...",
    "latitude": 52.52,
    "longitude": 13.405,
    "distance_km": 0
  },
  ...
]
```

---

### 4. Radius Search

**GET** `/api/search-radius`

Find items within a geographic radius.

**Query Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `latitude` | Float | Yes | Center latitude |
| `longitude` | Float | Yes | Center longitude |
| `radius_km` | Float | No | Search radius (default: 25 km) |
| `category` | String | No | Filter by category |
| `min_price` | Float | No | Minimum price |
| `max_price` | Float | No | Maximum price |

**Request**:
```bash
curl "http://localhost:8000/api/search-radius?latitude=52.52&longitude=13.405&radius_km=25&category=Electronics" \
  -H "Authorization: Bearer <token>"
```

**Response** (200 OK):
```json
[
  {
    "item_id": "ITEM-A1B2C3D4",
    "title": "Laptop",
    "price": "599.00",
    "address": "Berlin",
    "image_url": "...",
    "distance_km": 2.5
  },
  ...
]
```

---

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "detail": "Human-readable error message",
  "error_code": "MACHINE_READABLE_CODE",
  "status_code": 400
}
```

### Common Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input |
| `FILE_ERROR` | 400 | File upload issue |
| `AUTH_ERROR` | 401 | Authentication failed |
| `PERMISSION_ERROR` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `EXTERNAL_SERVICE_ERROR` | 503 | AI/external service failure |

### Handling Errors in Frontend

```javascript
import { apiGet } from '../utils/api';
import { getErrorMessage, showErrorAlert } from '../utils/errorHandler';

try {
  const items = await apiGet('/api/items');
} catch (error) {
  const { title, message } = getErrorMessage(error);
  showErrorAlert(error, () => console.log('Dismissed'));
}
```

---

## Examples

### Example 1: Analyze Product Photo

```javascript
import { apiPost } from '../utils/api';

async function analyzePhoto(imageUri, room = 'Other') {
  try {
    const formData = new FormData();
    formData.append('file', { uri: imageUri, name: 'photo.jpg', type: 'image/jpeg' });
    formData.append('room', room);

    const result = await apiPost('/api/analyze-image', formData);
    return result;
  } catch (error) {
    console.error('Analysis failed:', error);
    throw error;
  }
}
```

### Example 2: Fetch Items with Pagination

```javascript
async function fetchItems(pageOffset = 0, pageSize = 20) {
  try {
    const items = await apiGet('/api/items', {
      params: { limit: pageSize, offset: pageOffset },
      cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
    return items;
  } catch (error) {
    console.error('Fetch failed:', error);
    return [];
  }
}
```

### Example 3: Search Items by Location

```javascript
async function searchNearby(latitude, longitude, radiusKm = 25) {
  try {
    const endpoint = `/api/search-radius?latitude=${latitude}&longitude=${longitude}&radius_km=${radiusKm}`;
    const results = await apiGet(endpoint);
    return results.sort((a, b) => a.distance_km - b.distance_km);
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
}
```

---

## Rate Limiting

Currently no rate limiting. In production, implement:

```
- 100 requests per minute per user
- 1000 requests per minute per API key
- Implement with Redis/Memcached
```

---

## Best Practices

### ✅ DO
- Check response status before processing
- Use authentication tokens
- Implement retry logic for transient failures
- Cache responses when appropriate
- Validate input before sending
- Log errors for debugging

### ❌ DON'T
- Hardcode API URLs (use environment variables)
- Ignore error responses
- Send unencrypted sensitive data
- Make synchronous API calls on UI thread
- Retry failed requests indefinitely
- Log sensitive user data

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2026-05-16 | Pagination, caching, error handling |
| 1.0.0 | 2026-04-01 | Initial MVP |

---

## Support

For issues or questions:
1. Check this documentation
2. Review error response details
3. Check backend logs
4. Contact support

---

*Last updated: 2026-05-16*
