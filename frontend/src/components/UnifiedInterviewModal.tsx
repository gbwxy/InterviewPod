import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X, Sparkles, FileText, Mic,
  FileStack, ChevronDown, ChevronUp, Loader2
} from 'lucide-react';
import { useInterviewConfig, CUSTOM_SKILL_ID, DIFFICULTY_OPTIONS, type InterviewMode, type Difficulty } from '../hooks/useInterviewConfig';
import { getSkillIcon } from '../utils/skillIcons';

// Re-export for backward compatibility
export type { InterviewMode, Difficulty };
export { DIFFICULTY_OPTIONS };

export interface UnifiedInterviewConfig {
  mode: InterviewMode;
  skillId: string;
  skillName: string;
  difficulty: Difficulty;
  resumeId?: number;
  resumeText?: string;
  llmProvider: string;
  questionCount: number;
  techEnabled: boolean;
  projectEnabled: boolean;
  hrEnabled: boolean;
  plannedDuration: number;
  customJdText?: string;
  customCategories?: import('../api/skill').CategoryDTO[];
}

interface UnifiedInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (config: UnifiedInterviewConfig) => void;
  defaultMode?: InterviewMode;
  defaultResumeId?: number;
  hideModeSwitch?: boolean;
  title?: string;
  subtitle?: string;
  startButtonText?: string;
}

export default function UnifiedInterviewModal({
  isOpen,
  onClose,
  onStart,
  defaultMode = 'text',
  defaultResumeId,
  hideModeSwitch = false,
  title = '开始模拟面试',
  subtitle = '选择面试模式和主题，快速开始',
  startButtonText = '开始面试',
}: UnifiedInterviewModalProps) {
  const config = useInterviewConfig({ defaultMode, defaultResumeId, autoLoad: false });

  useEffect(() => {
    if (isOpen) {
      config.setMode(defaultMode);
      if (defaultResumeId != null) {
        config.setResumeId(defaultResumeId);
        config.setShowMore(true);
      }
      config.loadSkills();
      config.loadResumes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, defaultMode, defaultResumeId]);

  const handleStart = () => {
    const selectedSkill = config.selectedSkill;

    if (config.isCustomStartDisabled) {
      return;
    }

    onStart({
      mode: config.mode,
      skillId: config.skillId,
      skillName: selectedSkill?.name || '自定义',
      difficulty: config.difficulty,
      resumeId: config.resumeId,
      llmProvider: config.llmProvider,
      questionCount: config.questionCount,
      techEnabled: true,
      projectEnabled: true,
      hrEnabled: true,
      plannedDuration: config.plannedDuration,
      customJdText: config.isCustomSkill ? config.parsedCustomJdText : undefined,
      customCategories: config.isCustomSkill ? config.customCategories : undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-zinc-500" />
                    <div>
                      <h2 className="text-sm font-semibold text-black dark:text-white">
                        {title}
                      </h2>
                      <p className="text-xs text-zinc-500">
                        {subtitle}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 text-zinc-500 hover:text-zinc-500 dark:hover:text-zinc-500 dark:text-zinc-300 dark:text-zinc-300 hover:bg-zinc-200 dark:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-5 py-4 space-y-4">
                {!hideModeSwitch && (
                  <div>
                    <label className="flex items-center gap-2 mb-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
                      面试模式
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        {
                          value: 'text' as InterviewMode,
                          label: '文字面试',
                          icon: FileText,
                          desc: '推荐：更稳定，更适合系统化练习',
                          recommended: true,
                        },
                        {
                          value: 'voice' as InterviewMode,
                          label: '语音面试',
                          icon: Mic,
                          desc: '实时语音对话，偏临场模拟',
                          recommended: false,
                        },
                      ]).map(opt => {
                        const Icon = opt.icon;
                        const selected = config.mode === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => config.setMode(opt.value)}
                            className={`flex items-center gap-2.5 p-3 rounded-lg border transition-all duration-150 text-left
                              ${selected
                                ? 'border-zinc-500 bg-zinc-200 dark:bg-zinc-800'
                                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 hover:border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800/50'
                              }`}
                          >
                            <Icon className={`w-4 h-4 flex-shrink-0 ${selected ? 'text-black dark:text-white' : 'text-zinc-500'}`} />
                            <div className="min-w-0">
                              <p className={`font-medium text-xs flex items-center gap-1.5 ${selected ? 'text-black dark:text-white' : 'text-zinc-600 dark:text-zinc-400 dark:text-zinc-400'}`}>
                                <span>{opt.label}</span>
                                {opt.recommended && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-300 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 dark:text-zinc-400">
                                    推荐
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-zinc-600 dark:text-zinc-400 mt-0.5">{opt.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 面试方向 */}
                <div>
                  <label className="flex items-center gap-2 mb-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
                    面试方向
                  </label>
                  {config.loadingSkills ? (
                    <div className="flex items-center gap-2 py-4 text-zinc-600 dark:text-zinc-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs">加载中...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5">
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
                            <div className="flex-1 min-w-0">
                              <span className={`text-xs font-medium block truncate ${selected ? 'text-black dark:text-white' : 'text-zinc-600 dark:text-zinc-400 dark:text-zinc-400'}`}>
                                {skill.name}
                              </span>
                            </div>
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
                  <label className="flex items-center gap-2 mb-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
                    难度
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {DIFFICULTY_OPTIONS.map(opt => {
                      const selected = config.difficulty === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => config.setDifficulty(opt.value)}
                          className={`py-2 px-3 rounded-lg border transition-all duration-150 text-center
                            ${selected
                              ? 'border-zinc-500 bg-zinc-200 dark:bg-zinc-800'
                              : 'border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 hover:border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800/50'
                            }`}
                        >
                          <p className={`text-xs font-medium ${selected ? 'text-black dark:text-white' : 'text-zinc-600 dark:text-zinc-400 dark:text-zinc-400'}`}>
                            {opt.label}
                          </p>
                          <p className="text-[10px] text-zinc-600 dark:text-zinc-400 mt-0.5">{opt.desc}</p>
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
                      <div className="bg-zinc-200 dark:bg-zinc-800 rounded-lg p-3.5 border border-zinc-300 dark:border-zinc-700">
                        <div className="flex items-center gap-2 mb-2.5">
                          <FileStack className="w-3.5 h-3.5 text-zinc-500" />
                          <p className="font-medium text-xs text-zinc-500 dark:text-zinc-300 dark:text-zinc-300">
                            基于简历面试（可选）
                          </p>
                        </div>
                        <select
                          value={config.resumeId || ''}
                          onChange={e => config.setResumeId(e.target.value ? parseInt(e.target.value) : undefined)}
                          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700
                            bg-zinc-100 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-200
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
                          <label className="flex items-center gap-2 mb-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
                            题目数量
                          </label>
                          <div className="flex gap-1.5">
                            {[6, 8, 10, 12].map(n => (
                              <button
                                key={n}
                                onClick={() => config.setQuestionCount(n)}
                                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all
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
                        <div className="bg-zinc-200 dark:bg-zinc-800 rounded-lg p-3.5 border border-zinc-300 dark:border-zinc-700">
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-medium text-xs text-zinc-500 dark:text-zinc-300 dark:text-zinc-300">计划面试时长</p>
                            <div className="text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-200">
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

              {/* Footer */}
              <div className="px-5 py-3.5 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex gap-2">
                  <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700
                      text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 rounded-lg font-medium text-sm
                      hover:bg-zinc-200 dark:bg-zinc-800 hover:text-zinc-900 dark:text-zinc-200 transition-all"
                  >
                    取消
                  </motion.button>
                  <motion.button
                    onClick={handleStart}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={config.isCustomStartDisabled}
                    className="flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all
                      bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100
                      disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {startButtonText}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
