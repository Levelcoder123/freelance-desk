import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
    persist(
        set => ({
            token: null,
            refreshToken: null,
            user: null,
            setTokens: (token, refreshToken) => set({ token, refreshToken }),
            setUser: user => set({ user }),
            logout: () => set({ token: null, refreshToken: null, user: null }),
        }),
        { name: 'auth' }   // persisted to localStorage
    )
)
