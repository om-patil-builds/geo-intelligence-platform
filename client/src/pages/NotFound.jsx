import { useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';


const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="p-4 bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 rounded-3xl mb-6 animate-bounce">
        <Compass className="w-12 h-12" />
      </div>
      <h1 className="text-4xl sm:text-5xl font-black text-slate-800 dark:text-white tracking-tight">
        404 - Page Lost
      </h1>
      <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
        The geo-coordinates you searched for don't map to any page. Double-check your URL link or return back to safety.
      </p>

      <button
        onClick={() => navigate('/')}
        className="mt-8 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition flex items-center justify-center gap-2 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Home</span>
      </button>
    </div>
  );
};

export default NotFound;
