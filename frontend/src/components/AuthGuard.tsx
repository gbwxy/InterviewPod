import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../constants/routes';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * 路由守卫：未登录用户重定向到 /login，登录后跳回原目标路由
 * 包裹在 Layout 中，保护所有需要认证的页面
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const { isLoggedIn, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-zinc-200 dark:border-zinc-800 border-t-zinc-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Navigate
        to={`${ROUTES.login}?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  return <>{children}</>;
}
