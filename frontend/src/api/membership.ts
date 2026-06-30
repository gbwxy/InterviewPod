import { request } from './request';

// ===== 类型定义 =====

export type UserRole = 'ADMIN' | 'LITE' | 'PRO' | 'MAX_PLUS';

export interface PlanInfo {
  role: UserRole;
  period: 'WEEKLY' | 'MONTHLY';
  amount: number;
  days: number;
}

export interface SubscriptionInfo {
  id: number;
  userId: number;
  role: UserRole;
  planId: string;
  period: string;
  amount: number;
  orderId: number;
  startedAt: string;
  expiredAt: string;
  expired: boolean;
}

export interface SubscriptionStatus {
  role: UserRole;
  expiredAt: string | null;
  latestSubscription: SubscriptionInfo | null;
  activeSubscription: SubscriptionInfo | null;
}

export interface CreateOrderResponse {
  orderId: number;
  planId: string;
  paymentMethod: string;
  /** 支付二维码 URL（微信/支付宝通用） */
  codeUrl: string;
  /** 支付金额（元） */
  amount: number;
}

export interface OrderStatus {
  orderId: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'REFUNDED';
  planId: string;
  paymentMethod: string;
}

// ===== API 调用 =====

/**
 * 获取可购买的套餐列表
 */
export function getPlans(): Promise<Record<string, PlanInfo>> {
  return request.get('/api/membership/plans');
}

/**
 * 获取当前订阅状态
 */
export function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  return request.get('/api/membership/status');
}

/**
 * 创建订阅订单并获取支付二维码
 */
export function createOrder(planId: string, paymentMethod: 'WECHAT' | 'ALIPAY' = 'WECHAT'): Promise<CreateOrderResponse> {
  return request.post('/api/membership/subscribe', { planId, paymentMethod });
}

/**
 * 查询支付订单状态
 */
export function getOrderStatus(orderId: number): Promise<OrderStatus> {
  return request.get(`/api/payment/status/${orderId}`);
}

// ===== 辅助函数 =====

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: '管理员',
  LITE: 'Lite 免费版',
  PRO: 'Pro 专业版',
  MAX_PLUS: 'Max+ 尊享版',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  LITE: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  PRO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  MAX_PLUS: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

/**
 * 格式化金额
 */
export function formatAmount(amount: number): string {
  return `¥${amount.toFixed(1)}`;
}

/**
 * 格式化日期时间
 */
export function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
