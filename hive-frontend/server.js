// Simple Node.js server to handle SPA routing
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the current directory with proper headers
app.use(express.static(__dirname, {
    setHeaders: (res, path) => {
        // Disable caching for CSS and JS files during development
        if (path.endsWith('.css') || path.endsWith('.js')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));

// Handle all routes by serving index.html for client-side routing
app.get('*', (req, res, next) => {
    // Don't serve index.html for API requests
    if (req.url.startsWith('/api/')) {
        return res.status(404).send('API not found');
    }
    
    // Check if this is a request for a static file
    const urlPath = req.url.split('?')[0]; // Remove query parameters
    const fileExt = path.extname(urlPath);
    
    // If it's a file request (has extension), let static middleware handle it first
    if (fileExt) {
        // Don't handle here - let it fall through to static middleware or 404
        return next();
    }
    
    // For routes without extensions (SPA routes), serve index.html
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 handler for files not found by static middleware
app.use((req, res) => {
    res.status(404).send('File not found');
});

app.listen(PORT, () => {
    console.log(`HIVE Frontend server running on http://localhost:${PORT}`);
    console.log('This server properly handles SPA routing - no more 404 errors on refresh!');
});