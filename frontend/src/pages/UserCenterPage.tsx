import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  User, Phone, Shield, Clock, LogOut, Crown, ChevronRight,
  KeyRound, Loader2,
} from 'lucide-react';
import { ROLE_LABELS, ROLE_COLORS, formatDateTime } from '../api/membership';
import * as authApi from '../api/auth';

export default function UserCenterPage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // 修改密码表单
  const [pwdPhone, setPwdPhone] = useState('');
  const [pwdCode, setPwdCode] = useState('');
  const [pwdNewPassword, setPwdNewPassword] = useState('');
  const [pwdCountdown, setPwdCountdown] = useState(0);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-zinc-600 dark:text-zinc-400 animate-spin" />
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  const handleSendCode = async () => {
    if (!pwdPhone || !/^1[3-9]\d{9}$/.test(pwdPhone)) {
      setPasswordError('请输入有效的手机号');
      return;
    }
    setPasswordError(null);
    try {
      await authApi.sendSmsCode(pwdPhone);
      setPwdCountdown(60);
      const timer = setInterval(() => {
        setPwdCountdown(prev => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (e: unknown) {
      setPasswordError(e instanceof Error ? e.message : '发送失败');
    }
  };

  const handleSetPassword = async () => {
    if (!pwdPhone || !/^1[3-9]\d{9}$/.test(pwdPhone)) {
      setPasswordError('请输入有效的手机号');
      return;
    }
    if (!pwdCode || pwdCode.length !== 6) {
      setPasswordError('请输入6位验证码');
      return;
    }
    if (!pwdNewPassword || pwdNewPassword.length < 8) {
      setPasswordError('密码至少8位，需包含字母和数字');
      return;
    }
    setPasswordLoading(true);
    setPasswordError(null);
    try {
      await authApi.setPassword(pwdPhone, pwdCode, pwdNewPassword);
      setPasswordSuccess(true);
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(false);
        setPwdPhone('');
        setPwdCode('');
        setPwdNewPassword('');
      }, 2000);
    } catch (e: unknown) {
      setPasswordError(e instanceof Error ? e.message : '设置失败');
    } finally {
      setPasswordLoading(false);
    }
  };

  const quotaLabels: Record<string, string> = {
    RESUME_UPLOAD: '简历上传(今日)',
    RESUME_TOTAL: '简历总数',
    TEXT_INTERVIEW: '文字面试(今日)',
    VOICE_INTERVIEW: '语音面试(今日)',
    KB_FILE_TOTAL: '知识库文件数',
    QA_ASSISTANT: '问答助手(今日)',
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2.5">
          <User className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          个人中心
        </h1>
        <p className="text-zinc-500 text-sm mt-1">管理账户信息与会员状态</p>
      </div>

      {/* 用户信息卡片 */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-5 mb-6">
        <div className="flex items-center gap-4">
          {/* 头像占位 */}
          <div className="w-14 h-14 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
            <User className="w-7 h-7 text-zinc-500 dark:text-zinc-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-semibold text-black dark:text-white truncate">
                {user.username || `用户${user.userId}`}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                {ROLE_LABELS[user.role]}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-zinc-500">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                {user.phone}
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                ID: {user.userId}
              </span>
            </div>
          </div>
          {(user.role === 'PRO' || user.role === 'MAX_PLUS') && user.subscriptionExpiredAt && (
            <div className="text-xs text-zinc-500 flex items-center gap-1 flex-shrink-0">
              <Clock className="w-3.5 h-3.5" />
              到期: {formatDateTime(user.subscriptionExpiredAt)}
            </div>
          )}
        </div>
      </div>

      {/* 配额信息 */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-5 mb-6">
        <h2 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-4">
          使用配额
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(user.quotaRemaining || {}).map(([key, value]) => (
            <div
              key={key}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black/50 p-3"
            >
              <div className="text-xs text-zinc-500 mb-1">{quotaLabels[key] || key}</div>
              <div className="text-lg font-semibold text-black dark:text-white">
                {value === -1 ? '∞' : value === 0 ? (
                  <span className="text-red-500">0</span>
                ) : value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 操作区 */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
        {/* 升级会员 */}
        {user.role === 'LITE' && (
          <button
            onClick={() => navigate('/membership')}
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-left border-b border-zinc-200 dark:border-zinc-800"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-black dark:text-white">升级会员</div>
              <div className="text-xs text-zinc-500">解锁更多配额和高级功能</div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-400" />
          </button>
        )}

        {/* 管理订阅 */}
        {(user.role === 'PRO' || user.role === 'MAX_PLUS') && (
          <button
            onClick={() => navigate('/membership')}
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-left border-b border-zinc-200 dark:border-zinc-800"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <Crown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-black dark:text-white">管理订阅</div>
              <div className="text-xs text-zinc-500">续费或升级套餐</div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-400" />
          </button>
        )}

        {/* 修改密码 */}
        <button
          onClick={() => setShowPasswordModal(true)}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-left border-b border-zinc-200 dark:border-zinc-800"
        >
          <div className="w-9 h-9 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
            <KeyRound className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-black dark:text-white">设置/修改密码</div>
            <div className="text-xs text-zinc-500">通过短信验证码设置登录密码</div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-400" />
        </button>

        {/* 刷新用户信息 */}
        <button
          onClick={refreshUser}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-left border-b border-zinc-200 dark:border-zinc-800"
        >
          <div className="w-9 h-9 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-black dark:text-white">刷新信息</div>
            <div className="text-xs text-zinc-500">重新获取账户配额数据</div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-400" />
        </button>

        {/* 退出登录 */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
            <LogOut className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-red-600 dark:text-red-400">
              {loggingOut ? '退出中...' : '退出登录'}
            </div>
          </div>
        </button>
      </div>

      {/* 修改密码弹窗 */}
      {showPasswordModal && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-50"
            onClick={() => setShowPasswordModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl max-w-md w-full p-6"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-base font-semibold text-black dark:text-white mb-5">
                设置/修改密码
              </h3>

              {passwordSuccess ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <KeyRound className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">密码设置成功！</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                      手机号 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={pwdPhone}
                      onChange={e => setPwdPhone(e.target.value)}
                      placeholder="请输入手机号"
                      maxLength={11}
                      className="w-full px-3 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700
                        bg-zinc-200 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-200
                        placeholder:text-zinc-500 focus:outline-none focus:ring-1
                        focus:ring-zinc-500 focus:border-zinc-500 transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                      验证码 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={pwdCode}
                        onChange={e => setPwdCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="6位验证码"
                        maxLength={6}
                        className="flex-1 px-3 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700
                          bg-zinc-200 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-200
                          placeholder:text-zinc-500 focus:outline-none focus:ring-1
                          focus:ring-zinc-500 focus:border-zinc-500 transition-shadow"
                      />
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={pwdCountdown > 0 || !/^1[3-9]\d{9}$/.test(pwdPhone)}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 whitespace-nowrap"
                      >
                        {pwdCountdown > 0 ? `${pwdCountdown}s` : '发送'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                      新密码 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={pwdNewPassword}
                      onChange={e => setPwdNewPassword(e.target.value)}
                      placeholder="至少8位，包含字母和数字"
                      className="w-full px-3 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700
                        bg-zinc-200 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-200
                        placeholder:text-zinc-500 focus:outline-none focus:ring-1
                        focus:ring-zinc-500 focus:border-zinc-500 transition-shadow"
                    />
                  </div>

                  {passwordError && (
                    <div className="text-red-500 text-xs bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg px-3 py-2">
                      {passwordError}
                    </div>
                  )}

                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      onClick={() => {
                        setShowPasswordModal(false);
                        setPasswordError(null);
                        setPwdPhone('');
                        setPwdCode('');
                        setPwdNewPassword('');
                      }}
                      disabled={passwordLoading}
                      className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg font-medium text-sm hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all disabled:opacity-40"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSetPassword}
                      disabled={passwordLoading}
                      className="px-4 py-2 text-zinc-900 dark:text-white rounded-lg font-medium text-sm bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all disabled:opacity-40"
                    >
                      {passwordLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          提交中...
                        </span>
                      ) : '确认'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
