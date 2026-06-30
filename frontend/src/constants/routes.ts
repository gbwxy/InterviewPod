export const ROUTES = {
  // 简历管理
  resumeUpload: '/upload',
  resumeList: '/history',
  resumeDetail: (id: number) => `/history/${id}`,

  // 面试
  interviewHub: '/interview-hub',
  interview: '/interview',
  interviewWithResume: (id: number) => `/interview/${id}`,
  interviewHistory: '/interviews',
  interviewDetail: (id: string) => `/interviews/${id}`,
  voiceInterview: '/voice-interview',
  voiceInterviewEvaluation: (id: string) => `/voice-interview/${id}/evaluation`,
  interviewSchedule: '/interview-schedule',

  // 知识库
  knowledgebase: '/knowledgebase',
  knowledgebaseUpload: '/knowledgebase/upload',
  knowledgebaseChat: '/knowledgebase/chat',

  // 用户 & 认证
  login: '/login',
  userCenter: '/user-center',
  membership: '/membership',

  // 管理后台
  adminUsers: '/admin/users',
  adminResumes: '/admin/resumes',
  adminKnowledgeBase: '/admin/knowledge-base',
  adminInterviews: '/admin/interviews',

  // 系统
  settings: '/settings',
} as const;
