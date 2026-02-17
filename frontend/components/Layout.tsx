import React, { useState, createContext, useContext } from 'react';
import { NavLink, useLocation, useNavigate, Outlet } from 'react-router-dom';
import ToastContainer, { ToastMessage, ToastType } from './ui/Toast';
import { useAuth } from '../src/context/AuthContext';
import GlobalSearch, { SearchContext } from './GlobalSearch';
import PWAInstallPrompt from './PWAInstallPrompt';

// Toast Context Setup
interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}
export const ToastContext = createContext<ToastContextType>({ addToast: () => { } });
export const useToast = () => useContext(ToastContext);

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleAdminLogout = () => {
    logout();
    navigate('/admin-login');
  };

  const addToast = (message: string, type: ToastType) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { to: '/students', label: 'Students', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { to: '/assignments', label: 'Tasks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { to: '/payments', label: 'Payments', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { to: '/writers', label: 'Writers', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
    { to: '/audit-log', label: 'Audit Log', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { to: '/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ];

  const getPageTitle = () => {
    const current = navItems.find(item => item.to === location.pathname);
    return current ? current.label : 'TaskMaster';
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      <SearchContext.Provider value={{ openSearch: () => setSearchOpen(prev => !prev) }}>
        <div className="min-h-screen bg-background text-secondary-900 font-sans selection:bg-primary-500/20">
          <ToastContainer toasts={toasts} removeToast={removeToast} />
          <GlobalSearch isOpen={searchOpen} onOpenChange={setSearchOpen} />
          <PWAInstallPrompt />

          {/* Desktop Header */}
          <header className="fixed top-0 inset-x-0 z-40 hidden md:block bg-white/80 backdrop-blur-md border-b border-secondary-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                {/* Logo / Brand */}
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/dashboard')}>
                  <div className="w-8 h-8 rounded-apple bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-ios group-hover:shadow-ios-md transition-all">
                    <span className="text-white font-bold text-lg">T</span>
                  </div>
                  <h1 className="text-lg font-bold text-secondary-900 tracking-tight group-hover:text-primary-600 transition-colors">k0nach!</h1>
                </div>

                {/* Navigation */}
                <nav className="flex items-center space-x-1">
                  {navItems.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) => `
                      inline-flex items-center px-3 py-2 rounded-apple text-sm font-medium transition-all duration-200
                      ${isActive
                          ? 'text-primary-700 bg-primary-50'
                          : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'}
                    `}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </nav>

                {/* User Actions */}
                <div className="flex items-center gap-2 pl-6 border-l border-secondary-200 ml-6">
                  <button
                    onClick={() => setSearchOpen(prev => !prev)}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm text-secondary-500 hover:text-secondary-700 bg-secondary-50 hover:bg-secondary-100 rounded-apple transition-colors"
                    title="Search (Cmd+K)"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <kbd className="text-[10px] text-secondary-400 font-medium bg-white px-1.5 py-0.5 rounded border border-secondary-200">
                      {navigator.platform.includes('Mac') ? '⌘K' : 'Ctrl+K'}
                    </kbd>
                  </button>
                  <button
                    onClick={handleAdminLogout}
                    className="inline-flex items-center justify-center px-4 py-2 border border-secondary-200 shadow-ios text-sm font-medium rounded-apple text-secondary-700 bg-white hover:bg-secondary-50 hover:text-secondary-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                  >
                    Log out
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Mobile Header (Title Only) */}
          <header className="md:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-secondary-200 px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-apple bg-primary-600 flex items-center justify-center">
                <span className="text-white font-bold">T</span>
              </div>
              <h1 className="text-lg font-semibold text-secondary-900">{getPageTitle()}</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSearchOpen(prev => !prev)}
                className="p-2 text-secondary-400 hover:text-secondary-600 transition-colors"
                title="Search"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button
                onClick={handleAdminLogout}
                className="text-xs font-medium text-secondary-500 hover:text-red-600"
              >
                Logout
              </button>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:pt-24 pb-24 md:pb-8">
            <Outlet />
          </main>

          {/* Mobile Bottom Navigation */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-secondary-200 z-50 pb-safe shadow-[0_-1px_10px_rgba(0,0,0,0.05)]">
            <div className="grid grid-cols-5 h-16">
              {navItems.slice(0, 5).map(item => {
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`flex flex-col items-center justify-center gap-1 transition-colors ${isActive ? 'text-primary-600' : 'text-secondary-400 hover:text-secondary-600'}`}
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={isActive ? 2 : 1.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                    <span className="text-[10px] font-medium">
                      {item.label === 'Dashboard' ? 'Home' : item.label}
                    </span>
                  </NavLink>
                );
              })}
            </div>
          </nav>
        </div>
      </SearchContext.Provider>
    </ToastContext.Provider>
  );
};

export default Layout;