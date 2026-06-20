import { MapPinOff } from 'lucide-react';


const EmptyState = ({ 
  title = 'No places found', 
  description = 'Try adjusting your search criteria, keyword, or increasing the search radius.', 
  actionButton 
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm max-w-xl mx-auto my-8">
      <div className="p-4 bg-violet-50 dark:bg-violet-950/30 rounded-2xl mb-5 text-violet-600 dark:text-violet-400">
        <MapPinOff className="w-10 h-10" />
      </div>
      <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
        {title}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md leading-relaxed mb-6">
        {description}
      </p>
      {actionButton && (
        <div className="mt-2">
          {actionButton}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
