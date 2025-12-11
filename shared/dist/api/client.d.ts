import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { IApiResponse, IAuthResponse } from '../types';
export declare class ApiClient {
    private client;
    private baseURL;
    constructor(baseURL?: string);
    private setupInterceptors;
    private getAuthToken;
    private setAuthToken;
    private removeAuthToken;
    private handleAuthError;
    get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<IApiResponse<T>>>;
    post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<IApiResponse<T>>>;
    put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<IApiResponse<T>>>;
    patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<IApiResponse<T>>>;
    delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<IApiResponse<T>>>;
    login(email: string, password: string): Promise<IAuthResponse>;
    register(userData: {
        username: string;
        email: string;
        password: string;
        firstName: string;
        lastName: string;
    }): Promise<IAuthResponse>;
    logout(): Promise<void>;
    getMe(): Promise<any>;
    healthCheck(): Promise<any>;
    updateBaseURL(newBaseURL: string): void;
}
export declare const apiClient: ApiClient;
export default ApiClient;
//# sourceMappingURL=client.d.ts.map