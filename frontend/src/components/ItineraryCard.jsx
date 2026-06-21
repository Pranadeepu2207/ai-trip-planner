import React, { useState } from 'react';
import { Trash2, Sparkles, Plus, Clock, DollarSign, Printer, Share2, Check, Map, Plane, MapPin } from 'lucide-react';

export default function ItineraryCard({ trip, onAddActivity, onRemoveActivity, onRegenerateDay }) {
  const [newActivityText, setNewActivityText] = useState({});
  const [regenInstructions, setRegenInstructions] = useState({});
  const [showRegenInput, setShowRegenInput] = useState({});
  const [regenLoading, setRegenLoading] = useState({});
  const [copied, setCopied] = useState(false);

  const handleCopyShareable = () => {
    // Generate clean markdown content for the itinerary
    let md = `# Travel Itinerary: ${trip.destination}\n`;
    md += `* **Duration:** ${trip.durationDays} Days\n`;
    md += `* **Budget Tier:** ${trip.budgetTier}\n\n`;
    
    if (trip.estimatedBudget) {
      md += `## Estimated Budget\n`;
      md += `* **Lodging:** $${trip.estimatedBudget.accommodation}\n`;
      md += `* **Food:** $${trip.estimatedBudget.food}\n`;
      md += `* **Activities:** $${trip.estimatedBudget.activities}\n`;
      md += `* **Transport:** $${trip.estimatedBudget.transport}\n`;
      md += `* **Total:** $${trip.estimatedBudget.total}\n\n`;
    }

    if (trip.hotels && trip.hotels.length > 0) {
      md += `## Recommended Hotels\n`;
      trip.hotels.forEach(h => {
        md += `* **${h.name}** (${h.tier}) - $${h.estimatedCostNightUSD}/night, Rating: ${h.rating}\n`;
      });
      md += `\n`;
    }

    md += `## Day-by-Day Timeline\n`;
    trip.itinerary.forEach(day => {
      md += `### Day ${day.dayNumber}\n`;
      day.activities.forEach(act => {
        md += `* **[${act.timeOfDay}] ${act.title}**${act.estimatedCostUSD > 0 ? ` ($${act.estimatedCostUSD})` : ''}\n  ${act.description}\n`;
      });
      md += `\n`;
    });

    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const handleAddSubmit = (e, dayNum) => {
    e.preventDefault();
    const title = newActivityText[dayNum];
    if (!title || !title.trim()) return;

    onAddActivity(dayNum, title.trim());
    setNewActivityText({ ...newActivityText, [dayNum]: '' });
  };

  const handleRegenSubmit = async (dayNum) => {
    const text = regenInstructions[dayNum];
    if (!text || !text.trim()) return;

    setRegenLoading({ ...regenLoading, [dayNum]: true });
    await onRegenerateDay(dayNum, text.trim());
    setRegenLoading({ ...regenLoading, [dayNum]: false });
    
    // Clear & hide
    setRegenInstructions({ ...regenInstructions, [dayNum]: '' });
    setShowRegenInput({ ...showRegenInput, [dayNum]: false });
  };

  return (
    <div className="glass-panel rounded-2xl p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 flex-wrap">
            Day-by-Day Timeline: {trip.destination}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trip.destination)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-indigo-400 p-1 hover:bg-slate-800/60 rounded-md transition no-print flex items-center"
              title="Open Destination in Google Maps"
            >
              <Map size={16} />
            </a>
            <a
              href={`https://www.google.com/flights?q=flights+to+${encodeURIComponent(trip.destination)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-indigo-400 p-1 hover:bg-slate-800/60 rounded-md transition no-print flex items-center"
              title="Search Flights to Destination"
            >
              <Plane size={16} />
            </a>
          </h2>
          <p className="text-xs text-slate-405">
            {trip.durationDays} Days • {trip.budgetTier} Budget Profile
          </p>
        </div>

        {/* Share and Print Actions */}
        <div className="flex items-center gap-2.5 no-print w-full md:w-auto justify-end">
          <button
            onClick={() => window.print()}
            className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Export to PDF"
          >
            <Printer size={14} />
            <span>Export PDF</span>
          </button>

          <button
            onClick={handleCopyShareable}
            className="bg-indigo-900/30 hover:bg-indigo-950/40 text-indigo-400 hover:text-indigo-300 border border-indigo-900/40 hover:border-indigo-850 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Copy as Markdown"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
            <span>{copied ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      <div className="space-y-8 relative before:absolute before:top-2 before:bottom-2 before:left-[17px] before:w-0.5 before:bg-slate-800">
        {trip.itinerary.map((day) => (
          <div key={day.dayNumber} className="relative pl-10 group">
            {/* Timeline Marker */}
            <div className="absolute left-[9px] top-1.5 w-4.5 h-4.5 rounded-full border-4 border-slate-950 bg-indigo-500 shadow-md group-hover:scale-110 transition duration-300" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Day {day.dayNumber}
              </h3>
              
              {/* Day Options */}
              <button
                onClick={() => setShowRegenInput({ ...showRegenInput, [day.dayNumber]: !showRegenInput[day.dayNumber] })}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-950/40 px-2.5 py-1.5 rounded-lg border border-indigo-900/60 hover:bg-indigo-950/60 transition cursor-pointer"
              >
                <Sparkles size={12} />
                Regenerate Day {day.dayNumber}
              </button>
            </div>

            {/* Regeneration Prompt Input */}
            {showRegenInput[day.dayNumber] && (
              <div className="mb-4 bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                <p className="text-xs font-medium text-slate-300">How would you like to update Day {day.dayNumber}?</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    disabled={regenLoading[day.dayNumber]}
                    placeholder="e.g. Change to focus on sushi eating and museum tours..."
                    value={regenInstructions[day.dayNumber] || ''}
                    onChange={(e) => setRegenInstructions({ ...regenInstructions, [day.dayNumber]: e.target.value })}
                    className="flex-1 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 outline-none transition"
                  />
                  <button
                    disabled={regenLoading[day.dayNumber]}
                    onClick={() => handleRegenSubmit(day.dayNumber)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                  >
                    {regenLoading[day.dayNumber] ? 'Rewriting...' : 'Regen'}
                  </button>
                </div>
              </div>
            )}

            {/* Activities List */}
            <div className="space-y-3">
              {day.activities.map((act) => (
                <div
                  key={act._id || act.title}
                  className="bg-slate-900/50 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-4 transition-all duration-300 flex justify-between items-start gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-slate-200">{act.title}</span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(act.title + ' ' + trip.destination)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-500 hover:text-indigo-400 p-0.5 hover:bg-slate-800/60 rounded transition no-print flex items-center"
                        title={`Search "${act.title}" on Google Maps`}
                      >
                        <MapPin size={12} />
                      </a>
                      <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-800 text-slate-400 px-2 py-0.5 rounded flex items-center gap-1">
                        <Clock size={9} />
                        {act.timeOfDay}
                      </span>
                      {act.estimatedCostUSD > 0 && (
                        <span className="text-[10px] uppercase font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 px-2 py-0.5 rounded flex items-center gap-0.5">
                          <DollarSign size={9} />
                          {act.estimatedCostUSD}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{act.description}</p>
                  </div>

                  <button
                    onClick={() => onRemoveActivity(day.dayNumber, act._id)}
                    className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800/60 transition cursor-pointer"
                    title="Remove Activity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {day.activities.length === 0 && (
                <p className="text-xs text-slate-600 italic pl-1">No activities plotted. Add one below!</p>
              )}
            </div>

            {/* Add Activity Form */}
            <form onSubmit={(e) => handleAddSubmit(e, day.dayNumber)} className="mt-3 flex items-center gap-2 max-w-md">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Inject new activity item..."
                  value={newActivityText[day.dayNumber] || ''}
                  onChange={(e) => setNewActivityText({ ...newActivityText, [day.dayNumber]: e.target.value })}
                  className="w-full bg-slate-950/40 border border-slate-800 focus:border-indigo-500 rounded-lg text-xs pl-8 pr-3 py-2 text-slate-200 placeholder-slate-600 outline-none transition"
                />
                <Plus size={12} className="absolute left-2.5 top-2.5 text-slate-500" />
              </div>
              <button
                type="submit"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-lg px-3.5 py-2 text-xs font-semibold transition cursor-pointer"
              >
                Add
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
