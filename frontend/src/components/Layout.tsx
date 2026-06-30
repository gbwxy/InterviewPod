import {Link, Outlet, useLocation, useNavigate} from 'react-router-dom';
import {motion} from 'framer-motion';
import {Calendar, Database, FileStack, MessageSquare, Moon, Settings, Sparkles, Sun, Users, User, Crown, Shield, LogOut, BookOpen,} from 'lucide-react';
import {useTheme} from '../hooks/useTheme';
import {useState} from 'react';
import UnifiedInterviewModal, {UnifiedInterviewConfig} from './UnifiedInterviewModal';
import logoImg from '../assets/logo.jpg';
import {useAuth} from '../hooks/useAuth';
import {ROLE_LABELS, ROLE_COLORS} from '../api/membership';
import AuthGuard from './AuthGuard';
import SettingsFab from './SettingsFab';
import {ROUTES} from '../constants/routes';

interface NavItem {
  id: string;
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  /** 仅特定角色可见 */
  roles?: string[];
}

interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

export default function Layout() {
  const location = useLocation();
  const currentPath = location.pathname;
  const {theme, toggleTheme} = useTheme();
  const navigate = useNavigate();
  const {user, isLoggedIn, logout} = useAuth();
  const [interviewModalPreset, setInterviewModalPreset] = useState<{
    defaultMode: 'text' | 'voice';
    defaultResumeId?: number;
    title: string;
    subtitle: string;
    startButtonText: string;
  } | null>(null);

  const openInterviewModalWithResume = (resumeId: number) => {
    setInterviewModalPreset({
      defaultMode: 'text',
      defaultResumeId: resumeId,
      title: '开始模拟面试',
      subtitle: '配置面试参数，开始练习',
      startButtonText: '开始面试',
    });
  };

  const handleInterviewStart = (config: UnifiedInterviewConfig) => {
    setInterviewModalPreset(null);
    if (config.mode === 'text') {
      navigate('/interview', {
        state: {
          resumeId: config.resumeId,
          interviewConfig: {
            skillId: config.skillId,
            difficulty: config.difficulty,
            questionCount: config.questionCount,
            llmProvider: config.llmProvider,
          },
        },
      });
      return;
    }

    const params = new URLSearchParams({
      skillId: config.skillId,
      difficulty: config.difficulty,
    });
    navigate(`/voice-interview?${params.toString()}`, {
      state: {
        voiceConfig: {
          skillId: config.skillId,
          difficulty: config.difficulty,
          techEnabled: true,
          projectEnabled: true,
          hrEnabled: true,
          plannedDuration: config.plannedDuration,
          resumeId: config.resumeId,
          llmProvider: config.llmProvider,
        },
      },
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.login, { replace: true });
  };

  // 按业务模块组织的导航项
  const navGroups: NavGroup[] = [
    {
      id: 'interview',
      title: '面试准备',
      items: [
        { id: 'resumes', path: '/history', label: '简历管理', icon: FileStack, description: '管理简历，AI 分析' },
        { id: 'interview-hub', path: '/interview-hub', label: '模拟面试', icon: Sparkles, description: '文字/语音面试练习' },
        { id: 'interviews', path: '/interviews', label: '面试记录', icon: Users, description: '查看面试历史' },
        { id: 'interview-schedule', path: '/interview-schedule', label: '面试日程', icon: Calendar, description: '管理面试安排' },
      ],
    },
    {
      id: 'knowledge',
      title: '知识库',
      items: [
        { id: 'kb-manage', path: '/knowledgebase', label: '知识库管理', icon: Database, description: '管理知识文档' },
        { id: 'chat', path: '/knowledgebase/chat', label: '问答助手', icon: MessageSquare, description: '基于知识库问答' },
      ],
    },
    {
      id: 'account',
      title: '账户',
      items: [
        { id: 'user-center', path: '/user-center', label: '个人中心', icon: User, description: '账户信息与配额' },
        { id: 'membership', path: '/membership', label: '会员订阅', icon: Crown, description: '升级套餐', roles: ['LITE', 'PRO', 'MAX_PLUS'] },
        { id: 'admin-users', path: '/admin/users', label: '用户管理', icon: Shield, description: '管理后台', roles: ['ADMIN'] },
        { id: 'admin-resumes', path: '/admin/resumes', label: '简历管理', icon: FileStack, description: '管理用户简历', roles: ['ADMIN'] },
        { id: 'admin-kb', path: '/admin/knowledge-base', label: '知识库管理', icon: BookOpen, description: '管理知识库文件', roles: ['ADMIN'] },
        { id: 'admin-interviews', path: '/admin/interviews', label: '面试记录管理', icon: MessageSquare, description: '管理面试记录', roles: ['ADMIN'] },
        { id: 'settings', path: '/settings', label: '设置', icon: Settings, description: '管理模型和语音服务', roles: ['ADMIN'] },
      ],
    },
  ];

  // 根据用户角色过滤导航项
  const filteredNavGroups: NavGroup[] = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (!item.roles) return true;
      return user && item.roles.includes(user.role);
    }),
  })).filter(group => group.items.length > 0);

  // 判断当前页面是否匹配导航项
  const isActive = (path: string) => {
    if (path.startsWith('#')) return false;
    if (path === '/history') {
      return currentPath === '/history'
        || currentPath === '/'
        || currentPath.startsWith('/history/')
        || currentPath === '/upload';
    }
    if (path === '/interview-hub') {
      return currentPath === '/interview-hub'
        || currentPath === '/interview'
        || currentPath.startsWith('/interview/')
        || currentPath.startsWith('/voice-interview');
    }
    if (path === '/knowledgebase') {
      return currentPath === '/knowledgebase' || currentPath === '/knowledgebase/upload';
    }
    if (path === '/user-center') {
      return currentPath === '/user-center';
    }
    if (path === '/membership') {
      return currentPath === '/membership';
    }
    if (path === '/admin/users') {
      return currentPath === '/admin/users';
    }
    if (path === '/admin/resumes') {
      return currentPath === '/admin/resumes';
    }
    if (path === '/admin/knowledge-base') {
      return currentPath === '/admin/knowledge-base';
    }
    if (path === '/admin/interviews') {
      return currentPath === '/admin/interviews';
    }
    return currentPath.startsWith(path);
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-white dark:bg-black">
        {/* 左侧边栏 */}
        <aside className="w-72 bg-white dark:bg-black border-r border-zinc-200 dark:border-zinc-800 fixed h-screen left-0 top-0 z-50 flex flex-col">
          {/* Logo */}
          <div className="px-4 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <Link to="/history" className="flex items-center gap-3">
              <img src={logoImg} alt="InterviewPod" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
              <div>
                <span className="text-base font-bold text-black dark:text-white tracking-tight block">InterviewPod</span>
                <span className="text-xs text-zinc-500">智能面试助手</span>
              </div>
            </Link>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <div className="space-y-5">
              {filteredNavGroups.map((group) => (
                <div key={group.id}>
                  <div className="px-3 mb-2">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                      {group.title}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const active = isActive(item.path);

                      return (
                        <Link
                          key={item.id}
                          to={item.path}
                          className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150
                            ${active
                              ? 'bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white'
                              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 hover:text-black dark:hover:text-zinc-200'
                            }`}
                        >
                          {/* 激活态左侧竖线 */}
                          {active && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-black dark:bg-white rounded-r-full" />
                          )}
                          <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-black dark:text-white' : 'text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300'}`} />
                          <div className="flex-1 min-w-0">
                            <span className={`text-[15px] block ${active ? 'font-semibold text-black dark:text-white' : 'font-normal'}`}>
                              {item.label}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          {/* 底部用户信息 + 主题切换 */}
          <div className="border-t border-zinc-200 dark:border-zinc-800">
            {isLoggedIn && user && (
              <div className="px-4 py-3 flex items-center gap-3">
                {/* 用户头像占位 */}
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-black dark:text-white truncate">
                      {user.username || `用户${user.userId}`}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${ROLE_COLORS[user.role]}`}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="退出登录"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 font-medium">AI 面试助手</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">v1.0</p>
              </div>
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title={theme === 'dark' ? '切换浅色模式' : '切换深色模式'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 ml-72 min-h-screen bg-white dark:bg-black overflow-y-auto">
          <div className="p-8">
            <motion.div
              key={currentPath}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet context={{ openInterviewModalWithResume }} />
            </motion.div>
          </div>
        </main>

        {/* 浮动设置按钮 */}
        <SettingsFab />

        {/* 统一面试弹窗 */}
        <UnifiedInterviewModal
          isOpen={interviewModalPreset !== null}
          onClose={() => setInterviewModalPreset(null)}
          onStart={handleInterviewStart}
          defaultMode={interviewModalPreset?.defaultMode || 'text'}
          defaultResumeId={interviewModalPreset?.defaultResumeId}
          hideModeSwitch={interviewModalPreset?.defaultResumeId == null}
          title={interviewModalPreset?.title || '开始模拟面试'}
          subtitle={interviewModalPreset?.subtitle || '选择面试模式和主题，快速开始'}
          startButtonText={interviewModalPreset?.startButtonText || '开始面试'}
        />
      </div>
    </AuthGuard>
  );
}
