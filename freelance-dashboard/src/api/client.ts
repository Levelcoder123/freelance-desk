import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL as string,
})

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

// Attach token to every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// Auto-refresh on 401, then retry original request
let refreshing = false
let queue: { resolve: (value: any) => void; reject: (reason?: any) => void }[] = []

api.interceptors.response.use(
    res => res,
    async (err: AxiosError) => {
        const original = err.config as CustomAxiosRequestConfig
        
        // If it's a 401 and not a retry and not the login/refresh call itself
        if (err.response?.status === 401 && original && !original._retry && original.url && !original.url.includes('/auth/login')) {
            if (refreshing) {
                return new Promise((resolve, reject) => {
                    queue.push({ resolve, reject })
                })
            }
            original._retry = true
            refreshing = true
            try {
                // IMPORTANT: Use the full URL or the 'api' instance to ensure baseURL is used
                const { data } = await api.post('/auth/refresh', {
                    refresh_token: useAuthStore.getState().refreshToken,
                })
                
                // Set the new tokens in store
                useAuthStore.getState().setTokens(
                    data.access_token,
                    data.refresh_token
                )
                
                // Update the original request header with new token
                if (original.headers) {
                    original.headers.Authorization = `Bearer ${data.access_token}`
                }
                
                const retried = await api(original)
                queue.forEach(p => p.resolve(retried))
                queue = []
                return retried
            } catch (e) {
                queue.forEach(p => p.reject(e))
                queue = []
                useAuthStore.getState().logout()
            } finally {
                refreshing = false
            }
        }
        return Promise.reject(err)
    }
)

export default api
