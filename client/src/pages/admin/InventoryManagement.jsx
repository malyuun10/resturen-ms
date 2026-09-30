import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import SearchBar from '../../components/SearchBar';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Loading from '../../components/Loading';
import DashboardCard from '../../components/DashboardCard';
import Pagination from '../../components/Pagination';
import {
  Boxes,
  PlusCircle,
  MinusCircle,
  AlertTriangle,
  History,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const InventoryManagement = () => {
  const { settings } = useAuth();
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'history'

  // Stock State
  const [inventory, setInventory] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // History State
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotalCount, setHistoryTotalCount] = useState(0);

  // Stock Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustAction, setAdjustAction] = useState('restock'); // 'restock' | 'reduce'
  const [selectedItemId, setSelectedItemId] = useState('');
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustError, setAdjustError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currency = settings?.currency || '$';
  const threshold = settings?.lowStockThreshold || 10;

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getInventory({
        search,
        status: statusFilter === 'all' ? undefined : statusFilter
      });
      if (res.success) {
        setInventory(res.items || []);
        setSummary(res.summary || {});
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await inventoryService.getHistory({
        page: historyPage,
        limit: 20
      });
      if (res.success) {
        setHistory(res.history || []);
        setHistoryTotalPages(res.totalPages || 1);
        setHistoryTotalCount(res.totalCount || 0);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'stock') {
      fetchInventory();
    } else {
      fetchHistory();
    }
  }, [activeTab, statusFilter, historyPage]);

  const openAdjustModal = (action, item = null) => {
    setAdjustAction(action);
    setSelectedItemId(item ? item._id : inventory[0]?._id || '');
    setAdjustQuantity('');
    setAdjustReason(action === 'restock' ? 'Supplier restocking delivery' : 'Damaged / expired item disposal');
    setAdjustError('');
    setIsAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItemId || !adjustQuantity) {
      setAdjustError('Please specify item and quantity.');
      return;
    }

    const qty = Number(adjustQuantity);
    if (qty <= 0) {
      setAdjustError('Quantity must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    setAdjustError('');

    try {
      const res = await inventoryService.adjustStock({
        menuItemId: selectedItemId,
        action: adjustAction,
        quantity: qty,
        reason: adjustReason
      });

      if (res.success) {
        setIsAdjustModalOpen(false);
        await fetchInventory();
      }
    } catch (err) {
      setAdjustError(err.message || 'Stock adjustment failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1F2937] flex items-center gap-2">
            <Boxes className="w-5 h-5 text-[#800020]" />
            <span>Inventory & Stock Management</span>
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Monitor real-time stock deductions on customer sales, low-stock alerts, and manual restocks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            icon={PlusCircle}
            onClick={() => openAdjustModal('restock')}
          >
            Add Stock / Restock
          </Button>
          <Button
            variant="outline"
            icon={MinusCircle}
            onClick={() => openAdjustModal('reduce')}
          >
            Reduce Stock
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Tracked Items"
          value={summary.totalItems || 0}
          subtitle="Catalogue offerings"
          icon={Boxes}
          colorScheme="maroon"
        />
        <DashboardCard
          title="Low-Stock Alerts"
          value={summary.lowStockCount || 0}
          subtitle={`Quantity ≤ ${threshold}`}
          icon={AlertTriangle}
          colorScheme={summary.lowStockCount > 0 ? 'amber' : 'green'}
          badgeText={summary.lowStockCount > 0 ? 'Replenish' : 'Healthy'}
        />
        <DashboardCard
          title="Out of Stock"
          value={summary.outOfStockCount || 0}
          subtitle="Zero available stock"
          icon={MinusCircle}
          colorScheme="red"
        />
        <DashboardCard
          title="In Good Stock"
          value={summary.inStockCount || 0}
          subtitle="Above alert threshold"
          icon={CheckCircle2}
          colorScheme="green"
        />
      </div>

      {/* Navigation Tabs: Current Stock vs Stock Movement History */}
      <div className="flex items-center gap-2 border-b border-gray-200 text-xs font-bold">
        <button
          onClick={() => setActiveTab('stock')}
          className={`pb-2.5 px-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'stock'
              ? 'border-[#800020] text-[#800020]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Current Stock Levels ({inventory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2.5 px-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'history'
              ? 'border-[#800020] text-[#800020]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Stock Movement Audit Logs</span>
        </button>
      </div>

      {/* TAB 1: Current Stock */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          {/* Search & Stock Filter */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="w-full md:w-80">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search stock by name..."
                onClear={() => {
                  setSearch('');
                  fetchInventory();
                }}
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1.5 px-3 rounded-lg border border-gray-200 text-xs text-gray-700 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-[#800020]"
              >
                <option value="all">All Stock Statuses</option>
                <option value="low">Low Stock (≤ {threshold})</option>
                <option value="out">Out of Stock (0)</option>
                <option value="in">In Stock (&gt; {threshold})</option>
              </select>
            </div>
          </div>

          {/* Stock Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-8">
                <Loading text="Loading stock counts..." />
              </div>
            ) : inventory.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Boxes className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No inventory records found.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FDF2F4]/40 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Menu Item</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Current Stock</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Quick Stock Adjustment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inventory.map((item) => {
                    const isOut = item.stockQuantity <= 0;
                    const isLow = !isOut && item.stockQuantity <= threshold;

                    return (
                      <tr key={item._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-[#1F2937] text-sm">
                          {item.name}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {item.category}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-gray-700">
                          {currency}{item.price?.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-sm text-[#1F2937]">
                          {item.stockQuantity}
                        </td>
                        <td className="py-3 px-4">
                          {isOut ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-800">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 flex items-center gap-1 w-max">
                              <AlertTriangle className="w-3 h-3" /> Low Stock ({item.stockQuantity})
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openAdjustModal('restock', item)}
                              className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-[11px] transition-colors"
                            >
                              + Restock
                            </button>
                            <button
                              onClick={() => openAdjustModal('reduce', item)}
                              className="px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 font-semibold text-[11px] transition-colors"
                            >
                              - Reduce
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Stock Movement History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          {historyLoading ? (
            <div className="p-8">
              <Loading text="Loading movement audit logs..." />
            </div>
          ) : history.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No stock movement logs recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FDF2F4]/40 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Menu Item</th>
                    <th className="py-3 px-4">Movement Type</th>
                    <th className="py-3 px-4">Qty Change</th>
                    <th className="py-3 px-4">Previous → New Stock</th>
                    <th className="py-3 px-4">Reason / Reference</th>
                    <th className="py-3 px-4 text-right">Logged By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.map((log) => {
                    const isPositive = log.quantityChange > 0;
                    return (
                      <tr key={log._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 text-gray-500 font-mono">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#1F2937]">
                          {log.itemName}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              log.type === 'sale'
                                ? 'bg-blue-100 text-blue-800'
                                : log.type === 'restock'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {log.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          <span
                            className={
                              isPositive ? 'text-emerald-700' : 'text-red-700'
                            }
                          >
                            {isPositive ? `+${log.quantityChange}` : log.quantityChange}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-600">
                          {log.previousStock} → <span className="font-bold text-[#1F2937]">{log.newStock}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-700 max-w-xs truncate">
                          {log.reason || '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-gray-800 capitalize">
                          {log.userName || 'System'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="p-4 border-t border-gray-100">
                <Pagination
                  currentPage={historyPage}
                  totalPages={historyTotalPages}
                  totalItems={historyTotalCount}
                  itemsPerPage={20}
                  onPageChange={(p) => setHistoryPage(p)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={adjustAction === 'restock' ? 'Add Stock (Restock)' : 'Reduce Stock (Adjustment / Spoilage)'}
        subtitle="Record quantity change into inventory audit trail"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          {adjustError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {adjustError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1F2937] mb-1">Select Menu Item *</label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              required
              className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020] bg-white"
            >
              {inventory.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name} (Current Stock: {item.stockQuantity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1F2937] mb-1">
              Quantity to {adjustAction === 'restock' ? 'Add' : 'Deduct'} *
            </label>
            <input
              type="number"
              min="1"
              required
              value={adjustQuantity}
              onChange={(e) => setAdjustQuantity(e.target.value)}
              placeholder="e.g. 15"
              className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1F2937] mb-1">Audit Reason</label>
            <input
              type="text"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="e.g. Fresh vegetable shipment delivery"
              className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button variant="ghost" onClick={() => setIsAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={adjustAction === 'restock' ? 'success' : 'danger'}
              loading={isSubmitting}
            >
              {adjustAction === 'restock' ? 'Confirm Restock' : 'Confirm Reduction'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InventoryManagement;
