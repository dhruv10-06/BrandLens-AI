import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ShieldCheck, LogOut, Building2 } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-lg tracking-tight">
                  BrandLens <span className="text-brand-600">AI</span>
                </span>
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full border border-brand-200">
                  GovPlatform
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-500 font-medium leading-none">
                Your Brand's Intelligent Checkpoint Before Publication
              </p>
            </div>
          </div>

          {/* Center Workspace Identifier */}
          {user?.organization && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-700 font-medium">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Workspace:</span>
              <span className="font-semibold text-slate-900">{user.organization.name}</span>
            </div>
          )}

          {/* Right Section: Fixed Authenticated User & Logout */}
          <div className="flex items-center gap-3">
            {/* Read-Only Role Badge based strictly on authenticated database record */}
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end text-right">
                <span className="text-xs font-semibold text-slate-900 leading-tight">
                  {user?.name}
                </span>
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                    user?.role === 'reviewer'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : user?.role === 'admin'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {user?.role} Role (Fixed)
                </span>
              </div>

              <button
                type="button"
                onClick={logout}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition ml-1"
                title="Sign out of current account"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
