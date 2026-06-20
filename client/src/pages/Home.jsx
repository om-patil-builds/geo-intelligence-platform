import React from 'react';
import AppNavbar from '../components/AppNavbar';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-base">
      <AppNavbar />
      <div className="flex-1 flex text-t1 mt-8 max-w-7xl mx-auto w-full px-6 gap-6">
        {/* Placeholder for Sidebar */}
        <div className="w-64 bg-card border border-dim rounded-2xl p-4 hidden md:block">
          <h2 className="text-white font-bold mb-4">Filters</h2>
          <div className="text-t2 text-sm">Dashboard sidebar mock</div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-card border border-dim rounded-2xl p-6">
            <h1 className="text-2xl font-bold text-white mb-4">Dashboard</h1>
            <p className="text-t2 mb-6">Welcome to geoLead AI. Use the form below to start searching.</p>
            {/* SearchForm mock */}
            <div className="bg-surface border border-dim p-6 rounded-xl flex items-center justify-center h-48 border-dashed">
              <span className="text-t3">&lt;SearchForm Component /&gt;</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
