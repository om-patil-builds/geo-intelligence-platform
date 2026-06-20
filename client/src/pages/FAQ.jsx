import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, HelpCircle, Mail, MessageSquare, Shield } from 'lucide-react';

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openAccordion, setOpenAccordion] = useState(null);

  const categories = [
    { id: 'all', name: 'All Questions' },
    { id: 'general', name: 'General' },
    { id: 'billing', name: 'Billing & Plans' },
    { id: 'data', name: 'Data & Accuracy' }
  ];

  const faqs = [
    {
      q: 'What is GeoIntel?',
      a: 'GeoIntel is a next-generation lead generation and location intelligence platform that helps businesses discover, evaluate, and export high-quality commercial leads. By combining real-time Google Places crawling, lead tier algorithms, and Gemini AI analysis, it delivers enriched target lists instantly.',
      category: 'general'
    },
    {
      q: 'How does lead discovery work?',
      a: 'Users enter a business niche (keyword) and a city (location) into the search dashboard. GeoIntel retrieves the corresponding business listings from the Google Maps API, filters out pre-existing duplicates under your account, assesses lead scores based on online presence indicators, and populates them on your dashboard.',
      category: 'general'
    },
    {
      q: 'How are AI summaries generated?',
      a: 'When you click "Generate AI Summary" on a lead, the platform uses Google\'s Gemini LLM. It parses the company\'s name, category, address, and website details to synthesize a brief B2B intelligence profile and sales pitch suggestion. If the Gemini API experiences rate limits, the system falls back to a highly detailed local summary.',
      category: 'data'
    },
    {
      q: 'What types of businesses can be discovered?',
      a: 'Any commercial establishment indexed on Google Maps. This includes manufacturing factories, suppliers, clinics, schools, corporate offices, hotels, cafes, retail stores, and services.',
      category: 'data'
    },
    {
      q: 'Is there a free plan available?',
      a: 'Yes, you can register a free account to test the system. The free tier gives you 5 searches per month with up to 50 business leads per search, and full access to CSV export downloads.',
      category: 'billing'
    },
    {
      q: 'How does lead scoring work?',
      a: 'Each business is graded up to 100 points based on digital markers: website availability (30 pts), phone listing (20 pts), physical address (15 pts), geotargeting coordinates (10 pts), Google ratings (15 pts), and review count (10 pts). Businesses are then prioritized into High (>=80), Medium (>=60), or Low (<60) priority tiers.',
      category: 'data'
    },
    {
      q: 'Can I export the lead data?',
      a: 'Yes. You can export any query list or entire lead database from the dashboard. GeoIntel compiles the data and triggers immediate downloads of formatted CSV files or Excel spreadsheets.',
      category: 'general'
    },
    {
      q: 'Is my data secure?',
      a: 'Yes. All search history queries, lead lists, and AI summary logs are private to your user account and secured behind standard JWT authentication protocols.',
      category: 'general'
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We accept all major credit cards including Visa, Mastercard, American Express, and Discover. Enterprise billing can be managed via bank transfers or custom invoices.',
      category: 'billing'
    },
    {
      q: 'Can I cancel my subscription at any time?',
      a: 'Yes. You can cancel your monthly or annual subscription at any time directly through your account dashboard. You will retain full access to your plan features until the end of your current billing cycle.',
      category: 'billing'
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.q.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          faq.a.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleAccordion = (index) => {
    setOpenAccordion(openAccordion === index ? null : index);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      {/* Title Header */}
      <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
        <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest bg-violet-100 dark:bg-violet-950/40 px-3 py-1.5 rounded-full">
          Support Center
        </span>
        <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Need help? Browse our categorized guides or search directly for answers about GeoIntel's lead sourcing tool.
        </p>

        {/* Search Bar */}
        <div className="pt-4 max-w-md mx-auto relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search questions or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl outline-none transition text-sm text-slate-850 dark:text-slate-100 shadow-sm"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveCategory(cat.id);
              setOpenAccordion(null);
            }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeCategory === cat.id
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-350 dark:hover:border-slate-700'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Accordions */}
      <div className="space-y-4 mb-20 min-h-[200px]">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, idx) => {
            const isOpen = openAccordion === idx;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm hover:border-slate-300 dark:hover:border-slate-700/80 transition"
              >
                <button
                  onClick={() => toggleAccordion(idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-sm sm:text-base text-slate-800 dark:text-white outline-none cursor-pointer"
                >
                  <span className="pr-4">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-violet-500' : ''}`} />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
            <HelpCircle className="w-8 h-8 text-slate-400 mx-auto animate-pulse" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-350">No questions found</h3>
            <p className="text-xs text-slate-400">Try checking a different category or search term.</p>
          </div>
        )}
      </div>

      {/* Grid Contact Support */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center space-y-3">
          <div className="p-3 bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 rounded-xl w-fit mx-auto">
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">Email Support</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Send us your queries and get responses from our B2B team within 24 hours.
          </p>
          <a
            href="mailto:support@geointel.com"
            className="block text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline pt-1"
          >
            support@geointel.com
          </a>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center space-y-3">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl w-fit mx-auto">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">Sales Outreach</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Interested in high-volume crawling or dedicated proxy integrations? Talk with sales.
          </p>
          <button className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline pt-1 bg-transparent border-none cursor-pointer">
            Schedule a Demo Call
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center space-y-3">
          <div className="p-3 bg-fuchsia-100 dark:bg-fuchsia-950/40 text-fuchsia-600 dark:text-fuchsia-400 rounded-xl w-fit mx-auto">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">Enterprise SLA</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            We offer 99.9% API uptime guarantees and custom endpoints for CRM auto-syncs.
          </p>
          <button className="text-xs font-bold text-fuchsia-600 dark:text-fuchsia-400 hover:underline pt-1 bg-transparent border-none cursor-pointer">
            Read Security Policy
          </button>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
