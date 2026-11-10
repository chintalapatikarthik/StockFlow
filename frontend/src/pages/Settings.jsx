import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Save, AlertCircle, Info, Building2, Sliders } from 'lucide-react';
import Toast from '../components/Toast';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [organizationName, setOrganizationName] = useState('');
  const [defaultLowStock, setDefaultLowStock] = useState('5');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data.success && res.data.settings) {
          setOrganizationName(res.data.settings.organization_name || '');
          setDefaultLowStock(String(res.data.settings.default_low_stock ?? 5));
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
        setError('Failed to load settings from server.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedThreshold = parseInt(defaultLowStock, 10);
    if (isNaN(parsedThreshold) || parsedThreshold < 0) {
      setError('Default low stock threshold must be a non-negative integer.');
      return;
    }

    if (!organizationName.trim()) {
      setError('Organization name cannot be empty.');
      return;
    }

    setSaving(true);

    try {
      const res = await api.put('/settings', {
        default_low_stock: parsedThreshold,
        organization_name: organizationName.trim()
      });

      if (res.data.success) {
        setToast({
          message: 'Settings updated successfully.',
          type: 'success'
        });
        updateUser({
          organization_name: res.data.settings.organization_name,
          default_low_stock: res.data.settings.default_low_stock
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save settings.';
      setError(msg);
      setToast({ message: msg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-medium text-slate-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organization Settings</h1>
        <p className="text-sm text-slate-500">Configure tenant preferences and inventory alert defaults</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Threshold & Profile Configuration</h3>
            <p className="text-xs text-slate-500">Settings apply across all products in your organization</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Organization Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Organization Name
            </label>
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Building2 className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="My Business"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              The registered company or business name for this multi-tenant account.
            </span>
          </div>

          {/* Default Low Stock Threshold */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Default Low Stock Threshold (Units)
            </label>
            <div className="max-w-xs">
              <input
                type="number"
                min="0"
                step="1"
                required
                value={defaultLowStock}
                onChange={(e) => setDefaultLowStock(e.target.value)}
                placeholder="5"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2.5 text-xs text-blue-800">
              <Info className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">How default threshold works:</p>
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  Whenever an individual product does not have a custom threshold assigned, StockFlow automatically uses this default value. When product quantity falls at or below this number, the product is flagged as <strong>Low Stock</strong> on the Dashboard and Product Catalog.
                </p>
              </div>
            </div>
          </div>

          {/* User Account Info Display */}
          <div className="pt-4 border-t border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Account Details
            </span>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 text-slate-600">
              <p><strong className="text-slate-800">User Email:</strong> {user?.email}</p>
              <p><strong className="text-slate-800">Organization ID:</strong> #{user?.organization_id}</p>
              <p><strong className="text-slate-800">Tenancy Isolation:</strong> Strictly enforced by JWT context</p>
            </div>
          </div>

          {/* Submit button */}
          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
};

export default Settings;
