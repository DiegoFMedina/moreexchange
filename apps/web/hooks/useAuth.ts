// PATH: apps/web/hooks/useAuth.ts
// DESC: Hook de autenticación — login, registro, logout y estado de usuario actual

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { storeTokens, clearTokens, getCurrentUser } from '@/lib/auth';
import type { ApiResponse, User } from '@/types';

interface LoginPayload { email: string; password: string }
interface RegisterPayload { email: string; password: string; firstName: string; lastName: string; phone?: string }

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
    staleTime: Infinity,
  });

  const login = useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', payload);
      return data.data;
    },
    onSuccess: (data) => {
      storeTokens(data.accessToken, data.refreshToken);
      queryClient.setQueryData(['currentUser'], getCurrentUser());
      router.push(data.user.role === 'ADMIN' ? '/admin' : '/exchange');
    },
  });

  const register = useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/register', payload);
      return data.data;
    },
    onSuccess: (data) => {
      storeTokens(data.accessToken, data.refreshToken);
      queryClient.setQueryData(['currentUser'], getCurrentUser());
      router.push('/exchange');
    },
  });

  const logout = useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: () => {
      clearTokens();
      queryClient.clear();
      router.push('/');
    },
  });

  return { currentUser, login, register, logout };
}
