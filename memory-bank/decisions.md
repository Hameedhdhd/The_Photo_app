# Technical Decisions

## Database Table Naming (May 2026)
- **Decision**: Changed table name from `items` (and briefly `host`) to `APP_Table`.
- **Rationale**: User preference for the new project structure.
- **Impact**: All backend and frontend queries must now target `APP_Table`.

## AI Security (May 2026)
- **Decision**: Implemented `.aiignore` and strict `.gitignore` for `.env` files.
- **Rationale**: Ensure AI agents cannot read sensitive credentials and prevent accidental commits of secrets.
- **Impact**: AI tools will skip these files during search and read operations.

## AI Persistence (May 2026)
- **Decision**: Adopted the Memory Bank structure (`.clinerules/` and `memory-bank/`).
- **Rationale**: Maintain continuity and reduce token usage by providing a stable project context.
- **Impact**: Every new task starts by reading these core memory files.
