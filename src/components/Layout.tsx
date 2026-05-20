import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, History, User, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: 'Drawer', path: '/', icon: Home },
    { name: 'History', path: '/history', icon: History },
    { name: 'Account', path: '/account', icon: User },
  ];

  return (
    <div className="min-h-screen bg-bg-base text-slate-200 font-sans flex flex-col">
      {/* Top Navigation */}
      <nav className="h-14 border-b border-white/10 flex items-center justify-between px-8 bg-bg-panel shrink-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand rounded flex items-center justify-center font-bold text-white italic text-xl">
            Σ
          </div>
          <span className="font-medium tracking-tight text-lg">AI Olympiad Geometry</span>
        </div>

        <div className="flex gap-8 items-center h-full">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`text-sm font-medium tracking-wide transition-colors h-full flex items-center border-b-2 uppercase ${
                  isActive 
                    ? 'text-white border-brand' 
                    : 'text-slate-400 border-transparent hover:text-white'
                }`}
              >
                {item.name}
              </button>
            );
          })}
          
          <div className="h-4 w-px bg-white/10 mx-2" />
          
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
                Profile: {user.username}
              </span>
              <button
                onClick={() => {
                  logout();
                  navigate('/auth');
                }}
                className="px-4 py-1.5 border border-white/10 rounded-full hover:bg-white/5 transition-colors text-xs font-medium"
              >
                LOGOUT
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto bg-bg-section">
          <div className="max-w-7xl mx-auto p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
