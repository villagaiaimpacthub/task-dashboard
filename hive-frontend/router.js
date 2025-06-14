// Simple Client-Side Router for HIVE
class HIVERouter {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.init();
    }

    init() {
        // Listen for browser navigation
        window.addEventListener('popstate', () => this.handleRoute());
        
        // Don't handle initial route until routes are registered
        // this.handleRoute();
    }

    // Register a route handler
    register(path, handler) {
        this.routes[path] = handler;
    }

    // Navigate to a route
    navigate(path) {
        history.pushState({}, '', path);
        this.handleRoute();
    }

    // Handle current route
    handleRoute() {
        const path = window.location.pathname;
        
        // Clean up previous route
        this.cleanup();
        
        this.currentRoute = path;

        // Parse route parameters
        const params = this.parseParams(path);

        // Find matching route handler
        const handler = this.findHandler(path);
        
        if (handler) {
            handler(params);
        } else {
            this.handleNotFound();
        }
    }

    // Clean up current route (called before navigation)
    cleanup() {
        // Clean up task page chat if we're leaving a task page
        if (window.taskPageManager) {
            window.taskPageManager.cleanupChat();
        }
    }

    // Parse parameters from path
    parseParams(path) {
        const params = {};
        
        // Handle /task/{id} pattern
        const taskMatch = path.match(/^\/task\/(.+)$/);
        if (taskMatch) {
            params.id = taskMatch[1];
            params.type = 'task';
        }

        // Handle /project/{id} pattern  
        const projectMatch = path.match(/^\/project\/(.+)$/);
        if (projectMatch) {
            params.id = projectMatch[1];
            params.type = 'project';
        }

        // Handle /protocol/{id} pattern
        const protocolMatch = path.match(/^\/protocol\/(.+)$/);
        if (protocolMatch) {
            params.protocolId = protocolMatch[1];
            params.type = 'protocol';
        }

        // Handle /implementation/{id} pattern
        const implementationMatch = path.match(/^\/implementation\/(.+)$/);
        if (implementationMatch) {
            params.implementationId = implementationMatch[1];
            params.type = 'implementation';
        }

        return params;
    }

    // Find appropriate handler for path
    findHandler(path) {
        // Exact match first
        if (this.routes[path]) {
            return this.routes[path];
        }

        // Pattern matching
        if (path.startsWith('/task/')) {
            return this.routes['/task/:id'];
        }
        
        if (path.startsWith('/project/')) {
            return this.routes['/project/:id'];
        }

        if (path.startsWith('/protocol/')) {
            return this.routes['/protocol/:id'];
        }

        if (path.startsWith('/implementation/')) {
            return this.routes['/implementation/:id'];
        }

        return null;
    }

    // Handle 404 cases
    handleNotFound() {
        console.log('Route not found:', this.currentRoute);
        // Only redirect if we have routes registered
        if (Object.keys(this.routes).length > 0) {
            this.navigate('/');
        }
    }

    // Get current route info
    getCurrentRoute() {
        return {
            path: this.currentRoute,
            params: this.parseParams(this.currentRoute)
        };
    }
}

// Global router instance
const router = new HIVERouter();

// Make router available globally
window.router = router;