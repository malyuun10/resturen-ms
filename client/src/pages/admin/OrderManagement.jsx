import React, { useState, useEffect } from 'react';
import { orderService, userService, paymentService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';
import Button from '../../components/Button';
import ReceiptModal from '../../components/ReceiptModal';
import Loading from '../../components/Loading';
import {
  ShoppingBag,
  Receipt,
  Calendar,
  Filter,
  Users,
  Eye,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

const OrderManagement = () => {
  const { settings } = useAuth();
  const [orders, setOrders] = useState([]);
  const [cashiers, setCashiers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cashierFilter, setCashierFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const currency = settings?.currency || '$';

  const fetchFiltersAndOrders = async () => {
    try {
      setLoading(true);
      const [ordRes, usersRes] = await Promise.all([
        orderService.getOrders({
          page,
          limit: 15,
          search,
          status: statusFilter,
          cashierId: cashierFilter,
          date: dateFilter,
          orderType: orderTypeFilter
        }),
        userService.getUsers({ role: 'cashier' })
      ]);

      if (ordRes.success) {
        setOrders(ordRes.orders || []);
        setTotalPages(ordRes.totalPages || 1);
        setTotalCount(ordRes.totalCount || 0);
      }
      if (usersRes.success) {
        setCashiers(usersRes.users || []);
      }
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiltersAndOrders();
  }, [page, statusFilter, cashierFilter, dateFilter, orderTypeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchFiltersAndOrders();
  };

  const handleViewReceipt = async (orderNumber) => {
    try {
      const res = await paymentService.getReceipt(orderNumber);
      if (res.success) {
        setActiveReceipt(res.receipt);
        setShowReceiptModal(true);
      }
    } catch (err) {
      alert('Could not load receipt: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1F2937] flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#800020]" />
            <span>All Restaurant Orders</span>
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Comprehensive audit of dine-in and takeaway orders across all cashier shifts.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="w-full md:w-80">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search order #, table, cashier..."
              onClear={() => {
                setSearch('');
                fetchFiltersAndOrders();
              }}
            />
          </form>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="py-1.5 px-3 rounded-lg border border-gray-200 text-xs text-gray-700 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-[#800020]"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Cashier Filter */}
            <select
              value={cashierFilter}
              onChange={(e) => {
                setCashierFilter(e.target.value);
                setPage(1);
              }}
              className="py-1.5 px-3 rounded-lg border border-gray-200 text-xs text-gray-700 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-[#800020]"
            >
              <option value="">All Cashiers</option>
              {cashiers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.fullName || c.username}
                </option>
              ))}
            </select>

            {/* Order Type */}
            <select
              value={orderTypeFilter}
              onChange={(e) => {
                setOrderTypeFilter(e.target.value);
                setPage(1);
              }}
              className="py-1.5 px-3 rounded-lg border border-gray-200 text-xs text-gray-700 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-[#800020]"
            >
              <option value="all">All Types</option>
              <option value="dine-in">Dine-In</option>
              <option value="takeaway">Takeaway</option>
            </select>

            {/* Date */}
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="py-1.5 px-2.5 rounded-lg border border-gray-200 text-xs text-gray-700 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-[#800020]"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => {
                  setDateFilter('');
                  setPage(1);
                }}
                className="text-gray-400 hover:text-gray-600 text-xs underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8">
            <Loading text="Loading order records..." />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No orders found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FDF2F4]/40 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4">Cashier</th>
                  <th className="py-3 px-4">Type / Seating</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Grand Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((ord) => (
                  <tr key={ord._id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#1F2937]">
                      {ord.orderNumber}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <div>{new Date(ord.createdAt).toLocaleDateString()}</div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-800 capitalize">
                      {ord.cashierName || 'Staff'}
                    </td>
                    <td className="py-3 px-4 capitalize text-gray-700">
                      {ord.orderType === 'dine-in' ? `Dine-In (${ord.tableNumber})` : 'Takeaway'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <span className="font-semibold text-[#1F2937]">{ord.items?.length}</span> items
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-500">
                      {ord.discount > 0 ? `-${currency}${ord.discount.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#800020]">
                      {currency}{ord.total?.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          ord.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {ord.paymentStatus === 'paid' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Receipt}
                          onClick={() => handleViewReceipt(ord.orderNumber)}
                        >
                          Receipt
                        </Button>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Unpaid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-gray-100">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalCount}
            itemsPerPage={15}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </div>
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        receiptData={activeReceipt}
      />
    </div>
  );
};

export default OrderManagement;
