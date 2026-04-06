import React from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import ErrorBoundary from './ErrorBoundary';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-black font-arabic" dir="rtl">
      {/* Sidebar - Hidden on mobile, visible on lg (1024px) and above */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main Content - Adjust margin-right to match Sidebar width (64 / 16rem) */}
      <main className="flex-1 lg:mr-64 p-4 lg:p-8 pb-32 lg:pb-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </main>

      {/* Bottom Nav - Visible only on mobile/tablet, hidden on lg and above */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
};

export default Layout;
