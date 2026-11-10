import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  ArrowUpDown, 
  Package, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import ProductModal from '../components/ProductModal';
import AdjustStockModal from '../components/AdjustStockModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import Toast from '../components/Toast';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [defaultOrgThreshold, setDefaultOrgThreshold] = useState(5);

  // Modals state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchProducts = useCallback(async (searchQuery = '') => {
    try {
      const url = searchQuery ? `/products?search=${encodeURIComponent(searchQuery)}` : '/products';
      const [prodRes, settingsRes] = await Promise.all([
        api.get(url),
        api.get('/settings').catch(() => ({ data: { settings: { default_low_stock: 5 } } }))
      ]);

      if (prodRes.data.success) {
        setProducts(prodRes.data.products);
      }
      if (settingsRes.data?.settings?.default_low_stock) {
        setDefaultOrgThreshold(settingsRes.data.settings.default_low_stock);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
      setToast({
        message: 'Failed to load products. Please check connection.',
        type: 'error'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(search);
  }, [fetchProducts, search]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProducts(search);
  };

  // Add / Edit handler
  const handleSaveProduct = async (payload) => {
    if (editingProduct) {
      const res = await api.put(`/products/${editingProduct.product_id}`, payload);
      if (res.data.success) {
        setToast({ message: 'Product updated successfully.', type: 'success' });
        fetchProducts(search);
      }
    } else {
      const res = await api.post('/products', payload);
      if (res.data.success) {
        setToast({ message: 'Product created successfully.', type: 'success' });
        fetchProducts(search);
      }
    }
  };

  // Stock adjust handler
  const handleAdjustStock = async (productId, adjustment, note) => {
    const res = await api.patch(`/products/${productId}/adjust-stock`, { adjustment, note });
    if (res.data.success) {
      setToast({
        message: res.data.message || 'Stock adjusted successfully.',
        type: 'success'
      });
      fetchProducts(search);
    }
  };

  // Delete handler
  const handleDeleteProduct = async (productId) => {
    try {
      setDeleteLoading(true);
      const res = await api.delete(`/products/${productId}`);
      if (res.data.success) {
        setToast({ message: 'Product deleted successfully.', type: 'success' });
        setDeleteModalOpen(false);
        setDeletingProduct(null);
        fetchProducts(search);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete product.';
      setToast({ message: msg, type: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Search bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by product name or SKU..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => {
              setEditingProduct(null);
              setProductModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition shadow-blue-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Product Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-medium text-slate-500">Loading product catalog...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">
              {search ? 'No Matching Products' : 'No Products Added Yet'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search 
                ? `No products matched "${search}". Try searching with a different term.`
                : 'Get started by clicking the "Add Product" button above to add your first inventory item.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Product & SKU</th>
                  <th className="py-3 px-6">Quantity on Hand</th>
                  <th className="py-3 px-6">Stock Status</th>
                  <th className="py-3 px-6">Cost Price</th>
                  <th className="py-3 px-6">Selling Price</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {products.map((p) => {
                  const isOutOfStock = p.quantity === 0;
                  const isLowStock = p.is_low_stock || p.quantity <= p.effective_threshold;

                  return (
                    <tr key={p.product_id} className="hover:bg-slate-50/70 transition">
                      {/* Name & SKU */}
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight">{p.name}</p>
                          <p className="text-xs font-mono text-slate-500 mt-0.5">
                            SKU: <span className="text-slate-700">{p.sku}</span>
                          </p>
                          {p.description && (
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{p.description}</p>
                          )}
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className={`text-base font-bold ${
                            isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-slate-900'
                          }`}>
                            {p.quantity}
                          </span>
                          <span className="text-xs text-slate-400">units</span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Threshold: &le; {p.effective_threshold}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-6">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            In Stock
                          </span>
                        )}
                      </td>

                      {/* Cost Price */}
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {p.cost_price !== null && p.cost_price !== undefined 
                          ? `$${parseFloat(p.cost_price).toFixed(2)}` 
                          : '—'}
                      </td>

                      {/* Selling Price */}
                      <td className="py-4 px-6 text-slate-900 font-semibold">
                        {p.selling_price !== null && p.selling_price !== undefined 
                          ? `$${parseFloat(p.selling_price).toFixed(2)}` 
                          : '—'}
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setAdjustingProduct(p);
                              setAdjustModalOpen(true);
                            }}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                            title="Adjust Stock Units"
                          >
                            <ArrowUpDown className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setProductModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            title="Edit Product"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setDeletingProduct(p);
                              setDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Product Add / Edit Modal */}
      <ProductModal
        isOpen={productModalOpen}
        onClose={() => {
          setProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        product={editingProduct}
        defaultOrgThreshold={defaultOrgThreshold}
      />

      {/* Adjust Stock Modal */}
      <AdjustStockModal
        isOpen={adjustModalOpen}
        onClose={() => {
          setAdjustModalOpen(false);
          setAdjustingProduct(null);
        }}
        onAdjust={handleAdjustStock}
        product={adjustingProduct}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingProduct(null);
        }}
        onConfirm={handleDeleteProduct}
        product={deletingProduct}
        loading={deleteLoading}
      />

      {/* Toast Alert */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
};

export default Products;

