import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Package, 
  Boxes, 
  AlertTriangle, 
  DollarSign, 
  ArrowRight, 
  ArrowUpDown, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';
import AdjustStockModal from '../components/AdjustStockModal';
import Toast from '../components/Toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    lowStockCount: 0,
    totalInventoryValue: '0.00'
  });
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Modal state for quick stock adjust from dashboard
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, lowStockRes] = await Promise.all([
        api.get('/dashboard'),
        api.get('/dashboard/low-stock')
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
      if (lowStockRes.data.success) {
        setLowStockProducts(lowStockRes.data.products);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setToast({
        message: 'Failed to load dashboard metrics. Please refresh.',
        type: 'error'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleOpenAdjust = (product) => {
    setSelectedProduct(product);
    setAdjustModalOpen(true);
  };

  const handleAdjustStock = async (productId, adjustment, note) => {
    const res = await api.patch(`/products/${productId}/adjust-stock`, { adjustment, note });
    if (res.data.success) {
      setToast({
        message: res.data.message || 'Stock adjusted successfully.',
        type: 'success'
      });
      // Refresh dashboard immediately
      fetchDashboardData();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Loading inventory analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top action row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h1>
          <p className="text-sm text-slate-500">Live operational snapshot of your business inventory</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Products */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Products</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.totalProducts}</p>
            <Link to="/products" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 2: Total Stock Units */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Stock Units</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.totalStock}</p>
            <span className="text-xs text-slate-400 font-medium">units on hand</span>
          </div>
        </div>

        {/* Card 3: Low Stock Items */}
        <div className={`rounded-xl p-5 border shadow-sm transition ${
          stats.lowStockCount > 0 
            ? 'bg-amber-50/60 border-amber-200 hover:shadow-md' 
            : 'bg-white border-slate-200 hover:shadow-md'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${
              stats.lowStockCount > 0 ? 'text-amber-800' : 'text-slate-500'
            }`}>
              Low Stock Alert
            </span>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              stats.lowStockCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className={`text-3xl font-extrabold tracking-tight ${
              stats.lowStockCount > 0 ? 'text-amber-700' : 'text-emerald-700'
            }`}>
              {stats.lowStockCount}
            </p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              stats.lowStockCount > 0 ? 'bg-amber-200/80 text-amber-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {stats.lowStockCount > 0 ? 'Needs Attention' : 'Healthy'}
            </span>
          </div>
        </div>

        {/* Card 4: Inventory Value */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Est. Stock Value</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">${stats.totalInventoryValue}</p>
            <span className="text-xs text-slate-400 font-medium">at cost price</span>
          </div>
        </div>
      </div>

      {/* Low Stock Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div>
            <h2 className="font-bold text-slate-900 text-base">Low Stock Products</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Threshold: quantity &le; effective threshold
          </span>
        </div>

        {lowStockProducts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">All Inventory Levels Healthy</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              None of your products are currently below their configured low stock threshold.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Product Name</th>
                  <th className="py-3 px-6">SKU</th>
                  <th className="py-3 px-6">Quantity on Hand</th>
                  <th className="py-3 px-6">Low Stock Threshold</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {lowStockProducts.map((p) => {
                  const isOutOfStock = p.quantity === 0;
                  return (
                    <tr key={p.product_id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-6 font-semibold text-slate-900">
                        {p.name}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-xs text-slate-600">
                        {p.sku}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className={`font-bold ${isOutOfStock ? 'text-rose-600' : 'text-amber-600'}`}>
                          {p.quantity} units
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-slate-600 text-xs">
                        &le; {p.effective_threshold} units
                        {p.low_stock_threshold === null && (
                          <span className="text-[10px] text-slate-400 ml-1.5">(org default)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                            Out of Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            Low Stock
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => handleOpenAdjust(p)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                        >
                          <ArrowUpDown className="w-3.5 h-3.5" />
                          <span>Adjust Stock</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust Stock Modal */}
      {selectedProduct && (
        <AdjustStockModal
          isOpen={adjustModalOpen}
          onClose={() => {
            setAdjustModalOpen(false);
            setSelectedProduct(null);
          }}
          onAdjust={handleAdjustStock}
          product={selectedProduct}
        />
      )}

      {/* Toast notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
};

export default Dashboard;

