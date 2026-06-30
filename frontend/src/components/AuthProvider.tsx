import React from 'react';
import { AuthContext, useAuthState } from '../hooks/useAuth';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * 全局认证上下文提供者，包裹在 App 最外层
 */
export default function AuthProvider({ children }: AuthProviderProps) {
  const authState = useAuthState();
  return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>;
}
