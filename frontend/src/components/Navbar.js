import { Link, useNavigate } from 'react-router-dom';
import { Scan, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-3" data-testid="navbar-logo">
          <div className="w-10 h-10 border border-black/30 flex items-center justify-center">
            <Scan className="w-5 h-5" />
          </div>
          <span className="font-mono text-sm uppercase tracking-widest font-medium hidden md:block">
            MediVision
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-black/70 hover:text-black hover:bg-black/5"
                data-testid="user-menu-trigger"
              >
                <div className="w-8 h-8 border border-black/30 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <span className="hidden md:block">{user?.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="bg-white border-black/20 min-w-[200px]"
            >
              <div className="px-3 py-2">
                <p className="font-mono text-xs uppercase tracking-wider text-black/50">
                  Signed in as
                </p>
                <p className="text-sm text-black truncate mt-1">{user?.email}</p>
              </div>
              <DropdownMenuSeparator className="bg-black/10" />
              <DropdownMenuItem 
                className="text-black/80 cursor-pointer hover:bg-black/5 focus:bg-black/5"
                onClick={() => navigate('/dashboard')}
                data-testid="menu-dashboard"
              >
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-black/80 cursor-pointer hover:bg-black/5 focus:bg-black/5"
                onClick={() => navigate('/history')}
                data-testid="menu-history"
              >
                Scan History
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-black/10" />
              <DropdownMenuItem 
                className="text-red-600 cursor-pointer hover:bg-red-50 focus:bg-red-50"
                onClick={handleLogout}
                data-testid="menu-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
