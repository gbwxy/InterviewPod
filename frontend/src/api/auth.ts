import { request } from './request';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: number;
  role: 'ADMIN' | 'LITE' | 'PRO' | 'MAX_PLUS';
  phone: string;
  username: string | null;
}

export interface UserInfoResponse {
  userId: number;
  phone: string;
  username: string | null;
  role: 'ADMIN' | 'LITE' | 'PRO' | 'MAX_PLUS';
  subscriptionExpiredAt: string | null;
  quotaRemaining: Record<string, number>;
}

/**
 * 发送短信验证码
 */
export function sendSmsCode(phone: string): Promise<void> {
  return request.post('/api/auth/send-sms', { phone });
}

/**
 * 手机号 + 验证码登录
 */
export function loginBySms(phone: string, code: string): Promise<AuthResponse> {
  return request.post('/api/auth/login/sms', { phone, code });
}

/**
 * 手机号 + 密码登录
 */
export function loginByPhonePassword(phone: string, password: string): Promise<AuthResponse> {
  return request.post('/api/auth/login/phone-password', { phone, password });
}

/**
 * 用户名 + 密码登录
 */
export function loginByUsernamePassword(username: string, password: string): Promise<AuthResponse> {
  return request.post('/api/auth/login/username-password', { username, password });
}

/**
 * 刷新 Access Token
 */
export function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
  return request.post('/api/auth/refresh', { refreshToken });
}

/**
 * 登出
 */
export function logout(refreshToken: string): Promise<void> {
  return request.post('/api/auth/logout', { refreshToken });
}

/**
 * 获取当前用户信息
 */
export function getMe(): Promise<UserInfoResponse> {
  return request.get('/api/auth/me');
}

/**
 * 设置/修改密码
 */
export function setPassword(phone: string, code: string, newPassword: string): Promise<void> {
  return request.post('/api/auth/set-password', { phone, code, newPassword });
}

/**
 * 更新用户名
 */
export function updateUsername(username: string): Promise<UserInfoResponse> {
  return request.patch('/api/auth/me', { username });
}
