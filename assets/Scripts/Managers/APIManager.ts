import { DEBUG } from "cc/env";
import { APIFakeData } from "./APIFakeData";
import { CurrentEnviroment } from "../Constant/Constants";
import { UserModel } from "../Models/UserModel";

// Types and Interfaces
export interface APIResponse<T = any> {
    statusCode: number;
    message?: string;
    error?: string;
    data?: T;
}

export interface APIError extends APIResponse {
    statusCode: number;
    message: string;
    error?: string;
}

export interface APIConfig {
    baseURL: string;
    timeout: number;
    maxRetries: number;
    maxTokenRetries: number;
    enableLogging: boolean;
}

export interface RequestConfig {
    method: string;
    headers?: HeadersInit;
    body?: BodyInit;
    retryCount?: number;
}

export interface RequestInterceptor {
    onRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
    onResponse?: (response: Response) => Response | Promise<Response>;
    onError?: (error: APIError) => APIError | Promise<APIError>;
}

// Declare CryptoJS type
declare const CryptoJS: any;

class APIManager {
    private config: APIConfig;
    private token: string = '';
    private apiKey: string = '';
    private authKey: string = '';
    private retakeTokenTimesThisSession: number = 0;
    private retakeToken: () => Promise<boolean> = null!;
    private interceptors: RequestInterceptor[] = [];
    private isFakeData: boolean = false;

    constructor(config: Partial<APIConfig> = {}) {
        this.config = {
            baseURL: '',
            timeout: 30000,
            maxRetries: 3,
            maxTokenRetries: 5,
            enableLogging: true,
            ...config
        };
    }

    // Configuration Methods
    public setConfig(config: Partial<APIConfig>): void {
        this.config = { ...this.config, ...config };
    }

    public getConfig(): APIConfig {
        return { ...this.config };
    }

    // Token Management
    public setToken(token: string): void {
        this.token = token;
    }

    public getToken(): string {
        return this.token;
    }

    public setApiKey(key: string): void {
        this.apiKey = key;
    }

    public setAuthKey(key: string): void {
        this.authKey = key;
    }

    // Interceptor Management
    public addInterceptor(interceptor: RequestInterceptor): void {
        this.interceptors.push(interceptor);
    }

    public removeInterceptor(interceptor: RequestInterceptor): void {
        const index = this.interceptors.indexOf(interceptor);
        if (index !== -1) {
            this.interceptors.splice(index, 1);
        }
    }

    // Logging
    private log(message: string, data?: any): void {
        if (this.config.enableLogging && CurrentEnviroment.LOG) {
            console.log(`[API] ${message}`, data ? data : '');
        }
    }

    private error(message: string, error?: any): void {
        if (this.config.enableLogging && CurrentEnviroment.LOG) {
            console.error(`[API] ${message}`, error ? error : '');
        }
    }

    // Core Request Method
    public async request<T>(
        endpoint: string,
        config: RequestConfig,
        callback: (data: T) => void,
        failHandler: (error: APIError) => void,
        encryptionKey: string = this.apiKey
    ): Promise<void> {
        try {
            // Apply request interceptors
            let finalConfig = config;
            for (const interceptor of this.interceptors) {
                if (interceptor.onRequest) {
                    finalConfig = await interceptor.onRequest(finalConfig);
                }
            }

            const response = await this.fetchWithRetry(endpoint, finalConfig);
            
            // Apply response interceptors
            let finalResponse = response;
            for (const interceptor of this.interceptors) {
                if (interceptor.onResponse) {
                    finalResponse = await interceptor.onResponse(finalResponse);
                }
            }

            if (!finalResponse.ok) {
                throw {
                    statusCode: finalResponse.status,
                    message: 'Network response was not ok'
                };
            }

            const data = await finalResponse.json();
            const apiResponse = data as APIResponse<T>;

            if (apiResponse.statusCode && apiResponse.statusCode !== 200) {
                throw {
                    statusCode: apiResponse.statusCode,
                    message: apiResponse.message || 'Unknown error',
                    error: apiResponse.error
                };
            }

            // Decrypt data if needed
            if (apiResponse.data && encryptionKey) {
                try {
                    const bytes = CryptoJS.AES.decrypt(apiResponse.data, encryptionKey);
                    const original = bytes.toString(CryptoJS.enc.Utf8);
                    apiResponse.data = JSON.parse(original);
                } catch (e) {
                    this.error('Decryption error', e);
                }
            }

            callback(apiResponse.data as T);
        } catch (error) {
            const apiError = error as APIError;
            
            // Apply error interceptors
            for (const interceptor of this.interceptors) {
                if (interceptor.onError) {
                    await interceptor.onError(apiError);
                }
            }

            this.error('Request failed', apiError);
            failHandler(apiError);
        }
    }

    private async fetchWithRetry(
        endpoint: string,
        config: RequestConfig,
        retries: number = this.config.maxRetries
    ): Promise<Response> {
        let attempts = 0;
        
        while (attempts < retries) {
            try {
                const url = this.config.baseURL + endpoint;
                this.log(`Attempt ${attempts + 1}: Fetching ${url}`);
                
                const response = await this.timeoutPromise(fetch(url, config));
                
                if (response.status === 401 && this.retakeToken) {
                    this.log('Token expired, attempting to refresh');
                    if (++this.retakeTokenTimesThisSession <= this.config.maxTokenRetries) {
                        const success = await this.retakeToken();
                        if (success) {
                            config.headers = this.getHeaders();
                            continue;
                        }
                    }
                }
                
                if (response.ok) return response;
            } catch (error) {
                if (attempts === retries - 1) throw error;
            }
            
            attempts++;
            this.log(`Retry attempt ${attempts}`);
        }
        
        throw {
            statusCode: 666,
            message: 'All retries failed'
        };
    }

    private timeoutPromise(fetchPromise: Promise<Response>): Promise<Response> {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(
                () => reject(new Error('Request timed out')),
                this.config.timeout
            );
            
            fetchPromise
                .then(res => {
                    clearTimeout(timeoutId);
                    resolve(res);
                })
                .catch(err => {
                    clearTimeout(timeoutId);
                    reject(err);
                });
        });
    }

    public getHeaders(): HeadersInit {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }
}

// Singleton instance
const api = new APIManager();

// Export configuration functions
export function setAPIManagerConfig(config: Partial<APIConfig>): void {
    api.setConfig(config);
}

export function setAPIManagerURL(url: string): void {
    api.setConfig({ baseURL: url });
}

export function setToken(token: string): void {
    api.setToken(token);
}

export function setApiKey(key: string): void {
    api.setApiKey(key);
}

export function setAuthKey(key: string): void {
    api.setAuthKey(key);
}

// Export request methods
export function requestUserInfo(callback: (data: UserModel, error: APIError) => void): void {
    const apiName = "users/info";
    
    if (isFakeData && DEBUG) {
        return callback?.(APIFakeData[apiName], null);
    }
    
    api.request<UserModel>(
        apiName,
        {
            method: 'GET',
            headers: api.getHeaders()
        },
        data => callback?.(data, null),
        error => callback?.(null, error)
    );
}

// Initialize fake data if needed
let isFakeData = false;
if (isFakeData && DEBUG) {
    setFakeData();
}

export function setFakeData(): void {
    isFakeData = true;
    APIFakeData.isFakeData = true;
}

// Export the API instance
export default api;
