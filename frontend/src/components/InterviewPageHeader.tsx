import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface InterviewPageHeaderProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
}

export default function InterviewPageHeader({
  title,
  subtitle,
  icon,
}: InterviewPageHeaderProps) {
  return (
    <motion.div
      className="text-center mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h1 className="text-3xl font-bold text-black dark:text-white mb-2 flex items-center justify-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-zinc-700 to-zinc-600 rounded-xl flex items-center justify-center">
          {icon}
        </div>
        {title}
      </h1>
      <p className="text-zinc-500">{subtitle}</p>
    </motion.div>
  );
}
