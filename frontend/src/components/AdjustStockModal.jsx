import React, { useState } from 'react';
import { X, ArrowUpDown, AlertCircle, Plus, Minus } from 'lucide-react';

const AdjustStockModal = ({ isOpen, onClose, onAdjust, product }) => {
  const [adjustment, setAdjustment] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !product) return null;

  const currentQuantity = product.quantity || 0;
  const parsedAdjustment = parseInt(adjustment, 10) || 0;
  const projectedQuantity = currentQuantity + parsedAdjustment;

  const handleQuickAdd = (amount) => {
    const currentVal = parseInt(adjustment, 10) || 0;
    setAdjustment(String(currentVal + amount));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (parsedAdjustment === 0) {
      setError('Adjustment amount cannot be zero.');
      return;
    }

    if (projectedQuantity < 0) {
      setError(`Stock cannot fall below zero. Maximum decrement allowed is ${currentQuantity}.`);
      return;
    }

    try {
      setLoading(true);
      await onAdjust(product.product_id, parsedAdjustment, note);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to adjust stock.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <ArrowUpDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Adjust Stock Units</h3>
              <p className="text-xs text-slate-500">{product.name} ({product.sku})</p>
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

          {/* Current vs Projected Stock Preview */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-center">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Current Stock</span>
              <p className="text-xl font-bold text-slate-800">{currentQuantity}</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Projected Stock</span>
              <p className={`text-xl font-bold ${projectedQuantity < 0 ? 'text-rose-600' : 'text-blue-600'}`}>
                {projectedQuantity}
              </p>
            </div>
          </div>

          {/* Quick Adjustment Shortcuts */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Quick Adjustment Buttons
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleQuickAdd(-5)}
                className="px-2.5 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded text-xs font-semibold flex items-center justify-center gap-1 transition"
              >
                <Minus className="w-3 h-3" /> 5
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(-1)}
                className="px-2.5 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded text-xs font-semibold flex items-center justify-center gap-1 transition"
              >
                <Minus className="w-3 h-3" /> 1
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(1)}
                className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 rounded text-xs font-semibold flex items-center justify-center gap-1 transition"
              >
                <Plus className="w-3 h-3" /> 1
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(10)}
                className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 rounded text-xs font-semibold flex items-center justify-center gap-1 transition"
              >
                <Plus className="w-3 h-3" /> 10
              </button>
            </div>
          </div>

          {/* Manual Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Adjustment Quantity (+ / -) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="1"
              value={adjustment}
              onChange={(e) => {
                setAdjustment(e.target.value);
                setError('');
              }}
              placeholder="e.g. +10 or -5"
              required
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <span className="text-[11px] text-slate-400">Enter a positive number to add stock, or negative to deduct stock.</span>
          </div>

          {/* Optional Adjustment Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Reason / Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. New stock delivery, damaged goods, return"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Actions */}
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
              disabled={loading || parsedAdjustment === 0 || projectedQuantity < 0}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              <span>Apply Adjustment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdjustStockModal;
