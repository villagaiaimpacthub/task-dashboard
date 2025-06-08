# HIVE Project Cleanup Guide

## 🧹 Clean House Before Building

Before developing new features, remove conflicting, outdated, and contradictory code that creates confusion.

## 📋 STEP 1: File Structure Audit

### Identify All Files
```bash
# Get complete file inventory
find . -type f -name "*.py" -o -name "*.js" -o -name "*.html" -o -name "*.md" -o -name "*.json" | grep -v node_modules | sort
```

### Categorize Files by Purpose
Create lists of:
- **Active backend files** (what's actually running)
- **Active frontend files** (what's actually serving the UI)
- **Configuration files** (package.json, .env files, etc.)
- **Documentation files** (README, guides, etc.)
- **Unknown/legacy files** (old experiments, duplicates, etc.)

## 📋 STEP 2: Backend Cleanup

### Identify Active Backend
```bash
# Check what's actually running
ps aux | grep python
lsof -i :8000

# Identify the real backend entry point
ls -la *.py
ls -la *backend* 2>/dev/null || echo "No backend directories"
```

### Backend File Audit Questions:
- **Which Python file is the actual server?** (main.py, app.py, simple_backend.py?)
- **Are there multiple backend implementations?** (FastAPI vs simple HTTP server?)
- **Which one is actually being used?**
- **Are there leftover experiment files?**

### Cleanup Actions:
```bash
# Document active backend
echo "Active backend: [FILE_NAME]" > .active-backend.txt

# Move unused backend files to archive
mkdir -p .archive/unused-backends/
# mv unused_backend_file.py .archive/unused-backends/
```

## 📋 STEP 3: Frontend Cleanup

### Identify Frontend Structure
```bash
# Check frontend organization
ls -la *.html *.js *.css 2>/dev/null || echo "No frontend files in root"
ls -la hive-frontend/ 2>/dev/null || echo "No hive-frontend directory"
ls -la frontend/ 2>/dev/null || echo "No frontend directory"
ls -la public/ 2>/dev/null || echo "No public directory"
```

### Frontend File Audit Questions:
- **What's the entry point HTML file?**
- **Are there duplicate CSS/JS files?**
- **Are there old template files not being used?**
- **Are there conflicting versions of the same functionality?**

### Cleanup Actions:
```bash
# Document active frontend structure
echo "Frontend entry: [FILE_NAME]" > .active-frontend.txt
echo "Frontend directory: [DIRECTORY]" >> .active-frontend.txt

# Archive unused frontend files
mkdir -p .archive/unused-frontend/
```

## 📋 STEP 4: Configuration Cleanup

### Environment File Audit
```bash
# List all environment/config files
ls -la .*env* .env* *.env 2>/dev/null || echo "No .env files"
ls -la *config* *.config 2>/dev/null || echo "No config files"
ls -la package*.json 2>/dev/null || echo "No package files"
```

### Configuration Questions:
- **Which .env files are actually used?**
- **Are there conflicting configuration files?**
- **Is package.json accurate for current setup?**
- **Are there old Docker files not being used?**

### Cleanup Actions:
```bash
# Keep only active configurations
# Archive contradictory or unused configs
mkdir -p .archive/old-configs/
```

## 📋 STEP 5: Documentation Cleanup

### Documentation Audit
```bash
# Find all documentation
ls -la *.md README* DEPLOY* 2>/dev/null || echo "No markdown files"
ls -la docs/ 2>/dev/null || echo "No docs directory"
```

### Documentation Questions:
- **Which README is current?**
- **Are deployment instructions accurate?**
- **Are there conflicting setup guides?**
- **Do docs match the actual codebase?**

### Cleanup Actions:
```bash
# Keep one authoritative README
# Archive outdated documentation
mkdir -p .archive/old-docs/
```

## 📋 STEP 6: Dependency Cleanup

### Check Package Dependencies
```bash
# Audit package.json dependencies
if [ -f package.json ]; then
    echo "=== PACKAGE.JSON DEPENDENCIES ==="
    cat package.json | grep -A 20 '"dependencies"'
    echo ""
    echo "=== ACTUALLY USED DEPENDENCIES ==="
    # Check which dependencies are actually imported
    grep -r "import.*from\|require(" . --include="*.js" | grep -E "(zod|node-fetch)" | head -5
fi
```

### Python Dependencies (if applicable)
```bash
# Check Python requirements
ls -la requirements.txt pyproject.toml poetry.lock 2>/dev/null || echo "No Python dependency files"
```

### Cleanup Actions:
- Remove unused dependencies from package.json
- Update versions to match what's actually working
- Remove conflicting dependency files

## 📋 STEP 7: Legacy Code Detection

### Find Old Experiment Files
```bash
# Look for obvious legacy files
find . -name "*old*" -o -name "*backup*" -o -name "*test*" -o -name "*temp*" | grep -v node_modules

# Look for duplicate functionality
echo "=== POTENTIAL DUPLICATES ==="
find . -name "*.js" -exec basename {} \; | sort | uniq -d
```

### Legacy Pattern Detection
```bash
# Check for old API patterns
echo "=== OLD API PATTERNS ==="
grep -r "XMLHttpRequest\|jQuery\|axios" . --include="*.js" | head -3

# Check for old styling approaches
echo "=== OLD STYLING ==="
find . -name "*.css" | wc -l
grep -r "bootstrap\|foundation" . --include="*.html" --include="*.js" | head -3
```

## 📋 STEP 8: Create Clean Project Structure

### Define Clear Structure
```
hive-project/
├── .claude/                 # AI development rules
├── .archive/                # Old/unused files (don't delete, just archive)
├── [frontend-dir]/          # Active frontend code
├── [backend-file]           # Active backend code
├── README.md               # Current, accurate documentation
├── package.json            # Clean dependencies
├── .env.example            # Template environment variables
└── .gitignore              # Proper ignores
```

### Document the Cleaned Structure
```bash
# Create current structure documentation
cat > PROJECT_STRUCTURE.md << 'EOF'
# HIVE Project Structure (Post-Cleanup)

## Active Components
- **Backend**: [FILE/DIRECTORY]
- **Frontend**: [FILE/DIRECTORY] 
- **Entry Point**: [MAIN_HTML_FILE]
- **Configuration**: [CONFIG_FILES]

## Key Scripts
- **Start Backend**: [COMMAND]
- **Start Frontend**: [COMMAND]
- **Environment Setup**: [COMMAND]

## Archived Components
- **Location**: .archive/
- **Contents**: [DESCRIPTION]

EOF
```

## 📋 STEP 9: Validation After Cleanup

### Test Everything Still Works
```bash
# After cleanup, verify functionality
echo "=== POST-CLEANUP VALIDATION ==="

# 1. Backend starts successfully
echo "Testing backend startup..."
# [BACKEND_START_COMMAND]

# 2. Frontend loads successfully  
echo "Testing frontend..."
# [FRONTEND_START_COMMAND]

# 3. Environment variables work
echo "Testing environment..."
source ./dev-connect.sh
echo "BACKEND_URL: $BACKEND_URL"

# 4. Basic functionality works
echo "Testing basic API call..."
curl http://localhost:8000/health || echo "Backend not responding"
```

### Verify No Broken References
```bash
# Check for broken imports/references
echo "=== CHECKING FOR BROKEN REFERENCES ==="
grep -r "import.*from" . --include="*.js" | grep -v node_modules
grep -r "src=\|href=" . --include="*.html" | grep -v "http"
```

## 📋 STEP 10: Create Maintenance Rules

### Prevent Future Chaos
```markdown
# Maintenance Rules for HIVE

## Before Adding New Files:
1. Check if similar functionality already exists
2. Remove old implementation before adding new one
3. Update PROJECT_STRUCTURE.md if structure changes
4. Test that existing functionality still works

## File Naming Conventions:
- Backend files: Clear, descriptive names
- Frontend files: Organized in logical directories
- Config files: One source of truth per environment
- Documentation: Keep current, archive old versions

## Archive Policy:
- Don't delete old code immediately
- Move to .archive/ with date and reason
- Keep .archive/ organized by category
- Review .archive/ monthly for permanent deletion
```

## 🎯 Success Criteria

### Project is Clean When:
✅ **Single source of truth** for each component  
✅ **No duplicate functionality** or conflicting files  
✅ **Clear entry points** for backend and frontend  
✅ **Accurate documentation** that matches reality  
✅ **Working environment setup** from scratch  
✅ **No broken references** or missing dependencies  
✅ **Logical file organization** that newcomers can understand  

### Red Flags That Need Cleanup:
❌ Multiple files doing the same thing  
❌ Documentation that doesn't match the code  
❌ Dependencies that aren't actually used  
❌ Configuration files that contradict each other  
❌ Files with names like "old", "backup", "test"  
❌ Unclear which file is the "real" version  

---

**Clean house first, then build on solid foundation.**