import React from 'react';
import AppNavbar from '../components/AppNavbar';

export default function History() {
  return (
    <div className="min-h-screen flex flex-col bg-base">
      <AppNavbar />
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full mt-4">
        <h1 className="text-2xl font-bold text-white mb-6">Search History</h1>
        <div className="bg-card border border-dim rounded-2xl p-8 flex items-center justify-center min-h-[300px] border-dashed">
          <span className="text-t3">&lt;HistoryTable Component /&gt;</span>
        </div>
      </div>
    </div>
  );
}
