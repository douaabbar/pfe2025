import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
    // Allow configurable API URL with multiple fallbacks
    baseURL: process.env.REACT_APP_API_URL || window.API_URL || 'http://localhost:5000',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
    },
    withCredentials: true // Enable sending cookies with requests
});

// Log API configuration on startup
console.log("API configured with baseURL:", api.defaults.baseURL);

// Add a request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        console.log("API Request:", config.method?.toUpperCase(), config.url);
        console.log("Request headers:", JSON.stringify(config.headers));
        
        if (config.data && typeof config.data === 'object') {
            const logData = { ...config.data };
            if (logData.profile_image) {
                logData.profile_image = logData.profile_image.substring(0, 30) + '...[truncated]';
            }
            if (logData.password) {
                logData.password = '******';
            }
            console.log("Request payload:", JSON.stringify(logData));
        }
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log("Authorization header set:", `Bearer ${token.substring(0, 15)}...`);
        } else {
            console.warn("No token found in localStorage");
        }
        
        return config;
    },
    (error) => {
        console.error("Request interceptor error:", error.message);
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
    (response) => {
        console.log("API Response:", response.status, response.config.method?.toUpperCase(), response.config.url);
        
        if (response.data) {
            const logData = { ...response.data };
            if (logData.profile_image) {
                logData.profile_image = logData.profile_image.substring(0, 30) + '...[truncated]';
            }
            console.log("Response data:", JSON.stringify(logData));
        }
        
        return response;
    },
    (error) => {
        console.error("API Error:", {
            url: error.config?.url,
            method: error.config?.method?.toUpperCase(),
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
        });
        
        if (error.response) {
            // Handle specific error cases
            switch (error.response.status) {
                case 401:
                    // Handle unauthorized
                    console.error('Unauthorized (401) - Clearing token and redirecting');
                    localStorage.removeItem('token');
                    // Only redirect to login if we're not already there
                    if (!window.location.pathname.includes('/login')) {
                        window.location.href = '/login';
                    }
                    break;
                case 403:
                    // Handle forbidden - user is authenticated but doesn't have permission
                    console.error('Access forbidden (403):', error.response.data);
                    break;
                case 404:
                    // Handle not found
                    console.error('Resource not found (404):', error.response.data);
                    break;
                case 500:
                    // Handle server error
                    console.error('Server error (500):', error.response.data);
                    break;
                default:
                    // Handle other errors
                    console.error(`API error (${error.response.status}):`, error.response.data);
                    break;
            }
        } else if (error.request) {
            // Handle network errors
            console.error('Network error - no response received:', error.request);
        } else {
            // Handle other errors
            console.error('Error setting up request:', error.message);
        }
        return Promise.reject(error);
    }
);

export default api; 