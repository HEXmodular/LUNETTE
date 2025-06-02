export class BaseApi {
    private static baseUrl = import.meta.env.DEV ? 'https://lunette.local/api' : '/api';

    private static async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    private static async handleFetchError(error: unknown): Promise<never> {
        if (error instanceof Error) {
            if (error.message === 'Failed to fetch') {
                throw new Error('Network error: Unable to connect to the server. Please check your connection.');
            }
            throw error;
        }
        throw new Error('An unexpected error occurred');
    }

    static async post<T>(endpoint: string, data: any): Promise<T> {
        try {
            const response = await fetch(`${this.baseUrl}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            return await this.handleResponse<T>(response);
        } catch (error) {
            return this.handleFetchError(error);
        }
    }

    static async get<T>(endpoint: string): Promise<T> {
        try {
            const response = await fetch(`${this.baseUrl}/${endpoint}`);
            return await this.handleResponse<T>(response);
        } catch (error) {
            return this.handleFetchError(error);
        }
        // return await Promise.resolve([] as T);
    }
} 