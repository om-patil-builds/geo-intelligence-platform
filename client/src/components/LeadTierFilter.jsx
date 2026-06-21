import { Filter } from 'lucide-react';
import { LEAD_TIER_COLORS } from '../utils/constants';

const LeadTierFilter = ({ selectedTier, onTierChange }) => {
  const tiers = ['all', 'high', 'medium', 'low'];

  const getTierLabel = (tier) => {
    if (tier === 'all') return 'All Leads';
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  const getTierBadgeStyle = (tier) => {
    if (tier === 'all') {
      return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/50 dark:text-slate-100 dark:border-slate-700';
    }
    return LEAD_TIER_COLORS[tier];
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-violet-500" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Filter Places
          </h4>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {tiers.map((tier) => (
            <button
              key={tier}
              onClick={() => onTierChange(tier)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                selectedTier === tier
                  ? `${getTierBadgeStyle(tier)} ring-2 ring-offset-2 dark:ring-offset-slate-900 ${
                      tier === 'all' ? 'ring-slate-400' : `ring-${tier}-500`
                    }`
                  : `${getTierBadgeStyle(tier)} opacity-60 hover:opacity-100`
              }`}
            >
              {getTierLabel(tier)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeadTierFilter;
