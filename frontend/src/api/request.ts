import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

declare module 'axios' {
  interface AxiosRequestConfig {
    skipResultTransform?: boolean;
    _retry?: boolean;
  }
}

// ===== Token 管理 =====
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const tokenStorage = {
  getAccessToken: () => sessionStorage.getItem(ACCESS_TOKEN_KEY),
  setAccessToken: (token: string) => sessionStorage.setItem(ACCESS_TOKEN_KEY, token),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string) => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  clear: () => {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

// 刷新 Token 的锁，避免并发刷新
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

/**
 * 后端统一响应结构
 */
export interface Result<T = unknown> {
  code: number;
  message: string;
  data: T;
}

const SUCCESS_CODE = 200;
const RESULT_BLOB_PARSE_LIMIT = 64 * 1024;

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const instance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

/** Token 刷新失败时跳转登录（延迟导入避免循环依赖） */
function redirectToLogin() {
  tokenStorage.clear();
  // 使用 location.href 跳转，避免依赖 Router
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
  }
}

/** 处理 Token 刷新逻辑 */
async function handleTokenRefresh(originalConfig: AxiosRequestConfig) {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    redirectToLogin();
    return Promise.reject(new Error('请重新登录'));
  }

  if (isRefreshing) {
    // 等待刷新完成后重试
    return new Promise<string>((resolve) => {
      subscribeTokenRefresh((token) => resolve(token));
    }).then((token) => {
      originalConfig._retry = true;
      if (originalConfig.headers) {
        originalConfig.headers['Authorization'] = `Bearer ${token}`;
      }
      return instance(originalConfig);
    });
  }

  isRefreshing = true;
  try {
    const res = await instance.post<{ data: { accessToken: string } }>(
      '/api/auth/refresh',
      { refreshToken },
      { skipResultTransform: true }
    );
    const newToken = (res.data as unknown as { data: { accessToken: string } }).data?.accessToken;
    if (!newToken) throw new Error('Token 刷新失败');

    tokenStorage.setAccessToken(newToken);
    onRefreshed(newToken);

    originalConfig._retry = true;
    if (originalConfig.headers) {
      originalConfig.headers['Authorization'] = `Bearer ${newToken}`;
    }
    return instance(originalConfig);
  } catch {
    redirectToLogin();
    return Promise.reject(new Error('登录已过期，请重新登录'));
  } finally {
    isRefreshing = false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

export function isResult(value: unknown): value is Result {
  return isRecord(value)
    && typeof value.code === 'number'
    && typeof value.message === 'string';
}

export function getResultError(value: unknown): Error | null {
  if (!isResult(value) || value.code === SUCCESS_CODE) {
    return null;
  }
  return new Error(value.message || '请求失败');
}

function parseResultText(text: string): Result | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith('{')) {
    return null;
  }

  try {
    const value = JSON.parse(trimmed) as unknown;
    return isResult(value) ? value : null;
  } catch {
    return null;
  }
}

function shouldTryParseBlob(blob: Blob): boolean {
  const type = blob.type.toLowerCase();
  return type.includes('json')
    || type.startsWith('text/')
    || blob.size <= RESULT_BLOB_PARSE_LIMIT;
}

export async function parseResultPayload(payload: unknown): Promise<Result | null> {
  if (isResult(payload)) {
    return payload;
  }

  if (payload instanceof Blob && shouldTryParseBlob(payload)) {
    return parseResultText(await payload.text());
  }

  if (typeof payload === 'string') {
    return parseResultText(payload);
  }

  return null;
}

export async function resolveBlobDownload(blob: Blob): Promise<Blob> {
  const result = await parseResultPayload(blob);
  if (!result) {
    return blob;
  }

  if (result.code !== SUCCESS_CODE) {
    throw new Error(result.message || '文件下载失败');
  }

  throw new Error(result.message && result.message !== 'success'
    ? result.message
    : '文件下载失败：服务端未返回文件内容');
}

async function getErrorFromResponseData(data: unknown): Promise<Error | null> {
  const result = await parseResultPayload(data);
  if (!result) {
    return null;
  }

  return new Error(result.message || '请求失败');
}

/**
 * 请求拦截器：自动附加 Authorization 头
 */
instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccessToken();
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

/**
 * 响应拦截器
 *
 * 后端约定：所有响应都是 HTTP 200 + Result
 * - code === 200 → 成功，返回 data
 * - code !== 200 → 失败，直接显示 message
 *
 * 当 code === 12011（Token无效/过期）时，自动刷新 Token。
 */
const TOKEN_INVALID_CODE = 12011;

instance.interceptors.response.use(
  async (response) => {
    if (response.config.skipResultTransform) {
      return response;
    }

    const result = response.data as Result;

    // 检查是否是 Result 格式
    if (isResult(result)) {
      if (result.code === SUCCESS_CODE) {
        // 成功：返回 data
        response.data = result.data;
        return response;
      }

      // Token 无效：尝试刷新
      if (result.code === TOKEN_INVALID_CODE && !response.config._retry) {
        return handleTokenRefresh(response.config);
      }

      // 失败：直接抛出 message
      return Promise.reject(new Error(result.message || '请求失败'));
    }
    
    // 非 Result 格式，直接返回
    return response;
  },
  async (error) => {
    // 有响应的情况：后端返回了结果（即使是错误）
    if (error.response) {
      const { data } = error.response;
      // 尝试解析 Result 格式
      const responseError = await getErrorFromResponseData(data);
      if (responseError) {
        return Promise.reject(responseError);
      }
      // 响应格式不对
      return Promise.reject(new Error('请求失败，请重试'));
    }

    // 没有响应的情况：真正的网络错误或连接被重置
    // 对于文件上传，可能是网络超时或连接中断，但不一定是文件大小问题
    // 让后端返回真实的错误信息，而不是在这里假设
    const config = error.config;
    const isUpload = config && (
      config.url?.includes('/upload') ||
      config.headers?.['Content-Type']?.toString().includes('multipart')
    );

    if (isUpload) {
      // 文件上传失败且没有响应，可能是网络超时或连接中断
      // 不直接假设是文件大小问题，返回更通用的错误信息
      return Promise.reject(new Error('上传失败，可能是网络超时或连接中断，请重试'));
    }

    // 其他网络错误
    return Promise.reject(new Error('网络连接失败，请检查网络'));
  }
);

export const request = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.get(url, config).then(res => res.data);
  },

  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return instance.post(url, data, config).then(res => res.data);
  },

  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return instance.put(url, data, config).then(res => res.data);
  },

  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return instance.patch(url, data, config).then(res => res.data);
  },

  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.delete(url, config).then(res => res.data);
  },

  /**
   * 文件上传
   */
  upload<T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> {
    return instance.post(url, formData, {
      timeout: 300000, // 5分钟，与Nginx proxy_read_timeout对齐
      headers: { 'Content-Type': 'multipart/form-data' },
      ...config,
    }).then(res => res.data);
  },

  /**
   * 文件下载，自动识别后端以 Blob 形式返回的 Result.error
   */
  async download(url: string, config?: AxiosRequestConfig): Promise<Blob> {
    const response = await instance.get<Blob>(url, {
      ...config,
      responseType: 'blob',
      skipResultTransform: true,
    });
    return resolveBlobDownload(response.data);
  },

  /**
   * 获取原始实例（用于特殊场景如下载 Blob）
   */
  getInstance(): AxiosInstance {
    return instance;
  },
};

/**
 * 获取错误信息
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return '未知错误';
}

export default request;
