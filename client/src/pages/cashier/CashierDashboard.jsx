import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { orderService, paymentService } from '../../services/api';
import DashboardCard from '../../components/DashboardCard';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import ReceiptModal from '../../components/ReceiptModal';
import {
  ShoppingCart,
  CheckCircle,
  Clock,
  DollarSign,
  Receipt,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

const CashierDashboard = () => {
  const { user, settings } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todaySales: 0,
    completedCount: 0,
    pendingCount: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const currency = settings?.currency || '$';

  const loadCashierStats = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);
      const ordersRes = await orderService.getOrders({
        cashierId: user?._id,
        date: today
      });

      if (ordersRes.success) {
        const orders = ordersRes.orders || [];
        const completed = orders.filter((o) => o.status === 'completed');
        const pending = orders.filter((o) => o.status === 'pending');
        const sales = completed.reduce((sum, o) => sum + o.total, 0);

        setStats({
          todaySales: sales,
          completedCount: completed.length,
          pendingCount: pending.length
        });
        setRecentOrders(orders.slice(0, 6));
      }
    } catch (err) {
      console.error('Error loading cashier dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCashierStats();
  }, [user?._id]);

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

  if (loading) {
    return <Loading text="Loading your cashier workstation..." />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#800020] to-[#5C001A] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-amber-200">
            Active Cashier Shift
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-1">
            Welcome, {user?.fullName || user?.username}!
          </h2>
          <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-xl">
            Ready to serve customers. Use the POS Terminal to quickly create orders, calculate change, and print receipts.
          </p>
        </div>

        <Button
          variant="secondary"
          size="lg"
          icon={ShoppingCart}
          onClick={() => navigate('/cashier/pos')}
          className="bg-white text-[#800020] hover:bg-gray-100 font-bold shrink-0 shadow-md"
        >
          Launch POS Terminal
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <DashboardCard
          title="Today's Sales Collected"
          value={`${currency}${stats.todaySales.toFixed(2)}`}
          subtitle="Total cash collected today"
          icon={DollarSign}
          colorScheme="maroon"
        />
        <DashboardCard
          title="Completed Orders"
          value={stats.completedCount}
          subtitle="Orders paid & processed"
          icon={CheckCircle}
          colorScheme="green"
        />
        <DashboardCard
          title="Active / Pending Orders"
          value={stats.pendingCount}
          subtitle="Awaiting final checkout"
          icon={Clock}
          colorScheme="amber"
          onClick={() => navigate('/cashier/current-orders')}
        />
      </div>

      {/* Quick POS Navigation & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Launch Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#1F2937] flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-[#800020]" />
              <span>Quick POS Actions</span>
            </h3>
            <p className="text-xs text-[#6B7280] mt-1">
              Start new transactions, manage ongoing orders, or lookup previous customer receipts.
            </p>

            <div className="space-y-2.5 mt-5">
              <button
                onClick={() => navigate('/cashier/pos')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-[#800020] hover:bg-[#FDF2F4]/30 text-xs font-semibold text-[#1F2937] transition-all group"
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#800020]" />
                  Create New POS Order
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#800020] transition-colors" />
              </button>

              <button
                onClick={() => navigate('/cashier/current-orders')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-amber-400 hover:bg-amber-50/40 text-xs font-semibold text-[#1F2937] transition-all group"
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  View Pending Orders ({stats.pendingCount})
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-amber-600 transition-colors" />
              </button>

              <button
                onClick={() => navigate('/cashier/previous-orders')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50/40 text-xs font-semibold text-[#1F2937] transition-all group"
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  View Completed Orders
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-[#6B7280]">
            <span>System Status:</span>
            <span className="font-bold text-emerald-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Offline POS Active
            </span>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-[#1F2937]">Your Recent Shift Orders</h3>
            <button
              onClick={() => navigate('/cashier/previous-orders')}
              className="text-xs font-semibold text-[#800020] hover:underline"
            >
              View All Orders →
            </button>
          </div>

          <div className="flex-1 overflow-x-auto mt-4">
            {recentOrders.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-gray-400">
                <Receipt className="w-8 h-8 stroke-[1.5] mb-2" />
                <p className="text-xs">No orders recorded in your shift yet today.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                    <th className="pb-2">Order #</th>
                    <th className="pb-2">Type / Table</th>
                    <th className="pb-2">Items</th>
                    <th className="pb-2">Total</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-gray-50/80">
                      <td className="py-2.5 font-bold text-[#1F2937]">{ord.orderNumber}</td>
                      <td className="py-2.5 capitalize text-gray-600">
                        {ord.orderType === 'dine-in' ? `Dine-in (${ord.tableNumber})` : 'Takeaway'}
                      </td>
                      <td className="py-2.5 text-gray-600">
                        {ord.items?.length || 0} item(s)
                      </td>
                      <td className="py-2.5 font-bold text-[#800020]">
                        {currency}{ord.total?.toFixed(2)}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
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
                      <td className="py-2.5 text-right">
                        {ord.paymentStatus === 'paid' ? (
                          <button
                            onClick={() => handleViewReceipt(ord.orderNumber)}
                            className="text-[#800020] hover:text-[#5C001A] font-semibold text-xs flex items-center gap-1 ml-auto"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Receipt</span>
                          </button>
                        ) : (
                          <span className="text-gray-400 italic">Unpaid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        receiptData={activeReceipt}
      />
    </div>
  );
};

export default CashierDashboard;
