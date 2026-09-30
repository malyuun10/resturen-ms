import React, { useState, useEffect } from 'react';
import { categoryService } from '../../services/api';
import SearchBar from '../../components/SearchBar';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import Loading from '../../components/Loading';
import { Tags, Plus, Edit2, Trash2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const [deleteCatId, setDeleteCatId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form
  const [formData, setFormData] = useState({ name: '', description: '', isActive: true });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await categoryService.getCategories({ search });
      if (res.success) {
        setCategories(res.categories || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCategories();
  };

  const openAdd = () => {
    setFormData({ name: '', description: '', isActive: true });
    setFormError('');
    setIsAddOpen(true);
  };

  const openEdit = (cat) => {
    setSelectedCat(cat);
    setFormData({ name: cat.name, description: cat.description || '', isActive: cat.isActive });
    setFormError('');
    setIsEditOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      const res = await categoryService.createCategory(formData);
      if (res.success) {
        setIsAddOpen(false);
        await fetchCategories();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedCat) return;
    setFormError('');
    setIsSubmitting(true);
    try {
      const res = await categoryService.updateCategory(selectedCat._id, formData);
      if (res.success) {
        setIsEditOpen(false);
        await fetchCategories();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to update category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCatId) return;
    setIsDeleting(true);
    try {
      const res = await categoryService.deleteCategory(deleteCatId);
      if (res.success) {
        setDeleteCatId(null);
        await fetchCategories();
      }
    } catch (err) {
      alert(err.message || 'Could not delete category.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1F2937] flex items-center gap-2">
            <Tags className="w-5 h-5 text-[#800020]" />
            <span>Category Management</span>
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Organize menu groupings such as Appetizers, Mains, Pizzas, Drinks, and Desserts.
          </p>
        </div>

        <Button variant="primary" icon={Plus} onClick={openAdd}>
          Add Category
        </Button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="w-full sm:w-80">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search categories..."
            onClear={() => {
              setSearch('');
              fetchCategories();
            }}
          />
        </form>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8">
            <Loading text="Loading menu categories..." />
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Tags className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No categories found.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FDF2F4]/40 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Category Name</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Menu Items Count</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-[#1F2937] text-sm">
                    {c.name}
                  </td>
                  <td className="py-3 px-4 text-gray-600 max-w-sm">
                    {c.description || '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-[#800020] bg-[#FDF2F4] px-2 py-0.5 rounded-md">
                      {c.itemCount || 0} items
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {c.isActive ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-gray-400" />}
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 text-gray-500 hover:text-[#800020] hover:bg-[#FDF2F4] rounded-md transition-colors"
                        title="Edit Category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteCatId(c._id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New Category">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {formError}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-[#1F2937] mb-1">Category Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Seafood & Grills"
              className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1F2937] mb-1">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this section..."
              className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="catActiveCheck"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-[#800020] rounded border-gray-300 focus:ring-[#800020]"
            />
            <label htmlFor="catActiveCheck" className="text-xs text-gray-700 font-medium">
              Category Active in POS
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button variant="ghost" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Create Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Category">
        <form onSubmit={handleUpdate} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {formError}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-[#1F2937] mb-1">Category Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800020]"
            />
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
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="editCatActiveCheck"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-[#800020] rounded border-gray-300 focus:ring-[#800020]"
            />
            <label htmlFor="editCatActiveCheck" className="text-xs text-gray-700 font-medium">
              Category Active in POS
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button variant="ghost" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deleteCatId}
        onClose={() => setDeleteCatId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? Categories containing existing menu items cannot be deleted until those items are removed or reassigned."
        confirmText="Delete Category"
        confirmVariant="danger"
        loading={isDeleting}
      />
    </div>
  );
};

export default CategoryManagement;
