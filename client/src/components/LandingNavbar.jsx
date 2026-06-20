import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function LandingNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full h-[64px] bg-surface/80 backdrop-blur-md border-b border-dim z-50">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan to-indigo flex items-center justify-center">
            <span className="text-white text-xs font-bold">g</span>
          </div>
          <span className="font-display font-bold text-[20px]">
            <span className="text-lead-cyan">geo</span>
            <span className="text-white">Lead</span>
            <span className="text-gradient"> AI</span>
          </span>
        </Link>

        {/* Center: Nav links (Desktop) */}
        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => scrollToSection('features')} className="text-[14px] text-t2 hover:text-t1 transition-colors">Features</button>
          <button onClick={() => scrollToSection('how-it-works')} className="text-[14px] text-t2 hover:text-t1 transition-colors">How It Works</button>
          <button onClick={() => scrollToSection('zones')} className="text-[14px] text-t2 hover:text-t1 transition-colors">Zones</button>
        </div>

        {/* Right: Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/login" className="px-4 py-2 text-[14px] text-t2 border border-dim hover:border-cyan transition-colors rounded-lg">
            Login
          </Link>
          <Link to="/register" className="px-4 py-2 text-[14px] font-medium bg-gradient-btn hover:opacity-90 transition-opacity rounded-lg">
            Get Started
          </Link>
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden text-t2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-[64px] left-0 w-full bg-surface border-b border-dim p-4 flex flex-col gap-4 shadow-xl">
          <button onClick={() => scrollToSection('features')} className="text-left text-t2 py-2">Features</button>
          <button onClick={() => scrollToSection('how-it-works')} className="text-left text-t2 py-2">How It Works</button>
          <button onClick={() => scrollToSection('zones')} className="text-left text-t2 py-2">Zones</button>
          <div className="flex flex-col gap-2 pt-4 border-t border-dim">
            <Link to="/login" className="text-center px-4 py-2 text-[14px] text-t2 border border-dim rounded-lg">Login</Link>
            <Link to="/register" className="text-center px-4 py-2 text-[14px] bg-gradient-btn rounded-lg">Get Started</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
