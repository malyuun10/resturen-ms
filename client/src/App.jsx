import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import CashierLayout from './layouts/CashierLayout';

// Auth Page
import LoginPage from './pages/LoginPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import MenuManagement from './pages/admin/MenuManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import TableManagement from './pages/admin/TableManagement';
import OrderManagement from './pages/admin/OrderManagement';
import InventoryManagement from './pages/admin/InventoryManagement';
import Reports from './pages/admin/Reports';
import SystemSettings from './pages/admin/SystemSettings';
import BackupRestore from './pages/admin/BackupRestore';

// Cashier Pages
import CashierDashboard from './pages/cashier/CashierDashboard';
import CashierPOS from './pages/cashier/CashierPOS';
import CurrentOrders from './pages/cashier/CurrentOrders';
import PreviousOrders from './pages/cashier/PreviousOrders';
import ReceiptLookup from './pages/cashier/ReceiptLookup';

// Smart Index Router based on Role
const RootRedirect = () => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return null;

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/cashier/pos" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Root redirector */}
          <Route path="/" element={<RootRedirect />} />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="pos" element={<CashierPOS />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="menu" element={<MenuManagement />} />
            <Route path="categories" element={<CategoryManagement />} />
            <Route path="tables" element={<TableManagement />} />
            <Route path="orders" element={<OrderManagement />} />
            <Route path="inventory" element={<InventoryManagement />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<SystemSettings />} />
            <Route path="backup" element={<BackupRestore />} />
          </Route>

          {/* Cashier Protected Routes */}
          <Route path="/cashier" element={<CashierLayout />}>
            <Route index element={<Navigate to="/cashier/pos" replace />} />
            <Route path="dashboard" element={<CashierDashboard />} />
            <Route path="pos" element={<CashierPOS />} />
            <Route path="current-orders" element={<CurrentOrders />} />
            <Route path="previous-orders" element={<PreviousOrders />} />
            <Route path="receipts" element={<ReceiptLookup />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
