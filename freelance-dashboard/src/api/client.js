import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
})

// Attach token to every request
api.interceptors.request.use(config => {
    const token = useAuthStore.getState().token
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// Auto-refresh on 401, then retry original request
let refreshing = false
let queue = []

api.interceptors.response.use(
    res => res,
    async err => {
        const original = err.config
        if (err.response?.status === 401 && !original._retry) {
            if (refreshing) {
                return new Promise((resolve, reject) => {
                    queue.push({ resolve, reject })
                })
            }
            original._retry = true
            refreshing = true
            try {
                const { data } = await axios.post('/api/v1/auth/refresh', {
                    refresh_token: useAuthStore.getState().refreshToken,
                })
                useAuthStore.getState().setTokens(
                    data.accessToken || data.access_token,
                    data.refreshToken || data.refresh_token
                )
                const retried = await api(original)
                queue.forEach(p => p.resolve(retried))
                queue = []
                return retried
            } catch (e) {
                queue.forEach(p => p.reject(e))
                queue = []
                useAuthStore.getState().logout()
                window.location.href = '/login'
            } finally {
                refreshing = false
            }
        }
        return Promise.reject(err)
    }
)

export default api
