import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, User, Palette, BarChart3, Loader2, ExternalLink,
  Crown, CheckCircle, XCircle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import * as authApi from '../api/auth';
import { ROLE_LABELS, ROLE_COLORS } from '../api/membership';

type SettingsTab = 'account' | 'appearance' | 'usage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPasswordManage: () => void;
}

// ===== Quota labels & config =====
const QUOTA_CONFIG: Record<string, { label: string; isDaily: boolean; unsupportedForLite?: boolean }> = {
  RESUME_UPLOAD: { label: '简历上传', isDaily: true },
  RESUME_TOTAL: { label: '简历总数', isDaily: false },
  TEXT_INTERVIEW: { label: '文字面试', isDaily: true },
  VOICE_INTERVIEW: { label: '语音面试', isDaily: true, unsupportedForLite: true },
  KB_FILE_TOTAL: { label: '知识库文件', isDaily: false },
  QA_ASSISTANT: { label: '问答助手', isDaily: true },
};

export default function SettingsModal({ isOpen, onClose, onPasswordManage }: SettingsModalProps) {
  const { user, refreshUser } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  // Account tab state
  const [editUsername, setEditUsername] = useState(user?.username || '');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const USERNAME_RE = /^[a-zA-Z0-9_]{4,20}$/;

  const validateUsername = useCallback((value: string) => {
    if (!value || value.trim().length === 0) {
      return null; // Allow empty username
    }
    if (value.length < 4 || value.length > 20) {
      return '用户名须为 4-20 字符，仅支持字母、数字和下划线';
    }
    if (!USERNAME_RE.test(value)) {
      return '用户名须为 4-20 字符，仅支持字母、数字和下划线';
    }
    return null;
  }, []);

  const handleUsernameChange = (value: string) => {
    setEditUsername(value);
    if (value && value.trim().length > 0) {
      setUsernameError(validateUsername(value));
    } else {
      setUsernameError(null);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    const newUsername = editUsername.trim() || null;

    // Validate if not empty
    if (newUsername) {
      const error = validateUsername(newUsername);
      if (error) {
        setUsernameError(error);
        return;
      }
    }

    // No change
    if (newUsername === user.username) {
      onClose();
      return;
    }

    setSaving(true);
    setUsernameError(null);
    try {
      await authApi.updateUsername(newUsername || '');
      await refreshUser();
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '保存失败';
      setUsernameError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    if (tab === 'account') {
      setEditUsername(user?.username || '');
      setUsernameError(null);
      setSaveSuccess(false);
    }
  };

  const handleClose = () => {
    setUsernameError(null);
    setSaveSuccess(false);
    onClose();
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'account', label: '账户', icon: User },
    { id: 'appearance', label: '外观', icon: Palette },
    { id: 'usage', label: '用量', icon: BarChart3 },
  ];

  if (!isOpen || !user) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 z-[100]"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex"
            >
              {/* Left nav */}
              <div className="w-48 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3 flex flex-col">
                {/* User info */}
                <div className="px-3 py-3 mb-2">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-black dark:text-white truncate">
                        {user.username || `用户${user.userId}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 ml-10">
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${ROLE_COLORS[user.role]}`}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </div>
                </div>

                {/* Tab list */}
                <nav className="space-y-0.5">
                  {tabs.map((tab) => {
                    const active = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                          ${active
                            ? 'bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white'
                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                          }`}
                      >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Right content */}
              <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                  <h2 className="text-base font-semibold text-black dark:text-white">
                    {activeTab === 'account' && '账户设置'}
                    {activeTab === 'appearance' && '外观设置'}
                    {activeTab === 'usage' && '用量统计'}
                  </h2>
                  <button
                    onClick={handleClose}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* ===== Account Tab ===== */}
                  {activeTab === 'account' && (
                    <div>
                      <p className="text-sm text-zinc-500 mb-6">管理你的账户信息</p>

                      {saveSuccess ? (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                          </div>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">用户名已更新！</p>
                        </div>
                      ) : (
                        <div className="space-y-5">
                          {/* Username */}
                          <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                              名称
                            </label>
                            <input
                              type="text"
                              value={editUsername}
                              onChange={(e) => handleUsernameChange(e.target.value)}
                              placeholder="输入用户名（4-20字符，字母/数字/下划线）"
                              maxLength={20}
                              className="w-full px-3 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700
                                bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-200
                                placeholder:text-zinc-400 focus:outline-none focus:ring-2
                                focus:ring-zinc-500/30 focus:border-zinc-500 transition-shadow"
                            />
                            {usernameError && (
                              <p className="mt-1.5 text-xs text-red-500">{usernameError}</p>
                            )}
                            <p className="mt-1 text-xs text-zinc-400">
                              4-20字符，仅支持字母、数字和下划线
                            </p>
                          </div>

                          {/* Password */}
                          <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                              密码
                            </label>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700
                                bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-400">
                                ••••••••
                              </div>
                              <button
                                onClick={onPasswordManage}
                                className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium
                                  text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200
                                  rounded-lg border border-zinc-200 dark:border-zinc-700
                                  hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                              >
                                管理
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ===== Appearance Tab ===== */}
                  {activeTab === 'appearance' && (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <p className="text-sm text-zinc-500">自定义应用外观</p>
                      </div>

                      {/* Current theme display */}
                      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-black dark:text-white">主题模式</p>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              当前：{theme === 'dark' ? '深色模式' : '浅色模式'}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            theme === 'dark'
                              ? 'bg-zinc-800 text-zinc-300'
                              : 'bg-zinc-200 text-zinc-600'
                          }`}>
                            已启用
                          </span>
                        </div>
                      </div>

                      {/* Placeholder content */}
                      <div className="text-center py-12">
                        <Palette className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                        <p className="text-sm text-zinc-500">暂未开放，敬请期待</p>
                      </div>
                    </div>
                  )}

                  {/* ===== Usage Tab ===== */}
                  {activeTab === 'usage' && (
                    <div>
                      <p className="text-sm text-zinc-500 mb-6">查看今日各业务维度配额使用情况</p>

                      <div className="space-y-3">
                        {Object.entries(QUOTA_CONFIG).map(([key, config]) => {
                          const remaining = user.quotaRemaining?.[key];
                          const isUnlimited = remaining === -1;
                          const isExhausted = remaining === 0;
                          const isUnsupported = config.unsupportedForLite && user.role === 'LITE';

                          return (
                            <div
                              key={key}
                              className={`flex items-center justify-between px-4 py-3 rounded-lg border
                                ${isExhausted && !isUnlimited
                                  ? 'border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10'
                                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50'
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                                  ${isExhausted && !isUnlimited
                                    ? 'bg-red-100 dark:bg-red-900/20'
                                    : 'bg-zinc-200 dark:bg-zinc-700'
                                  }`}>
                                  {isExhausted && !isUnlimited ? (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                  ) : isUnlimited ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <BarChart3 className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-black dark:text-white">
                                    {config.label}
                                    {config.isDaily && (
                                      <span className="text-zinc-400 font-normal ml-1">（今日）</span>
                                    )}
                                  </p>
                                  {isUnsupported && (
                                    <p className="text-xs text-zinc-400">当前等级不支持</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {isUnlimited ? (
                                  <span className="text-sm font-medium text-green-600 dark:text-green-400">不限</span>
                                ) : isUnsupported ? (
                                  <span className="text-sm text-zinc-400">不支持</span>
                                ) : (
                                  <span className={`text-sm font-medium ${
                                    isExhausted ? 'text-red-500' : 'text-black dark:text-white'
                                  }`}>
                                    {remaining}
                                  </span>
                                )}
                                {isExhausted && !isUnlimited && user.role !== 'ADMIN' && (
                                  <a
                                    href="/membership"
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium
                                      bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400
                                      hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                                  >
                                    <Crown className="w-3 h-3" />
                                    升级会员
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Upgrade prompt */}
                      {(user.role === 'LITE' || user.role === 'PRO') && (
                        <div className="mt-6 p-4 rounded-xl border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10">
                          <div className="flex items-center gap-3">
                            <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                                需要更多配额？
                              </p>
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                                升级会员解锁更多功能和更高配额
                              </p>
                            </div>
                            <a
                              href="/membership"
                              className="px-3 py-1.5 rounded-lg text-xs font-medium
                                bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                            >
                              查看套餐
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer (only for Account tab) */}
                {activeTab === 'account' && !saveSuccess && (
                  <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
                    <button
                      onClick={handleClose}
                      disabled={saving}
                      className="px-4 py-2 border border-zinc-300 dark:border-zinc-700
                        text-zinc-600 dark:text-zinc-400 rounded-lg font-medium text-sm
                        hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors
                        disabled:opacity-40"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving || !!usernameError}
                      className="px-4 py-2 text-white rounded-lg font-medium text-sm
                        bg-black hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100
                        transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          保存中...
                        </span>
                      ) : (
                        '保存'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
