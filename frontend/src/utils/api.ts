import axios from 'axios';
import { store } from '../redux/store';
import { refreshAccessToken, logout } from '../redux/authSlice';

const apiBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${apiBaseURL}/api`,
  withCredentials: true, // Allow sending HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request Interceptor: Attach Access Token
api.interceptors.request.use(
  (config) => {
    // We get the latest state directly from the store
    const state = store.getState();
    const token = state.auth.token;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 and Silent Refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token using the HttpOnly cookie
        const res = await axios.post(
          `${apiBaseURL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = res.data.token;
        
        // Dispatch action to update token in Redux
        store.dispatch(refreshAccessToken(newToken));

        // Update the original request's authorization header and retry it
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails (e.g., Refresh Token expired), logout the user
        store.dispatch(logout());
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
