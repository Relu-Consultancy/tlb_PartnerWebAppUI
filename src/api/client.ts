const BASE_URL = 'https://tlb-api.reluconsultancy.in';

export const getAuthToken = () => localStorage.getItem('access_token');
export const setAuthToken = (token: string) => localStorage.setItem('access_token', token);
export const getRefreshToken = () => localStorage.getItem('refresh_token');
export const setRefreshToken = (token: string) => localStorage.setItem('refresh_token', token);
export const clearTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
};

export const apiClient = async (endpoint: string, options: RequestInit = {}) => {
    let token = getAuthToken();
    const headers: HeadersInit = {
        ...(options.headers || {}),
    };

    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401 && endpoint !== '/api/v1/auth/refresh-token/') {
        const refresh_token = getRefreshToken();
        if (refresh_token) {
            try {
                const refreshResponse = await fetch(`${BASE_URL}/api/v1/auth/refresh-token/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token })
                });

                if (refreshResponse.ok) {
                    const res = await refreshResponse.json();
                    const payload = res.data || res;
                    const access = payload.access_token || payload.access;
                    
                    if (access) {
                        setAuthToken(access);
                        // Retry original request
                        headers['Authorization'] = `Bearer ${access}`;
                        response = await fetch(`${BASE_URL}${endpoint}`, {
                            ...options,
                            headers,
                        });
                    } else {
                        clearTokens();
                    }
                } else {
                    clearTokens();
                }
            } catch (err) {
                clearTokens();
            }
        } else {
            clearTokens();
        }
    }

    return response;
};
