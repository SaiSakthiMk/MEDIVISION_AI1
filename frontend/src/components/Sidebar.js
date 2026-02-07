import { NavLink } from 'react-router-dom';
import { LayoutDashboard, History, Scan } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/history', icon: History, label: 'Scan History' },
  ];

  return (
    <aside className="fixed left-0 top-20 bottom-0 w-16 lg:w-60 bg-zinc-50 border-r border-black/10 z-40">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 font-mono text-xs uppercase tracking-wider transition-colors ${
                isActive
                  ? 'bg-black/10 text-black border-l-2 border-black'
                  : 'text-black/50 hover:text-black hover:bg-black/5'
              }`
            }
            data-testid={`sidebar-${item.label.toLowerCase().replace(' ', '-')}`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="hidden lg:block">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      {/* Bottom Info */}
      <div className="absolute bottom-4 left-4 right-4 hidden lg:block">
        <div className="p-4 bg-black/5 border border-black/10">
          <div className="flex items-center gap-2 mb-2">
            <Scan className="w-4 h-4 text-black/50" />
            <span className="font-mono text-xs uppercase tracking-wider text-black/50">
              AI Status
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-black/70">Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
