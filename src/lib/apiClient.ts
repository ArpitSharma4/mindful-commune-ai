export async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  // Get the auth token from localStorage
  const token = localStorage.getItem('authToken');
  
  // Prepare headers with authentication
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  console.log('🌐 API Request:', {
    url,
    method: options.method || 'GET',
    hasToken: !!token,
    headers: Object.keys(headers)
  });
  
  const response = await fetch(url, {
    headers: { ...headers, ...(options.headers || {}) },
    ...options,
  });
  
  console.log('📡 API Response:', {
    url,
    status: response.status,
    statusText: response.statusText,
    ok: response.ok
  });
  
  if (!response.ok) {
    const text = await response.text();
    console.error('❌ API Error:', {
      url,
      status: response.status,
      statusText: response.statusText,
      errorText: text
    });
    
    // Handle token expiration
    if (response.status === 401) {
      console.log('🔐 Token expired or invalid, clearing auth data');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      // Dispatch event to notify components of auth state change
      window.dispatchEvent(new Event('authStateChanged'));
    }
    
    throw new Error(`API error: ${response.status} ${response.statusText}${text ? ` - ${text}` : ''}`);
  }
  return response.json() as Promise<T>;
}
