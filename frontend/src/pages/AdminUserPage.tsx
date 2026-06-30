import { useState, useEffect, useCallback } from 'react';
import { Shield, Users, Search, Loader2, ChevronLeft, ChevronRight, Trash2, Crown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import * as adminApi from '../api/admin';
import type { UserRole } from '../api/membership';
import { ROLE_LABELS, ROLE_COLORS, formatDateTime } from '../api/membership';

export default function AdminUserPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<adminApi.AdminUser[]>([]);
  const [stats, setStats] = useState<adminApi.AdminUserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('LITE');
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pageSize = 20;

  // 非 Admin 用户看不到此页面
  if (currentUser?.role !== 'ADMIN') {
    return null;
  }

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [userPage, statsData] = await Promise.all([
        adminApi.listUsers({
          page,
          size: pageSize,
          keyword: keyword || undefined,
          role: roleFilter || undefined,
        }),
        adminApi.getUserStats(),
      ]);
      setUsers(userPage.content);
      setTotalPages(userPage.totalPages);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }, [page, keyword, roleFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleUpdateRole = async () => {
    if (editUserId === null) return;
    setSaving(true);
    try {
      await adminApi.updateUserRole(editUserId, editRole);
      setEditUserId(null);
      await loadUsers();
    } catch (err) {
      console.error('Failed to update role:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmId === null) return;
    setDeleting(true);
    try {
      await adminApi.deleteUser(deleteConfirmId);
      setDeleteConfirmId(null);
      await loadUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-purple-500" />
          用户管理
        </h1>
        <p className="text-zinc-500 text-sm mt-1">管理平台用户、角色和订阅</p>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: '总用户', value: stats.total, color: 'text-black dark:text-white' },
            { label: 'Lite', value: stats.lite, color: 'text-zinc-600 dark:text-zinc-400' },
            { label: 'Pro', value: stats.pro, color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Max+', value: stats.maxPlus, color: 'text-amber-600 dark:text-amber-400' },
            { label: 'Admin', value: stats.admin, color: 'text-purple-600 dark:text-purple-400' },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-3 text-center"
            >
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* 搜索和筛选 */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={keyword}
            onChange={e => { setKeyword(e.target.value); setPage(0); }}
            placeholder="搜索手机号或用户名..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700
              bg-zinc-200 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-200
              placeholder:text-zinc-500 focus:outline-none focus:ring-1
              focus:ring-zinc-500 focus:border-zinc-500 transition-shadow"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value as UserRole | ''); setPage(0); }}
          className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700
            bg-zinc-200 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-200
            focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500"
        >
          <option value="">全部角色</option>
          <option value="LITE">Lite</option>
          <option value="PRO">Pro</option>
          <option value="MAX_PLUS">Max+</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {/* 用户列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-zinc-600 dark:text-zinc-400 animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <Users className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">暂无用户数据</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">手机号</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">用户名</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">角色</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">到期时间</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">注册时间</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr
                  key={user.id}
                  className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 font-mono text-xs">{user.id}</td>
                  <td className="px-4 py-3 text-black dark:text-white font-mono text-xs">{user.phone || '—'}</td>
                  <td className="px-4 py-3 text-black dark:text-white">{user.username || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">{formatDateTime(user.subscriptionExpiredAt)}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">{formatDateTime(user.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditUserId(user.id); setEditRole(user.role); }}
                        className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        title="修改角色"
                      >
                        <Crown className="w-3.5 h-3.5" />
                      </button>
                      {user.id !== currentUser?.userId && (
                        <button
                          onClick={() => setDeleteConfirmId(user.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-zinc-500 hover:text-red-500"
                          title="删除用户"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-zinc-500">
            第 {page + 1} / {totalPages} 页
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 修改角色弹窗 */}
      {editUserId !== null && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setEditUserId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl max-w-sm w-full p-6"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-base font-semibold text-black dark:text-white mb-4">修改用户角色</h3>
              <p className="text-sm text-zinc-500 mb-4">用户 ID: {editUserId}</p>
              <select
                value={editRole}
                onChange={e => setEditRole(e.target.value as UserRole)}
                className="w-full px-3 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700
                  bg-zinc-200 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-200
                  focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500 mb-4"
              >
                <option value="LITE">Lite 免费版</option>
                <option value="PRO">Pro 专业版</option>
                <option value="MAX_PLUS">Max+ 尊享版</option>
                <option value="ADMIN">管理员</option>
              </select>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setEditUserId(null)}
                  disabled={saving}
                  className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg font-medium text-sm hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all disabled:opacity-40"
                >
                  取消
                </button>
                <button
                  onClick={handleUpdateRole}
                  disabled={saving}
                  className="px-4 py-2 text-zinc-900 dark:text-white rounded-lg font-medium text-sm bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all disabled:opacity-40"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin inline-block" /> : '确认'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 删除确认弹窗 */}
      {deleteConfirmId !== null && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setDeleteConfirmId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl max-w-sm w-full p-6"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-base font-semibold text-black dark:text-white mb-4">删除用户</h3>
              <p className="text-sm text-zinc-500 mb-6">
                确定要删除用户 ID {deleteConfirmId} 吗？此操作不可撤销。
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  disabled={deleting}
                  className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg font-medium text-sm hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all disabled:opacity-40"
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-white rounded-lg font-medium text-sm bg-red-600 hover:bg-red-700 transition-all disabled:opacity-40"
                >
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
