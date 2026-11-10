import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, ShieldCheck } from 'lucide-react';

const Navbar = ({ title, subtitle }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-slate-900 leading-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Organization pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-slate-700">
          <Building2 className="w-3.5 h-3.5 text-blue-600" />
          <span>{user?.organization_name || 'Organization'}</span>
        </div>

        {/* Security / Isolation badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-xs font-medium text-blue-700">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Isolated Tenant</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
