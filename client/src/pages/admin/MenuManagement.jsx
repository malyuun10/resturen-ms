import React, { useState, useEffect } from 'react';
import { menuService, categoryService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import SearchBar from '../../components/SearchBar';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import Loading from '../../components/Loading';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Coffee,
  DollarSign,
  Tag
} from 'lucide-react';

const MenuManagement = () => {
  const { settings } = useAuth();

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockStatus, setStockStatus] = useState('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    stockQuantity: 0,
    isAvailable: true
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currency = settings?.currency || '$';
  const threshold = settings?.lowStockThreshold || 10;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [menuRes, catRes] = await Promise.all([
        menuService.getMenuItems({
          search,
          category: selectedCategory,
          stockStatus: stockStatus === 'all' ? undefined : stockStatus
        }),
        categoryService.getCategories()
      ]);

      if (menuRes.success) setItems(menuRes.items || []);
      if (catRes.success) setCategories(catRes.categories || []);
    } catch (err) {
      console.error('Error fetching menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory, stockStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  // Open Add Modal
  const openAddModal = () => {
    setFormData({
      name: '',
      category: categories[0]?._id || '',
      description: '',
      price: '',
      stockQuantity: 20,
      isAvailable: true
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      category: item.category?._id || item.category || '',
      description: item.description || '',
      price: item.price,
      stockQuantity: item.stockQuantity,
      isAvailable: item.isAvailable
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  // Create Item
  const handleCreateItem = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const res = await menuService.createMenuItem({
        ...formData,
        price: Number(formData.price),
        stockQuantity: Number(formData.stockQuantity)
      });
      if (res.success) {
        setIsAddModalOpen(false);
        await fetchData();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create menu item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Item
  const handleUpdateItem = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    setFormError('');
    setIsSubmitting(true);

    try {
      const res = await menuService.updateMenuItem(selectedItem._id, {
        ...formData,
        price: Number(formData.price),
        stockQuantity: Number(formData.stockQuantity)
      });
      if (res.success) {
        setIsEditModalOpen(false);
        await fetchData();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to update item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Toggle Availability
  const handleToggleAvailability = async (itemId) => {
    try {
      const res = await menuService.toggleAvailability(itemId);
      if (res.success) {
        await fetchData();
      }
    } catch (err) {
      alert(err.message || 'Could not update availability.');
    }
  };

  // Delete Item
  const handleConfirmDelete = async () => {
    if (!deleteItemId) return;
    setIsDeleting(true);

    try {
      const res = await menuService.deleteMenuItem(deleteItemId);
      if (res.success) {
        setDeleteItemId(null);
        await fetchData();
      }
    } catch (err) {
      alert(err.message || 'Could not delete item.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1F2937] flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-[#800020]" />
            <span>Menu & Beverage Management</span>
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Configure restaurant offerings, prices, stock levels, and food availability.
          </p>
        </div>

        <Button variant="primary" icon={Plus} onClick={openAddModal}>
          Add New Menu Item
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search menu items..."
            onClear={() => {
              setSearch('');
              fetchData();
            }}
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-1.5 px-3 rounded-lg border border-gray-200 text-xs text-gray-700 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-[#800020]"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockStatus}
            onChange={(e) => setStockStatus(e.target.value)}
            className="py-1.5 px-3 rounded-lg border border-gray-200 text-xs text-gray-700 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-[#800020]"
          >
            <option value="all">All Stock Levels</option>
            <option value="low">Low Stock Only (≤ {threshold})</option>
            <option value="out">Out of Stock</option>
            <option value="in">Well Stocked</option>
          </select>
        </div>
      </div>

      {/* Menu Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8">
            <Loading text="Loading menu catalog..." />
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Coffee className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No menu items found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FDF2F4]/40 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Menu Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock Quantity</th>
                  <th className="py-3 px-4">Stock Status</th>
                  <th className="py-3 px-4">Availability</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((it) => {
                  const isOut = it.stockQuantity <= 0;
                  const isLow = !isOut && it.stockQuantity <= threshold;

                  return (
                    <tr key={it._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#1F2937] text-sm">{it.name}</div>
                        {it.description && (
                          <div className="text-[11px] text-gray-500 line-clamp-1 max-w-xs">
                            {it.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium">
                          {it.category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-sm text-[#800020]">
                        {currency}{it.price?.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-800">
                        {it.stockQuantity}
                      </td>
                      <td className="py-3 px-4">
                        {isOut ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-800">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 flex items-center gap-1 w-max">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleAvailability(it._id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition-all ${
                            it.isAvailable
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {it.isAvailable ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Enabled
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-gray-400" /> Disabled
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(it)}
                            className="p-1.5 text-gray-500 hover:text-[#800020] hover:bg-[#FDF2F4] rounded-md transition-colors"
                            title="Edit Item"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteItemId(it._id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Menu Item"
        subtitle="Specify food item, category, initial stock, and pricing"
      >
        <form onSubmit={handleCreateItem} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1F2937] mb-1">Item Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Truffle Fries"
              className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1">Category *</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020] bg-white"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1">Price ({currency}) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1F2937] mb-1">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Key ingredients, allergens, preparation notes..."
              className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1">Initial Stock Quantity *</label>
              <input
                type="number"
                min="0"
                required
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="isAvailableCheck"
                checked={formData.isAvailable}
                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                className="w-4 h-4 text-[#800020] rounded border-gray-300 focus:ring-[#800020]"
              />
              <label htmlFor="isAvailableCheck" className="text-xs text-gray-700 font-medium">
                Available on POS Menu
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Save Menu Item
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Menu Item"
        subtitle={`Updating: ${selectedItem?.name}`}
      >
        <form onSubmit={handleUpdateItem} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1F2937] mb-1">Item Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1">Category</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020] bg-white"
              >
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1">Price ({currency})</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1F2937] mb-1">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1">Stock Quantity</label>
              <input
                type="number"
                min="0"
                required
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="editAvailableCheck"
                checked={formData.isAvailable}
                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                className="w-4 h-4 text-[#800020] rounded border-gray-300 focus:ring-[#800020]"
              />
              <label htmlFor="editAvailableCheck" className="text-xs text-gray-700 font-medium">
                Available on POS Menu
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Update Item
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Item Dialog */}
      <ConfirmationDialog
        isOpen={!!deleteItemId}
        onClose={() => setDeleteItemId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Menu Item"
        message="Are you sure you want to delete this menu item from the catalog?"
        confirmText="Delete Item"
        confirmVariant="danger"
        loading={isDeleting}
      />
    </div>
  );
};

export default MenuManagement;
