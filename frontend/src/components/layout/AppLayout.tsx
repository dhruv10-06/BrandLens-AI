import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.tsx';
import { Sidebar } from './Sidebar.tsx';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FCFBF9] flex flex-col font-sans selection:bg-brand-600 selection:text-white relative">
      {/* Subtle pearl ambient lighting glow */}
      <div className="fixed top-0 left-1/3 w-[600px] h-[300px] bg-lavender-100/40 blur-[120px] pointer-events-none -z-0" />
      <div className="fixed top-20 right-10 w-[400px] h-[300px] bg-champagne-100/30 blur-[100px] pointer-events-none -z-0" />

      <Navbar />
      <div className="flex-1 flex overflow-hidden relative z-10">
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