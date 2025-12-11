import axios from 'axios';
export class ApiClient {
    constructor(baseURL = process.env.API_URL || 'http://localhost:5000') {
        this.baseURL = baseURL;
        this.client = axios.create({
            baseURL: `${this.baseURL}/api`,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true,
        });
        this.setupInterceptors();
    }
    setupInterceptors() {
        // Request interceptor
        this.client.interceptors.request.use((config) => {
            // Add auth token if available
            const token = this.getAuthToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        }, (error) => {
            return Promise.reject(error);
        });
        // Response interceptor
        this.client.interceptors.response.use((response) => {
            return response;
        }, async (error) => {
            if (error.response?.status === 401) {
                // Handle token refresh or logout
                this.handleAuthError();
            }
            return Promise.reject(error);
        });
    }
    getAuthToken() {
        // Platform-specific token retrieval
        if (typeof window !== 'undefined') {
            // Web environment
            return localStorage.getItem('token');
        }
        else {
            // Mobile environment - will be implemented by mobile app
            return null;
        }
    }
    setAuthToken(token) {
        if (typeof window !== 'undefined') {
            // Web environment
            localStorage.setItem('token', token);
        }
        else {
            // Mobile environment - will be implemented by mobile app
        }
    }
    removeAuthToken() {
        if (typeof window !== 'undefined') {
            // Web environment
            localStorage.removeItem('token');
        }
        else {
            // Mobile environment - will be implemented by mobile app
        }
    }
    handleAuthError() {
        this.removeAuthToken();
        // Platform-specific navigation to login
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    }
    // Generic request methods
    async get(url, config) {
        return this.client.get(url, config);
    }
    async post(url, data, config) {
        return this.client.post(url, data, config);
    }
    async put(url, data, config) {
        return this.client.put(url, data, config);
    }
    async patch(url, data, config) {
        return this.client.patch(url, data, config);
    }
    async delete(url, config) {
        return this.client.delete(url, config);
    }
    // Auth methods
    async login(email, password) {
        const response = await this.post('/auth/login', { email, password });
        if (response.data.success && response.data.data) {
            this.setAuthToken(response.data.data.token);
            return response.data.data;
        }
        throw new Error(response.data.message || 'Login failed');
    }
    async register(userData) {
        const response = await this.post('/auth/register', userData);
        if (response.data.success && response.data.data) {
            this.setAuthToken(response.data.data.token);
            return response.data.data;
        }
        throw new Error(response.data.message || 'Registration failed');
    }
    async logout() {
        try {
            await this.post('/auth/logout');
        }
        finally {
            this.removeAuthToken();
        }
    }
    async getMe() {
        const response = await this.get('/auth/me');
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Failed to get user data');
    }
    // Health check
    async healthCheck() {
        const response = await this.client.get('/health');
        return response.data;
    }
    // Update base URL (useful for mobile apps)
    updateBaseURL(newBaseURL) {
        this.baseURL = newBaseURL;
        this.client.defaults.baseURL = `${this.baseURL}/api`;
    }
}
// Export singleton instance
export const apiClient = new ApiClient();
// Export for platform-specific implementations
export default ApiClient;
//# sourceMappingURL=client.js.map