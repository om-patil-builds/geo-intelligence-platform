import { useState, Fragment } from 'react';
import { Star, Globe, Phone, Clock, Trash2, ChevronUp, ExternalLink, Sparkles, Loader2 } from 'lucide-react';
import { LEAD_TIER_COLORS } from '../utils/constants';
import placeService from '../services/placeService';


const ResultsTable = ({ places = [], onDelete, deletingId }) => {
  const [expandedHours, setExpandedHours] = useState({});
  const [localSummaries, setLocalSummaries] = useState({});
  const [summarizingId, setSummarizingId] = useState(null);

  const toggleHours = (id) => {
    setExpandedHours(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getTierBadge = (tier) => {
    const baseStyle = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border';
    const colorStyle = LEAD_TIER_COLORS[tier] || LEAD_TIER_COLORS.low;
    return <span className={`${baseStyle} ${colorStyle}`}>{tier}</span>;
  };

  const handleGenerateSummary = async (placeId) => {
    if (summarizingId) return;
    setSummarizingId(placeId);
    try {
      const res = await placeService.generateSummary(placeId);
      if (res.success) {
        setLocalSummaries(prev => ({
          ...prev,
          [placeId]: res.summary
        }));
      } else {
        alert(res.message || 'Failed to generate summary');
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Error generating AI summary');
    } finally {
      setSummarizingId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden my-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              <th className="py-4 px-6">Place Info</th>
              <th className="py-4 px-6">Category</th>
              <th className="py-4 px-6">Contact info</th>
              <th className="py-4 px-6">Rating</th>
              <th className="py-4 px-6">Status / Lead</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
            {places.map((place) => {
              const hasHours = place.openingHours && place.openingHours.length > 0;
              const isHoursExpanded = expandedHours[place._id];
              const summaryText = localSummaries[place._id] || place.aiSummary;

              return (
                <Fragment key={place._id}>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    {/* Place Name and Address */}
                    <td className="py-4 px-6 max-w-xs">
                      <div className="font-bold text-slate-800 dark:text-slate-100 leading-snug">
                        {place.name}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate hover:text-clip" title={place.address}>
                        {place.address || 'N/A'}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-6">
                      <span className="inline-block px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700/60">
                        {place.category || 'Local Business'}
                      </span>
                    </td>

                    {/* Phone & Website */}
                    <td className="py-4 px-6 space-y-1">
                      {place.phone ? (
                        <a
                           href={`tel:${place.phone}`}
                           className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{place.phone}</span>
                        </a>
                      ) : (
                        <div className="text-xs text-slate-400 dark:text-slate-600 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" />
                          <span>No phone</span>
                        </div>
                      )}

                      {place.website ? (
                        <a
                          href={place.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 hover:underline"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[120px]">{place.website}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      ) : (
                        <div className="text-xs text-slate-400 dark:text-slate-600 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5" />
                          <span>No website</span>
                        </div>
                      )}
                    </td>

                    {/* Rating & Review Count */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {place.rating !== null ? place.rating.toFixed(1) : '0.0'}
                        </span>
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {place.reviewCount || 0} reviews
                      </div>
                    </td>

                    {/* Lead Score / Tier */}
                    <td className="py-4 px-6 space-y-1">
                      <div className="flex items-center gap-1.5">
                        {getTierBadge(place.leadTier)}
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          ({place.leadScore || 0} pts)
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                      {hasHours && (
                        <button
                          onClick={() => toggleHours(place._id)}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl transition inline-flex items-center justify-center cursor-pointer"
                          title="View opening hours"
                        >
                          {isHoursExpanded ? <ChevronUp className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleGenerateSummary(place._id)}
                        disabled={summarizingId === place._id}
                        className="p-2 hover:bg-violet-50 dark:hover:bg-violet-950/20 text-violet-500 hover:text-violet-750 dark:hover:text-violet-400 rounded-xl transition inline-flex items-center justify-center disabled:opacity-50 cursor-pointer"
                        title="Generate AI Summary"
                      >
                        {summarizingId === place._id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-violet-600 dark:text-violet-400" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        )}
                      </button>

                      <button
                        onClick={() => onDelete(place._id)}
                        disabled={deletingId === place._id}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition inline-flex items-center justify-center disabled:opacity-50 cursor-pointer"
                        title="Delete place"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>

                  {/* Expanded opening hours rows */}
                  {hasHours && isHoursExpanded && (
                    <tr className="bg-slate-50/40 dark:bg-slate-800/10">
                      <td colSpan="6" className="py-3 px-6 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex flex-col gap-1.5 py-1">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Opening Hours Schedule
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                            {place.openingHours.map((hour, idx) => (
                              <div 
                                key={idx} 
                                className="text-xs px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700/30"
                              >
                                {hour}
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Expanded AI Summary row */}
                  {summaryText && (
                    <tr className="bg-violet-50/10 dark:bg-violet-950/5">
                      <td colSpan="6" className="py-4 px-6 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex flex-col gap-1.5 py-1">
                          <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-violet-500 animate-pulse animate-pulse-slow" />
                            AI Intelligence Summary
                          </span>
                          <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-violet-50/30 dark:bg-violet-950/10 p-3.5 rounded-xl border border-violet-100/50 dark:border-violet-900/30 mt-1 max-w-4xl">
                            {summaryText}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsTable;
