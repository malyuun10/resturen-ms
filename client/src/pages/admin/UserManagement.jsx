import React, { useState, useEffect } from 'react';
import { userService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import SearchBar from '../../components/SearchBar';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import Loading from '../../components/Loading';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';

const UserManagement = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Delete dialog
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'cashier',
    phone: '',
    isActive: true
  });
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userService.getUsers({
        search,
        role: roleFilter,
        status: statusFilter
      });
      if (res.success) {
        setUsers(res.users || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  // Open Add Modal
  const openAddModal = () => {
    setFormData({
      username: '',
      password: '',
      fullName: '',
      role: 'cashier',
      phone: '',
      isActive: true
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (u) => {
    setSelectedUser(u);
    setFormData({
      username: u.username,
      fullName: u.fullName,
      role: u.role,
      phone: u.phone || '',
      isActive: u.isActive
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  // Open Reset Password Modal
  const openResetModal = (u) => {
    setSelectedUser(u);
    setResetPasswordVal('');
    setFormError('');
    setIsResetModalOpen(true);
  };

  // Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const res = await userService.createUser(formData);
      if (res.success) {
        setIsAddModalOpen(false);
        await fetchUsers();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update User
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setFormError('');
    setIsSubmitting(true);

    try {
      const res = await userService.updateUser(selectedUser._id, {
        fullName: formData.fullName,
        role: formData.role,
        phone: formData.phone,
        isActive: formData.isActive
      });
      if (res.success) {
        setIsEditModalOpen(false);
        await fetchUsers();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to update user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset Password Submit
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedUser || !resetPasswordVal || resetPasswordVal.length < 6) {
      setFormError('New password must be at least 6 characters.');
      return;
    }
    setFormError('');
    setIsSubmitting(true);

    try {
      const res = await userService.resetPassword(selectedUser._id, resetPasswordVal);
      if (res.success) {
        setIsResetModalOpen(false);
        alert(res.message || 'Password reset successfully.');
      }
    } catch (err) {
      setFormError(err.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Status
  const handleToggleStatus = async (userId) => {
    try {
      const res = await userService.toggleStatus(userId);
      if (res.success) {
        await fetchUsers();
      }
    } catch (err) {
      alert(err.message || 'Could not update user status.');
    }
  };

  // Delete User
  const handleConfirmDelete = async () => {
    if (!deleteUserId) return;
    setIsDeleting(true);

    try {
      const res = await userService.deleteUser(deleteUserId);
      if (res.success) {
        setDeleteUserId(null);
        await fetchUsers();
      }
    } catch (err) {
      alert(err.message || 'Could not delete user.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1F2937] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#800020]" />
            <span>Staff & User Management</span>
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Administer restaurant cashier accounts, roles, access permissions, and passwords.
          </p>
        </div>

        <Button variant="primary" icon={UserPlus} onClick={openAddModal}>
          Create New Staff User
        </Button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name, username, or phone..."
            onClear={() => {
              setSearch('');
              fetchUsers();
            }}
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="py-1.5 px-3 rounded-lg border border-gray-200 text-xs text-gray-700 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-[#800020]"
          >
            <option value="">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="cashier">Cashiers</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-3 rounded-lg border border-gray-200 text-xs text-gray-700 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-[#800020]"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Deactivated</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8">
            <Loading text="Loading staff records..." />
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No users match your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FDF2F4]/40 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Last Login</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => {
                  const isCurrent = currentUser?._id === u._id;
                  return (
                    <tr key={u._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#800020] text-white flex items-center justify-center font-bold text-xs uppercase">
                            {u.fullName?.charAt(0) || u.username.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-[#1F2937]">
                              {u.fullName} {isCurrent && <span className="text-[10px] text-gray-400 font-normal">(You)</span>}
                            </p>
                            <p className="text-[10px] text-gray-400">ID: {u._id.slice(-6)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-gray-700">
                        {u.username}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                            u.role === 'admin'
                              ? 'bg-[#FDF2F4] text-[#800020] border border-[#800020]/20'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {u.phone || '—'}
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleStatus(u._id)}
                          disabled={isCurrent}
                          title={isCurrent ? "Cannot deactivate yourself" : "Click to toggle active status"}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-all ${
                            u.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {u.isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-gray-400" /> Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openResetModal(u)}
                            className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                            title="Reset Password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-gray-500 hover:text-[#800020] hover:bg-[#FDF2F4] rounded-md transition-colors"
                            title="Edit User"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteUserId(u._id)}
                            disabled={isCurrent}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={isCurrent ? 'Cannot delete your own active account' : 'Delete User'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Staff Member"
        subtitle="Create an Admin or Cashier user account"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1F2937] mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="e.g. John Doe"
              className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1">Username *</label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="e.g. cashier2"
                className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1">Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Min 6 characters"
                className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020] bg-white"
              >
                <option value="cashier">Cashier</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 555-0199"
                className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-[#800020] rounded border-gray-300 focus:ring-[#800020]"
            />
            <label htmlFor="isActiveCheck" className="text-xs text-gray-700 font-medium">
              Account Active Immediately
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Staff Member"
        subtitle={`Updating user: ${selectedUser?.username}`}
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1F2937] mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020] bg-white"
              >
                <option value="cashier">Cashier</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="editIsActiveCheck"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-[#800020] rounded border-gray-300 focus:ring-[#800020]"
            />
            <label htmlFor="editIsActiveCheck" className="text-xs text-gray-700 font-medium">
              Account Active
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset User Password"
        subtitle={`Set a new login password for ${selectedUser?.username}`}
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1F2937] mb-1">
              New Password (min 6 characters)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={resetPasswordVal}
              onChange={(e) => setResetPasswordVal(e.target.value)}
              placeholder="Enter new password"
              className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button variant="ghost" onClick={() => setIsResetModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Reset Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete User Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deleteUserId}
        onClose={() => setDeleteUserId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Staff Account"
        message="Are you sure you want to permanently delete this user account? This cannot be undone."
        confirmText="Delete Account"
        confirmVariant="danger"
        loading={isDeleting}
      />
    </div>
  );
};

export default UserManagement;
