import React, { useState, useEffect } from 'react';
import {
  menuService,
  categoryService,
  tableService,
  orderService,
  paymentService
} from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import SearchBar from '../../components/SearchBar';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import ReceiptModal from '../../components/ReceiptModal';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  Utensils,
  Coffee,
  AlertTriangle,
  Receipt,
  CheckCircle,
  Clock,
  RotateCcw
} from 'lucide-react';

const CashierPOS = () => {
  const { user, settings } = useAuth();

  // Menu & categories state
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Active Cart State
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('dine-in'); // 'dine-in' | 'takeaway'
  const [selectedTableId, setSelectedTableId] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [cashReceived, setCashReceived] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // Processing & Receipt state
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const currency = settings?.currency || '$';
  const taxRate = settings?.taxRate || 0;
  const lowStockThreshold = settings?.lowStockThreshold || 10;

  // Load menu, categories, and tables
  const loadData = async () => {
    try {
      setLoading(true);
      const [catsRes, menuRes, tablesRes] = await Promise.all([
        categoryService.getCategories({ activeOnly: true }),
        menuService.getMenuItems({ availableOnly: true }),
        tableService.getTables()
      ]);

      if (catsRes.success) setCategories(catsRes.categories);
      if (menuRes.success) setMenuItems(menuRes.items);
      if (tablesRes.success) setTables(tablesRes.tables);
    } catch (err) {
      setErrorMsg('Failed to load menu data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered menu items
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      item.category?._id === selectedCategory ||
      item.category === selectedCategory;

    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Available tables for dine-in
  const availableTables = tables.filter((t) => t.status === 'available');

  // Cart operations
  const addToCart = (item) => {
    if (item.stockQuantity <= 0) return;

    setErrorMsg('');
    setSuccessMsg('');

    setCart((prevCart) => {
      const existing = prevCart.find((ci) => ci.menuItemId === item._id);
      if (existing) {
        if (existing.quantity >= item.stockQuantity) {
          setErrorMsg(`Cannot add more "${item.name}". Only ${item.stockQuantity} available in stock.`);
          return prevCart;
        }
        return prevCart.map((ci) =>
          ci.menuItemId === item._id
            ? { ...ci, quantity: ci.quantity + 1, subtotal: (ci.quantity + 1) * ci.price }
            : ci
        );
      } else {
        return [
          ...prevCart,
          {
            menuItemId: item._id,
            name: item.name,
            price: item.price,
            stockQuantity: item.stockQuantity,
            quantity: 1,
            subtotal: item.price
          }
        ];
      }
    });
  };

  const updateQuantity = (menuItemId, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((ci) => {
          if (ci.menuItemId === menuItemId) {
            const newQty = ci.quantity + delta;
            if (newQty > ci.stockQuantity) {
              setErrorMsg(`Only ${ci.stockQuantity} available for "${ci.name}".`);
              return ci;
            }
            if (newQty <= 0) return null;
            return {
              ...ci,
              quantity: newQty,
              subtotal: newQty * ci.price
            };
          }
          return ci;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (menuItemId) => {
    setCart((prevCart) => prevCart.filter((ci) => ci.menuItemId !== menuItemId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedTableId('');
    setDiscountAmount(0);
    setCashReceived('');
    setOrderNotes('');
    setErrorMsg('');
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const discount = Math.min(subtotal, Math.max(0, Number(discountAmount) || 0));
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const tax = Math.round(((discountedSubtotal * taxRate) / 100) * 100) / 100;
  const total = Math.round((discountedSubtotal + tax) * 100) / 100;

  const numCash = Number(cashReceived) || 0;
  const change = Math.max(0, Math.round((numCash - total) * 100) / 100);
  const isCashSufficient = numCash >= total && total > 0;

  // Preset cash shortcuts
  const handleCashPreset = (amount) => {
    if (amount === 'exact') {
      setCashReceived(total.toFixed(2));
    } else {
      setCashReceived(Number(amount).toFixed(2));
    }
  };

  // Checkout and Pay Immediately
  const handleCheckoutAndPay = async () => {
    if (cart.length === 0) {
      setErrorMsg('Please add items to the cart before checking out.');
      return;
    }

    if (orderType === 'dine-in' && !selectedTableId) {
      setErrorMsg('Please select a dining table for Dine-in orders.');
      return;
    }

    if (!isCashSufficient) {
      setErrorMsg(`Cash received (${currency}${numCash.toFixed(2)}) is less than total amount (${currency}${total.toFixed(2)}).`);
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');

    try {
      const orderPayload = {
        orderType,
        tableId: orderType === 'dine-in' ? selectedTableId : null,
        items: cart.map((ci) => ({
          menuItemId: ci.menuItemId,
          quantity: ci.quantity
        })),
        discount,
        notes: orderNotes,
        immediatePayment: true,
        amountPaid: numCash
      };

      const res = await orderService.createOrder(orderPayload);
      if (res.success) {
        // Build receipt data
        const selectedTableObj = tables.find((t) => t._id === selectedTableId);
        const receiptData = {
          restaurantName: settings?.restaurantName || 'Royal Burgundy Restaurant',
          address: settings?.address || '',
          phone: settings?.phone || '',
          currency,
          headerMessage: settings?.receiptHeader || '',
          footerMessage: settings?.receiptFooter || '',
          transactionId: res.payment?.transactionId,
          orderNumber: res.order.orderNumber,
          orderType: res.order.orderType,
          tableNumber: selectedTableObj ? selectedTableObj.tableNumber : 'Takeaway',
          cashierName: user?.fullName || user?.username,
          date: new Date(),
          items: res.order.items,
          subtotal: res.order.subtotal,
          discount: res.order.discount,
          tax: res.order.tax,
          total: res.order.total,
          amountPaid: numCash,
          change
        };

        setActiveReceipt(receiptData);
        setShowReceiptModal(true);
        clearCart();
        // Refresh menu stock and table status
        await loadData();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Payment processing failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Save as Pending Order (Hold Order)
  const handleHoldOrder = async () => {
    if (cart.length === 0) {
      setErrorMsg('Cart is empty.');
      return;
    }

    if (orderType === 'dine-in' && !selectedTableId) {
      setErrorMsg('Table selection is required for Dine-in orders.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');

    try {
      const orderPayload = {
        orderType,
        tableId: orderType === 'dine-in' ? selectedTableId : null,
        items: cart.map((ci) => ({
          menuItemId: ci.menuItemId,
          quantity: ci.quantity
        })),
        discount,
        notes: orderNotes,
        immediatePayment: false
      };

      const res = await orderService.createOrder(orderPayload);
      if (res.success) {
        setSuccessMsg(`Order ${res.order.orderNumber} placed and saved as Pending.`);
        clearCart();
        await loadData();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to place order.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-6.5rem)]">
      {/* LEFT SECTION: Category Tabs, Search & Menu Grid */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Top Header: Search & Category Filter */}
        <div className="p-4 border-b border-gray-100 space-y-3 bg-[#FDF2F4]/30">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <h2 className="text-base font-bold text-[#1F2937] flex items-center gap-2">
              <Utensils className="w-4 h-4 text-[#800020]" />
              <span>Menu Catalogue</span>
            </h2>
            <div className="w-full sm:w-72">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search food or beverage..."
              />
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-[#800020] text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Items ({menuItems.length})
            </button>

            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat._id
                    ? 'bg-[#800020] text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {cat.name} ({cat.itemCount || 0})
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <Loading text="Loading delicious menu..." />
          ) : filteredMenuItems.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400">
              <Coffee className="w-12 h-12 stroke-[1.5] mb-2" />
              <p className="text-sm font-medium">No menu items match your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filteredMenuItems.map((item) => {
                const isOutOfStock = item.stockQuantity <= 0;
                const isLowStock = !isOutOfStock && item.stockQuantity <= lowStockThreshold;

                return (
                  <div
                    key={item._id}
                    onClick={() => !isOutOfStock && addToCart(item)}
                    className={`group relative rounded-xl border p-3 flex flex-col justify-between transition-all duration-150 ${
                      isOutOfStock
                        ? 'opacity-60 bg-gray-50 border-gray-200 cursor-not-allowed'
                        : 'bg-white border-gray-200 hover:border-[#800020] hover:shadow-md cursor-pointer active:scale-[0.98]'
                    }`}
                  >
                    <div>
                      {/* Category Label */}
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                        {item.category?.name || 'General'}
                      </span>
                      <h4 className="text-sm font-bold text-[#1F2937] leading-snug line-clamp-2 mt-0.5 group-hover:text-[#800020] transition-colors">
                        {item.name}
                      </h4>
                      {item.description && (
                        <p className="text-[11px] text-gray-500 line-clamp-2 mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-base font-extrabold text-[#800020]">
                        {currency}{item.price.toFixed(2)}
                      </span>

                      {/* Stock Status Badge */}
                      {isOutOfStock ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center gap-0.5">
                          <AlertTriangle className="w-3 h-3" />
                          {item.stockQuantity} left
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md text-gray-500 bg-gray-50">
                          {item.stockQuantity} in stock
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SECTION: Cart, Table Selection, Cash & Change Calculation */}
      <div className="w-full lg:w-96 xl:w-[420px] shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
        {/* Cart Header */}
        <div className="p-4 border-b border-gray-200 bg-[#5C001A] text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-amber-300" />
              <h3 className="font-bold text-base">Current Order</h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white font-medium">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} Items
            </span>
          </div>

          {/* Dine-in vs Takeaway Switcher */}
          <div className="grid grid-cols-2 gap-2 mt-3 p-1 bg-black/20 rounded-lg">
            <button
              type="button"
              onClick={() => setOrderType('dine-in')}
              className={`py-1.5 text-xs font-bold rounded-md transition-all ${
                orderType === 'dine-in'
                  ? 'bg-white text-[#5C001A] shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              🍽️ Dine-In
            </button>
            <button
              type="button"
              onClick={() => {
                setOrderType('takeaway');
                setSelectedTableId('');
              }}
              className={`py-1.5 text-xs font-bold rounded-md transition-all ${
                orderType === 'takeaway'
                  ? 'bg-white text-[#5C001A] shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              🛍️ Takeaway
            </button>
          </div>

          {/* Table Selector (If Dine-In) */}
          {orderType === 'dine-in' && (
            <div className="mt-3">
              <label className="block text-[11px] font-semibold text-white/80 mb-1">
                Select Dining Table:
              </label>
              <select
                value={selectedTableId}
                onChange={(e) => setSelectedTableId(e.target.value)}
                className="w-full py-1.5 px-3 rounded-lg text-xs bg-white text-gray-800 font-medium focus:outline-none"
              >
                <option value="">-- Choose Available Table --</option>
                {availableTables.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.tableNumber} (Seats {t.capacity})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="p-2.5 bg-red-50 text-red-700 text-xs font-medium border-b border-red-100 flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="font-bold ml-2">×</button>
          </div>
        )}
        {successMsg && (
          <div className="p-2.5 bg-emerald-50 text-emerald-700 text-xs font-medium border-b border-emerald-100 flex items-center justify-between">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="font-bold ml-2">×</button>
          </div>
        )}

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {cart.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-gray-400">
              <ShoppingCart className="w-10 h-10 stroke-[1.5] mb-1" />
              <p className="text-xs">No items in cart yet.</p>
              <p className="text-[11px] text-gray-400">Click items on the left to add.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.menuItemId}
                className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-gray-50/60 hover:bg-gray-50 text-xs"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <p className="font-bold text-[#1F2937] truncate">{item.name}</p>
                  <p className="text-gray-500 font-mono">
                    {currency}{item.price.toFixed(2)} × {item.quantity} ={' '}
                    <span className="font-bold text-[#800020]">
                      {currency}{item.subtotal.toFixed(2)}
                    </span>
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => updateQuantity(item.menuItemId, -1)}
                    className="w-6 h-6 rounded bg-white border border-gray-300 text-gray-700 flex items-center justify-center hover:bg-gray-100 font-bold active:bg-gray-200"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.menuItemId, 1)}
                    className="w-6 h-6 rounded bg-white border border-gray-300 text-gray-700 flex items-center justify-center hover:bg-gray-100 font-bold active:bg-gray-200"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.menuItemId)}
                    className="w-6 h-6 rounded text-red-500 hover:bg-red-50 flex items-center justify-center ml-1"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Financial Summary & Cash Calculation */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2 text-xs">
          {/* Subtotal */}
          <div className="flex justify-between text-gray-600 font-medium">
            <span>Subtotal</span>
            <span>{currency}{subtotal.toFixed(2)}</span>
          </div>

          {/* Discount Input */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Discount ({currency}):</span>
            <input
              type="number"
              min="0"
              step="0.5"
              value={discountAmount || ''}
              onChange={(e) => setDiscountAmount(e.target.value)}
              placeholder="0.00"
              className="w-24 text-right py-1 px-2 text-xs bg-white border border-gray-300 rounded font-medium focus:outline-none focus:ring-1 focus:ring-[#800020]"
            />
          </div>

          {/* Tax */}
          {taxRate > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Tax ({taxRate}%)</span>
              <span>{currency}{tax.toFixed(2)}</span>
            </div>
          )}

          {/* Grand Total */}
          <div className="flex justify-between items-baseline pt-2 border-t border-gray-200">
            <span className="text-sm font-extrabold text-[#1F2937]">Grand Total:</span>
            <span className="text-xl font-black text-[#800020]">
              {currency}{total.toFixed(2)}
            </span>
          </div>

          {/* Cash Received Input */}
          <div className="pt-2 border-t border-gray-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-[#1F2937] flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cash Received:</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder="0.00"
                className="w-28 text-right font-mono font-bold text-sm py-1.5 px-2 bg-white border-2 border-gray-300 rounded-lg focus:border-[#800020] focus:outline-none"
              />
            </div>

            {/* Quick Cash Presets */}
            <div className="grid grid-cols-4 gap-1 pt-1">
              <button
                type="button"
                onClick={() => handleCashPreset('exact')}
                className="py-1 px-1 rounded bg-white border border-gray-300 hover:bg-gray-100 font-bold text-[10px] text-gray-700"
              >
                Exact
              </button>
              <button
                type="button"
                onClick={() => handleCashPreset(10)}
                className="py-1 px-1 rounded bg-white border border-gray-300 hover:bg-gray-100 font-bold text-[10px] text-gray-700"
              >
                {currency}10
              </button>
              <button
                type="button"
                onClick={() => handleCashPreset(20)}
                className="py-1 px-1 rounded bg-white border border-gray-300 hover:bg-gray-100 font-bold text-[10px] text-gray-700"
              >
                {currency}20
              </button>
              <button
                type="button"
                onClick={() => handleCashPreset(50)}
                className="py-1 px-1 rounded bg-white border border-gray-300 hover:bg-gray-100 font-bold text-[10px] text-gray-700"
              >
                {currency}50
              </button>
            </div>

            {/* Change Calculation */}
            <div className="flex justify-between items-center py-1 px-2 rounded-lg bg-emerald-50 border border-emerald-200">
              <span className="font-bold text-emerald-900 text-xs">Change to Return:</span>
              <span className="font-mono font-black text-sm text-emerald-700">
                {currency}{change.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <Button
              variant="primary"
              size="lg"
              className="w-full py-2.5 font-bold tracking-wide"
              icon={Receipt}
              onClick={handleCheckoutAndPay}
              loading={isProcessing}
              disabled={cart.length === 0 || !isCashSufficient}
            >
              Pay Cash & Print Receipt
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleHoldOrder}
                disabled={cart.length === 0 || isProcessing}
                icon={Clock}
              >
                Save as Pending
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                disabled={cart.length === 0 || isProcessing}
                icon={RotateCcw}
              >
                Clear Cart
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        receiptData={activeReceipt}
      />
    </div>
  );
};

export default CashierPOS;
