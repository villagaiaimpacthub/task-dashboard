# HIVE Project Structure (Post-Cleanup)

## Active Components

- **Backend**: `simple_backend.py` (Python stdlib HTTP server)
- **Frontend**: `hive-frontend/` directory (Vanilla JS, HTML, CSS)
- **Entry Point**: `hive-frontend/index.html`
- **Configuration**: `dev-connect-dynamic.sh`, `export-env.sh`, `package.json`

## Key Scripts

- **Start Backend**: `python simple_backend.py`
- **Start Frontend**: `cd hive-frontend && python -m http.server 3000`
- **Environment Setup**: `./dev-connect-dynamic.sh` or `source ./export-env.sh`
- **Debugging**: `./debug-hive.sh`

## Directory Structure

```
hive-project/
├── .claude/                    # AI development rules and guidelines
├── .archive/                   # Preserved but unused code
│   ├── unused-backends/        # Complete FastAPI backend (88 files)
│   ├── legacy-frontend/        # Old frontend files
│   ├── test-files/            # Test and debug files
│   └── old-docs/              # Outdated documentation
├── hive-frontend/              # Active frontend application
│   ├── index.html             # Main entry point
│   ├── app.js                 # Main application logic
│   ├── styles.css             # Styling
│   ├── websocket.js           # Real-time (currently disabled)
│   ├── api.js                 # API client
│   └── server.py              # Frontend development server
├── simple_backend.py          # Active backend server
├── README.md                  # Main project documentation
├── BACKEND_STATUS.md          # Backend implementation status
├── START_HERE.md              # Getting started guide
├── API_CONTRACT_GUIDE.md      # API contract documentation
├── PROJECT_STATE.md           # Current project state
├── package.json               # JavaScript dependencies
├── dev-connect-dynamic.sh     # WSL networking setup
├── export-env.sh              # Environment variable export
├── debug-hive.sh              # Project debugging tool
└── .gitignore                 # Git ignore rules
```

## Current Functionality

### ✅ Working Features
- Task CRUD operations (create, read, update, delete)
- User authentication (simplified)
- File upload and download
- Comments system
- Dashboard analytics
- Modal-to-page navigation system

### ❌ Disabled Features
- Real-time WebSocket updates (backend doesn't support real WebSocket)
- Live user status updates
- Multi-user collaboration

## Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Python standard library HTTP server
- **Database**: In-memory (simple_backend.py)
- **API Client**: Custom with Zod validation
- **Environment**: WSL with dynamic IP detection

## Archived Components

### FastAPI Backend (`unused-backends/hive-backend-alpha/`)
- Complete backend implementation with 88 files
- Features: Real WebSocket, authentication, database models, API docs
- Status: Complete and ready to use when needed
- Migration: Can replace simple_backend.py when real-time features required

### Legacy Files
- Old API clients, unused servers, test files
- Preserved in `.archive/` for reference
- Not currently used in active development

## Development Workflow

1. **Start Development**:
   ```bash
   ./dev-connect-dynamic.sh  # Setup environment
   python simple_backend.py  # Start backend
   # In another terminal:
   cd hive-frontend && python -m http.server 3000
   ```

2. **Debug Issues**: `./debug-hive.sh`

3. **Environment Variables**: `source ./export-env.sh`

## Migration Path

To activate full features (WebSocket, real-time):
1. Switch to FastAPI backend: `cd .archive/unused-backends/hive-backend-alpha`
2. Install dependencies: `poetry install`
3. Start FastAPI: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
4. Re-enable WebSocket in `hive-frontend/websocket.js`

---

**Last Updated**: June 8, 2025
**Cleanup Date**: June 8, 2025
**Status**: Clean, organized, ready for development