import { useNavigate } from 'react-router-dom';
import { Globe, Layers, FileSpreadsheet, ShieldCheck, ArrowRight } from 'lucide-react';
import SearchForm from '../components/SearchForm';
import { useAuth } from '../context/AuthContext';


const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleQuickSearch = (formData) => {
    // Redirect to dashboard with query parameters
    const params = new URLSearchParams();
    params.append('keyword', formData.keyword);
    params.append('location', formData.location);
    params.append('radius', formData.radius);

    if (isAuthenticated) {
      navigate(`/dashboard?${params.toString()}`);
    } else {
      // If not logged in, take them to login first, then we can redirect them.
      // For simplicity, we redirect them to login with a message.
      navigate(`/login?redirect=dashboard&${params.toString()}`);
    }
  };

  const features = [
    {
      title: 'Deduplication AI',
      desc: 'Automatically checks and filters out fuzzy duplicates and pre-existing places in real-time.',
      icon: ShieldCheck,
      color: 'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/20'
    },
    {
      title: 'Lead Tier Assessment',
      desc: 'Grades target business listings into cold, warm, or hot leads using customizable heuristic metrics.',
      icon: Layers,
      color: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/20'
    },
    {
      title: 'Multi-Format Export',
      desc: 'Seamlessly compile lists and download them as high-quality Excel spreadsheets or CSV files.',
      icon: FileSpreadsheet,
      color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20'
    }
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center text-center max-w-4xl mx-auto py-12 px-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/40 rounded-full text-xs font-semibold text-violet-600 dark:text-violet-400 mb-6">
          <Globe className="w-3.5 h-3.5 animate-spin-slow" />
          <span>Intelligent Location Prospecting Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-800 dark:text-white tracking-tight leading-tight">
          Unlock Smart{' '}
          <span className="bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Geo-Location
          </span>{' '}
          Data Processing
        </h1>

        <p className="mt-6 text-lg text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
          GeoIntel is a next-generation lead generation and location scouting system. Instantly crawl local business listings, remove duplicates, score lead tiers, and export records in seconds.
        </p>

        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          {isAuthenticated ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition flex items-center gap-2 cursor-pointer"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition flex items-center gap-2 cursor-pointer"
              >
                <span>Get Started (Free)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Create Account
              </button>
            </>
          )}
        </div>
      </section>

      {/* Quick Search Widget */}
      <section className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-6">
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">
            Quick Prospecting Tool
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Specify a target niche and geographical boundaries to evaluate listings immediately.
          </p>
        </div>
        <SearchForm onSearch={handleQuickSearch} loading={false} />
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-12 border-t border-slate-200 dark:border-slate-800/80">
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white text-center mb-12">
          Engineered for Sales & Operations Teams
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feat, index) => {
            const IconComponent = feat.icon;
            return (
              <div 
                key={index}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition duration-300"
              >
                <div className={`p-3 rounded-xl w-fit ${feat.color} mb-5`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">
                  {feat.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Home;
