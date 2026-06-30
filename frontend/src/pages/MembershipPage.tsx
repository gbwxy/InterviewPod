import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Check, X, Loader2, ArrowLeft, Sparkles, Zap, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import * as membershipApi from '../api/membership';
import PaymentModal from '../components/PaymentModal';

type Period = 'WEEKLY' | 'MONTHLY';

export default function MembershipPage() {
  const { user, isLoggedIn, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Record<string, membershipApi.PlanInfo>>({});
  const [subscriptionStatus, setSubscriptionStatus] = useState<membershipApi.SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('MONTHLY');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedPlanInfo, setSelectedPlanInfo] = useState<membershipApi.PlanInfo | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { replace: true, state: { from: '/membership' } });
      return;
    }
    loadData();
  }, [isLoggedIn]);

  const loadData = async () => {
    try {
      const [planData, statusData] = await Promise.all([
        membershipApi.getPlans(),
        membershipApi.getSubscriptionStatus(),
      ]);
      setPlans(planData);
      setSubscriptionStatus(statusData);
    } catch (err) {
      console.error('Failed to load membership data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (planId: string) => {
    const plan = plans[planId];
    if (!plan) return;
    setSelectedPlanId(planId);
    setSelectedPlanInfo(plan);
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    refreshUser();
    loadData();
  };

  // 根据当前周/月切换过滤出对应套餐
  const getPlanForRole = (role: 'PRO' | 'MAX_PLUS'): [string, membershipApi.PlanInfo] | null => {
    const entry = Object.entries(plans).find(
      ([, p]) => p.role === role && p.period === period
    );
    return entry ?? null;
  };

  // 按钮状态逻辑
  const getButtonConfig = (targetRole: 'PRO' | 'MAX_PLUS') => {
    if (!user) return { label: '立即订阅', disabled: false, action: 'subscribe' as const };
    const currentRole = user.role;
    if (currentRole === 'ADMIN') return { label: '已包含', disabled: true, action: 'none' as const };
    if (currentRole === targetRole) return { label: '续期', disabled: false, action: 'renew' as const };
    // 角色层级: LITE < PRO < MAX_PLUS
    const roleOrder = { LITE: 0, PRO: 1, MAX_PLUS: 2 };
    const currentLevel = roleOrder[currentRole] ?? 0;
    const targetLevel = roleOrder[targetRole] ?? 0;
    if (currentLevel >= targetLevel) return { label: '当前方案', disabled: true, action: 'none' as const };
    return { label: '立即订阅', disabled: false, action: 'subscribe' as const };
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-zinc-600 dark:text-zinc-400 animate-spin" />
        </div>
      </div>
    );
  }

  const currentRole = user?.role || 'LITE';
  const proPlan = getPlanForRole('PRO');
  const maxPlan = getPlanForRole('MAX_PLUS');
  const proBtn = getButtonConfig('PRO');
  const maxBtn = getButtonConfig('MAX_PLUS');

  return (
    <div className="max-w-5xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/user-center')}
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回个人中心
        </button>
        <h1 className="text-2xl font-bold text-black dark:text-white flex items-center gap-2.5">
          <Crown className="w-6 h-6 text-amber-500" />
          会员订阅
        </h1>
        <p className="text-zinc-500 text-sm mt-1.5">选择适合你的套餐，解锁更多功能</p>
      </div>

      {/* 当前状态 */}
      {subscriptionStatus && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${membershipApi.ROLE_COLORS[currentRole]}`}>
                {membershipApi.ROLE_LABELS[currentRole]}
              </div>
              {subscriptionStatus.expiredAt && currentRole !== 'LITE' && currentRole !== 'ADMIN' && (
                <span className="text-xs text-zinc-500">
                  到期: {membershipApi.formatDateTime(subscriptionStatus.expiredAt)}
                </span>
              )}
            </div>
            {currentRole === 'LITE' && (
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                升级解锁更多功能
              </span>
            )}
          </div>
        </div>
      )}

      {/* 周/月切换 Tab */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-1">
          <button
            onClick={() => setPeriod('WEEKLY')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              period === 'WEEKLY'
                ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            周付
          </button>
          <button
            onClick={() => setPeriod('MONTHLY')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              period === 'MONTHLY'
                ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            月付
          </button>
        </div>
      </div>

      {/* 三栏套餐卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ===== Lite 免费版 ===== */}
        <div className="rounded-xl border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-5 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-black dark:text-white">Lite 免费版</h2>
              <p className="text-xs text-zinc-500">体验基础功能</p>
            </div>
          </div>

          {/* 价格 */}
          <div className="mb-4">
            <span className="text-3xl font-bold text-black dark:text-white">¥0</span>
            <span className="text-sm text-zinc-500 ml-1">/永久</span>
          </div>

          {/* 功能列表 */}
          <ul className="space-y-2.5 mb-6 flex-1">
            {[
              { text: '每日 1 次简历上传', included: true },
              { text: '简历总数 2 份', included: true },
              { text: '每日 1 次文字面试', included: true },
              { text: '语音面试', included: false },
              { text: '知识库 5 个文件', included: true },
              { text: '每日 1 次问答助手', included: true },
            ].map(f => (
              <li key={f.text} className={`flex items-center gap-2 text-sm ${f.included ? 'text-zinc-600 dark:text-zinc-400' : 'text-zinc-400 line-through'}`}>
                {f.included ? (
                  <Check className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                )}
                {f.text}
              </li>
            ))}
          </ul>

          {/* 按钮 */}
          <button
            disabled={currentRole === 'LITE' || currentRole === 'ADMIN'}
            className="w-full py-2.5 rounded-lg text-sm font-medium border border-zinc-300 dark:border-zinc-700
              text-zinc-600 dark:text-zinc-400 bg-transparent
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {currentRole === 'LITE' ? '当前方案' : currentRole === 'ADMIN' ? '已包含' : '当前方案'}
          </button>
        </div>

        {/* ===== Pro 专业版 ===== */}
        <div className="rounded-xl border-2 border-blue-300 dark:border-blue-700 bg-zinc-50 dark:bg-zinc-900 p-5 flex flex-col relative overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-black dark:text-white">Pro 专业版</h2>
              <p className="text-xs text-zinc-500">适合认真准备面试的同学</p>
            </div>
          </div>

          {/* 价格 */}
          <div className="mb-4">
            {proPlan ? (
              <>
                <span className="text-3xl font-bold text-black dark:text-white">
                  {membershipApi.formatAmount(proPlan[1].amount)}
                </span>
                <span className="text-sm text-zinc-500 ml-1">
                  /{period === 'WEEKLY' ? '周' : '月'}
                </span>
              </>
            ) : (
              <span className="text-zinc-400 text-sm">暂无可用套餐</span>
            )}
          </div>

          {/* 功能列表 */}
          <ul className="space-y-2.5 mb-6 flex-1">
            {[
              '无限简历上传',
              '简历总数 10 份',
              '每日 5 次文字面试',
              '每日 5 次语音面试',
              '知识库文件 100 个',
              '每日 5 次问答助手',
            ].map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {/* 按钮 */}
          <button
            disabled={proBtn.disabled || !proPlan}
            onClick={() => proPlan && handleSubscribe(proPlan[0])}
            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors
              ${proBtn.disabled
                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
          >
            {proBtn.label}
          </button>
        </div>

        {/* ===== Max+ 尊享版 ===== */}
        <div className="rounded-xl border-2 border-red-400 dark:border-red-600 bg-zinc-50 dark:bg-zinc-900 p-5 flex flex-col relative overflow-hidden">
          {/* 最受欢迎标签 */}
          <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            最受欢迎🔥
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-black dark:text-white">Max+ 尊享版</h2>
              <p className="text-xs text-zinc-500">追求极致准备的专业选手</p>
            </div>
          </div>

          {/* 价格 */}
          <div className="mb-4">
            {maxPlan ? (
              <>
                <span className="text-3xl font-bold text-black dark:text-white">
                  {membershipApi.formatAmount(maxPlan[1].amount)}
                </span>
                <span className="text-sm text-zinc-500 ml-1">
                  /{period === 'WEEKLY' ? '周' : '月'}
                </span>
              </>
            ) : (
              <span className="text-zinc-400 text-sm">暂无可用套餐</span>
            )}
          </div>

          {/* 功能列表 */}
          <ul className="space-y-2.5 mb-6 flex-1">
            {[
              '无限简历上传',
              '简历总数 20 份',
              '每日 20 次文字面试',
              '每日 20 次语音面试',
              '知识库文件 1000 个',
              '每日 20 次问答助手',
            ].map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <Check className="w-4 h-4 text-amber-500 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {/* 按钮 */}
          <button
            disabled={maxBtn.disabled || !maxPlan}
            onClick={() => maxPlan && handleSubscribe(maxPlan[0])}
            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors
              ${maxBtn.disabled
                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-red-500 text-white hover:bg-red-600'
              }`}
          >
            {maxBtn.label}
          </button>
        </div>
      </div>

      {/* 底部提示 */}
      <div className="mt-8 text-center">
        <p className="text-xs text-zinc-400">
          如有疑问，请联系客服。套餐价格可能随时调整，以支付时显示的价格为准。
        </p>
      </div>

      {/* 支付弹窗 */}
      {showPayment && selectedPlanId && selectedPlanInfo && (
        <PaymentModal
          planId={selectedPlanId}
          planInfo={selectedPlanInfo}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
