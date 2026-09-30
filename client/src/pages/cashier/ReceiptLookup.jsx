import React, { useState } from 'react';
import { paymentService } from '../../services/api';
import SearchBar from '../../components/SearchBar';
import Button from '../../components/Button';
import ReceiptModal from '../../components/ReceiptModal';
import { Receipt, Search, AlertCircle, Printer, ArrowRight } from 'lucide-react';

const ReceiptLookup = () => {
  const [orderQuery, setOrderQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleLookup = async (e) => {
    e?.preventDefault();
    if (!orderQuery.trim()) {
      setError('Please enter an order number.');
      return;
    }

    setLoading(true);
    setError('');
    setReceipt(null);

    try {
      const res = await paymentService.getReceipt(orderQuery.trim());
      if (res.success && res.receipt) {
        setReceipt(res.receipt);
        setShowModal(true);
      }
    } catch (err) {
      setError(err.message || 'Receipt not found for this order number.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#FDF2F4] text-[#800020] flex items-center justify-center mx-auto mb-3 shadow-xs">
          <Receipt className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-[#1F2937]">Receipt Lookup Station</h2>
        <p className="text-xs text-[#6B7280] mt-1">
          Search any transaction receipt by its unique Order Number to re-print or inspect.
        </p>
      </div>

      {/* Lookup Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <form onSubmit={handleLookup} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1F2937] uppercase tracking-wider mb-2">
              Enter Order Number:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                placeholder="e.g. ORD-20260930-0001"
                className="flex-1 py-2.5 px-3.5 text-sm bg-gray-50 border border-gray-300 rounded-lg text-[#1F2937] font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]"
              />
              <Button
                type="submit"
                variant="primary"
                icon={Search}
                loading={loading}
                className="px-5 shrink-0"
              >
                Search
              </Button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100 text-xs text-[#6B7280] space-y-2">
          <p className="font-semibold text-[#1F2937]">Helpful POS Tips:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Receipts can be recalled at any time directly from the local database.</li>
            <li>Pressing "Print Receipt" in the receipt popup formats cleanly for thermal printer receipt rolls.</li>
          </ul>
        </div>
      </div>

      <ReceiptModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        receiptData={receipt}
      />
    </div>
  );
};

export default ReceiptLookup;
