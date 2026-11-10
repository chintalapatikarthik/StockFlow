import React, { useState, useEffect } from 'react';
import { X, AlertCircle, PackagePlus, Save } from 'lucide-react';

const ProductModal = ({ isOpen, onClose, onSave, product = null, defaultOrgThreshold = 5 }) => {
  const isEditing = !!product;

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    quantity: '0',
    cost_price: '',
    selling_price: '',
    low_stock_threshold: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        description: product.description || '',
        quantity: product.quantity !== undefined ? String(product.quantity) : '0',
        cost_price: product.cost_price !== null && product.cost_price !== undefined ? String(product.cost_price) : '',
        selling_price: product.selling_price !== null && product.selling_price !== undefined ? String(product.selling_price) : '',
        low_stock_threshold: product.low_stock_threshold !== null && product.low_stock_threshold !== undefined ? String(product.low_stock_threshold) : ''
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        description: '',
        quantity: '0',
        cost_price: '',
        selling_price: '',
        low_stock_threshold: ''
      });
    }
    setError('');
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Product name is required.');
      return;
    }

    if (!formData.sku.trim()) {
      setError('SKU is required.');
      return;
    }

    const qty = parseInt(formData.quantity, 10);
    if (isNaN(qty) || qty < 0) {
      setError('Quantity must be a non-negative integer.');
      return;
    }

    if (formData.cost_price !== '') {
      const cp = parseFloat(formData.cost_price);
      if (isNaN(cp) || cp < 0) {
        setError('Cost price must be a non-negative number.');
        return;
      }
    }

    if (formData.selling_price !== '') {
      const sp = parseFloat(formData.selling_price);
      if (isNaN(sp) || sp < 0) {
        setError('Selling price must be a non-negative number.');
        return;
      }
    }

    if (formData.low_stock_threshold !== '') {
      const th = parseInt(formData.low_stock_threshold, 10);
      if (isNaN(th) || th < 0) {
        setError('Low stock threshold must be a non-negative integer.');
        return;
      }
    }

    try {
      setLoading(true);
      await onSave({
        ...formData,
        sku: formData.sku.trim().toUpperCase(),
        quantity: qty,
        cost_price: formData.cost_price !== '' ? parseFloat(formData.cost_price) : null,
        selling_price: formData.selling_price !== '' ? parseFloat(formData.selling_price) : null,
        low_stock_threshold: formData.low_stock_threshold !== '' ? parseInt(formData.low_stock_threshold, 10) : null
      });
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save product.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              {isEditing ? <Save className="w-5 h-5" /> : <PackagePlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                {isEditing ? 'Edit Product' : 'Add New Product'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? 'Update inventory details for this item' : 'Create a new item in your inventory catalog'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Basmati Rice 5kg"
                required
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* SKU */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                SKU <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="e.g. RICE001"
                required
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono transition uppercase"
              />
              <span className="text-[11px] text-slate-400">Unique identifier per organization</span>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Quantity on Hand <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                min="0"
                step="1"
                value={formData.quantity}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Cost Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Cost Price (₹)
              </label>
              <input
                type="number"
                name="cost_price"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.cost_price}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Selling Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Selling Price (₹)
              </label>
              <input
                type="number"
                name="selling_price"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.selling_price}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Low Stock Threshold */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Custom Low Stock Threshold (Optional)
              </label>
              <input
                type="number"
                name="low_stock_threshold"
                min="0"
                step="1"
                placeholder={`Leave empty to use organization default (${defaultOrgThreshold})`}
                value={formData.low_stock_threshold}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <span className="text-[11px] text-slate-400">
                Trigger low-stock warning when quantity falls at or below this value. Default: {defaultOrgThreshold}.
              </span>
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Description (Optional)
              </label>
              <textarea
                name="description"
                rows="2"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description, notes, supplier info, or specs..."
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
              ></textarea>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              <span>{isEditing ? 'Save Changes' : 'Create Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;

