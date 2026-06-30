import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, CheckCircle, XCircle, CreditCard, Wallet, AlertTriangle } from 'lucide-react';
import QRCode from 'qrcode';
import * as membershipApi from '../api/membership';
import { useAuth } from '../hooks/useAuth';

interface PaymentModalProps {
  planId: string;
  planInfo: membershipApi.PlanInfo;
  onClose: () => void;
  onSuccess: () => void;
}

type PaymentStep = 'select' | 'paying' | 'success' | 'failed';
type PaymentMethod = 'WECHAT' | 'ALIPAY';

export default function PaymentModal({ planId, planInfo, onClose, onSuccess }: PaymentModalProps) {
  const { refreshUser } = useAuth();
  const [step, setStep] = useState<PaymentStep>('select');
  const [method, setMethod] = useState<PaymentMethod>('WECHAT');
  const [codeUrl, setCodeUrl] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [_orderId, setOrderId] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const periodLabel = planInfo.period === 'WEEKLY' ? '周' : '月';
  const methodLabel: Record<PaymentMethod, string> = {
    WECHAT: '微信支付',
    ALIPAY: '支付宝',
  };

  // 停止轮询
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // 轮询支付状态（每 2 秒）
  const startPolling = useCallback((oid: number) => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const status = await membershipApi.getOrderStatus(oid);
        if (status.status === 'PAID') {
          stopPolling();
          setStep('success');
          await refreshUser();
          onSuccess();
        } else if (status.status === 'EXPIRED' || status.status === 'REFUNDED') {
          stopPolling();
          setStep('failed');
          setError('订单已过期或已退款');
        }
      } catch {
        // 轮询失败不中断，继续重试
      }
    }, 2000);
  }, [stopPolling, refreshUser, onSuccess]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // 当 codeUrl 变更时生成二维码图片
  useEffect(() => {
    if (codeUrl) {
      QRCode.toDataURL(codeUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(''));
    } else {
      setQrDataUrl('');
    }
  }, [codeUrl]);

  const handleCreateOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await membershipApi.createOrder(planId, method);
      setOrderId(result.orderId);
      setCodeUrl(result.codeUrl);
      setStep('paying');
      startPolling(result.orderId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '创建订单失败');
      setStep('failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    stopPolling();
    onClose();
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 z-[100]" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl max-w-md w-full p-6"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-black dark:text-white">
              {step === 'select' && '选择支付方式'}
              {step === 'paying' && '扫码支付'}
              {step === 'success' && '支付成功'}
              {step === 'failed' && '支付失败'}
            </h3>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4 text-zinc-500" />
            </button>
          </div>

          {/* 套餐信息 */}
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-3 mb-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-black dark:text-white">
                  {membershipApi.ROLE_LABELS[planInfo.role]} · {periodLabel}卡
                </span>
                <div className="text-xs text-zinc-500 mt-0.5">
                  有效期 {planInfo.days} 天
                </div>
              </div>
              <div className="text-lg font-bold text-black dark:text-white">
                {membershipApi.formatAmount(planInfo.amount)}
              </div>
            </div>
          </div>

          {/* Step: 选择支付方式 */}
          {step === 'select' && (
            <div className="space-y-3">
              <div
                onClick={() => setMethod('WECHAT')}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  method === 'WECHAT'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <CreditCard className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-black dark:text-white">微信支付</span>
                {method === 'WECHAT' && (
                  <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                )}
              </div>
              <div
                onClick={() => setMethod('ALIPAY')}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  method === 'ALIPAY'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <Wallet className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-black dark:text-white">支付宝</span>
                {method === 'ALIPAY' && (
                  <CheckCircle className="w-4 h-4 text-blue-600 ml-auto" />
                )}
              </div>

              <button
                onClick={handleCreateOrder}
                disabled={loading}
                className="w-full py-3 bg-black text-white dark:bg-white dark:text-black rounded-lg font-medium text-sm hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    创建订单中...
                  </span>
                ) : `确认支付 ${membershipApi.formatAmount(planInfo.amount)}`}
              </button>

              {/* 一旦购买概不退款提示 */}
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                  一旦购买概不退款，请谨慎选择
                </p>
              </div>
            </div>
          )}

          {/* Step: 扫码支付 */}
          {step === 'paying' && (
            <div className="text-center">
              <div className="w-48 h-48 mx-auto mb-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white flex items-center justify-center overflow-hidden">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="支付二维码" className="w-full h-full" />
                ) : codeUrl ? (
                  <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
                ) : (
                  <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
                )}
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                请使用{methodLabel[method]}扫描二维码完成支付
              </p>
              <p className="text-xs text-zinc-400">
                支付完成后将自动刷新状态...
              </p>
              <button
                onClick={handleClose}
                className="mt-4 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline"
              >
                取消支付
              </button>
            </div>
          )}

          {/* Step: 支付成功 */}
          {step === 'success' && (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-black dark:text-white mb-1">支付成功！</p>
              <p className="text-xs text-zinc-500">会员已激活，配额已更新</p>
              <button
                onClick={handleClose}
                className="mt-4 px-6 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg text-sm font-medium hover:opacity-90 transition-all"
              >
                完成
              </button>
            </div>
          )}

          {/* Step: 支付失败 */}
          {step === 'failed' && (
            <div className="text-center py-4">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-black dark:text-white mb-1">支付失败</p>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="mt-4 flex gap-3 justify-center">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                >
                  关闭
                </button>
                <button
                  onClick={() => { setStep('select'); setError(null); }}
                  className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg text-sm font-medium hover:opacity-90 transition-all"
                >
                  重试
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}
