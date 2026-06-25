import {useCallback, useEffect, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {
  AlertCircle,
  Check,
  CheckCircle,
  ChevronDown,
  Clock,
  Database,
  Download,
  Edit3,
  Eye,
  FileText,
  HardDrive,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {knowledgeBaseApi, KnowledgeBaseItem, KnowledgeBaseStats, SortOption, VectorStatus,} from '../api/knowledgebase';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';

interface KnowledgeBaseManagePageProps {
  onUpload: () => void;
  onChat: () => void;
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// 格式化日期
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 状态图标组件
function StatusIcon({ status }: { status: VectorStatus }) {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'PROCESSING':
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    case 'PENDING':
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case 'FAILED':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    default:
      return <CheckCircle className="w-4 h-4 text-green-500" />;
  }
}

// 状态文本
function getStatusText(status: VectorStatus): string {
  switch (status) {
    case 'COMPLETED':
      return '已完成';
    case 'PROCESSING':
      return '处理中';
    case 'PENDING':
      return '待处理';
    case 'FAILED':
      return '失败';
    default:
      return '未知';
  }
}

// 统计卡片组件
function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-100 dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800"
    >
      <div className="flex items-center gap-3.5">
        <div className="p-2.5 rounded-lg bg-zinc-200 dark:bg-zinc-800">
          <Icon className="w-5 h-5 text-zinc-600 dark:text-zinc-400 dark:text-zinc-400" />
        </div>
        <div>
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-200">{value.toLocaleString()}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function KnowledgeBaseManagePage({ onUpload, onChat }: KnowledgeBaseManagePageProps) {
  const [stats, setStats] = useState<KnowledgeBaseStats | null>(null);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('time');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [deleteItem, setDeleteItem] = useState<KnowledgeBaseItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 分类编辑状态
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);
  const categoryInputRef = useRef<HTMLInputElement>(null);

  // 重新向量化状态
  const [revectorizing, setRevectorizing] = useState<number | null>(null);

  // 加载数据（不显示loading状态，用于轮询）
  const loadDataSilent = useCallback(async () => {
    try {
      const [statsData, kbList, categoryList] = await Promise.all([
        knowledgeBaseApi.getStatistics(),
        searchKeyword
          ? knowledgeBaseApi.search(searchKeyword)
          : selectedCategory
          ? knowledgeBaseApi.getByCategory(selectedCategory)
          : knowledgeBaseApi.getAllKnowledgeBases(sortBy),
        knowledgeBaseApi.getAllCategories(),
      ]);
      setStats(statsData);
      setKnowledgeBases(kbList);
      setCategories(categoryList);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  }, [searchKeyword, sortBy, selectedCategory]);

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, kbList, categoryList] = await Promise.all([
        knowledgeBaseApi.getStatistics(),
        searchKeyword
          ? knowledgeBaseApi.search(searchKeyword)
          : selectedCategory
          ? knowledgeBaseApi.getByCategory(selectedCategory)
          : knowledgeBaseApi.getAllKnowledgeBases(sortBy),
        knowledgeBaseApi.getAllCategories(),
      ]);
      setStats(statsData);
      setKnowledgeBases(kbList);
      setCategories(categoryList);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [searchKeyword, sortBy, selectedCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 轮询：当有 PENDING 或 PROCESSING 状态时，每5秒刷新一次
  useEffect(() => {
    const hasPendingItems = knowledgeBases.some(
      kb => kb.vectorStatus === 'PENDING' || kb.vectorStatus === 'PROCESSING'
    );

    if (hasPendingItems && !loading) {
      const timer = setInterval(() => {
        loadDataSilent();
      }, 5000);

      return () => clearInterval(timer);
    }
  }, [knowledgeBases, loading, loadDataSilent]);

  // 重新向量化
  const handleRevectorize = async (id: number) => {
    try {
      setRevectorizing(id);
      await knowledgeBaseApi.revectorize(id);
      await loadDataSilent();
    } catch (error) {
      console.error('重新向量化失败:', error);
    } finally {
      setRevectorizing(null);
    }
  };

  // 删除知识库
  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      setDeleting(true);
      await knowledgeBaseApi.deleteKnowledgeBase(deleteItem.id);
      setDeleteItem(null);
      await loadData();
    } catch (error) {
      console.error('删除失败:', error);
    } finally {
      setDeleting(false);
    }
  };

  // 下载知识库
    const handleDownload = async (kb: KnowledgeBaseItem) => {
        try {
            const blob = await knowledgeBaseApi.downloadKnowledgeBase(kb.id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = kb.originalFilename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('下载失败:', error);
        }
  };

  // 开始编辑分类
  const handleStartEditCategory = (kb: KnowledgeBaseItem) => {
    setEditingCategoryId(kb.id);
    setEditingCategoryValue(kb.category || '');
    setTimeout(() => {
      categoryInputRef.current?.focus();
    }, 50);
  };

  // 取消编辑分类
  const handleCancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryValue('');
  };

  // 保存分类
  const handleSaveCategory = async (id: number) => {
    try {
      setSavingCategory(true);
      const categoryToSave = editingCategoryValue.trim() || null;
      await knowledgeBaseApi.updateCategory(id, categoryToSave);
      setEditingCategoryId(null);
      setEditingCategoryValue('');
      await loadData();
    } catch (error) {
      console.error('更新分类失败:', error);
    } finally {
      setSavingCategory(false);
    }
  };

  // 处理分类输入框按键
  const handleCategoryKeyDown = (e: React.KeyboardEvent, id: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveCategory(id);
    } else if (e.key === 'Escape') {
      handleCancelEditCategory();
    }
  };

  // 搜索处理
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2.5">
            <Database className="w-5 h-5 text-zinc-600 dark:text-zinc-400 dark:text-zinc-400" />
            知识库管理
          </h1>
          <p className="text-zinc-500 text-sm mt-1">管理您的知识库文件，查看使用统计</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onUpload}
            className="flex items-center gap-2 px-3.5 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg hover:bg-zinc-100 transition-colors text-sm font-medium"
          >
            <Upload className="w-3.5 h-3.5" />
            上传知识库
          </button>
          <button
            onClick={onChat}
            className="flex items-center gap-2 px-3.5 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-300 dark:text-zinc-300 rounded-lg hover:bg-zinc-300 dark:bg-zinc-700 transition-colors border border-zinc-300 dark:border-zinc-700 text-sm font-medium"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            问答助手
          </button>
        </div>
      </div>
      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard icon={Database} label="知识库总数" value={stats.totalCount} />
          <StatCard icon={MessageSquare} label="总提问次数" value={stats.totalQuestionCount} />
          <StatCard icon={Eye} label="总访问次数" value={stats.totalAccessCount} />
        </div>
      )}

      {/* 搜索和筛选栏 */}
        <div
            className="bg-zinc-100 dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 mb-5">
        <div className="flex flex-wrap items-center gap-4">
          {/* 搜索框 */}
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索知识库名称..."
                className="w-full pl-9 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-500 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 text-sm placeholder:text-zinc-600 dark:text-zinc-400"
              />
            </div>
          </form>

          {/* 排序选择 */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortOption);
                setSearchKeyword('');
                setSelectedCategory(null);
              }}
              className="appearance-none pl-3 pr-9 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-500 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 text-sm cursor-pointer"
            >
              <option value="time">按时间排序</option>
              <option value="size">按大小排序</option>
              <option value="access">按访问排序</option>
              <option value="question">按提问排序</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400 pointer-events-none" />
          </div>

          {/* 分类筛选 */}
          <div className="relative">
            <select
              value={selectedCategory || ''}
              onChange={(e) => {
                setSelectedCategory(e.target.value || null);
                setSearchKeyword('');
              }}
              className="appearance-none pl-3 pr-9 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-500 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 text-sm cursor-pointer"
            >
              <option value="">全部分类</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 知识库列表 */}
        <div
            className="bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-zinc-600 dark:text-zinc-400 animate-spin" />
          </div>
        ) : knowledgeBases.length === 0 ? (
          <div className="text-center py-20">
            <HardDrive className="w-12 h-12 text-zinc-500 dark:text-zinc-300 mx-auto mb-4" />
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">暂无知识库</p>
            <button
              onClick={onUpload}
              className="mt-4 text-sm text-zinc-500 hover:text-zinc-500 dark:hover:text-zinc-500 dark:text-zinc-300 dark:text-zinc-300"
            >
              上传第一个知识库
            </button>
          </div>
        ) : (
          <table className="w-full">
              <thead className="border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                  <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">名称</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">分类</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">大小</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">状态</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">提问</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">上传时间</th>
                  <th className="text-right px-5 py-3.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">操作</th>
              </tr>
            </thead>
            <tbody>
              {knowledgeBases.map((kb, index) => (
                <motion.tr
                  key={kb.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-zinc-200 dark:border-zinc-800 last:border-0 hover:bg-zinc-200 dark:bg-zinc-800 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                      <div>
                          <p className="font-medium text-sm text-zinc-900 dark:text-zinc-200">{kb.name}</p>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">{kb.originalFilename}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <AnimatePresence mode="wait">
                      {editingCategoryId === kb.id ? (
                        <motion.div
                          key="editing"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <input
                            ref={categoryInputRef}
                            type="text"
                            value={editingCategoryValue}
                            onChange={(e) => setEditingCategoryValue(e.target.value)}
                            onKeyDown={(e) => handleCategoryKeyDown(e, kb.id)}
                            placeholder="输入分类名称"
                            list="category-suggestions"
                            className="w-24 px-2 py-1 text-xs border border-zinc-400 dark:border-zinc-600 rounded focus:outline-none focus:ring-1 focus:ring-zinc-500 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200"
                            disabled={savingCategory}
                          />
                          <datalist id="category-suggestions">
                            {categories.map((cat) => (
                              <option key={cat} value={cat} />
                            ))}
                          </datalist>
                          <button
                            onClick={() => handleSaveCategory(kb.id)}
                            disabled={savingCategory}
                            className="p-1 text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 rounded transition-colors disabled:opacity-50"
                            title="保存"
                          >
                            {savingCategory ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={handleCancelEditCategory}
                            disabled={savingCategory}
                            className="p-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-500 dark:text-zinc-300 dark:text-zinc-300 hover:bg-zinc-300 dark:bg-zinc-700 rounded transition-colors disabled:opacity-50"
                            title="取消"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="display"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2 group/category"
                        >
                          {kb.category ? (
                              <span
                                  className="px-2 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 rounded text-xs border border-zinc-300 dark:border-zinc-700">
                              {kb.category}
                            </span>
                          ) : (
                              <span className="text-zinc-500 dark:text-zinc-300 text-xs">未分类</span>
                          )}
                          <button
                            onClick={() => handleStartEditCategory(kb)}
                            className="p-1 text-zinc-500 dark:text-zinc-300 hover:text-zinc-600 dark:hover:text-zinc-400 dark:text-zinc-400 dark:text-zinc-400 hover:bg-zinc-300 dark:bg-zinc-700 rounded opacity-0 group-hover/category:opacity-100 transition-all"
                            title="编辑分类"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </td>
                    <td className="px-5 py-4 text-xs text-zinc-500">
                    {formatFileSize(kb.fileSize)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <StatusIcon status={kb.vectorStatus} />
                        <span className="text-xs text-zinc-600 dark:text-zinc-400 dark:text-zinc-400">
                        {getStatusText(kb.vectorStatus)}
                      </span>
                    </div>
                  </td>
                    <td className="px-5 py-4 text-xs text-zinc-500">
                    {kb.questionCount}
                  </td>
                    <td className="px-5 py-4 text-xs text-zinc-600 dark:text-zinc-400">
                    {formatDate(kb.uploadedAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* 下载按钮 */}
                      <button
                        onClick={() => handleDownload(kb)}
                        className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-500 dark:text-zinc-300 dark:text-zinc-300 hover:bg-zinc-300 dark:bg-zinc-700 rounded-lg transition-colors"
                        title="下载"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {/* 重新向量化按钮（仅 FAILED 状态显示） */}
                      {kb.vectorStatus === 'FAILED' && (
                        <button
                          onClick={() => handleRevectorize(kb.id)}
                          disabled={revectorizing === kb.id}
                          className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-500 dark:text-zinc-300 dark:text-zinc-300 hover:bg-zinc-300 dark:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
                          title="重新向量化"
                        >
                          <RefreshCw className={`w-4 h-4 ${revectorizing === kb.id ? 'animate-spin' : ''}`} />
                        </button>
                      )}
                      {/* 删除按钮 */}
                      <button
                        onClick={() => setDeleteItem(kb)}
                        className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        open={deleteItem !== null}
        item={deleteItem}
        itemType="知识库"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </div>
  );
}
