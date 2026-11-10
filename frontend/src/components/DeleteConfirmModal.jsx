import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, product, loading = false }) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scale-up">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-rose-100 rounded-full text-rose-600 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Confirm Delete Product</h3>
              <p className="text-xs text-slate-500">This action cannot be undone.</p>
            </div>
          </div>

          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            Are you sure you want to permanently delete <strong className="text-slate-900 font-semibold">{product.name}</strong> (<span className="font-mono text-xs">{product.sku}</span>)?
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(product.product_id)}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg shadow-sm transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              <span>Delete Product</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;

