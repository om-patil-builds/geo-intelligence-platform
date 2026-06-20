import React from 'react';
import AppNavbar from '../components/AppNavbar';

export default function Results() {
  return (
    <div className="min-h-screen flex flex-col bg-base">
      <AppNavbar />
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full mt-4">
        <h1 className="text-2xl font-bold text-white mb-6">Search Results</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* ResultsTable mock */}
          <div className="bg-card border border-dim rounded-2xl flex items-center justify-center border-dashed overflow-hidden">
            <span className="text-t3">&lt;ResultsTable Component /&gt;</span>
          </div>
          {/* MapView mock */}
          <div className="bg-card border border-dim rounded-2xl flex items-center justify-center border-dashed overflow-hidden">
             <span className="text-t3">&lt;MapView Component /&gt;</span>
          </div>
        </div>
      </div>
    </div>
  );
}
