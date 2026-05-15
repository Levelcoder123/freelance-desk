import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import * as profileApi from '../api/profile'

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
  })
}

export function useUpdateProfile() {
  const qc      = useQueryClient()
  const setUser = useAuthStore(s => s.setUser)
  const user    = useAuthStore(s => s.user)

  return useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: (updated) => {
      // Sync auth store so topbar reflects changes immediately
      setUser({ ...user, ...updated })
      qc.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: profileApi.changePassword,
  })
}