import { request } from './request';
import type { UserRole } from './membership';

// ===== 类型定义 =====

export interface AdminUser {
  id: number;
  phone: string | null;
  username: string | null;
  passwordHash: string;
  role: UserRole;
  subscriptionExpiredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserPage {
  content: AdminUser[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface AdminUserStats {
  total: number;
  lite: number;
  pro: number;
  maxPlus: number;
  admin: number;
}

export interface PageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface AdminResume {
  id: number;
  userId: number;
  originalFilename: string;
  fileSize: number;
  uploadedAt: string;
  analysisStatus: string;
}

export interface AdminKnowledgeBase {
  id: number;
  userId: number;
  name: string;
  originalFilename: string;
  fileSize: number;
  uploadedAt: string;
  vectorStatus: string;
  category: string | null;
}

export interface AdminInterview {
  id: number;
  userId: number;
  sessionId: string;
  skillId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminVoiceInterview {
  id: number;
  userId: number;
  roleType: string;
  status: string;
  currentPhase: string;
  startTime: string;
  endTime: string | null;
  createdAt: string;
  evaluateStatus: string | null;
}

// ===== API 调用 — 用户管理 =====

/**
 * 分页查询用户列表
 */
export function listUsers(params: {
  page?: number;
  size?: number;
  keyword?: string;
  role?: UserRole;
}): Promise<AdminUserPage> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.size !== undefined) query.set('size', String(params.size));
  if (params.keyword) query.set('keyword', params.keyword);
  if (params.role) query.set('role', params.role);
  return request.get(`/api/admin/users?${query.toString()}`);
}

/**
 * 获取用户统计
 */
export function getUserStats(): Promise<AdminUserStats> {
  return request.get('/api/admin/users/stats');
}

/**
 * 修改用户角色
 */
export function updateUserRole(userId: number, role: UserRole): Promise<void> {
  return request.put(`/api/admin/users/${userId}/role`, { role });
}

/**
 * 修改用户订阅到期时间
 */
export function updateUserExpiry(userId: number, expiredAt: string | null): Promise<void> {
  return request.put(`/api/admin/users/${userId}/expiry`, { expiredAt });
}

/**
 * 删除用户
 */
export function deleteUser(userId: number): Promise<void> {
  return request.delete(`/api/admin/users/${userId}`);
}

// ===== API 调用 — 简历管理 =====

/**
 * 分页查询所有简历
 */
export function listResumes(params: {
  page?: number;
  size?: number;
  userId?: number;
  startTime?: string;
  endTime?: string;
}): Promise<PageResult<AdminResume>> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.size !== undefined) query.set('size', String(params.size));
  if (params.userId !== undefined) query.set('userId', String(params.userId));
  if (params.startTime) query.set('startTime', params.startTime);
  if (params.endTime) query.set('endTime', params.endTime);
  return request.get(`/api/admin/resumes?${query.toString()}`);
}

/**
 * 管理员删除简历
 */
export function deleteResume(id: number): Promise<void> {
  return request.delete(`/api/admin/resumes/${id}`);
}

// ===== API 调用 — 知识库管理 =====

/**
 * 分页查询所有知识库文件
 */
export function listKnowledgeBases(params: {
  page?: number;
  size?: number;
  userId?: number;
  startTime?: string;
  endTime?: string;
}): Promise<PageResult<AdminKnowledgeBase>> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.size !== undefined) query.set('size', String(params.size));
  if (params.userId !== undefined) query.set('userId', String(params.userId));
  if (params.startTime) query.set('startTime', params.startTime);
  if (params.endTime) query.set('endTime', params.endTime);
  return request.get(`/api/admin/knowledge-base?${query.toString()}`);
}

/**
 * 管理员删除知识库文件
 */
export function deleteKnowledgeBase(id: number): Promise<void> {
  return request.delete(`/api/admin/knowledge-base/${id}`);
}

// ===== API 调用 — 文字面试管理 =====

/**
 * 分页查询所有文字面试记录
 */
export function listInterviews(params: {
  page?: number;
  size?: number;
  userId?: number;
  startTime?: string;
  endTime?: string;
}): Promise<PageResult<AdminInterview>> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.size !== undefined) query.set('size', String(params.size));
  if (params.userId !== undefined) query.set('userId', String(params.userId));
  if (params.startTime) query.set('startTime', params.startTime);
  if (params.endTime) query.set('endTime', params.endTime);
  return request.get(`/api/admin/interviews?${query.toString()}`);
}

/**
 * 查询文字面试详情
 */
export function getInterview(id: number): Promise<AdminInterview> {
  return request.get(`/api/admin/interviews/${id}`);
}

// ===== API 调用 — 语音面试管理 =====

/**
 * 分页查询所有语音面试记录
 */
export function listVoiceInterviews(params: {
  page?: number;
  size?: number;
  userId?: number;
  startTime?: string;
  endTime?: string;
}): Promise<PageResult<AdminVoiceInterview>> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.size !== undefined) query.set('size', String(params.size));
  if (params.userId !== undefined) query.set('userId', String(params.userId));
  if (params.startTime) query.set('startTime', params.startTime);
  if (params.endTime) query.set('endTime', params.endTime);
  return request.get(`/api/admin/voice-interviews?${query.toString()}`);
}

/**
 * 查询语音面试详情
 */
export function getVoiceInterview(id: number): Promise<AdminVoiceInterview> {
  return request.get(`/api/admin/voice-interviews/${id}`);
}

/**
 * 管理员删除语音面试记录
 */
export function deleteVoiceInterview(id: number): Promise<void> {
  return request.delete(`/api/admin/voice-interviews/${id}`);
}
