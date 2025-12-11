import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { IApiResponse, IAuthResponse } from '../types';

export class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = process.env.API_URL || 'http://localhost:5000') {
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

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse<IApiResponse>) => {
        return response;
      },
      async (error) => {
        if (error.response?.status === 401) {
          // Handle token refresh or logout
          this.handleAuthError();
        }
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    // Platform-specific token retrieval
    if (typeof window !== 'undefined') {
      // Web environment
      return localStorage.getItem('token');
    } else {
      // Mobile environment - will be implemented by mobile app
      return null;
    }
  }

  private setAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
      // Web environment
      localStorage.setItem('token', token);
    } else {
      // Mobile environment - will be implemented by mobile app
    }
  }

  private removeAuthToken(): void {
    if (typeof window !== 'undefined') {
      // Web environment
      localStorage.removeItem('token');
    } else {
      // Mobile environment - will be implemented by mobile app
    }
  }

  private handleAuthError(): void {
    this.removeAuthToken();
    // Platform-specific navigation to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  // Generic request methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<IApiResponse<T>>> {
    return this.client.get(url, config);
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<IApiResponse<T>>> {
    return this.client.post(url, data, config);
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<IApiResponse<T>>> {
    return this.client.put(url, data, config);
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<IApiResponse<T>>> {
    return this.client.patch(url, data, config);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<IApiResponse<T>>> {
    return this.client.delete(url, config);
  }

  // Auth methods
  async login(email: string, password: string): Promise<IAuthResponse> {
    const response = await this.post<IAuthResponse>('/auth/login', { email, password });
    if (response.data.success && response.data.data) {
      this.setAuthToken(response.data.data.token);
      return response.data.data;
    }
    throw new Error(response.data.message || 'Login failed');
  }

  async register(userData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<IAuthResponse> {
    const response = await this.post<IAuthResponse>('/auth/register', userData);
    if (response.data.success && response.data.data) {
      this.setAuthToken(response.data.data.token);
      return response.data.data;
    }
    throw new Error(response.data.message || 'Registration failed');
  }

  async logout(): Promise<void> {
    try {
      await this.post('/auth/logout');
    } finally {
      this.removeAuthToken();
    }
  }

  async getMe(): Promise<any> {
    const response = await this.get('/auth/me');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to get user data');
  }

  // Health check
  async healthCheck(): Promise<any> {
    const response = await this.client.get('/health');
    return response.data;
  }

  // Update base URL (useful for mobile apps)
  updateBaseURL(newBaseURL: string): void {
    this.baseURL = newBaseURL;
    this.client.defaults.baseURL = `${this.baseURL}/api`;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export for platform-specific implementations
export default ApiClient; 