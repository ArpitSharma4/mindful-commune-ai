interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
  headers?: Record<string, string>;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth token if available
  const token = localStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  // Handle request body
  if (options.body) {
    config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    
    // Handle 401 Unauthorized - clear token and redirect to login
    if (response.status === 401) {
      localStorage.removeItem('authToken');
      // You might want to redirect to login here if using client-side routing
      // window.location.href = '/login';
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(
        errorData.message || `API request failed with status ${response.status}`
      );
      (error as any).response = response;
      (error as any).data = errorData;
      throw error;
    }

    // Handle empty responses (e.g., 204 No Content)
    if (response.status === 204) {
      return {} as T;
    }

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return (await response.text()) as any;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Helper HTTP methods
export const get = <T = any>(endpoint: string, options: Omit<ApiRequestOptions, 'method'> = {}) =>
  apiRequest<T>(endpoint, { ...options, method: 'GET' });

export const post = <T = any>(
  endpoint: string,
  body?: any,
  options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
) => apiRequest<T>(endpoint, { ...options, method: 'POST', body });

export const put = <T = any>(
  endpoint: string,
  body?: any,
  options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
) => apiRequest<T>(endpoint, { ...options, method: 'PUT', body });

export const del = <T = any>(endpoint: string, options: Omit<ApiRequestOptions, 'method'> = {}) =>
  apiRequest<T>(endpoint, { ...options, method: 'DELETE' });

// Auth helpers
export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  if (!token) return false;
  
  // Simple check for JWT expiration (if token is a JWT)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch (e) {
    return false;
  }
};
