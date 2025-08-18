import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useSidebar } from '@/store/useAppStore';

const Layout: React.FC = () => {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header />
      
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <main 
          className={`flex-1 transition-all duration-300 ease-in-out ${
            collapsed ? 'ml-16' : 'ml-64'
          } pt-16`}
        >
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;