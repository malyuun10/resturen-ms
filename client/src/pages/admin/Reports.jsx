import React, { useState, useEffect } from 'react';
import { reportService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import DashboardCard from '../../components/DashboardCard';
import {
  BarChart3,
  Calendar,
  Printer,
  Download,
  DollarSign,
  ShoppingBag,
  Users,
  Flame,
  Boxes,
  TrendingUp
} from 'lucide-react';

const Reports = () => {
  const { settings } = useAuth();
  const [reportType, setReportType] = useState('daily'); // 'daily', 'weekly', 'monthly', 'cashier', 'products', 'inventory'

  // Date filters
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  const currency = settings?.currency || '$';

  const loadReport = async () => {
    try {
      setLoading(true);
      let res = null;

      if (reportType === 'daily') {
        res = await reportService.getDailyReport({ date: dateFilter });
      } else if (reportType === 'weekly') {
        res = await reportService.getWeeklyReport({ startDate });
      } else if (reportType === 'monthly') {
        res = await reportService.getMonthlyReport({ year: selectedYear, month: selectedMonth });
      } else if (reportType === 'cashier') {
        res = await reportService.getCashierReport({ startDate, endDate });
      } else if (reportType === 'products') {
        res = await reportService.getProductReport({ startDate, endDate });
      } else if (reportType === 'inventory') {
        res = await reportService.getInventoryReport();
      }

      if (res && res.success) {
        setReportData(res);
      }
    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportType, dateFilter, startDate, endDate, selectedMonth, selectedYear]);

  // Export CSV Helper
  const handleExportCSV = () => {
    if (!reportData) return;
    let csvRows = [];

    if (reportType === 'daily') {
      csvRows.push(['Daily Sales Report', dateFilter]);
      csvRows.push(['Total Sales', `${currency}${reportData.summary.totalSales}`]);
      csvRows.push(['Total Orders', reportData.summary.totalOrders]);
      csvRows.push(['Completed Orders', reportData.summary.completedCount]);
      csvRows.push(['Cancelled Orders', reportData.summary.cancelledCount]);
      csvRows.push([]);
      csvRows.push(['Hour', 'Sales', 'Orders Count']);
      reportData.hourly.forEach((h) => {
        csvRows.push([h.hour, h.sales.toFixed(2), h.orders]);
      });
    } else if (reportType === 'weekly') {
      csvRows.push(['Weekly Sales Report', `${reportData.startDate} to ${reportData.endDate}`]);
      csvRows.push(['Total Sales', `${currency}${reportData.summary.totalSales}`]);
      csvRows.push(['Total Orders', reportData.summary.totalOrders]);
      csvRows.push([]);
      csvRows.push(['Date', 'Day', 'Sales', 'Orders']);
      reportData.dailyBreakdown.forEach((d) => {
        csvRows.push([d.date, d.dayName, d.sales.toFixed(2), d.orders]);
      });
    } else if (reportType === 'monthly') {
      csvRows.push(['Monthly Sales Report', `Year: ${reportData.year}, Month: ${reportData.month}`]);
      csvRows.push(['Total Revenue', `${currency}${reportData.summary.revenue}`]);
      csvRows.push(['Completed Orders', reportData.summary.completedCount]);
      csvRows.push([]);
      csvRows.push(['Day Date', 'Sales', 'Orders']);
      reportData.dailyBreakdown.forEach((d) => {
        csvRows.push([d.date, d.sales.toFixed(2), d.orders]);
      });
    } else if (reportType === 'cashier') {
      csvRows.push(['Cashier Performance Report', `${reportData.startDate} to ${reportData.endDate}`]);
      csvRows.push(['Cashier Name', 'Total Orders', 'Completed Orders', 'Cancelled Orders', 'Total Collected']);
      reportData.cashiers.forEach((c) => {
        csvRows.push([c.cashierName, c.totalOrders, c.completedOrders, c.cancelledOrders, c.totalCollected.toFixed(2)]);
      });
    } else if (reportType === 'products') {
      csvRows.push(['Product Popularity Report', `${reportData.startDate} to ${reportData.endDate}`]);
      csvRows.push(['Item Name', 'Unit Price', 'Quantity Sold', 'Total Revenue']);
      reportData.products.forEach((p) => {
        csvRows.push([p.name, p.price.toFixed(2), p.quantitySold, p.totalRevenue.toFixed(2)]);
      });
    } else if (reportType === 'inventory') {
      csvRows.push(['Inventory Valuation Report']);
      csvRows.push(['Item Name', 'Category', 'Price', 'Stock Quantity', 'Stock Status', 'Valuation']);
      reportData.items.forEach((i) => {
        csvRows.push([i.name, i.category, i.price.toFixed(2), i.stockQuantity, i.stockStatus, i.inventoryValue.toFixed(2)]);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportType}_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-[#1F2937] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#800020]" />
            <span>Administrative Sales & Operations Reports</span>
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Filter, print, and export revenue reports, cashier performance, product velocity, and inventory valuation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" icon={Printer} onClick={handlePrint}>
            Print Report
          </Button>
          <Button variant="primary" icon={Download} onClick={handleExportCSV}>
            Export to CSV
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 text-xs font-bold overflow-x-auto no-print">
        {[
          { id: 'daily', label: 'Daily Sales', icon: Calendar },
          { id: 'weekly', label: 'Weekly Sales', icon: TrendingUp },
          { id: 'monthly', label: 'Monthly Sales', icon: BarChart3 },
          { id: 'cashier', label: 'Cashier Activity', icon: Users },
          { id: 'products', label: 'Product Best-Sellers', icon: Flame },
          { id: 'inventory', label: 'Inventory Report', icon: Boxes },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={`pb-2.5 px-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
                reportType === tab.id
                  ? 'border-[#800020] text-[#800020]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
          <span>Date Filter:</span>

          {reportType === 'daily' && (
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="py-1.5 px-3 rounded-lg border border-gray-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#800020]"
            />
          )}

          {(reportType === 'weekly' || reportType === 'cashier' || reportType === 'products') && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="py-1.5 px-3 rounded-lg border border-gray-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#800020]"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="py-1.5 px-3 rounded-lg border border-gray-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#800020]"
              />
            </div>
          )}

          {reportType === 'monthly' && (
            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="py-1.5 px-3 rounded-lg border border-gray-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#800020]"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2026, i, 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="py-1.5 px-3 rounded-lg border border-gray-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#800020]"
              >
                {[2024, 2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <span className="text-xs text-gray-500 font-mono">
          Report Generated: {new Date().toLocaleTimeString()}
        </span>
      </div>

      {/* Printable Report Header for paper output */}
      <div className="hidden print-only mb-6 text-center border-b pb-4">
        <h1 className="text-xl font-bold uppercase">{settings?.restaurantName || 'Royal Burgundy'}</h1>
        <p className="text-xs text-gray-600">{settings?.address}</p>
        <p className="text-xs text-gray-600 font-bold mt-2 uppercase">
          {reportType.toUpperCase()} REPORT - {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Report Content Body */}
      {loading ? (
        <Loading text="Compiling financial report data..." />
      ) : !reportData ? (
        <div className="p-8 text-center text-gray-400">No report data generated.</div>
      ) : (
        <div className="space-y-6">
          {/* DAILY REPORT */}
          {reportType === 'daily' && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <DashboardCard
                  title="Total Daily Sales"
                  value={`${currency}${reportData.summary?.totalSales?.toFixed(2)}`}
                  subtitle="Gross revenue today"
                  icon={DollarSign}
                  colorScheme="maroon"
                />
                <DashboardCard
                  title="Total Orders Placed"
                  value={reportData.summary?.totalOrders}
                  subtitle="Volume of bills"
                  icon={ShoppingBag}
                  colorScheme="blue"
                />
                <DashboardCard
                  title="Completed Orders"
                  value={reportData.summary?.completedCount}
                  subtitle="Paid and closed"
                  icon={ShoppingBag}
                  colorScheme="green"
                />
                <DashboardCard
                  title="Cancelled Orders"
                  value={reportData.summary?.cancelledCount}
                  subtitle="Voided tickets"
                  icon={ShoppingBag}
                  colorScheme="red"
                />
              </div>

              {/* Hourly Breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
                <h3 className="font-bold text-sm text-[#1F2937] mb-3">Hourly Revenue Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase border-b">
                      <tr>
                        <th className="py-2.5 px-3">Hour Window</th>
                        <th className="py-2.5 px-3">Orders Count</th>
                        <th className="py-2.5 px-3 text-right">Hourly Sales</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono">
                      {reportData.hourly?.filter((h) => h.orders > 0 || h.sales > 0).map((h, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="py-2 px-3 font-semibold text-gray-800">{h.hour} - {h.hour.slice(0, 2)}:59</td>
                          <td className="py-2 px-3 text-gray-600">{h.orders} order(s)</td>
                          <td className="py-2 px-3 text-right font-bold text-[#800020]">
                            {currency}{h.sales.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* WEEKLY REPORT */}
          {reportType === 'weekly' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <DashboardCard
                  title="Total 7-Day Revenue"
                  value={`${currency}${reportData.summary?.totalSales?.toFixed(2)}`}
                  subtitle="Gross sales over the week"
                  icon={DollarSign}
                  colorScheme="maroon"
                />
                <DashboardCard
                  title="Total Completed Orders"
                  value={reportData.summary?.totalOrders}
                  subtitle="Orders served"
                  icon={ShoppingBag}
                  colorScheme="blue"
                />
                <DashboardCard
                  title="Average Ticket Size"
                  value={`${currency}${reportData.summary?.averageOrderValue?.toFixed(2)}`}
                  subtitle="Revenue per order"
                  icon={TrendingUp}
                  colorScheme="green"
                />
              </div>

              {/* Day-by-Day Table */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
                <h3 className="font-bold text-sm text-[#1F2937] mb-3">Daily Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase border-b">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Day of Week</th>
                        <th className="py-2.5 px-3">Order Count</th>
                        <th className="py-2.5 px-3 text-right">Daily Sales Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reportData.dailyBreakdown?.map((d, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="py-2 px-3 text-gray-800">{d.date}</td>
                          <td className="py-2 px-3 font-semibold text-gray-700">{d.dayName}</td>
                          <td className="py-2 px-3 text-gray-600">{d.orders}</td>
                          <td className="py-2 px-3 text-right font-bold text-[#800020]">
                            {currency}{d.sales.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* MONTHLY REPORT */}
          {reportType === 'monthly' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <DashboardCard
                  title="Total Monthly Revenue"
                  value={`${currency}${reportData.summary?.revenue?.toFixed(2)}`}
                  subtitle={`Month: ${reportData.month}/${reportData.year}`}
                  icon={DollarSign}
                  colorScheme="maroon"
                />
                <DashboardCard
                  title="Completed Orders"
                  value={reportData.summary?.completedCount}
                  subtitle="Fulfilled transactions"
                  icon={ShoppingBag}
                  colorScheme="green"
                />
                <DashboardCard
                  title="Cancelled Orders"
                  value={reportData.summary?.cancelledCount}
                  subtitle="Voided tickets"
                  icon={ShoppingBag}
                  colorScheme="red"
                />
              </div>

              {/* Monthly Table */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
                <h3 className="font-bold text-sm text-[#1F2937] mb-3">Daily Calendar Performance</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase border-b">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Orders</th>
                        <th className="py-2 px-3 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reportData.dailyBreakdown?.filter((d) => d.orders > 0 || d.sales > 0).map((d, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="py-2 px-3 font-semibold text-gray-800">{d.date}</td>
                          <td className="py-2 px-3 text-gray-600">{d.orders}</td>
                          <td className="py-2 px-3 text-right font-bold text-[#800020]">
                            {currency}{d.sales.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* CASHIER REPORT */}
          {reportType === 'cashier' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-sm text-[#1F2937]">Cashier Performance & Collections</h3>
                <p className="text-xs text-gray-500">Audit of transactions and cash collections per staff cashier</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 font-bold uppercase border-b">
                    <tr>
                      <th className="py-3 px-4">Cashier Name</th>
                      <th className="py-3 px-4">Total Orders Processed</th>
                      <th className="py-3 px-4">Completed Orders</th>
                      <th className="py-3 px-4">Cancelled Orders</th>
                      <th className="py-3 px-4 text-right">Total Cash Collected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reportData.cashiers?.map((c, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-bold text-[#1F2937] capitalize text-sm">
                          {c.cashierName}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-gray-700">
                          {c.totalOrders}
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-700 font-bold">
                          {c.completedOrders}
                        </td>
                        <td className="py-3 px-4 font-mono text-red-600 font-semibold">
                          {c.cancelledOrders}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-sm text-[#800020]">
                          {currency}{c.totalCollected.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PRODUCT PERFORMANCE REPORT */}
          {reportType === 'products' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-sm text-[#1F2937]">Menu Item Popularity & Velocity</h3>
                <p className="text-xs text-gray-500">Ranked by total quantity sold</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 font-bold uppercase border-b">
                    <tr>
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Item Name</th>
                      <th className="py-3 px-4">Unit Price</th>
                      <th className="py-3 px-4">Total Units Sold</th>
                      <th className="py-3 px-4 text-right">Total Gross Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reportData.products?.map((p, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-bold text-[#800020]">
                          #{i + 1}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#1F2937]">
                          {p.name}
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-600">
                          {currency}{p.price?.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-sm text-gray-900">
                          {p.quantitySold} units
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-sm text-[#800020]">
                          {currency}{p.totalRevenue?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* INVENTORY REPORT */}
          {reportType === 'inventory' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <DashboardCard
                  title="Total Inventory Valuation"
                  value={`${currency}${reportData.summary?.totalValuation?.toFixed(2)}`}
                  subtitle="Retail value of current stock"
                  icon={DollarSign}
                  colorScheme="maroon"
                />
                <DashboardCard
                  title="Low Stock Items"
                  value={reportData.summary?.lowStockCount}
                  subtitle="Needs restocking"
                  icon={Boxes}
                  colorScheme="amber"
                />
                <DashboardCard
                  title="Out of Stock Items"
                  value={reportData.summary?.outOfStockCount}
                  subtitle="Zero stock items"
                  icon={Boxes}
                  colorScheme="red"
                />
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-bold text-sm text-[#1F2937]">Full Inventory Stock Sheet</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600 font-bold uppercase border-b">
                      <tr>
                        <th className="py-3 px-4">Menu Item</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Unit Price</th>
                        <th className="py-3 px-4">Current Stock</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Inventory Valuation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reportData.items?.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-bold text-[#1F2937]">{item.name}</td>
                          <td className="py-3 px-4 text-gray-600">{item.category}</td>
                          <td className="py-3 px-4 font-mono text-gray-600">{currency}{item.price?.toFixed(2)}</td>
                          <td className="py-3 px-4 font-mono font-bold text-gray-800">{item.stockQuantity}</td>
                          <td className="py-3 px-4 font-bold text-[10px] uppercase">
                            <span
                              className={`px-2 py-0.5 rounded-full ${
                                item.stockStatus === 'In Stock'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.stockStatus === 'Low Stock'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {item.stockStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[#800020]">
                            {currency}{item.inventoryValue?.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
