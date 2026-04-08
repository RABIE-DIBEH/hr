import React from 'react';
import Sidebar from './Sidebar';
import ErrorBoundary from './ErrorBoundary';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-black font-arabic" dir="rtl">
      <Sidebar />

      {/* Main Content - Adjust margin-right to match Sidebar width (64 / 16rem) */}
      <main className="flex-1 mr-64 p-4 lg:p-8 pb-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};

export default Layout;
