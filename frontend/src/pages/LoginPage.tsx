import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as authApi from '../api/auth';
import { useAuth } from '../hooks/useAuth';

type LoginTab = 'sms' | 'phone-password' | 'username-password';

const PHONE_RE = /^1[3-9]\d{9}$/;

export default function LoginPage() {
  const [tab, setTab] = useState<LoginTab>('sms');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isLoggedIn, isLoading: authLoading } = useAuth();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const redirect = searchParams.get('redirect') || '/';

  // 已登录用户自动跳转
  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      navigate(redirect, { replace: true });
    }
  }, [authLoading, isLoggedIn, navigate, redirect]);

  // 正在检查登录状态时显示加载
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  // 已登录则不渲染登录页
  if (isLoggedIn) {
    return null;
  }

  // 发送验证码
  const handleSendCode = async () => {
    if (!PHONE_RE.test(phone)) {
      setError('请输入有效的中国大陆手机号');
      return;
    }
    setError(null);
    try {
      await authApi.sendSmsCode(phone);
      setCountdown(60);
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '发送失败');
    }
  };

  // 登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let response: authApi.AuthResponse;
      if (tab === 'sms') {
        if (!PHONE_RE.test(phone)) throw new Error('请输入有效的中国大陆手机号');
        if (!code || code.length !== 6) throw new Error('请输入6位验证码');
        response = await authApi.loginBySms(phone, code);
      } else if (tab === 'phone-password') {
        if (!PHONE_RE.test(phone)) throw new Error('请输入有效的中国大陆手机号');
        if (!password) throw new Error('请输入密码');
        response = await authApi.loginByPhonePassword(phone, password);
      } else {
        if (!username) throw new Error('请输入用户名');
        if (!password) throw new Error('请输入密码');
        response = await authApi.loginByUsernamePassword(username, password);
      }

      login(response);
      navigate(redirect, { replace: true });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const tabLabels: Record<LoginTab, string> = {
    'sms': '验证码登录',
    'phone-password': '手机号密码',
    'username-password': '用户名密码',
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">InterviewPod</h1>
          <p className="text-gray-500 mt-1">AI 智能面试平台</p>
        </div>

        {/* Tab 切换 */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          {(Object.keys(tabLabels) as LoginTab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === t
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tabLabels[t]}
            </button>
          ))}
        </div>

        {/* 登录表单 */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* 手机号字段（SMS 和 phone-password 模式） */}
          {(tab === 'sms' || tab === 'phone-password') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="请输入手机号"
                maxLength={11}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* 验证码字段（SMS 模式） */}
          {tab === 'sms' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">验证码</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6位验证码"
                  maxLength={6}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={countdown > 0 || !PHONE_RE.test(phone)}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 whitespace-nowrap"
                >
                  {countdown > 0 ? `${countdown}s后重发` : '发送验证码'}
                </button>
              </div>
            </div>
          )}

          {/* 用户名字段（username-password 模式） */}
          {tab === 'username-password' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* 密码字段（phone-password 和 username-password 模式） */}
          {(tab === 'phone-password' || tab === 'username-password') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          首次使用验证码登录即自动注册账号
        </p>
      </div>
    </div>
  );
}
