import React from 'react';
import { Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="mt-auto py-8 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} GeoIntel Platform. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
            <span>Built for Hackathon with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />
            <span>by student developers</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
