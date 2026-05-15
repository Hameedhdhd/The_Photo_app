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

### D3: Supabase Realtime for Chat (May 2026)
- **Decision**: Use Supabase Realtime (Postgres Changes) instead of separate WebSocket server
- **Rationale**: Already using Supabase; avoids additional infrastructure
- **Trade-off**: Less control than dedicated chat service, but simpler setup

### D4: Address-First Listings (May 2026)
- **Decision**: Require address on every listing; geocode to coordinates
- **Rationale**: Map discovery needs coordinates; address shows buyers pickup location
- **Implementation**: Google Geocoding API on backend, store lat/lng in DB

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