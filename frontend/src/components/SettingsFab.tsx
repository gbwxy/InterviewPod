import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import SettingsModal from './SettingsModal';

/**
 * 右下角浮动设置按钮
 * - 未登录：显示「登录」按钮，跳转 /login
 * - 已登录：显示「设置」齿轮按钮，弹出 SettingsModal
 */
export default function SettingsFab() {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);

  // Don't render on login page or when auth is loading
  if (!isLoggedIn && !showSettings) {
    // Still render login FAB
  }

  const handleFabClick = () => {
    if (!isLoggedIn) {
      navigate('/login');
    } else {
      setShowSettings(true);
    }
  };

  const handlePasswordManage = () => {
    setShowSettings(false);
    // Navigate to user center which has password management
    navigate('/user-center');
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleFabClick}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full
            bg-black dark:bg-white text-white dark:text-black
            shadow-lg hover:shadow-xl transition-shadow
            border border-zinc-700 dark:border-zinc-300"
          title={isLoggedIn ? '设置' : '登录'}
        >
          {isLoggedIn ? (
            <>
              <Settings className="w-5 h-5" />
              <span className="text-sm font-medium">设置</span>
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              <span className="text-sm font-medium">登录</span>
            </>
          )}
        </motion.button>
      </AnimatePresence>

      {/* Settings Modal */}
      {isLoggedIn && user && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onPasswordManage={handlePasswordManage}
        />
      )}
    </>
  );
}
