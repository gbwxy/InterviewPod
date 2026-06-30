import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import Layout from './components/Layout';
import { useEffect, useState, Suspense, lazy } from 'react';
import { historyApi, type InterviewDetail } from './api/history';
import type { UploadKnowledgeBaseResponse } from './api/knowledgebase';
import type { Difficulty } from './components/UnifiedInterviewModal';
import type { CategoryDTO } from './api/skill';
import { Loader2 } from 'lucide-react';
import { ROUTES } from './constants/routes';
import AuthProvider from './components/AuthProvider';
import AdminGuard from './components/AdminGuard';

// Lazy load components
const UploadPage = lazy(() => import('./pages/UploadPage'));
const HistoryList = lazy(() => import('./pages/HistoryPage'));
const ResumeDetailPage = lazy(() => import('./pages/ResumeDetailPage'));
const Interview = lazy(() => import('./pages/InterviewPage'));
const InterviewHistoryPage = lazy(() => import('./pages/InterviewHistoryPage'));
const KnowledgeBaseQueryPage = lazy(() => import('./pages/KnowledgeBaseQueryPage'));
const KnowledgeBaseUploadPage = lazy(() => import('./pages/KnowledgeBaseUploadPage'));
const KnowledgeBaseManagePage = lazy(() => import('./pages/KnowledgeBaseManagePage'));
const VoiceInterviewPage = lazy(() => import('./pages/VoiceInterviewPage'));
const VoiceInterviewEvaluationPage = lazy(() => import('./pages/VoiceInterviewEvaluationPage'));
const InterviewSchedulePage = lazy(() => import('./pages/InterviewSchedulePage'));
const InterviewHubPage = lazy(() => import('./pages/InterviewHubPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const InterviewDetailPanel = lazy(() => import('./components/InterviewDetailPanel'));

// 用户模块页面
const LoginPage = lazy(() => import('./pages/LoginPage'));
const UserCenterPage = lazy(() => import('./pages/UserCenterPage'));
const MembershipPage = lazy(() => import('./pages/MembershipPage'));
const AdminUserPage = lazy(() => import('./pages/AdminUserPage'));
const AdminResumePage = lazy(() => import('./pages/AdminResumePage'));
const AdminKnowledgeBasePage = lazy(() => import('./pages/AdminKnowledgeBasePage'));
const AdminInterviewPage = lazy(() => import('./pages/AdminInterviewPage'));

// Loading component
const Loading = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-10 h-10 border-2 border-zinc-200 dark:border-zinc-800 border-t-zinc-500 rounded-full animate-spin" />
  </div>
);

// 上传页面包装器
function UploadPageWrapper() {
  const navigate = useNavigate();

  const handleUploadComplete = (resumeId: number) => {
    // 异步模式：上传成功后跳转到简历库，让用户在列表中查看分析状态
    navigate(ROUTES.resumeList, { state: { newResumeId: resumeId } });
  };

  return <UploadPage onUploadComplete={handleUploadComplete} />;
}

// 历史记录列表包装器
function HistoryListWrapper() {
  const navigate = useNavigate();

  const handleSelectResume = (id: number) => {
    navigate(ROUTES.resumeDetail(id));
  };

  return <HistoryList onSelectResume={handleSelectResume} />;
}

// 简历详情包装器
function ResumeDetailWrapper() {
  const { resumeId } = useParams<{ resumeId: string }>();
  const navigate = useNavigate();
  const { openInterviewModalWithResume } = useOutletContext<{ openInterviewModalWithResume: (resumeId: number) => void }>();

  if (!resumeId) {
    return <Navigate to={ROUTES.resumeList} replace />;
  }

  const handleBack = () => {
    navigate(ROUTES.resumeList);
  };

  const handleStartInterview = (id: number) => {
    openInterviewModalWithResume(id);
  };

  return (
    <ResumeDetailPage
      resumeId={parseInt(resumeId, 10)}
      onBack={handleBack}
      onStartInterview={handleStartInterview}
    />
  );
}

interface InterviewEntryState {
  resumeId?: number;
  resumeText?: string;
  sessionIdToResume?: string;
  interviewConfig?: {
    skillId?: string;
    difficulty?: Difficulty;
    questionCount?: number;
    llmProvider?: string;
    customCategories?: CategoryDTO[];
    jdText?: string;
  };
}

// 模拟面试包装器
function InterviewWrapper() {
  const { resumeId } = useParams<{ resumeId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const entryState = (location.state as InterviewEntryState | undefined) ?? {};
  const [resumeText, setResumeText] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const effectiveResumeId = resumeId ? parseInt(resumeId, 10) : entryState.resumeId;

  useEffect(() => {
    // 优先从location state获取resumeText
    const stateText = entryState.resumeText;
    if (stateText) {
      setResumeText(stateText);
      setLoading(false);
    } else if (effectiveResumeId) {
      // 如果没有，从API获取简历详情
      historyApi.getResumeDetail(effectiveResumeId)
        .then(resume => {
          setResumeText(resume.resumeText);
          setLoading(false);
        })
        .catch(err => {
          console.error('获取简历文本失败', err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [effectiveResumeId, entryState.resumeText]);

  const handleBack = () => {
    if (effectiveResumeId) {
      navigate(ROUTES.resumeDetail(effectiveResumeId), { replace: false });
      return;
    }
    navigate(ROUTES.resumeList, { replace: false });
  };

  const handleInterviewComplete = () => {
    // 面试完成后跳转到面试记录页
    navigate(ROUTES.interviewHistory);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-zinc-200 dark:border-zinc-800 border-t-zinc-500 rounded-full mx-auto mb-4 animate-spin" />
          <p className="text-slate-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <Interview
      resumeText={resumeText}
      resumeId={effectiveResumeId}
      sessionIdToResume={entryState.sessionIdToResume}
      initialConfig={entryState.interviewConfig}
      onBack={handleBack}
      onInterviewComplete={handleInterviewComplete}
    />
  );
}

// 登录页面包装器
function LoginPageWrapper() {
  return <LoginPage />;
}

// 用户中心页面包装器
function UserCenterPageWrapper() {
  return <UserCenterPage />;
}

// 会员订阅页面包装器
function MembershipPageWrapper() {
  return <MembershipPage />;
}

// 管理后台用户管理页面包装器
function AdminUserPageWrapper() {
  return <AdminUserPage />;
}

// 管理后台简历管理页面包装器
function AdminResumePageWrapper() {
  return <AdminResumePage />;
}

// 管理后台知识库管理页面包装器
function AdminKnowledgeBasePageWrapper() {
  return <AdminKnowledgeBasePage />;
}

// 管理后台面试记录管理页面包装器
function AdminInterviewPageWrapper() {
  return <AdminInterviewPage />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* 登录页 — 不使用 Layout，独立渲染 */}
      <Route path={ROUTES.login} element={<LoginPageWrapper />} />

      {/* 需要认证的路由 — 包裹在 Layout 中 */}
      <Route path="/" element={<Layout />}>
        {/* 默认重定向到简历管理页面 */}
        <Route index element={<Navigate to={ROUTES.resumeList} replace />} />

        {/* 上传页面 */}
        <Route path="upload" element={<UploadPageWrapper />} />

        {/* 历史记录列表（简历库） */}
        <Route path="history" element={<HistoryListWrapper />} />

        {/* 简历详情 */}
        <Route path="history/:resumeId" element={<ResumeDetailWrapper />} />

        {/* 面试中心 */}
        <Route path="interview-hub" element={<InterviewHubPage />} />

        {/* 面试记录列表 */}
        <Route path="interviews" element={<InterviewHistoryWrapper />} />

        {/* 面试详情报告 */}
        <Route path="interviews/:sessionId" element={<InterviewDetailPageWrapper />} />

        {/* 模拟面试（通用入口） */}
        <Route path="interview" element={<InterviewWrapper />} />

        {/* 模拟面试 */}
        <Route path="interview/:resumeId" element={<InterviewWrapper />} />

        {/* 语音面试 */}
        <Route path="voice-interview" element={<VoiceInterviewPageWrapper />} />

        {/* 语音面试评估报告 */}
        <Route path="voice-interview/:sessionId/evaluation" element={<VoiceInterviewEvaluationPage />} />

        {/* 知识库管理 */}
        <Route path="knowledgebase" element={<KnowledgeBaseManagePageWrapper />} />

        {/* 知识库上传 */}
        <Route path="knowledgebase/upload" element={<KnowledgeBaseUploadPageWrapper />} />

        {/* 面试日程管理 */}
        <Route path="interview-schedule" element={<InterviewSchedulePage />} />

        {/* 设置 — 仅管理员可访问 */}
        <Route
          path="settings"
          element={
            <AdminGuard>
              <SettingsPage />
            </AdminGuard>
          }
        />

        {/* 问答助手（知识库聊天） */}
        <Route path="knowledgebase/chat" element={<KnowledgeBaseQueryPageWrapper />} />

        {/* ========== 用户模块路由 ========== */}

        {/* 个人中心 */}
        <Route path="user-center" element={<UserCenterPageWrapper />} />

        {/* 会员订阅 */}
        <Route path="membership" element={<MembershipPageWrapper />} />

        {/* 管理后台 — 用户管理 */}
        <Route path="admin/users" element={<AdminUserPageWrapper />} />

        {/* 管理后台 — 简历管理 */}
        <Route path="admin/resumes" element={<AdminResumePageWrapper />} />

        {/* 管理后台 — 知识库管理 */}
        <Route path="admin/knowledge-base" element={<AdminKnowledgeBasePageWrapper />} />

        {/* 管理后台 — 面试记录管理 */}
        <Route path="admin/interviews" element={<AdminInterviewPageWrapper />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<Loading />}>
          <AuthGuardRouter>
            <AppRoutes />
          </AuthGuardRouter>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

/**
 * 认证路由守卫包装器
 * - /login 页面：已登录则跳转首页
 * - 其他页面：未登录则跳转登录页
 */
function AuthGuardRouter({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// 面试记录页面包装器
function InterviewHistoryWrapper() {
  const navigate = useNavigate();
  const { openInterviewModalWithResume } = useOutletContext<{ openInterviewModalWithResume: (resumeId: number) => void }>();

  const handleBack = () => {
    navigate(ROUTES.resumeList);
  };

  const handleViewInterview = async (sessionId: string, _resumeId?: number) => {
    navigate(ROUTES.interviewDetail(sessionId));
  };

  const handleRestartInterview = (resumeId: number) => {
    openInterviewModalWithResume(resumeId);
  };

  const handleContinueInterview = (sessionId: string) => {
    navigate(ROUTES.interview, { state: { sessionIdToResume: sessionId } });
  };

  return <InterviewHistoryPage onBack={handleBack} onViewInterview={handleViewInterview} onRestartInterview={handleRestartInterview} onContinueInterview={handleContinueInterview} />;
}

// 面试详情报告页面包装器
function InterviewDetailPageWrapper() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<InterviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) {
      navigate(ROUTES.interviewHistory);
      return;
    }
    historyApi.getInterviewDetail(sessionId)
      .then(detail => {
        setInterview(detail);
        setLoading(false);
      })
      .catch(() => {
        setError('加载面试详情失败');
        setLoading(false);
      });
  }, [sessionId, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 animate-spin" />
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || '面试记录不存在'}</p>
          <button
            onClick={() => navigate(ROUTES.interviewHistory)}
            className="px-5 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg hover:bg-zinc-200 dark:bg-zinc-800"
          >
            返回面试记录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(ROUTES.interviewHistory)}
          className="p-2 text-zinc-500 hover:text-slate-600 hover:bg-zinc-200 dark:bg-zinc-800 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-black dark:text-white">
          面试详情 #{sessionId!.slice(-8)}
        </h1>
      </div>
      <InterviewDetailPanel interview={interview} />
    </div>
  );
}
function KnowledgeBaseManagePageWrapper() {
  const navigate = useNavigate();

  const handleUpload = () => {
    navigate(ROUTES.knowledgebaseUpload);
  };

  const handleChat = () => {
    navigate(ROUTES.knowledgebaseChat);
  };

  return <KnowledgeBaseManagePage onUpload={handleUpload} onChat={handleChat} />;
}

// 知识库问答页面包装器
function KnowledgeBaseQueryPageWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const isChatMode = location.pathname === ROUTES.knowledgebaseChat;

  const handleBack = () => {
    if (isChatMode) {
      navigate(ROUTES.knowledgebase);
    } else {
      navigate(ROUTES.resumeList);
    }
  };

  const handleUpload = () => {
    navigate(ROUTES.knowledgebaseUpload);
  };

  return <KnowledgeBaseQueryPage onBack={handleBack} onUpload={handleUpload} />;
}

// 知识库上传页面包装器
function KnowledgeBaseUploadPageWrapper() {
  const navigate = useNavigate();

  const handleUploadComplete = (_result: UploadKnowledgeBaseResponse) => {
    // 上传完成后返回管理页面
    navigate(ROUTES.knowledgebase);
  };

  const handleBack = () => {
    navigate(ROUTES.knowledgebase);
  };

  return <KnowledgeBaseUploadPage onUploadComplete={handleUploadComplete} onBack={handleBack} />;
}

// 语音面试页面包装器
function VoiceInterviewPageWrapper() {
  return <VoiceInterviewPage />;
}

export default App;
