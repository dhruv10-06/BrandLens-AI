import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.tsx';
import { Sidebar } from './Sidebar.tsx';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8F8F6] flex flex-col font-sans selection:bg-brand-600 selection:text-white">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
