import {ChangeEvent, DragEvent, useCallback, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {AlertCircle, FileText, Loader2, Upload, X} from 'lucide-react';

export interface FileUploadCardProps {
  /** 标题 */
  title: string;
  /** 副标题 */
  subtitle: string;
  /** 接受的文件类型 */
  accept: string;
  /** 支持的格式说明 */
  formatHint: string;
  /** 最大文件大小说明 */
  maxSizeHint: string;
  /** 是否正在上传 */
  uploading?: boolean;
  /** 上传按钮文字 */
  uploadButtonText?: string;
  /** 选择按钮文字 */
  selectButtonText?: string;
  /** 是否显示名称输入框 */
  showNameInput?: boolean;
  /** 名称输入框占位符 */
  namePlaceholder?: string;
  /** 名称输入框标签 */
  nameLabel?: string;
  /** 错误信息 */
  error?: string;
  /** 文件选择回调 */
  onFileSelect?: (file: File) => void;
  /** 上传回调 */
  onUpload: (file: File, name?: string) => void;
  /** 返回回调 */
  onBack?: () => void;
}

export default function FileUploadCard({
  title,
  subtitle,
  accept,
  formatHint,
  maxSizeHint,
  uploading = false,
  uploadButtonText = '开始上传',
  selectButtonText = '选择文件',
  showNameInput = false,
  namePlaceholder = '留空则使用文件名',
  nameLabel = '名称（可选）',
  error,
  onFileSelect,
  onUpload,
  onBack,
}: FileUploadCardProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [name, setName] = useState('');

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
      onFileSelect?.(files[0]);
    }
  }, [onFileSelect]);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      onFileSelect?.(files[0]);
    }
  }, [onFileSelect]);

  const handleUpload = () => {
    if (!selectedFile) return;
    onUpload(selectedFile, name.trim() || undefined);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <motion.div
      className="max-w-2xl mx-auto pt-12"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* 标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-black dark:text-white mb-1.5 tracking-tight">
          {title}
        </h1>
        <p className="text-zinc-500 text-sm">
          {subtitle}
        </p>
      </div>

      {/* 上传区域 */}
      <motion.div
          className={`relative rounded-xl p-10 cursor-pointer transition-all duration-200 border-2 border-dashed
          ${dragOver
            ? 'border-zinc-500 bg-zinc-200 dark:bg-zinc-800/50 scale-[1.01]'
            : 'border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 hover:border-zinc-400 dark:border-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800/30'
          }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload-input')?.click()}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <input
          type="file"
          id="file-upload-input"
          className="hidden"
          accept={accept}
          onChange={handleFileChange}
          disabled={uploading}
        />

        <div className="text-center">
          <AnimatePresence mode="wait">
            {selectedFile ? (
              <motion.div
                key="file-selected"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4"
              >
                <div className="w-14 h-14 mx-auto bg-zinc-200 dark:bg-zinc-800 rounded-xl flex items-center justify-center">
                  <FileText className="w-7 h-7 text-zinc-600 dark:text-zinc-400 dark:text-zinc-400"/>
                </div>
                <div className="flex items-center justify-center gap-4 bg-zinc-200 dark:bg-zinc-800 px-5 py-3.5 rounded-lg max-w-md mx-auto border border-zinc-300 dark:border-zinc-700">
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-medium text-sm text-zinc-900 dark:text-zinc-200 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <button
                    className="w-7 h-7 bg-zinc-300 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="no-file"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <motion.div
                  className={`w-16 h-16 mx-auto rounded-xl flex items-center justify-center transition-colors
                    ${dragOver ? 'bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-300 dark:text-zinc-300' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}
                  animate={{ y: dragOver ? -4 : 0 }}
                >
                  <Upload className="w-8 h-8" />
                </motion.div>
                <div>
                  <h3 className="text-base font-medium text-zinc-500 dark:text-zinc-300 dark:text-zinc-300 mb-1">点击或拖拽文件至此处</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                    {formatHint}（{maxSizeHint}）
                  </p>
                </div>
                <motion.button
                  className="bg-black text-white dark:bg-white dark:text-black px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-zinc-100 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById('file-upload-input')?.click();
                  }}
                >
                  {selectButtonText}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 名称输入框 */}
      {showNameInput && selectedFile && (
        <motion.div
          className="mt-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <label className="block text-xs font-medium text-zinc-500 mb-2">{nameLabel}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={namePlaceholder}
            className="w-full px-3 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-500 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 text-sm placeholder:text-zinc-600 dark:text-zinc-400"
            disabled={uploading}
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}

      {/* 错误提示 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 操作按钮 */}
      <div className="mt-6 flex gap-3 justify-center">
        {onBack && (
          <motion.button
            onClick={onBack}
            className="px-5 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 text-sm font-medium hover:bg-zinc-200 dark:bg-zinc-800 hover:text-zinc-900 dark:text-zinc-200 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            返回
          </motion.button>
        )}
        {selectedFile && (
          <motion.button
            onClick={handleUpload}
            disabled={uploading}
            className="px-6 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-lg font-medium text-sm hover:bg-zinc-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            whileHover={{ scale: uploading ? 1 : 1.02 }}
            whileTap={{ scale: uploading ? 1 : 0.98 }}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                处理中...
              </>
            ) : (
              uploadButtonText
            )}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
