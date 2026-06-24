import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown, ChevronUp, FileStack, FileText, Loader2, Mic,
  RefreshCw, Sparkles,
} from 'lucide-react';
import { type SkillDTO } from '../api/skill';
import { interviewApi, type TextSessionMeta } from '../api/interview';
import { voiceInterviewApi, type SessionMeta } from '../api/voiceInterview';
import { getSkillIcon } from '../utils/skillIcons';
import { getTemplateName } from '../utils/voiceInterview';
import { getScoreTextColor } from '../utils/score';
import { formatDateTime } from '../utils/date';
import {
  useInterviewConfig,
  CUSTOM_SKILL_ID,
  type InterviewMode,
  DIFFICULTY_OPTIONS,
} from '../hooks/useInterviewConfig';

// 统一的面试记录项
interface RecentInterviewItem {
  id: string;
  type: 'text' | 'voice';
  title: string;
  status: string;
  evaluateStatus?: string | null;
  overallScore: number | null;
  createdAt: string;
  voiceSessionId?: number;
}

export default function InterviewHubPage() {
  const navigate = useNavigate();

  const config = useInterviewConfig({ autoLoad: false });

  // === 最近面试记录 ===
  const [recentInterviews, setRecentInterviews] = useState<RecentInterviewItem[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  const loadRecentInterviews = useCallback(async (allSkills: SkillDTO[]) => {
    setLoadingRecent(true);
    try {
      const [textSessions, voiceSessions] = await Promise.all([
        interviewApi.listSessions().catch(() => [] as TextSessionMeta[]),
        voiceInterviewApi.getAllSessions().catch(() => [] as SessionMeta[]),
      ]);

      const items: RecentInterviewItem[] = [
        ...textSessions.map(s => ({
          id: s.sessionId,
          type: 'text' as const,
          title: getTemplateName(s.skillId, allSkills),
          status: s.status,
          evaluateStatus: s.evaluateStatus,
          overallScore: s.overallScore,
          createdAt: s.createdAt,
        })),
        ...voiceSessions.map(s => ({
          id: `voice-${s.sessionId}`,
          type: 'voice' as const,
          title: s.roleType || '语音面试',
          status: s.status,
          overallScore: null,
          createdAt: s.createdAt,
          voiceSessionId: s.sessionId,
        })),
      ];

      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecentInterviews(items.slice(0, 5));
    } catch (err) {
      console.error('Failed to load recent interviews:', err);
    } finally {
      setLoadingRecent(false);
    }
  }, []);

  // 初始加载：skills 和 resumes 并行，再用 skills 加载面试记录
  useEffect(() => {
    const init = async () => {
      const [skills] = await Promise.all([config.loadSkills(), config.loadResumes()]);
      await loadRecentInterviews(skills);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStart = () => {
    const selectedSkill = config.selectedSkill;
    const skillName = selectedSkill?.name || '自定义';

    if (config.isCustomStartDisabled) {
      return;
    }

    if (config.mode === 'text') {
      navigate('/interview', {
        state: {
          resumeId: config.resumeId,
          interviewConfig: {
            skillId: config.skillId,
            skillName,
            difficulty: config.difficulty,
            questionCount: config.questionCount,
            llmProvider: config.llmProvider,
            jdText: config.isCustomSkill ? config.parsedCustomJdText : undefined,
            customCategories: config.isCustomSkill ? config.customCategories : undefined,
          },
        },
      });
    } else {
      const params = new URLSearchParams({ skillId: config.skillId, difficulty: config.difficulty });
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
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-zinc-600 dark:text-zinc-400 dark:text-zinc-400" />
          模拟面试
        </h1>
        <p className="text-zinc-500 text-sm mt-1">选择面试模式和方向，快速开始练习</p>
      </div>

      {/* 配置区域 */}
      <div className="bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 mb-5">
        <div className="space-y-5">
          {/* 面试模式 */}
          <div>
            <label className="flex items-center gap-2 mb-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">
              面试模式
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {([
                {
                  value: 'text' as InterviewMode,
                  label: '文字面试',
                  icon: FileText,
                  desc: '推荐：更稳定，更适合系统化刷题与复盘',
                  recommended: true,
                },
                {
                  value: 'voice' as InterviewMode,
                  label: '语音面试',
                  icon: Mic,
                  desc: '实时语音对话，更偏临场模拟',
                  recommended: false,
                },
              ]).map(opt => {
                const Icon = opt.icon;
                const selected = config.mode === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => config.setMode(opt.value)}
                    className={`flex items-center gap-3 p-3.5 rounded-lg border transition-all duration-150 text-left
                      ${selected
                        ? 'border-zinc-500 bg-zinc-200 dark:bg-zinc-800'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 hover:border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800/50'
                      }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${selected ? 'text-black dark:text-white' : 'text-zinc-500'}`} />
                    <div className="min-w-0">
                      <p className={`font-medium text-sm flex items-center gap-2 ${selected ? 'text-black dark:text-white' : 'text-zinc-600 dark:text-zinc-400 dark:text-zinc-400'}`}>
                        <span>{opt.label}</span>
                        {opt.recommended && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-300 dark:text-zinc-300">
                            推荐
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 面试方向 */}
          <div>
            <label className="flex items-center gap-2 mb-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">
              面试方向
            </label>
            {config.loadingSkills ? (
              <div className="flex items-center gap-2 py-4 text-zinc-600 dark:text-zinc-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">加载中...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {config.skills.map(skill => {
                  const selected = config.skillId === skill.id;
                  const IconComponent = getSkillIcon(skill.id);
                  const fallbackEmoji = skill.display?.icon || '📋';
                  return (
                    <button
                      key={skill.id}
                      onClick={() => config.setSkillId(skill.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all duration-150 text-left
                        ${selected
                          ? 'border-zinc-500 bg-zinc-200 dark:bg-zinc-800'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 hover:border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800/50'
                        }`}
                    >
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center text-sm flex-shrink-0 ${
                        selected ? 'bg-zinc-300 dark:bg-zinc-700' : 'bg-zinc-200 dark:bg-zinc-800'
                      }`}>
                        {IconComponent
                          ? <IconComponent className={`w-3.5 h-3.5 ${selected ? 'text-zinc-900 dark:text-zinc-200' : 'text-zinc-500'}`} />
                          : <span className="text-xs">{fallbackEmoji}</span>
                        }
                      </div>
                      <span className={`text-xs font-medium truncate ${selected ? 'text-black dark:text-white' : 'text-zinc-600 dark:text-zinc-400 dark:text-zinc-400'}`}>
                        {skill.name}
                      </span>
                    </button>
                  );
                })}
                {/* 自定义按钮 */}
                <button
                  onClick={() => config.setSkillId(CUSTOM_SKILL_ID)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border border-dashed transition-all duration-150 text-left
                    ${config.isCustomSkill
                      ? 'border-zinc-500 bg-zinc-200 dark:bg-zinc-800'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:border-zinc-700'
                    }`}
                >
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                    config.isCustomSkill ? 'bg-zinc-300 dark:bg-zinc-700' : 'bg-zinc-200 dark:bg-zinc-800'
                  }`}>
                    {(() => {
                      const CustomIcon = getSkillIcon(CUSTOM_SKILL_ID);
                      return CustomIcon
                        ? <CustomIcon className={`w-3.5 h-3.5 ${config.isCustomSkill ? 'text-zinc-900 dark:text-zinc-200' : 'text-zinc-500'}`} />
                        : <span className="text-xs">✨</span>;
                    })()}
                  </div>
                  <span className={`text-xs font-medium ${config.isCustomSkill ? 'text-black dark:text-white' : 'text-zinc-500'}`}>
                    自定义 JD
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* 自定义 JD 输入 */}
          <AnimatePresence>
            {config.isCustomSkill && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 bg-zinc-200 dark:bg-zinc-800 rounded-lg p-4 border border-zinc-300 dark:border-zinc-700">
                  <textarea
                    value={config.customJdText}
                    onChange={e => config.setCustomJdText(e.target.value)}
                    placeholder="粘贴目标岗位的职位描述（JD），至少 50 字..."
                    rows={4}
                    className="w-full px-3 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700
                      bg-zinc-100 dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-200
                      placeholder:text-zinc-600 dark:text-zinc-400 resize-none focus:outline-none focus:ring-1
                      focus:ring-zinc-500 focus:border-zinc-500 transition-shadow"
                  />
                  <button
                    onClick={config.handleParseJd}
                    disabled={config.parsingJd || !config.customJdText}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg
                      bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100 disabled:opacity-40
                      disabled:cursor-not-allowed transition-colors"
                  >
                    {config.parsingJd ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    解析面试方向
                  </button>
                  {config.customCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {config.customCategories.map((cat, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 text-xs font-medium rounded-full bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-300 dark:text-zinc-300"
                        >
                          {cat.label}
                          <span className="ml-1 text-[10px] text-zinc-500">({cat.priority})</span>
                        </span>
                      ))}
                    </div>
                  )}
                  {config.jdNeedsReparse && (
                    <p className="text-xs text-amber-500">
                      JD 已修改，请重新解析后再开始面试。
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 难度 */}
          <div>
            <label className="flex items-center gap-2 mb-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">
              难度
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTY_OPTIONS.map(opt => {
                const selected = config.difficulty === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => config.setDifficulty(opt.value)}
                    className={`py-2.5 px-3 rounded-lg border transition-all duration-150 text-center
                      ${selected
                        ? 'border-zinc-500 bg-zinc-200 dark:bg-zinc-800'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 hover:border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800/50'
                      }`}
                  >
                    <p className={`text-sm font-medium ${selected ? 'text-black dark:text-white' : 'text-zinc-600 dark:text-zinc-400 dark:text-zinc-400'}`}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 更多选项 */}
          <button
            onClick={() => config.setShowMore(!config.showMore)}
            className="w-full flex items-center gap-2 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-400 dark:text-zinc-400 dark:text-zinc-400 transition-colors"
          >
            {config.showMore ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>更多选项</span>
            <div className="flex-1 border-t border-zinc-200 dark:border-zinc-800" />
          </button>

          <AnimatePresence>
            {config.showMore && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-4"
              >
                {/* 简历选择 */}
                <div className="bg-zinc-200 dark:bg-zinc-800 rounded-lg p-4 border border-zinc-300 dark:border-zinc-700">
                  <div className="flex items-center gap-2.5 mb-3">
                    <FileStack className="w-4 h-4 text-zinc-500" />
                    <p className="font-medium text-sm text-zinc-500 dark:text-zinc-300 dark:text-zinc-300">
                      基于简历面试（可选）
                    </p>
                  </div>
                  <select
                    value={config.resumeId || ''}
                    onChange={e => config.setResumeId(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700
                      bg-zinc-100 dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-200
                      focus:outline-none focus:ring-1 focus:ring-zinc-500 transition-shadow"
                  >
                    <option value="">不使用简历（通用提问）</option>
                    {config.resumes.map(r => (
                      <option key={r.id} value={r.id}>{r.filename}</option>
                    ))}
                  </select>
                </div>

                {/* 文字面试 - 题目数 */}
                {config.mode === 'text' && (
                  <div>
                    <label className="flex items-center gap-2 mb-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      题目数量
                    </label>
                    <div className="flex gap-2">
                      {[6, 8, 10, 12].map(n => (
                        <button
                          key={n}
                          onClick={() => config.setQuestionCount(n)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
                            ${config.questionCount === n
                              ? 'bg-black text-white dark:bg-white dark:text-black'
                              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 hover:bg-zinc-300 dark:bg-zinc-700 hover:text-zinc-500 dark:hover:text-zinc-500 dark:text-zinc-300 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700'
                            }`}
                        >
                          {n} 题
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 语音面试 - 时长 */}
                {config.mode === 'voice' && (
                  <div className="bg-zinc-200 dark:bg-zinc-800 rounded-lg p-4 border border-zinc-300 dark:border-zinc-700">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-medium text-sm text-zinc-500 dark:text-zinc-300 dark:text-zinc-300">计划面试时长</p>
                      <div className="text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-200">
                        {config.plannedDuration}
                        <span className="text-xs font-normal text-zinc-500 ml-0.5">min</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="60"
                      step="5"
                      value={config.plannedDuration}
                      onChange={e => config.setPlannedDuration(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5
                        [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 开始面试按钮 */}
        <div className="mt-5 pt-5 border-t border-zinc-200 dark:border-zinc-800">
          <motion.button
            onClick={handleStart}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            disabled={config.isCustomStartDisabled}
            className="w-full px-6 py-2.5 rounded-lg font-medium text-sm transition-all
              bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            开始{config.mode === 'text' ? '文字' : '语音'}面试
          </motion.button>
        </div>
      </div>

      {/* 最近面试记录 */}
      <div className="bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-300 dark:text-zinc-300">最近面试记录</h2>
          <Link
            to="/interviews"
            className="text-xs text-zinc-500 hover:text-zinc-500 dark:hover:text-zinc-500 dark:text-zinc-300 dark:text-zinc-300 transition-colors"
          >
            查看全部 →
          </Link>
        </div>

        {loadingRecent ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-zinc-600 dark:text-zinc-400 animate-spin" />
          </div>
        ) : recentInterviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">暂无面试记录，选择方向开始第一次面试吧</p>
          </div>
        ) : (
          <div className="space-y-1">
            {recentInterviews.map((item, index) => {
              const isCompleted = item.evaluateStatus === 'COMPLETED' || item.status === 'EVALUATED';
              const isEvaluating = item.evaluateStatus === 'PENDING' || item.evaluateStatus === 'PROCESSING';
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => {
                    if (item.type === 'text') {
                      navigate(`/interviews/${item.id}`);
                    } else if (item.voiceSessionId) {
                      navigate(`/voice-interview/${item.voiceSessionId}/evaluation`);
                    }
                  }}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-200 dark:bg-zinc-800 transition-colors cursor-pointer group"
                >
                  {/* 类型图标 */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    item.type === 'text' ? 'bg-zinc-200 dark:bg-zinc-800' : 'bg-zinc-200 dark:bg-zinc-800'
                  }`}>
                    {item.type === 'text'
                      ? <FileText className="w-4 h-4 text-zinc-500" />
                      : <Mic className="w-4 h-4 text-zinc-500" />
                    }
                  </div>

                  {/* 信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-zinc-900 dark:text-zinc-200 truncate">{item.title}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-500 border border-zinc-300 dark:border-zinc-700">
                        {item.type === 'text' ? '文字' : '语音'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">
                        {formatDateTime(item.createdAt)}
                      </span>
                      {isEvaluating && (
                        <span className="flex items-center gap-1 text-xs text-zinc-500">
                          <RefreshCw className="w-3 h-3 animate-spin" /> 评估中
                        </span>
                      )}
                      {isCompleted && item.overallScore !== null && (
                        <span className="text-xs text-zinc-500">
                          得分 <span className={`font-bold ${getScoreTextColor(item.overallScore!)}`}>{item.overallScore}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 箭头 */}
                  <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-300 group-hover:text-zinc-500 dark:hover:text-zinc-500 transition-colors flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <polyline points="9,18 15,12 9,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
