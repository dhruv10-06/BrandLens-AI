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
    <aside className="w-64 bg-[#FAF8F5] text-graphite-700 flex-shrink-0 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)] border-r border-[#EAE8E3]">
      <div className="p-4 space-y-6">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-graphite-400 px-3 mb-2.5 font-mono">
            Governance Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-card ring-1 ring-brand-700/20'
                      : 'text-graphite-600 hover:bg-ivory-200/70 hover:text-graphite-900'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-champagne-300/80 text-graphite-950 shadow-subtle font-mono">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Brand Governance Guidance Box */}
        <div className="p-4 rounded-2xl bg-white border border-[#EAE8E3] text-xs space-y-2 shadow-subtle">
          <div className="flex items-center gap-2 text-brand-600 font-bold text-xs tracking-tight">
            <Sparkles className="w-3.5 h-3.5" />
            <span>RAG Governance AI</span>
          </div>
          <p className="text-graphite-500 leading-relaxed text-[11px]">
            Content is verified against indexed guideline chunks and official brand facts. Violations cite ground-truth evidence.
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-[#EAE8E3] text-[11px] text-graphite-500 flex items-center justify-between bg-ivory-100/50">
        <div className="flex items-center gap-1.5 text-graphite-600 font-semibold font-mono">
          <Cpu className="w-3.5 h-3.5 text-brand-600" />
          <span>CodeNexus R3</span>
        </div>
        <span className="flex items-center gap-1.5 text-emerald-700 font-bold text-[10px] uppercase tracking-wider font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Multimodal Live
        </span>
      </div>
    </aside>
  );
};