import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const getHeaderInfo = (pathname) => {
  switch (pathname) {
    case '/dashboard':
      return {
        title: 'Inventory Dashboard',
        subtitle: 'Real-time stock summary and threshold alerts'
      };
    case '/products':
      return {
        title: 'Product Management',
        subtitle: 'Manage inventory items, pricing, thresholds and stock units'
      };
    case '/settings':
      return {
        title: 'Organization Settings',
        subtitle: 'Configure default threshold and preferences'
      };
    default:
      return {
        title: 'StockFlow',
        subtitle: 'SaaS Inventory Management'
      };
  }
};

const DashboardLayout = () => {
  const location = useLocation();
  const { title, subtitle } = getHeaderInfo(location.pathname);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title={title} subtitle={subtitle} />
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
