// Auto-generated dev configuration - import this in your API calls
export const devConfig = {
  backendUrl: 'http://172.19.58.21:8000',
  frontendUrl: 'http://172.19.58.21:3000',
  apiUrl: 'http://172.19.58.21:8000/api',
  wslIp: '172.19.58.21',
  backendPort: 8000,
  frontendPort: 3000,
  isWSL: true
};

// For CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { devConfig };
}

// For direct script inclusion
if (typeof window !== 'undefined') {
  window.devConfig = devConfig;
}
