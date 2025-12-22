'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TableFilter from '@/components/common/TableFilter';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import AlertDialog from '@/components/common/AlertDialog';

export default function UserList({ users: initialUsers }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [deleting, setDeleting] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, userId: null });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, message: '', variant: 'error' });

  // Filter logic
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search filter
      const searchMatch =
        !searchTerm ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      // Role filter
      const roleMatch = roleFilter === 'all' || user.role === roleFilter;

      return searchMatch && roleMatch;
    });
  }, [users, searchTerm, roleFilter]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
  };

  const handleDeleteClick = (id) => {
    setConfirmDialog({ isOpen: true, userId: id });
  };

  const handleDeleteConfirm = async () => {
    const id = confirmDialog.userId;
    setDeleting(id);

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers(users.filter((user) => user.id !== id));
        router.refresh();
      } else {
        const data = await response.json();
        setAlertDialog({
          isOpen: true,
          message: data.error || 'Kullanıcı silinemedi',
          variant: 'error',
        });
      }
    } catch (error) {
      setAlertDialog({
        isOpen: true,
        message: 'Bir hata oluştu',
        variant: 'error',
      });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <TableFilter
        searchPlaceholder="Kullanıcı adı veya email ara..."
        onSearchChange={setSearchTerm}
        filters={[
          {
            id: 'role',
            label: 'Rol',
            value: roleFilter,
            options: [
              { value: 'all', label: 'Tümü' },
              { value: 'admin', label: 'Admin' },
              { value: 'user', label: 'Kullanıcı' },
            ],
            onChange: setRoleFilter,
          },
        ]}
        onClearFilters={handleClearFilters}
        totalCount={users.length}
        filteredCount={filteredUsers.length}
      />

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Kullanıcı Adı
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rol
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Oluşturulma
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              İşlemler
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredUsers.map((user) => (
            <tr key={user.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {user.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {user.username}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {user.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(user.created_at).toLocaleDateString('tr-TR')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Link
                  href={`/admin/users/${user.id}/edit`}
                  className="text-blue-600 hover:text-blue-900 mr-4"
                >
                  Düzenle
                </Link>
                <button
                  onClick={() => handleDeleteClick(user.id)}
                  disabled={deleting === user.id}
                  className="text-red-600 hover:text-red-900 disabled:opacity-50"
                >
                  {deleting === user.id ? 'Siliniyor...' : 'Sil'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm || roleFilter !== 'all'
            ? 'Arama kriterlerine uygun kullanıcı bulunamadı'
            : 'Henüz kullanıcı bulunmuyor'}
        </div>
      )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, userId: null })}
        onConfirm={handleDeleteConfirm}
        title="Kullanıcıyı Sil"
        message="Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
        variant="danger"
      />

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.variant === 'error' ? 'Hata' : 'Bildirim'}
        message={alertDialog.message}
        variant={alertDialog.variant}
      />
    </div>
  );
}
