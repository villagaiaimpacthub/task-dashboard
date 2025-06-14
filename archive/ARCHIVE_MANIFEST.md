# HIVE Project Archive Manifest

## Archive Date
**Date:** December 2024  
**Reason:** Project cleanup after implementing FastAPI backend with proper async/await architecture

## What Was Archived

### 🗄️ Legacy Backend Files (`legacy-backend/`)
- `simple_backend.py` - Original simple backend replaced by FastAPI
- `master_plan_parser.py` - Duplicate of parser (kept in hive-backend-alpha)
- `test_api.html` - Manual API testing (replaced by FastAPI /docs)
- `test_payload.json` - Manual testing payload
- `migrations/` - Old migration system (replaced by Alembic)

### 🗄️ Legacy Frontend Files (`legacy-frontend/`)
- `frontend/` - Entire duplicate frontend directory
- `proxy.py` - Network proxy workaround (no longer needed)
- `server.py` - Custom server script
- `simple_server.py` - Custom server script (replaced by `python -m http.server`)

### 🗄️ Deprecated Scripts (`deprecated-scripts/`)
- `debug-hive.sh` - Legacy debugging script
- `deploy-alpha.sh` - Outdated deployment script
- `dev-connect-dynamic.sh` - WSL network detection workaround
- `export-env.sh` - Environment setup workaround
- `source-env.sh` - Environment setup workaround
- `start-backend.sh` - Legacy startup script
- `start_hive_backend.sh` - Legacy startup script
- `start_servers.sh` - Legacy startup script
- `start_services.sh` - Legacy startup script
- `stop_services.sh` - Legacy stop script

### 🗄️ Legacy Config Files (`legacy-config/`)
- `api-contract.js` - Custom API validation (replaced by FastAPI + Pydantic)
- `dev-config.js` - Outdated development configuration

### 🗄️ Legacy Documentation (`legacy-docs/`)
- `API_CONTRACT_GUIDE.md` - Custom contract system guide (superseded by FastAPI)
- `BACKEND_STATUS.md` - Historical backend status
- `PROJECT_STATE.md` - Historical project state
- `PROJECT_STRUCTURE.md` - Old project structure documentation
- `WSL_SETUP.md` - WSL setup documentation
- `task-page-design.md` - Historical design documentation

## What Remains Active

### ✅ Current Backend
- `hive-backend-alpha/` - FastAPI backend with async/await architecture
- All FastAPI routes, services, models, and schemas

### ✅ Current Frontend
- `hive-frontend/` - Active frontend with fixed API connectivity
- All JavaScript, HTML, and CSS files

### ✅ Essential Documentation
- `API_CONTRACT.md` - Updated for FastAPI architecture
- `README.md` - Main project documentation
- `START_HERE.md` - Getting started guide

### ✅ Current Scripts
- Scripts within `hive-backend-alpha/scripts/` - Active database and testing scripts

## Why These Files Were Archived

### 1. **API Contract Layer No Longer Needed**
- FastAPI provides automatic request/response validation via Pydantic schemas
- OpenAPI documentation auto-generated at `/docs` endpoint
- Type safety built into the framework

### 2. **Async Architecture Implemented**
- Proper AsyncSession database connections
- Async service layer methods
- Fixed frontend API client with proper error handling

### 3. **Simplified Development Workflow**
- Standard `uvicorn` for backend startup
- Standard `python -m http.server` for frontend
- No need for custom network detection scripts

### 4. **FastAPI Features Replace Custom Solutions**
- Built-in CORS handling
- Automatic data validation
- Interactive API documentation
- Better error handling and responses

## Recovery Instructions

If any archived files are needed:

1. **Check archive directory structure:**
   ```bash
   ls archive/
   # legacy-backend/ legacy-frontend/ deprecated-scripts/ legacy-config/ legacy-docs/
   ```

2. **Restore specific files if needed:**
   ```bash
   # Example: Restore a legacy script
   cp archive/deprecated-scripts/debug-hive.sh ./
   ```

3. **Reference historical documentation:**
   ```bash
   # View old project structure
   cat archive/legacy-docs/PROJECT_STRUCTURE.md
   ```

## Current Development Workflow

### Start Services:
```bash
# Backend (FastAPI)
cd hive-backend-alpha
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd hive-frontend  
python3 -m http.server 3000
```

### API Documentation:
- Interactive docs: http://localhost:8000/docs
- OpenAPI spec: http://localhost:8000/openapi.json

### Database Management:
```bash
cd hive-backend-alpha
python scripts/init_db.py        # Initialize database
python scripts/check_tasks.py    # Check task data
python scripts/delete_all_tasks.py  # Clear tasks for testing
```

## Archive Safety

- All archived files are preserved in their original state
- No data loss occurred during archiving
- Archive can be safely removed after confirming current system stability
- Current active system is fully functional without archived components

---
*This archive was created as part of the project modernization to FastAPI architecture.*