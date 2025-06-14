# HIVE Frontend

Interactive web interface for the HIVE task coordination platform. Built with vanilla JavaScript and designed to work seamlessly with the HIVE backend API.

## Features

- 🔐 **User Authentication** - Login/register with JWT tokens
- 📋 **Task Management** - Create, view, assign, and update tasks
- ⚡ **Real-time Updates** - WebSocket integration for live task updates
- 👥 **Team Coordination** - View online users and team status
- 📊 **Dashboard Analytics** - Real-time statistics and collective impact
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Prerequisites

- Python 3.7+ (for development server)
- HIVE Backend running on `http://localhost:8000`

## Quick Start

1. **Start the HIVE backend** (if not already running):
   ```bash
   cd ../hive-backend-alpha
   poetry run uvicorn app.main:app --reload
   ```

2. **Start the frontend development server**:
   ```bash
   cd hive-frontend
   python server.py
   ```

3. **Open your browser** and navigate to:
   ```
   http://localhost:3000
   ```

## Project Structure

```
hive-frontend/
├── index.html          # Main HTML template
├── styles.css          # Application styles
├── api.js              # Backend API client
├── websocket.js        # WebSocket connection manager
├── app.js              # Main application logic
├── server.py           # Development server
└── README.md           # This file
```

## Usage

### First Time Setup

1. **Register a new account** or **login** with existing credentials
2. The interface will automatically load your tasks and dashboard data
3. Real-time updates will be established via WebSocket connection

### Task Management

- **Create Tasks**: Click the "+" button or "Create Task" button
- **View Tasks**: Tasks are displayed in a responsive grid
- **Filter Tasks**: Use the sidebar filters to view tasks by status
- **Assign Tasks**: Click "Assign" to assign a task to yourself
- **Update Status**: Click "Update Status" to progress task through workflow
- **Delete Tasks**: Click "Delete" to remove tasks you own

### Real-time Features

- **Live Updates**: Task changes are broadcast to all connected users
- **Online Status**: See which team members are currently online
- **Dashboard Stats**: View live statistics about tasks and users
- **Connection Status**: Monitor WebSocket connection in top-right corner

## Task Workflow

Tasks follow this status progression:
1. **Draft** → **Available** → **In Progress** → **Completed**

## API Integration

The frontend integrates with the HIVE backend through:

- **REST API** (`/api/v1/`) for CRUD operations
- **WebSocket** (`/api/v1/ws`) for real-time updates
- **Dashboard API** (`/api/v1/dashboard/`) for statistics

## Development

### File Organization

- **`api.js`**: Handles all HTTP requests to the backend
- **`websocket.js`**: Manages WebSocket connections and real-time updates
- **`app.js`**: Main application class with UI logic and event handling
- **`styles.css`**: Complete styling based on the original HIVE design
- **`index.html`**: HTML structure with modals and layouts

### Key Classes

- **`APIClient`**: REST API communication
- **`WebSocketManager`**: Real-time connection management  
- **`HIVEApp`**: Main application controller

### Adding Features

1. **New API endpoints**: Add methods to `APIClient` class in `api.js`
2. **WebSocket messages**: Handle in `WebSocketManager.handleMessage()`
3. **UI components**: Add to `HIVEApp` class in `app.js`
4. **Styling**: Extend `styles.css` following existing patterns

## Configuration

The frontend is configured to connect to:
- **Backend API**: `http://localhost:8000`
- **WebSocket**: `ws://localhost:8000/api/v1/ws`

To change these URLs, edit the constants in `api.js` and `websocket.js`.

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Troubleshooting

### Connection Issues

1. **Backend not responding**: Ensure HIVE backend is running on port 8000
2. **CORS errors**: Backend includes CORS headers for `*` origins in alpha
3. **WebSocket failures**: Check browser console for connection errors

### Authentication Issues

1. **Login failures**: Check credentials and backend logs
2. **Token expiry**: Tokens expire after 30 minutes, login again
3. **Permission errors**: Ensure user has proper access rights

### Task Issues

1. **Tasks not loading**: Check network tab for API errors
2. **Updates not showing**: Verify WebSocket connection status
3. **Assignment failures**: Ensure you own the task being assigned

## Performance

- **Optimized for speed**: Minimal dependencies, vanilla JavaScript
- **Real-time efficient**: WebSocket with automatic reconnection
- **Responsive UI**: CSS Grid and Flexbox for fast rendering
- **Error handling**: Graceful degradation when backend is unavailable

## Security

- **JWT Authentication**: Secure token-based authentication
- **HTTPS Ready**: Designed to work with HTTPS in production
- **Input Validation**: Client-side validation with server-side enforcement
- **XSS Protection**: Safe HTML rendering practices

## Production Deployment

For production deployment:

1. **Build static files**: No build step required (vanilla JS)
2. **Web server**: Serve files with nginx, Apache, or CDN
3. **HTTPS**: Configure SSL certificates
4. **API URLs**: Update API endpoints in configuration
5. **CORS**: Configure backend for specific origins

## Contributing

1. Follow existing code style and patterns
2. Test all features with the HIVE backend
3. Ensure responsive design works on mobile
4. Verify WebSocket functionality
5. Update documentation for new features

The frontend maintains the original HIVE design aesthetic while providing full integration with the backend API and real-time capabilities.