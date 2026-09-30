import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  Tags,
  Grid,
  ShoppingBag,
  Boxes,
  BarChart3,
  Settings,
  DatabaseBackup,
  ShoppingCart,
  Clock,
  History,
  Receipt,
  LogOut,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin, logout, settings } = useAuth();

  const adminNavItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/pos', label: 'POS Terminal', icon: ShoppingCart },
    { to: '/admin/orders', label: 'All Orders', icon: ShoppingBag },
    { to: '/admin/menu', label: 'Menu Management', icon: UtensilsCrossed },
    { to: '/admin/categories', label: 'Categories', icon: Tags },
    { to: '/admin/tables', label: 'Tables', icon: Grid },
    { to: '/admin/inventory', label: 'Inventory & Stock', icon: Boxes },
    { to: '/admin/reports', label: 'Sales Reports', icon: BarChart3 },
    { to: '/admin/users', label: 'User Management', icon: Users },
    { to: '/admin/settings', label: 'System Settings', icon: Settings },
    { to: '/admin/backup', label: 'Backup & Restore', icon: DatabaseBackup },
  ];

  const cashierNavItems = [
    { to: '/cashier/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/cashier/pos', label: 'POS / New Order', icon: ShoppingCart },
    { to: '/cashier/current-orders', label: 'Current Orders', icon: Clock },
    { to: '/cashier/previous-orders', label: 'Previous Orders', icon: History },
    { to: '/cashier/receipts', label: 'Receipt Lookup', icon: Receipt },
  ];

  const navItems = isAdmin ? adminNavItems : cashierNavItems;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#5C001A] text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } no-print`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-white/10 bg-[#4A0015]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#800020] border border-white/20 flex items-center justify-center text-white font-black text-lg shadow-inner">
              R
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white leading-tight">
                {settings?.restaurantName ? settings.restaurantName.slice(0, 16) : 'Royal Burgundy'}
              </h2>
              <span className="text-[10px] text-amber-200 uppercase font-semibold tracking-wider">
                {isAdmin ? 'Admin Console' : 'Cashier Terminal'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden text-white/70 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-white/50">
            Navigation Menu
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#800020] text-white font-semibold shadow-sm border-l-4 border-amber-400 pl-2.5'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Footer: User summary & Sign out */}
        <div className="p-3 border-t border-white/10 bg-[#4A0015]/60">
          <div className="flex items-center justify-between px-2 py-1">
            <div className="text-xs">
              <p className="font-semibold text-white truncate max-w-[140px]">
                {user?.fullName || user?.username}
              </p>
              <p className="text-[10px] text-white/60 capitalize">
                Role: {user?.role}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-md hover:bg-red-900/50 text-red-200 hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
