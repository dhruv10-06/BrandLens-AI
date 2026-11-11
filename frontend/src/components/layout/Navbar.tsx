import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ShieldCheck, LogOut, Building2 } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-[#FCFBF9]/90 backdrop-blur-md border-b border-[#EAE8E3] shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-lavender-500 flex items-center justify-center text-white shadow-card ring-1 ring-white/50">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-graphite-900 text-lg tracking-tight">
                  BrandLens <span className="text-brand-600">AI</span>
                </span>
                <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider bg-lavender-100/80 text-brand-700 px-2.5 py-0.5 rounded-full border border-lavender-200 font-mono">
                  Enterprise
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-graphite-500 font-medium tracking-tight leading-none mt-0.5">
                Intelligent Brand Governance &amp; Publication Guardrails
              </p>
            </div>
          </div>

          {/* Center Workspace Identifier */}
          {user?.organization && (
            <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-ivory-100/80 border border-[#EAE8E3] text-xs text-graphite-700 font-medium shadow-subtle">
              <Building2 className="w-3.5 h-3.5 text-graphite-400" />
              <span className="text-graphite-400 font-mono text-[11px]">Workspace:</span>
              <span className="font-bold text-graphite-900">{user.organization.name}</span>
            </div>
          )}

          {/* Right Section: Authenticated User & Logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end text-right">
                <span className="text-xs font-bold text-graphite-900 leading-tight">
                  {user?.name}
                </span>
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border mt-0.5 font-mono ${
                    user?.role === 'reviewer'
                      ? 'bg-lavender-50 text-brand-700 border-lavender-200'
                      : user?.role === 'admin'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {user?.role} Role (Fixed)
                </span>
              </div>

              <div className="h-6 w-px bg-[#EAE8E3] hidden sm:block" />

              <button
                type="button"
                onClick={logout}
                className="p-2 text-graphite-400 hover:text-rose-600 hover:bg-rose-50/80 rounded-xl transition-colors"
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