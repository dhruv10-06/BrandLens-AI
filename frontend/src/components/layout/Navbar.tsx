import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ShieldCheck, UserCircle, LogOut, RefreshCw, Sparkles, Building2 } from 'lucide-react';
import { orgApi } from '../../api/org.api.ts';

export const Navbar: React.FC = () => {
  const { user, logout, quickDemoLogin } = useAuth();
  const [isSeeding, setIsSeeding] = React.useState(false);

  const handleResetDemo = async () => {
    if (!window.confirm('Reset demo dataset to fresh sample guidelines and sample submission?')) return;
    try {
      setIsSeeding(true);
      await orgApi.seedDemo(true);
      window.location.reload();
    } catch (err: any) {
      alert('Error resetting demo: ' + (err.message || err));
    } finally {
      setIsSeeding(false);
    }
  };

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

          {/* Right Action Tools: Role Switcher, Reset Demo, Profile */}
          <div className="flex items-center gap-3">
            {/* Quick Demo Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => quickDemoLogin('creator')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  user?.role === 'creator'
                    ? 'bg-white text-brand-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to Creator demo role"
              >
                Creator Role
              </button>
              <button
                type="button"
                onClick={() => quickDemoLogin('reviewer')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  user?.role === 'reviewer'
                    ? 'bg-white text-indigo-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to Reviewer demo role"
              >
                Reviewer Role
              </button>
            </div>

            {/* Reset Demo Button */}
            <button
              type="button"
              onClick={handleResetDemo}
              disabled={isSeeding}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition"
              title="Reset sample guidelines, facts, and submission"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
              <span>Reset Demo</span>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="flex flex-col items-end text-right">
                <span className="text-xs font-semibold text-slate-900 leading-tight">
                  {user?.name?.split(' ')[0]}
                </span>
                <span className="text-[10px] uppercase font-bold text-brand-600 tracking-wider">
                  {user?.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Sign out"
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
