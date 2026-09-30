import React, { useState, useEffect } from 'react';
import { tableService } from '../../services/api';
import SearchBar from '../../components/SearchBar';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import Loading from '../../components/Loading';
import { Grid, Plus, Edit2, Trash2, Users, CheckCircle, Clock, Bookmark, AlertCircle } from 'lucide-react';

const TableManagement = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [deleteTableId, setDeleteTableId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    tableNumber: '',
    capacity: 4,
    status: 'available'
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const res = await tableService.getTables({ status: statusFilter });
      if (res.success) {
        setTables(res.tables || []);
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, [statusFilter]);

  const openAdd = () => {
    setFormData({ tableNumber: '', capacity: 4, status: 'available' });
    setFormError('');
    setIsAddOpen(true);
  };

  const openEdit = (tbl) => {
    setSelectedTable(tbl);
    setFormData({
      tableNumber: tbl.tableNumber,
      capacity: tbl.capacity,
      status: tbl.status
    });
    setFormError('');
    setIsEditOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      const res = await tableService.createTable({
        ...formData,
        capacity: Number(formData.capacity)
      });
      if (res.success) {
        setIsAddOpen(false);
        await fetchTables();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create table.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedTable) return;
    setFormError('');
    setIsSubmitting(true);
    try {
      const res = await tableService.updateTable(selectedTable._id, {
        ...formData,
        capacity: Number(formData.capacity)
      });
      if (res.success) {
        setIsEditOpen(false);
        await fetchTables();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to update table.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (tableId, newStatus) => {
    try {
      const res = await tableService.updateTableStatus(tableId, newStatus);
      if (res.success) {
        await fetchTables();
      }
    } catch (err) {
      alert(err.message || 'Could not update table status.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTableId) return;
    setIsDeleting(true);
    try {
      const res = await tableService.deleteTable(deleteTableId);
      if (res.success) {
        setDeleteTableId(null);
        await fetchTables();
      }
    } catch (err) {
      alert(err.message || 'Could not delete table.');
    } finally {
      setIsDeleting(false);
    }
  };

  const availableCount = tables.filter((t) => t.status === 'available').length;
  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;
  const reservedCount = tables.filter((t) => t.status === 'reserved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1F2937] flex items-center gap-2">
            <Grid className="w-5 h-5 text-[#800020]" />
            <span>Table & Floor Plan Management</span>
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Manage restaurant dining tables, capacities, and active seating status.
          </p>
        </div>

        <Button variant="primary" icon={Plus} onClick={openAdd}>
          Add Dining Table
        </Button>
      </div>

      {/* Status Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'all'
              ? 'bg-[#800020] text-white border-[#800020] shadow-sm'
              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">
            All Tables
          </span>
          <span className="text-xl font-extrabold">{tables.length}</span>
        </button>

        <button
          onClick={() => setStatusFilter('available')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'available'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
              : 'bg-white border-gray-200 text-emerald-800 hover:border-emerald-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">
            Available
          </span>
          <span className="text-xl font-extrabold">{availableCount}</span>
        </button>

        <button
          onClick={() => setStatusFilter('occupied')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'occupied'
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-white border-gray-200 text-amber-800 hover:border-amber-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">
            Occupied
          </span>
          <span className="text-xl font-extrabold">{occupiedCount}</span>
        </button>

        <button
          onClick={() => setStatusFilter('reserved')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'reserved'
              ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
              : 'bg-white border-gray-200 text-blue-800 hover:border-blue-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">
            Reserved
          </span>
          <span className="text-xl font-extrabold">{reservedCount}</span>
        </button>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <Loading text="Loading floor layout..." />
      ) : tables.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <Grid className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">No tables found matching this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tables.map((t) => {
            const isAvail = t.status === 'available';
            const isOcc = t.status === 'occupied';
            const isRes = t.status === 'reserved';

            return (
              <div
                key={t._id}
                className={`bg-white rounded-xl border-2 p-4 flex flex-col justify-between transition-all duration-200 shadow-xs ${
                  isAvail
                    ? 'border-emerald-200 hover:border-emerald-500'
                    : isOcc
                    ? 'border-amber-200 hover:border-amber-500 bg-amber-50/20'
                    : 'border-blue-200 hover:border-blue-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="font-extrabold text-base text-[#1F2937]">
                      {t.tableNumber}
                    </span>
                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                      <Users className="w-3.5 h-3.5" />
                      <span>{t.capacity}</span>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <div className="mt-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isAvail
                          ? 'bg-emerald-100 text-emerald-800'
                          : isOcc
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {isAvail ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-emerald-600" /> Available
                        </>
                      ) : isOcc ? (
                        <>
                          <Clock className="w-3 h-3 text-amber-600" /> Occupied
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3 h-3 text-blue-600" /> Reserved
                        </>
                      )}
                    </span>
                  </div>

                  {/* Active Order Summary if Occupied */}
                  {isOcc && t.currentOrder && (
                    <div className="mt-2.5 p-2 rounded-lg bg-white border border-amber-200 text-[11px] text-gray-700 space-y-0.5">
                      <p className="font-mono font-bold text-amber-900 truncate">
                        {t.currentOrder.orderNumber}
                      </p>
                      <p className="font-bold text-[#800020]">
                        ${t.currentOrder.total?.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Quick Controls */}
                <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                  <select
                    value={t.status}
                    onChange={(e) => handleQuickStatusChange(t._id, e.target.value)}
                    className="w-full py-1 px-2 text-[11px] font-semibold bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#800020]"
                  >
                    <option value="available">Mark Available</option>
                    <option value="occupied">Mark Occupied</option>
                    <option value="reserved">Mark Reserved</option>
                  </select>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      onClick={() => openEdit(t)}
                      className="text-gray-500 hover:text-[#800020] flex items-center gap-1 font-medium"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => setDeleteTableId(t._id)}
                      disabled={isOcc}
                      title={isOcc ? 'Cannot delete occupied table' : 'Delete Table'}
                      className="text-gray-400 hover:text-red-600 flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Table Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Dining Table">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1F2937] mb-1">Table Identifier *</label>
            <input
              type="text"
              required
              value={formData.tableNumber}
              onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
              placeholder="e.g. T-11 or VIP-02"
              className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1">Seating Capacity *</label>
              <input
                type="number"
                min="1"
                required
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1">Initial Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020] bg-white"
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button variant="ghost" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Add Table
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Table Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Table Details">
        <form onSubmit={handleUpdate} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1F2937] mb-1">Table Identifier</label>
            <input
              type="text"
              required
              value={formData.tableNumber}
              onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
              className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1">Seating Capacity</label>
              <input
                type="number"
                min="1"
                required
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020] bg-white"
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button variant="ghost" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Save Table
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Table Dialog */}
      <ConfirmationDialog
        isOpen={!!deleteTableId}
        onClose={() => setDeleteTableId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Dining Table"
        message="Are you sure you want to remove this dining table? This action cannot be reversed."
        confirmText="Delete Table"
        confirmVariant="danger"
        loading={isDeleting}
      />
    </div>
  );
};

export default TableManagement;
