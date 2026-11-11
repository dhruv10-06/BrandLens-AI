import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ShieldCheck, LogOut, Building2, Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F0]/95 backdrop-blur-md border-b border-[#E2D7C5] shadow-parchment-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-[#243C32] flex items-center justify-center text-[#FDFBFA] shadow-parchment border border-forest-700">
              <ShieldCheck className="w-5 h-5 text-brass-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-espresso-950 text-lg tracking-tight font-serif">
                  BrandLens <span className="text-brass-700 italic font-normal">Atelier</span>
                </span>
                <span className="inline-block text-[9px] font-bold uppercase tracking-widest bg-[#F5EFE4] text-espresso-800 px-2.5 py-0.5 rounded-full border border-[#DDD2BF] font-mono">
                  Sovereign AI
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-espresso-600 font-medium tracking-tight leading-none mt-0.5">
                Intelligent Pre-Publication Brand Governance &amp; Safeguards
              </p>
            </div>
          </div>

          {/* Center Workspace Identifier */}
          {user?.organization && (
            <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#F5EFE4] border border-[#DDD2BF] text-xs text-espresso-800 font-medium shadow-parchment-sm">
              <Building2 className="w-3.5 h-3.5 text-brass-700" />
              <span className="text-espresso-600 font-mono text-[11px]">Workspace:</span>
              <span className="font-bold text-espresso-950 font-serif">{user.organization.name}</span>
            </div>
          )}

          {/* Right Section: Authenticated User & Logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end text-right">
                <span className="text-xs font-bold text-espresso-950 leading-tight">
                  {user?.name}
                </span>
                <span
                  className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border mt-0.5 font-mono ${
                    user?.role === 'reviewer'
                      ? 'bg-brass-100 text-brass-900 border-brass-300'
                      : user?.role === 'admin'
                      ? 'bg-oxblood-100 text-oxblood-900 border-oxblood-300'
                      : 'bg-forest-100 text-forest-900 border-forest-300'
                  }`}
                >
                  {user?.role} Role
                </span>
              </div>

              <div className="h-6 w-px bg-[#E2D7C5] hidden sm:block" />

              <button
                type="button"
                onClick={logout}
                className="p-2 text-espresso-600 hover:text-oxblood-800 hover:bg-oxblood-50 rounded-lg transition-colors border border-transparent hover:border-oxblood-200"
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
