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
  ShieldCheck,
  BarChart3,
  Cpu,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const isReviewer = user?.role === 'reviewer' || user?.role === 'admin';

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Brand Analytics', path: '/analytics', icon: BarChart3, badge: 'Intelligence' },
    { name: 'Brand Guidelines', path: '/guidelines', icon: BookOpen },
    { name: 'Submit Content', path: '/submissions/new', icon: FilePlus2 },
    { name: 'Submissions', path: '/submissions', icon: ListTodo },
    ...(isReviewer
      ? [{ name: 'Review Queue', path: '/review-queue', icon: CheckSquare, badge: 'Reviewer' }]
      : []),
    { name: 'Review History', path: '/review-history', icon: History },
  ];

  return (
    <aside className="w-64 bg-[#F5EFE4] text-espresso-800 flex-shrink-0 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4.25rem)] border-r border-[#E2D7C5]">
      <div className="p-4 space-y-6">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-espresso-600 px-3 mb-2.5 font-mono">
            Workspace Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-600 text-cream-50 shadow-parchment border border-forest-700/60'
                      : 'text-espresso-800 hover:bg-[#EAE1D2] hover:text-espresso-950'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 flex-shrink-0 text-brass-700" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#EAE1D2] text-espresso-900 border border-[#DDD2BF] font-mono">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Brand Governance Guidance Box */}
        <div className="p-4 rounded-xl bg-[#FDFBF7] border border-[#E2D7C5] text-xs space-y-2 shadow-parchment-sm">
          <div className="flex items-center gap-2 text-forest-800 font-bold text-xs tracking-tight font-serif">
            <ShieldCheck className="w-4 h-4 text-brass-700" />
            <span>Brand Guidelines</span>
          </div>
          <p className="text-espresso-700 leading-relaxed text-[11px]">
            Every creative asset is vetted against vectorized brand guidelines and verified factual assertions with zero halluncination tolerance.
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-[#E2D7C5] text-[11px] text-espresso-600 flex items-center justify-between bg-[#EFE8DA]">
        <div className="flex items-center gap-1.5 font-mono text-espresso-800 font-medium">
          <Cpu className="w-3.5 h-3.5 text-brass-700" />
          <span>Atelier Engine</span>
        </div>
        <span className="flex items-center gap-1.5 text-forest-900 font-semibold text-[10px] uppercase tracking-wider font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-forest-800 animate-pulse" />
          Llama 3.3 Active
        </span>
      </div>
    </aside>
  );
};
