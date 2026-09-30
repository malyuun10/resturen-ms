import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogOut, User as UserIcon, Shield, Laptop, Clock, Menu } from 'lucide-react';

const Navbar = ({ onToggleSidebar, title }) => {
  const { user, logout, settings, isAdmin } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const restaurantTitle = settings?.restaurantName || 'Royal Burgundy';

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs no-print">
      {/* Left side: Mobile menu toggle + Page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-[#1F2937] flex items-center gap-2">
            <span>{title || restaurantTitle}</span>
          </h1>
        </div>
      </div>

      {/* Right side: Offline badge, Clock, User Profile, Logout */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Offline Status Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Laptop className="w-3.5 h-3.5" />
          <span>Offline Ready (Local DB)</span>
        </div>

        {/* Live Clock */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#6B7280] font-mono bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
          <Clock className="w-3.5 h-3.5 text-[#800020]" />
          <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>

        {/* User Role & Name */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-[#800020] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
            {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-[#1F2937] leading-none capitalize">
              {user?.fullName || user?.username}
            </p>
            <span
              className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 uppercase tracking-wide ${
                isAdmin
                  ? 'bg-[#FDF2F4] text-[#800020]'
                  : 'bg-blue-50 text-blue-700'
              }`}
            >
              {user?.role}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
