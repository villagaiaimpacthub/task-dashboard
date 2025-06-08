// Auto-generated connection test
const testConnection = async () => {
  // Try to load from environment first, then fallback to config
  const backendUrl = process.env.VITE_API_URL || 
                    process.env.REACT_APP_API_URL || 
                    process.env.BACKEND_URL || 
                    'http://localhost:8000';
  
  console.log('Testing connection...');
  console.log('Backend URL:', backendUrl);
  console.log('WSL IP detected:', process.env.WSL_IP || 'Not set');
  
  try {
    const response = await fetch(`${backendUrl}/health`);
    console.log('✅ Backend connection successful');
    console.log('Response status:', response.status);
  } catch (error) {
    console.log('❌ Backend connection failed:', error.message);
    console.log('Make sure your backend is running and accessible');
  }
};

// Export for use in your app
export { testConnection };

if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  testConnection();
} else {
  // Browser environment
  window.testConnection = testConnection;
}
