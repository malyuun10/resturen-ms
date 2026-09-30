import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Lock, User, Eye, EyeOff, Utensils, AlertCircle } from 'lucide-react';
import Button from '../components/Button';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, settings } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isExpired = new URLSearchParams(location.search).get('expired') === 'true';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please provide both username and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const loggedUser = await login(username.trim(), password);
      // Role-based redirection
      if (loggedUser.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/cashier/pos', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (userType) => {
    if (userType === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else {
      setUsername('cashier1');
      setPassword('cashier123');
    }
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Card Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#800020] text-white shadow-lg shadow-[#800020]/25 mb-4">
            <Utensils className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-[#1F2937] tracking-tight">
            {settings?.restaurantName || 'Royal Burgundy'}
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Offline Restaurant POS & Management System
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="border-b border-gray-100 pb-4 mb-6">
            <h2 className="text-lg font-bold text-[#1F2937]">Sign In to Terminal</h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Enter your assigned staff credentials to proceed.
            </p>
          </div>

          {isExpired && (
            <div className="mb-5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Your session expired. Please log in again.</span>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  autoComplete="username"
                  required
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-[#1F2937] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#800020] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F2937] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                  className="w-full pl-9 pr-10 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-[#1F2937] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#800020] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-8 pt-5 border-t border-gray-100">
            <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider text-center mb-2.5">
              Quick Demo Fill
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className="py-1.5 px-2 bg-gray-50 hover:bg-[#FDF2F4] text-xs font-medium text-gray-700 hover:text-[#800020] rounded-lg border border-gray-200 hover:border-[#800020]/30 transition-all text-center"
              >
                <span className="font-bold">Admin</span>
                <span className="block text-[10px] text-gray-400">admin / admin123</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('cashier')}
                className="py-1.5 px-2 bg-gray-50 hover:bg-blue-50 text-xs font-medium text-gray-700 hover:text-blue-700 rounded-lg border border-gray-200 hover:border-blue-200 transition-all text-center"
              >
                <span className="font-bold">Cashier</span>
                <span className="block text-[10px] text-gray-400">cashier1 / cashier123</span>
              </button>
            </div>
          </div>
        </div>

        {/* Offline Badge Footer */}
        <p className="text-center text-xs text-[#6B7280] mt-6">
          Local Offline Server • Safe & Independent
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
