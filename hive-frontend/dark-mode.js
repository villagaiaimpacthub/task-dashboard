// Dark Mode Manager
class DarkModeManager {
    constructor() {
        this.isDarkMode = false;
        this.init();
    }

    init() {
        // Check for saved preference or default to dark mode (new beautiful theme)
        const savedMode = localStorage.getItem('darkMode');
        if (savedMode === 'false') {
            this.disableDarkMode(false);
        } else {
            // Default to dark mode to show off the new beautiful theme
            this.enableDarkMode(false);
        }

        // Setup theme toggle listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for theme toggle changes
        document.addEventListener('change', (e) => {
            if (e.target && e.target.id === 'themeToggle') {
                this.toggleDarkMode();
            }
        });
    }

    toggleDarkMode() {
        if (this.isDarkMode) {
            this.disableDarkMode();
        } else {
            this.enableDarkMode();
        }
    }

    enableDarkMode(save = true) {
        document.body.classList.add('dark-mode');
        this.isDarkMode = true;
        
        // Update all theme toggles
        const themeToggles = document.querySelectorAll('#themeToggle');
        themeToggles.forEach(toggle => {
            toggle.checked = true;
        });

        if (save) {
            localStorage.setItem('darkMode', 'true');
            this.showNotification('Dark mode enabled');
        }
    }

    disableDarkMode(save = true) {
        document.body.classList.remove('dark-mode');
        this.isDarkMode = false;
        
        // Update all theme toggles
        const themeToggles = document.querySelectorAll('#themeToggle');
        themeToggles.forEach(toggle => {
            toggle.checked = false;
        });

        if (save) {
            localStorage.setItem('darkMode', 'false');
            this.showNotification('Light mode enabled');
        }
    }

    showNotification(message) {
        // Use app's notification system if available
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message);
        }
    }

    // Get current mode
    getMode() {
        return this.isDarkMode ? 'dark' : 'light';
    }
}

// Global dark mode manager instance
const darkModeManager = new DarkModeManager();