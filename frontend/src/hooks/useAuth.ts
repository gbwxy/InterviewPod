import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { tokenStorage } from '../api/request';
import * as authApi from '../api/auth';
import type { UserInfoResponse } from '../api/auth';

export interface AuthState {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: UserInfoResponse | null;
}

export interface AuthActions {
  login: (response: authApi.AuthResponse) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export type AuthContextValue = AuthState & AuthActions;

// ===== Context =====
export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

// ===== Hook（用于 AuthProvider 内部状态管理）=====
export function useAuthState(): AuthContextValue {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<UserInfoResponse | null>(null);

  // 应用启动时检查登录状态
  useEffect(() => {
    const accessToken = tokenStorage.getAccessToken();
    const refreshToken = tokenStorage.getRefreshToken();

    if (accessToken || refreshToken) {
      // 尝试获取用户信息
      authApi.getMe()
        .then((info) => {
          setUser(info);
          setIsLoggedIn(true);
        })
        .catch(() => {
          // Token 无效，清除状态
          tokenStorage.clear();
          setIsLoggedIn(false);
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((response: authApi.AuthResponse) => {
    tokenStorage.setAccessToken(response.accessToken);
    tokenStorage.setRefreshToken(response.refreshToken);
    setIsLoggedIn(true);
    // 登录后获取完整用户信息
    authApi.getMe()
      .then((info) => setUser(info))
      .catch(() => {
        // 即使获取用户信息失败，登录状态也已建立
        setUser({
          userId: response.userId,
          phone: response.phone,
          username: response.username,
          role: response.role,
          subscriptionExpiredAt: null,
          quotaRemaining: {},
        });
      });
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // 即使登出 API 失败，也清除本地状态
    } finally {
      tokenStorage.clear();
      setIsLoggedIn(false);
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const info = await authApi.getMe();
      setUser(info);
    } catch {
      // 刷新用户信息失败，保持当前状态
    }
  }, []);

  return {
    isLoggedIn,
    isLoading,
    user,
    login,
    logout,
    refreshUser,
  };
}
