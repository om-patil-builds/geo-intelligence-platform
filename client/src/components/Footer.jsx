import { Link } from 'react-router-dom';
import { Globe, Heart, Mail, Phone, MapPin} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-900 transition-colors duration-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-12 md:py-16">
        {/* Footer Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-12 mb-12">
          
          {/* Brand Info Column */}
          <div className="space-y-4 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-slate-800 dark:text-white">
              <div className="p-2 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-xl text-white shadow-md shadow-violet-500/20">
                <Globe className="w-5 h-5 animate-spin-slow" />
              </div>
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent font-extrabold tracking-tight">
                GeoIntel
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-slate-450 dark:text-slate-500 leading-relaxed max-w-sm">
              Discover companies, analyze opportunities, generate AI-powered insights, and identify high-value B2B prospects from any geographic boundary instantly.
            </p>
          </div>

          {/* Product Navigation */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Product Workspace
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link to="/dashboard" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                  Prospector Dashboard
                </Link>
              </li>
              <li>
                <Link to="/history" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                  Search History
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                  Subscription Plans
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                  Help & FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Contact & Support
            </h4>
            <ul className="space-y-3.5 text-xs sm:text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-violet-500 shrink-0" />
                <a href="mailto:support@geointel.com" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                  support@geointel.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-violet-500 shrink-0" />
                <span className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                  +1 (555) 234-5678
                </span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  100 Pine Street, Suite 1200<br />San Francisco, CA 94111
                </span>
              </li>
            </ul>
          </div>

          {/* Newsletter Input Simulation */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Get Lead Sourcing Tips
            </h4>
            <p className="text-xs text-slate-450 dark:text-slate-500 leading-relaxed">
              Subscribe to get monthly B2B sales development guides and geo-scouting techniques.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); alert('Subscribed simulated newsletter.'); }} className="space-y-2">
              <input
                type="email"
                required
                placeholder="sales@company.com"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl outline-none transition text-slate-850 dark:text-slate-100"
              />
              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-550 hover:to-indigo-550 text-white rounded-xl text-xs font-bold transition duration-200 cursor-pointer shadow shadow-violet-500/10"
              >
                Subscribe
              </button>
            </form>
          </div>

        </div>

        <hr className="border-slate-200 dark:border-slate-900/60 my-8" />

        {/* Footer Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-slate-450 dark:text-slate-500 text-center sm:text-left">
            &copy; {currentYear} GeoIntel Platform. All rights reserved. Built for modern sales pipelines.
          </p>
          <div className="flex items-center gap-1 text-slate-400 dark:text-slate-655 text-center">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />
            <span>for enterprise intelligence.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
