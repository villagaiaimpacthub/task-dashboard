# HIVE Project Archive

This directory contains preserved code and files that are not currently active but should not be deleted.

## Directory Structure

### `unused-backends/`
- **hive-backend-alpha/**: Complete FastAPI backend implementation
  - Full WebSocket support, authentication, database models
  - 88 files of production-ready backend code
  - **Migration Path**: Can be activated when real-time features needed
- **start_backend_simple.py**: Experimental backend starter
- **api_contract.py**: Python version of API contract (JS version used instead)

### `legacy-frontend/` 
- **api.js**: Old API client (replaced by api-contract.js)
- **proxy.py**: Unused proxy server
- **server.py**: Unused server implementation  
- **simple_server.py**: Unused simple server

### `test-files/`
- **test-*.html**: Various test pages and debugging tools
- **debug-fetch.html**: Frontend debugging tool
- **test-connection.js**: Connection testing utility

### `old-docs/`
- **DEPLOYMENT_GUIDE.md**: Outdated deployment instructions (mentions Docker/Poetry)
- **get-pip.py**: Python pip installer (not needed in project root)

## Archive Policy

- **Don't delete archived files** - they represent completed work
- **Files moved here are intentionally preserved** for future reference
- **FastAPI backend in particular** is complete and ready to use when needed
- **Archive contents should be reviewed quarterly** for permanent deletion

## Future Use

The FastAPI backend (`unused-backends/hive-backend-alpha/`) is a complete implementation that can be activated when:
- Real WebSocket functionality is needed
- Advanced authentication is required  
- API documentation (/docs) is desired
- Production deployment is planned

**Date Archived**: June 8, 2025
**Reason**: Project structure cleanup - preserving complete work while clarifying active components