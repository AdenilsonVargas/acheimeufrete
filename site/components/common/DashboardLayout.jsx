import React from 'react';
import TopBar from './TopBar';
import Sidebar from './Sidebar';

export default function DashboardLayout({ children }) {
  return (
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen">
      {/* TopBar */}
      <TopBar />

      {/* Main Content with Sidebar */}
      <div className="flex pt-20">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 ml-64 transition-all duration-300">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 -left-64 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -right-64 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
    </div>
  );
}
