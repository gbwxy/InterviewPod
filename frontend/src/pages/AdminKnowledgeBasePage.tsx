import { useState, useEffect, useCallback } from 'react';
import { Database, Search, Loader2, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import * as adminApi from '../api/admin';
import { formatDateTime } from '../api/membership';

export default function AdminKnowledgeBasePage() {
  const { user: currentUser } = useAuth();
  const [items, setItems] = useState<adminApi.AdminKnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [userIdFilter, setUserIdFilter] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pageSize = 20;

  if (currentUser?.role !== 'ADMIN') return null;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.listKnowledgeBases({
        page,
        size: pageSize,
        userId: userIdFilter ? Number(userIdFilter) : undefined,
      });
      setItems(result.content);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Failed to load knowledge bases:', err);
    } finally {
      setLoading(false);
    }
  }, [page, userIdFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async () => {
    if (deleteConfirmId === null) return;
    setDeleting(true);
    try {
      await adminApi.deleteKnowledgeBase(deleteConfirmId);
      setDeleteConfirmId(null);
      await loadData();
    } catch (err) {
      console.error('Failed to delete knowledge base:', err);
    } finally {
      setDeleting(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const vectorStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 dark:text-green-400';
      case 'PROCESSING': return 'text-amber-600 dark:text-amber-400';
      case 'PENDING': return 'text-zinc-500';
      case 'FAILED': return 'text-red-500';
      default: return 'text-zinc-500';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2.5">
          <Database className="w-5 h-5 text-emerald-500" />
          知识库管理
        </h1>
        <p className="text-zinc-500 text-sm mt-1">查看和管理所有用户的知识库文件</p>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input type="number" value={userIdFilter}
            onChange={e => { setUserIdFilter(e.target.value); setPage(0); }}
            placeholder="用户 ID..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-zinc-600 dark:text-zinc-400 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <Database className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">暂无知识库数据</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">用户ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">文件名</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">大小</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">向量化</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">上传时间</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map(kb => (
                <tr key={kb.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 font-mono text-xs">{kb.id}</td>
                  <td className="px-4 py-3 text-black dark:text-white font-mono text-xs">{kb.userId}</td>
                  <td className="px-4 py-3 text-black dark:text-white max-w-[200px] truncate">{kb.originalFilename}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">{formatSize(kb.fileSize)}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className={vectorStatusColor(kb.vectorStatus)}>{kb.vectorStatus || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">{formatDateTime(kb.uploadedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setDeleteConfirmId(kb.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-zinc-500 hover:text-red-500" title="删除">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-zinc-500">第 {page + 1} / {totalPages} 页</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {deleteConfirmId !== null && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setDeleteConfirmId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-base font-semibold text-black dark:text-white mb-4">删除知识库文件</h3>
              <p className="text-sm text-zinc-500 mb-6">确定要删除知识库文件 ID {deleteConfirmId} 吗？将同时清理向量数据和存储文件。此操作不可撤销。</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteConfirmId(null)} disabled={deleting}
                  className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg font-medium text-sm hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all disabled:opacity-40">取消</button>
                <button onClick={handleDelete} disabled={deleting}
                  className="px-4 py-2 text-white rounded-lg font-medium text-sm bg-red-600 hover:bg-red-700 transition-all disabled:opacity-40">
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin inline-block" /> : '确认删除'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
