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
  Sparkles,
  BarChart3,
  Cpu,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const isReviewer = user?.role === 'reviewer' || user?.role === 'admin';

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Brand Analytics', path: '/analytics', icon: BarChart3, badge: 'R3' },
    { name: 'Brand Guidelines', path: '/guidelines', icon: BookOpen },
    { name: 'Submit Content', path: '/submissions/new', icon: FilePlus2 },
    { name: 'Submissions', path: '/submissions', icon: ListTodo },
    ...(isReviewer
      ? [{ name: 'Review Queue', path: '/review-queue', icon: CheckSquare, badge: 'Reviewer' }]
      : []),
    { name: 'Review History', path: '/review-history', icon: History },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)] border-r border-slate-800/80">
      <div className="p-4 space-y-6">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-3 mb-2.5">
            Governance Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm ring-1 ring-white/10'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 shadow-sm">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Brand Governance Guidance Box */}
        <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/50 text-xs space-y-2 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs tracking-tight">
            <Sparkles className="w-3.5 h-3.5" />
            <span>RAG Governance AI</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Content is verified against indexed guideline chunks and official brand facts. Violations cite ground-truth evidence.
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/90 text-[11px] text-slate-500 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-1.5 text-slate-400 font-medium">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span>CodeNexus R3</span>
        </div>
        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Multimodal Live
        </span>
      </div>
    </aside>
  );
};
