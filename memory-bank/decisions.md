# Architectural Decisions

## Decision Log

### D1: Marketplace Pivot (May 2026)
- **Decision**: Transform from personal inventory app to community marketplace
- **Rationale**: User wants a platform where people can buy/sell with each other
- **Impact**: New screens (Marketplace, Chat), new DB schema (messages, addresses)

### D2: Multi-AI Strategy (May 2026)
- **Decision**: Gemini for vision + Deepseek for copywriting
- **Rationale**: Gemini excels at image analysis; Deepseek excels at persuasive writing
- **Formula**: Hook → Benefits → Features → Condition → Call to Action
- **Fallback**: If Deepseek unavailable, use Gemini descriptions with basic formatting
- **Update (May 16, 2026)**: Use `gemini-2.5-flash` model for optimal performance with SDK version 0.3.0.

### D3: Supabase Realtime for Chat (May 2026)
- **Decision**: Use Supabase Realtime (Postgres Changes) instead of separate WebSocket server
- **Rationale**: Already using Supabase; avoids additional infrastructure
- **Trade-off**: Less control than dedicated chat service, but simpler setup

### D4: Address-First Listings (May 2026)
- **Decision**: Require address on every listing; geocode to coordinates
- **Rationale**: Map discovery needs coordinates; address shows buyers pickup location
- **Implementation**: Nominatim (OpenStreetMap) API on backend for free geocoding.

### D5: React Native Maps (May 2026)
- **Decision**: Use `react-native-maps` with Google Maps provider
- **Rationale**: Most mature mapping library for React Native; Google Maps has best coverage
- **Trade-off**: Requires Google Maps API key; Apple Maps would be free for iOS

### D6: Single Description Field (May 2026)
- **Decision**: Replace bilingual (EN/DE) descriptions with single Deepseek-generated description
- **Rationale**: Deepseek generates market-optimized copy; bilingual no longer needed for marketplace
- **Migration**: Old `description_en`/`description_de` columns kept for backward compatibility

### D7: Chat ID Convention (May 2026)
- **Decision**: Chat IDs generated as `{sorted_user_id_1}_{sorted_user_id_2}_{item_id}`
- **Rationale**: Ensures same chat ID regardless of who initiates; item-scoped conversations
- **Trade-off**: No group chats; each buyer-seller-item combo is unique thread

### D8: OpenStreetMap Instead of Google Maps (May 2026)
- **Decision**: Use OpenStreetMap (OSM) for maps and Nominatim for geocoding instead of Google Maps
- **Rationale**: Google Maps API requires billing account; OSM/Nominatim are completely free and open-source
- **Implementation**: `react-native-maps` default provider (no `PROVIDER_GOOGLE`) renders OSM tiles; backend geocoding via `nominatim.openstreetmap.org/search`
- **Trade-off**: Nominatim has a 1 req/sec rate limit (fine for marketplace); map style is OSM instead of Google

### D9: Backend Authorization (May 16, 2026)
- **Decision**: Use `SUPABASE_SERVICE_ROLE_KEY` for all backend database and storage operations.
- **Rationale**: Backend needs elevated privileges to bypass Row Level Security (RLS) for system tasks, while frontend continues to use the public `SUPABASE_ANON_KEY`.
- **Implementation**: Updated `backend/app/database.py` to prioritize service role key mapping.

### D10: Frontend Reanimated Update (May 16, 2026)
- **Decision**: Update `react-native-reanimated` to `4.3.1` and `react-native-worklets` to `0.8.3`.
- **Rationale**: Keep frontend UI performance optimized with the latest compatible libraries.
