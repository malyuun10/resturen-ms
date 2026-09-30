import React, { useState, useEffect } from 'react';
import { settingsService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import {
  Settings,
  Store,
  DollarSign,
  AlertTriangle,
  Receipt,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const SystemSettings = () => {
  const { refreshSettings } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    restaurantName: '',
    address: '',
    phone: '',
    email: '',
    currency: '$',
    taxRate: 5,
    receiptHeader: '',
    receiptFooter: '',
    lowStockThreshold: 10
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await settingsService.getSettings();
      if (res.success && res.settings) {
        setFormData({
          restaurantName: res.settings.restaurantName || '',
          address: res.settings.address || '',
          phone: res.settings.phone || '',
          email: res.settings.email || '',
          currency: res.settings.currency || '$',
          taxRate: res.settings.taxRate !== undefined ? res.settings.taxRate : 5,
          receiptHeader: res.settings.receiptHeader || '',
          receiptFooter: res.settings.receiptFooter || '',
          lowStockThreshold: res.settings.lowStockThreshold || 10
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await settingsService.updateSettings(formData);
      if (res.success) {
        setSuccessMsg('System settings successfully saved and applied.');
        await refreshSettings();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading text="Loading configuration settings..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#1F2937] flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#800020]" />
          <span>System & Restaurant Configuration</span>
        </h2>
        <p className="text-xs text-[#6B7280] mt-0.5">
          Configure restaurant branding, billing currency, taxation rates, inventory thresholds, and receipts.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns: Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Restaurant Identity Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-2 pb-2 border-b border-gray-100">
              <Store className="w-4 h-4 text-[#800020]" />
              <span>Restaurant Identity & Contact</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                Restaurant Trade Name *
              </label>
              <input
                type="text"
                required
                value={formData.restaurantName}
                onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                Street Address / Location
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Telephone Number
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
                />
              </div>
            </div>
          </div>

          {/* Currency & Financials */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-2 pb-2 border-b border-gray-100">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Billing, Currency & Inventory Thresholds</span>
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  required
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020] text-center font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Sales Tax / VAT (%)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                  className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Low-Stock Threshold
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                  className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
                />
              </div>
            </div>
          </div>

          {/* Receipt Customization */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-2 pb-2 border-b border-gray-100">
              <Receipt className="w-4 h-4 text-[#800020]" />
              <span>Receipt Header & Footer Messages</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                Receipt Header Message
              </label>
              <textarea
                rows={2}
                value={formData.receiptHeader}
                onChange={(e) => setFormData({ ...formData, receiptHeader: e.target.value })}
                placeholder="Welcome to our restaurant!"
                className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                Receipt Footer Closing Note
              </label>
              <textarea
                rows={2}
                value={formData.receiptFooter}
                onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                placeholder="Thank you for dining with us! Please come again."
                className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              icon={Save}
              loading={saving}
              className="px-8 shadow-md"
            >
              Save System Settings
            </Button>
          </div>
        </div>

        {/* Right Column: Live Receipt Preview */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-[#800020]" />
                <span>Live Receipt Preview</span>
              </h3>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                Auto-syncs
              </span>
            </div>

            {/* Paper container */}
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 font-mono text-[11px] text-[#1F2937] space-y-3">
              <div className="text-center pb-2 border-b border-dashed border-gray-300">
                <p className="font-bold text-xs uppercase text-black">
                  {formData.restaurantName || 'RESTAURANT NAME'}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {formData.address || 'Address Line'}
                </p>
                <p className="text-[10px] text-gray-500">
                  Tel: {formData.phone || '+1 555-0100'}
                </p>
                <p className="text-[9px] text-gray-400 italic mt-1">
                  {formData.receiptHeader || 'Header note appears here'}
                </p>
              </div>

              <div className="text-[10px] text-gray-600 space-y-0.5 py-1 border-b border-dashed border-gray-300">
                <div className="flex justify-between">
                  <span>Order No:</span>
                  <span className="font-bold">ORD-20260930-0042</span>
                </div>
                <div className="flex justify-between">
                  <span>Table:</span>
                  <span>Table T-03 (Dine-in)</span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier:</span>
                  <span>Sarah Cashier</span>
                </div>
              </div>

              <div className="text-[10px] space-y-1 py-1 border-b border-dashed border-gray-300">
                <div className="flex justify-between font-bold">
                  <span>Chicken Burger</span>
                  <span>{formData.currency}9.99</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Lemon Mint Cooler</span>
                  <span>{formData.currency}3.99</span>
                </div>
              </div>

              <div className="text-[10px] space-y-0.5 text-right py-1 border-b border-dashed border-gray-300">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formData.currency}13.98</span>
                </div>
                {formData.taxRate > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>Tax ({formData.taxRate}%):</span>
                    <span>{formData.currency}{((13.98 * formData.taxRate) / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xs pt-1 text-black">
                  <span>TOTAL:</span>
                  <span>
                    {formData.currency}
                    {(13.98 + (13.98 * formData.taxRate) / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="text-center pt-1 text-[9px] text-gray-500">
                <p>{formData.receiptFooter || 'Footer thank you note'}</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SystemSettings;
