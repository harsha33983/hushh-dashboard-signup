# Drop-off Intelligence Backend

Production-grade FastAPI backend for real-time drop-off detection and diagnosis.

## 🚀 Getting Started

To resolve the IDE "Could not find import" errors and run the server, follow these steps:

### 1. Create and Activate Virtual Environment
```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
# OR
pip install -e .
```

### 3. Configure Environment
Copy `.env.example` to `.env` and fill in your Supabase credentials.
```bash
cp .env.example .env
```

### 4. Run the Server
```bash
uvicorn app.main:app --reload
```

## 🛠 Tech Stack
- **FastAPI** (Web framework)
- **SQLModel** (ORM: SQLAlchemy + Pydantic)
- **Asyncpg** (Async PostgreSQL driver)
- **SlowAPI** (Rate limiting)
- **Loguru** (Structured logging)

## 📁 Structure
- `app/api/` - Routes and dependencies
- `app/core/` - Config and database init
- `app/models/` - SQLModel table definitions
- `app/schemas/` - Pydantic response/request schemas
- `app/services/` - Business logic and analytics queries
- `app/utils/` - Shared helpers
