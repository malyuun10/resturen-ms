import React, { useRef } from 'react';
import Modal from './Modal';
import Button from './Button';
import { Printer, CheckCircle2 } from 'lucide-react';

const ReceiptModal = ({ isOpen, onClose, receiptData }) => {
  const receiptRef = useRef(null);

  if (!receiptData) return null;

  const handlePrint = () => {
    window.print();
  };

  const currency = receiptData.currency || '$';
  const formatMoney = (amount) => `${currency}${(Number(amount) || 0).toFixed(2)}`;

  const formattedDate = receiptData.date
    ? new Date(receiptData.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : new Date().toLocaleDateString();

  const formattedTime = receiptData.date
    ? new Date(receiptData.date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    : new Date().toLocaleTimeString();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transaction Receipt" maxWidth="max-w-md">
      {/* Visual Success Alert */}
      <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold no-print">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span>Payment successfully recorded in local database.</span>
      </div>

      {/* Printable Receipt Paper Container */}
      <div
        ref={receiptRef}
        className="printable-area bg-white border border-gray-200 rounded-lg p-6 font-mono text-xs text-[#1F2937] shadow-inner"
      >
        {/* Restaurant Header */}
        <div className="text-center pb-3 border-b border-dashed border-gray-300">
          <h2 className="text-base font-bold tracking-wider uppercase text-black">
            {receiptData.restaurantName || 'ROYAL BURGUNDY RESTAURANT'}
          </h2>
          {receiptData.address && (
            <p className="text-[11px] text-gray-600 mt-1">{receiptData.address}</p>
          )}
          {receiptData.phone && (
            <p className="text-[11px] text-gray-600">Tel: {receiptData.phone}</p>
          )}
          {receiptData.headerMessage && (
            <p className="text-[10px] text-gray-500 italic mt-1 whitespace-pre-line">
              {receiptData.headerMessage}
            </p>
          )}
        </div>

        {/* Transaction Meta */}
        <div className="py-2.5 border-b border-dashed border-gray-300 space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span className="text-gray-500">Order No:</span>
            <span className="font-bold">{receiptData.orderNumber}</span>
          </div>
          {receiptData.transactionId && (
            <div className="flex justify-between">
              <span className="text-gray-500">Txn ID:</span>
              <span>{receiptData.transactionId}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Date & Time:</span>
            <span>{formattedDate} {formattedTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Cashier:</span>
            <span className="capitalize">{receiptData.cashierName || 'Cashier'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Type / Table:</span>
            <span className="font-semibold uppercase">
              {receiptData.orderType === 'dine-in'
                ? `Dine-In (${receiptData.tableNumber || 'Table'})`
                : 'Takeaway'}
            </span>
          </div>
        </div>

        {/* Ordered Items Table */}
        <div className="py-3 border-b border-dashed border-gray-300">
          <div className="flex justify-between font-bold text-gray-700 pb-1.5 border-b border-gray-200">
            <span>ITEM</span>
            <div className="flex gap-4">
              <span>QTY</span>
              <span className="w-14 text-right">TOTAL</span>
            </div>
          </div>

          <div className="divide-y divide-gray-100 py-1 space-y-1">
            {receiptData.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-1">
                <div className="pr-2 max-w-[170px] truncate">
                  <div className="font-medium text-black truncate">{item.name}</div>
                  <div className="text-[10px] text-gray-500">{formatMoney(item.price)} each</div>
                </div>
                <div className="flex gap-4 shrink-0">
                  <span className="w-6 text-center">{item.quantity}</span>
                  <span className="w-14 text-right font-medium">
                    {formatMoney(item.subtotal || item.price * item.quantity)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="py-2.5 border-b border-dashed border-gray-300 space-y-1 text-right text-[11px]">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal:</span>
            <span>{formatMoney(receiptData.subtotal)}</span>
          </div>
          {receiptData.discount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Discount:</span>
              <span>-{formatMoney(receiptData.discount)}</span>
            </div>
          )}
          {receiptData.tax > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Tax / VAT:</span>
              <span>{formatMoney(receiptData.tax)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-black pt-1.5 border-t border-gray-200">
            <span>TOTAL:</span>
            <span>{formatMoney(receiptData.total)}</span>
          </div>
        </div>

        {/* Payment & Change Record */}
        <div className="py-2.5 border-b border-dashed border-gray-300 space-y-1 text-right text-[11px]">
          <div className="flex justify-between">
            <span className="text-gray-500">Payment Method:</span>
            <span className="uppercase font-semibold">CASH</span>
          </div>
          <div className="flex justify-between font-medium">
            <span className="text-gray-600">Amount Paid:</span>
            <span>{formatMoney(receiptData.amountPaid)}</span>
          </div>
          <div className="flex justify-between font-bold text-black text-xs pt-1 border-t border-gray-100">
            <span>CHANGE:</span>
            <span className="text-emerald-700">{formatMoney(receiptData.change)}</span>
          </div>
        </div>

        {/* Receipt Footer Message */}
        <div className="pt-3 text-center text-[10px] text-gray-500 space-y-1">
          <p>{receiptData.footerMessage || 'Thank you for your visit!'}</p>
          <p className="text-[9px] text-gray-400">Powered by Offline Restaurant POS</p>
        </div>
      </div>

      {/* Modal Actions */}
      <div className="mt-5 flex justify-end gap-3 no-print">
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
        <Button variant="primary" icon={Printer} onClick={handlePrint}>
          Print Receipt
        </Button>
      </div>
    </Modal>
  );
};

export default ReceiptModal;
