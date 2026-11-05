import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LayoutDashboard,
  BookOpen,
  FilePlus2,
  ListTodo,
  CheckSquare,
  History,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const isReviewer = user?.role === 'reviewer' || user?.role === 'admin';

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Brand Guidelines', path: '/guidelines', icon: BookOpen },
    { name: 'Submit Content', path: '/submissions/new', icon: FilePlus2 },
    { name: 'Submissions', path: '/submissions', icon: ListTodo },
    ...(isReviewer
      ? [{ name: 'Review Queue', path: '/review-queue', icon: CheckSquare, badge: 'Reviewer' }]
      : []),
    { name: 'Review History', path: '/review-history', icon: History },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2">
            Governance Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-400 text-slate-950">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Brand Governance Guidance Box */}
        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>RAG Governance AI</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Content is compared against indexed guideline chunks and official facts. Violations are backed by cited evidence.
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
        <span>CodeNexus 2026 R2</span>
        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Engine Live
        </span>
      </div>
    </aside>
  );
};
