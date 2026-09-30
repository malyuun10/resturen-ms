import React, { useState, useEffect } from 'react';
import { orderService, paymentService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import SearchBar from '../../components/SearchBar';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import ReceiptModal from '../../components/ReceiptModal';
import Loading from '../../components/Loading';
import {
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Utensils
} from 'lucide-react';

const CurrentOrders = () => {
  const { settings, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Selected Order for Payment Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cashAmount, setCashAmount] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState('');

  // Order Details Modal
  const [detailOrder, setDetailOrder] = useState(null);

  // Cancel Dialog
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const currency = settings?.currency || '$';

  const loadPendingOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getOrders({ status: 'pending' });
      if (res.success) {
        setOrders(res.orders || []);
      }
    } catch (err) {
      console.error('Error loading pending orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingOrders();
  }, []);

  const filteredOrders = orders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.tableNumber.toLowerCase().includes(q) ||
      o.cashierName.toLowerCase().includes(q)
    );
  });

  // Handle Cash Payment for pending order
  const handleOpenPayment = (order) => {
    setSelectedOrder(order);
    setCashAmount(order.total.toFixed(2));
    setPayError('');
  };

  const handleProcessPayment = async () => {
    if (!selectedOrder) return;
    const numPaid = Number(cashAmount);
    if (isNaN(numPaid) || numPaid < selectedOrder.total) {
      setPayError(`Cash amount must be at least ${currency}${selectedOrder.total.toFixed(2)}.`);
      return;
    }

    setIsPaying(true);
    setPayError('');

    try {
      const res = await paymentService.processPayment({
        orderId: selectedOrder._id,
        amountPaid: numPaid
      });

      if (res.success) {
        setActiveReceipt(res.receipt);
        setShowReceiptModal(true);
        setSelectedOrder(null);
        await loadPendingOrders();
      }
    } catch (err) {
      setPayError(err.message || 'Payment failed.');
    } finally {
      setIsPaying(false);
    }
  };

  // Cancel Order
  const handleConfirmCancel = async () => {
    if (!cancelOrderId) return;
    setIsCancelling(true);
    try {
      const res = await orderService.updateOrderStatus(cancelOrderId, 'cancelled');
      if (res.success) {
        setCancelOrderId(null);
        await loadPendingOrders();
      }
    } catch (err) {
      alert('Could not cancel order: ' + err.message);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1F2937] flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#800020]" />
            <span>Active & Pending Orders</span>
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Dine-in and takeaway orders currently in progress or awaiting cash payment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-64">
            <SearchBar value={search} onChange={setSearch} placeholder="Search order or table..." />
          </div>
          <Button variant="outline" size="md" icon={RefreshCw} onClick={loadPendingOrders}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Orders Grid / Cards */}
      {loading ? (
        <Loading text="Loading active orders..." />
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <CheckCircle className="w-12 h-12 stroke-[1.5] text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#1F2937]">No Pending Orders</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            All customer orders have been completed and paid for. New orders created in the POS will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredOrders.map((ord) => (
            <div
              key={ord._id}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between hover:border-[#800020] transition-colors"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <span className="font-mono font-bold text-sm text-[#1F2937]">
                      {ord.orderNumber}
                    </span>
                    <p className="text-[11px] text-gray-500">
                      {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold text-xs uppercase">
                    {ord.orderType === 'dine-in' ? `Table: ${ord.tableNumber}` : 'Takeaway'}
                  </span>
                </div>

                {/* Items Summary */}
                <div className="py-3 space-y-1 text-xs">
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Items ({ord.items?.length || 0}):
                  </div>
                  {ord.items?.slice(0, 4).map((it, idx) => (
                    <div key={idx} className="flex justify-between text-gray-700">
                      <span className="truncate max-w-[190px]">
                        <span className="font-bold">{it.quantity}×</span> {it.name}
                      </span>
                      <span className="font-mono text-gray-600">
                        {currency}{it.subtotal.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {ord.items?.length > 4 && (
                    <p className="text-[11px] text-gray-400 italic">
                      +{ord.items.length - 4} more items...
                    </p>
                  )}
                </div>
              </div>

              {/* Footer: Total & Actions */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-500">Total Due:</span>
                  <span className="text-lg font-black text-[#800020]">
                    {currency}{ord.total?.toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="col-span-2"
                    icon={DollarSign}
                    onClick={() => handleOpenPayment(ord)}
                  >
                    Receive Cash
                  </Button>
                  <Button
                    variant="dangerOutline"
                    size="sm"
                    onClick={() => setCancelOrderId(ord._id)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Checkout Payment Modal */}
      {selectedOrder && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedOrder(null)}
          title={`Checkout Order: ${selectedOrder.orderNumber}`}
          subtitle={`${selectedOrder.orderType.toUpperCase()} - ${selectedOrder.tableNumber}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            {payError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {payError}
              </div>
            )}

            {/* Total Display */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Total Bill Amount
              </span>
              <p className="text-3xl font-black text-[#800020] mt-1">
                {currency}{selectedOrder.total.toFixed(2)}
              </p>
            </div>

            {/* Cash Input */}
            <div>
              <label className="block text-xs font-bold text-[#1F2937] uppercase tracking-wider mb-1.5">
                Cash Received from Customer:
              </label>
              <input
                type="number"
                min={selectedOrder.total}
                step="0.01"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                className="w-full py-2.5 px-3 text-lg font-mono font-bold border-2 border-gray-300 rounded-lg focus:border-[#800020] focus:outline-none text-right"
              />
            </div>

            {/* Change Preview */}
            <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <span className="text-xs font-bold text-emerald-900">Change to Return:</span>
              <span className="text-base font-black font-mono text-emerald-700">
                {currency}
                {Math.max(0, (Number(cashAmount) || 0) - selectedOrder.total).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="ghost" onClick={() => setSelectedOrder(null)} disabled={isPaying}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleProcessPayment}
                loading={isPaying}
                icon={CheckCircle}
              >
                Complete Payment & Print
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Dialog for Cancel */}
      <ConfirmationDialog
        isOpen={!!cancelOrderId}
        onClose={() => setCancelOrderId(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Customer Order"
        message="Are you sure you want to cancel this order? Any associated table will immediately be marked as Available."
        confirmText="Cancel Order"
        confirmVariant="danger"
        loading={isCancelling}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        receiptData={activeReceipt}
      />
    </div>
  );
};

export default CurrentOrders;
