import axios from 'axios';
import { store } from '../store';
import { setAccessToken, clearAuth } from '../store/authSlice';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true, // Crucial for refresh token cookies
});

api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const response = await axios.post('/auth/refresh', {}, { withCredentials: true });
        const { accessToken, user } = response.data;
        
        store.dispatch(setAccessToken(accessToken));
        if (user) {
          const { setAuth } = await import('../store/authSlice'); // Dynamic import to avoid circular dependency if any
          store.dispatch({ type: 'auth/setUser', payload: user });
        }
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        store.dispatch(clearAuth());
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
