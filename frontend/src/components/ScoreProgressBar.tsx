import {motion} from 'framer-motion';
import {calculatePercentage} from '../utils/score';

interface ScoreProgressBarProps {
  label: string;
  score: number;
  maxScore: number;
  color?: string;
  delay?: number;
  className?: string;
}

/**
 * 分数进度条组件
 */
export default function ScoreProgressBar({
  label,
  score,
  maxScore,
  color = 'bg-zinc-200 dark:bg-zinc-800',
  delay = 0,
  className = ''
}: ScoreProgressBarProps) {
  const percentage = calculatePercentage(score, maxScore);

  return (
      <div className={`bg-zinc-200 dark:bg-zinc-800 rounded-lg p-3 ${className}`}>
          <div className="text-xs text-zinc-500 mb-1">{label}</div>
      <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${color} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, delay }}
          />
        </div>
          <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 w-8 text-right">
          {score}/{maxScore}
        </span>
      </div>
    </div>
  );
}
