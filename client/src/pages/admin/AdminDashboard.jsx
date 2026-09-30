import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import DashboardCard from '../../components/DashboardCard';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import {
  DollarSign,
  ShoppingBag,
  UtensilsCrossed,
  Grid,
  AlertTriangle,
  TrendingUp,
  Users,
  Boxes,
  BarChart3,
  Settings,
  ArrowRight,
  Flame,
  UserCheck
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, settings } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  const currency = settings?.currency || '$';

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await reportService.getDashboardSummary();
      if (res.success) {
        setSummary(res.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <Loading text="Loading administrative insights..." />;
  }

  const {
    todaySales = 0,
    todayOrdersCount = 0,
    totalMenuItems = 0,
    availableTables = 0,
    occupiedTables = 0,
    lowStockItemsCount = 0,
    totalRevenue = 0,
    popularItems = [],
    cashierActivityToday = [],
    recentOrders = [],
    weeklyTrend = []
  } = summary || {};

  return (
    <div className="space-y-6">
      {/* Admin Welcome & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1F2937] tracking-tight">
            Executive Operations Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
            Real-time performance, inventory alerts, and restaurant revenue overview.
          </p>
        </div>

        {/* Quick Module Navigation Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Boxes}
            onClick={() => navigate('/admin/inventory')}
          >
            Inventory ({lowStockItemsCount} Low)
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={BarChart3}
            onClick={() => navigate('/admin/reports')}
          >
            Full Reports
          </Button>
        </div>
      </div>

      {/* 7 Required Metrics Cards (Section 6) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <DashboardCard
          title="Today's Sales"
          value={`${currency}${todaySales.toFixed(2)}`}
          subtitle="Completed revenue today"
          icon={DollarSign}
          colorScheme="maroon"
        />

        {/* Today's Orders */}
        <DashboardCard
          title="Today's Orders"
          value={todayOrdersCount}
          subtitle="Orders placed today"
          icon={ShoppingBag}
          colorScheme="blue"
          onClick={() => navigate('/admin/orders')}
        />

        {/* Total Revenue */}
        <DashboardCard
          title="Total Revenue"
          value={`${currency}${totalRevenue.toFixed(2)}`}
          subtitle="Cumulative gross sales"
          icon={TrendingUp}
          colorScheme="green"
        />

        {/* Low Stock Items */}
        <DashboardCard
          title="Low Stock Items"
          value={lowStockItemsCount}
          subtitle="Items needing replenishment"
          icon={AlertTriangle}
          colorScheme={lowStockItemsCount > 0 ? 'amber' : 'green'}
          badgeText={lowStockItemsCount > 0 ? 'Action Needed' : 'Good'}
          onClick={() => navigate('/admin/inventory')}
        />

        {/* Total Menu Items */}
        <DashboardCard
          title="Total Menu Items"
          value={totalMenuItems}
          subtitle="Active catalog dishes"
          icon={UtensilsCrossed}
          colorScheme="maroon"
          onClick={() => navigate('/admin/menu')}
        />

        {/* Available Tables */}
        <DashboardCard
          title="Available Tables"
          value={availableTables}
          subtitle="Ready for dine-in guests"
          icon={Grid}
          colorScheme="green"
          onClick={() => navigate('/admin/tables')}
        />

        {/* Occupied Tables */}
        <DashboardCard
          title="Occupied Tables"
          value={occupiedTables}
          subtitle="Guests currently dining"
          icon={Grid}
          colorScheme="amber"
          onClick={() => navigate('/admin/tables')}
        />
      </div>

      {/* Visual Analytics Grid: Weekly Sales Bars & Popular Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Revenue Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-[#1F2937]">Past 7 Days Sales Trend</h3>
              <p className="text-xs text-[#6B7280]">Daily revenue comparison</p>
            </div>
            <span className="text-xs font-bold text-[#800020] bg-[#FDF2F4] px-2.5 py-1 rounded-md">
              Offline Analytics
            </span>
          </div>

          <div className="mt-6 h-56 flex items-end justify-between gap-2 px-2">
            {weeklyTrend.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                No completed orders in the last 7 days yet.
              </div>
            ) : (
              weeklyTrend.map((day) => {
                const maxVal = Math.max(...weeklyTrend.map((d) => d.totalSales), 100);
                const heightPercent = Math.max(10, Math.round((day.totalSales / maxVal) * 100));

                return (
                  <div key={day._id} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="text-[10px] font-mono text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      {currency}{day.totalSales.toFixed(0)}
                    </div>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[40px] bg-gradient-to-t from-[#5C001A] to-[#800020] rounded-t-lg transition-all duration-300 group-hover:brightness-110 shadow-xs"
                    />
                    <span className="text-[10px] font-medium text-gray-600 truncate max-w-[48px]">
                      {day._id.slice(5)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Popular Menu Items (Top 5) */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-base font-bold text-[#1F2937] flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Top Best Sellers</span>
            </h3>
            <span className="text-xs text-gray-400">By Qty Sold</span>
          </div>

          <div className="flex-1 divide-y divide-gray-100 mt-3">
            {popularItems.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-gray-400 text-xs">
                Complete orders to rank popular items.
              </div>
            ) : (
              popularItems.map((prod, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <span className="w-5 h-5 rounded-full bg-[#FDF2F4] text-[#800020] font-bold text-[10px] flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="truncate">
                      <p className="font-bold text-[#1F2937] truncate">{prod.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">
                        Revenue: {currency}{prod.totalRevenue?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <span className="font-extrabold text-[#800020] bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                    {prod.totalQuantity} sold
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Cashier Activity Today & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cashier Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-base font-bold text-[#1F2937] flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>Cashier Shift Performance Today</span>
            </h3>
            <button
              onClick={() => navigate('/admin/reports')}
              className="text-xs text-[#800020] font-semibold hover:underline"
            >
              Cashier Report →
            </button>
          </div>

          <div className="mt-3 divide-y divide-gray-100">
            {cashierActivityToday.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-gray-400 text-xs">
                No cashier transactions completed yet today.
              </div>
            ) : (
              cashierActivityToday.map((cashier, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center uppercase">
                      {cashier.cashierName?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <p className="font-bold text-[#1F2937]">{cashier.cashierName}</p>
                      <p className="text-[10px] text-gray-500">
                        {cashier.orderCount} transaction(s) processed
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-mono font-bold text-sm text-emerald-700">
                      {currency}{cashier.totalSales?.toFixed(2)}
                    </p>
                    <span className="text-[10px] text-gray-400">Total Collected</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Admin Quick Action Hub */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#1F2937] mb-1">
              Admin Quick Access
            </h3>
            <p className="text-xs text-[#6B7280]">
              Direct shortcuts to manage restaurant resources and database backups.
            </p>

            <div className="grid grid-cols-2 gap-2.5 mt-4">
              <button
                onClick={() => navigate('/admin/users')}
                className="p-3 rounded-lg border border-gray-200 hover:border-[#800020] hover:bg-[#FDF2F4]/30 text-left transition-all"
              >
                <Users className="w-4 h-4 text-[#800020] mb-1" />
                <span className="text-xs font-bold text-[#1F2937] block">Staff & Users</span>
                <span className="text-[10px] text-gray-400">Manage cashier logins</span>
              </button>

              <button
                onClick={() => navigate('/admin/menu')}
                className="p-3 rounded-lg border border-gray-200 hover:border-[#800020] hover:bg-[#FDF2F4]/30 text-left transition-all"
              >
                <UtensilsCrossed className="w-4 h-4 text-[#800020] mb-1" />
                <span className="text-xs font-bold text-[#1F2937] block">Menu Catalog</span>
                <span className="text-[10px] text-gray-400">Prices & item options</span>
              </button>

              <button
                onClick={() => navigate('/admin/inventory')}
                className="p-3 rounded-lg border border-gray-200 hover:border-amber-400 hover:bg-amber-50/30 text-left transition-all"
              >
                <Boxes className="w-4 h-4 text-amber-600 mb-1" />
                <span className="text-xs font-bold text-[#1F2937] block">Inventory</span>
                <span className="text-[10px] text-gray-400">Restock & adjustments</span>
              </button>

              <button
                onClick={() => navigate('/admin/backup')}
                className="p-3 rounded-lg border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/30 text-left transition-all"
              >
                <Settings className="w-4 h-4 text-emerald-600 mb-1" />
                <span className="text-xs font-bold text-[#1F2937] block">Backup & Restore</span>
                <span className="text-[10px] text-gray-400">Local database snapshot</span>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-[#6B7280]">
            <span>Database: MongoDB Local</span>
            <span className="text-emerald-700 font-bold">● Active & Synced</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
