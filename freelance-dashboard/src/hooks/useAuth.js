import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { login as loginApi, logout as logoutApi } from "../api/auth"
import { getProfile as me } from "../api/profile"

export function useMe() {
    const token = useAuthStore(s => s.token)
    return useQuery({
        queryKey: ['me'],
        queryFn: me,
        enabled: !!token,
        staleTime: 5 * 60 * 1000,
    })
}

export function useLogin() {
    const { setTokens, setUser } = useAuthStore()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: loginApi,
        onSuccess: async (data) => {
            setTokens(data.accessToken, data.refreshToken)
            const user = await me()
            setUser(user)
            navigate('/dashboard')
        },
    })
}

export function useLogout() {
    const { logout } = useAuthStore()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: logoutApi,
        onSettled: () => {
            logout()
            navigate('/login')
        },
    })
}
