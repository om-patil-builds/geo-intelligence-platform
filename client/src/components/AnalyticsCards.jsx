import { MapPin, Star, ShieldAlert } from 'lucide-react';
import { formatRating } from '../utils/helpers';


const AnalyticsCards = ({ total = 0, averageRating = 0, duplicatesRemoved = 0 }) => {
  const stats = [
    {
      id: 'total-places',
      label: 'Total Places Found',
      value: total,
      icon: MapPin,
      colorClass: 'from-violet-500 to-indigo-500 shadow-violet-500/10 text-violet-600 dark:text-violet-400',
      bgClass: 'bg-violet-50 dark:bg-violet-950/20'
    },
    {
      id: 'avg-rating',
      label: 'Average Rating',
      value: formatRating(averageRating),
      icon: Star,
      colorClass: 'from-amber-500 to-orange-500 shadow-amber-500/10 text-amber-600 dark:text-amber-400',
      bgClass: 'bg-amber-50 dark:bg-amber-950/20'
    },
    {
      id: 'duplicates-removed',
      label: 'Duplicates Removed',
      value: duplicatesRemoved,
      icon: ShieldAlert,
      colorClass: 'from-emerald-500 to-teal-500 shadow-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 my-6">
      {stats.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <div 
            key={stat.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition duration-300"
          >
            <div className={`p-4 rounded-xl ${stat.bgClass} ${stat.colorClass} shrink-0`}>
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {stat.label}
              </p>
              <h4 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                {stat.value}
              </h4>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AnalyticsCards;
