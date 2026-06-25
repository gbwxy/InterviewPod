// frontend/src/components/interviewschedule/InterviewListItem.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, ExternalLink } from 'lucide-react';
import dayjs from 'dayjs';
import type { InterviewSchedule, InterviewStatus } from '../../types/interviewSchedule';

interface InterviewListItemProps {
  interview: InterviewSchedule;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: InterviewStatus) => void;
}

const statusConfig: Record<InterviewStatus, { label: string; className: string }> = {
  PENDING: {
    label: '待面试',
    className: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-300/30 dark:border-blue-400/30',
  },
  COMPLETED: {
    label: '已完成',
    className: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300/30 dark:border-emerald-400/30',
  },
  CANCELLED: {
    label: '已取消',
    className: 'bg-zinc-200 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800/50',
  },
  RESCHEDULED: {
    label: '已改期',
    className: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300/30 dark:border-amber-400/30',
  },
};

const typeLabels: Record<string, string> = {
  ONSITE: '现场面试',
  VIDEO: '视频面试',
  PHONE: '电话面试',
};

export const InterviewListItem: React.FC<InterviewListItemProps> = ({
  interview,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="bg-zinc-100 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 hover:shadow-2xl hover:shadow-zinc-900/50 dark:hover:shadow-zinc-900/50 hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <span className={`status-badge backdrop-blur-sm ${statusConfig[interview.status].className}`}>
              {statusConfig[interview.status].label}
            </span>
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 dark:text-zinc-400">
              {dayjs(interview.interviewTime).format('YYYY-MM-DD HH:mm')}
            </span>
          </div>

          <h3 className="font-display font-bold text-xl mb-2 text-black dark:text-white tracking-tight">
            {interview.companyName}
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 mb-3 font-medium">{interview.position}</p>

          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
            <span className="px-3 py-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg font-medium">
              第 {interview.roundNumber} 轮
            </span>
            <span className="text-zinc-500 dark:text-zinc-300">•</span>
            <span className="font-medium">{typeLabels[interview.interviewType] || interview.interviewType}</span>
            {interview.interviewer && (
              <>
                <span className="text-zinc-500 dark:text-zinc-300">•</span>
                <span className="font-medium">{interview.interviewer}</span>
              </>
            )}
          </div>

          {interview.meetingLink && (
            <motion.a
              whileHover={{ x: 2 }}
              href={interview.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-400 dark:text-zinc-400 dark:text-zinc-400 dark:hover:text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 mt-3 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              进入会议
            </motion.a>
          )}

          {interview.notes && (
            <p className="text-sm text-zinc-500 mt-3 italic">{interview.notes}</p>
          )}
        </div>

        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onEdit}
            className="p-2.5 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400 dark:text-zinc-400 dark:text-zinc-400 dark:hover:text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800/10 dark:hover:bg-zinc-200 dark:bg-zinc-800/20 rounded-xl hover:shadow-lg  transition-all"
            title="编辑"
          >
            <Edit2 className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onDelete}
            className="p-2.5 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded-xl hover:shadow-lg hover:shadow-red-500/20 transition-all"
            title="删除"
          >
            <Trash2 className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {interview.status === 'PENDING' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onStatusChange('COMPLETED')}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30 border border-emerald-300/30 dark:border-emerald-400/30 transition-all"
          >
            标记为已完成
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onStatusChange('CANCELLED')}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-zinc-200 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800/20 dark:hover:bg-zinc-200 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-800/50 transition-all"
          >
            取消面试
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
};
