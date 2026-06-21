import React, { useState } from 'react';

const INTERESTS_OPTIONS = [
  'Food & Dining',
  'Art & Culture',
  'Adventure & Sport',
  'Shopping',
  'Nature & Outdoors',
  'Nightlife',
  'Relaxation & Spa',
  'History'
];

export default function CreateTripForm({ onSubmit, loading }) {
  const [destination, setDestination] = useState('');
  const [durationDays, setDurationDays] = useState(3);
  const [budgetTier, setBudgetTier] = useState('Medium');
  const [selectedInterests, setSelectedInterests] = useState([]);

  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((item) => item !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!destination.trim() || !durationDays) return;
    onSubmit({
      destination,
      durationDays: parseInt(durationDays),
      budgetTier,
      interests: selectedInterests
    });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold font-display text-white mb-1">Create a New Trip</h2>
        <p className="text-xs text-slate-400">Specify your coordinates and travel profile</p>
      </div>

      <div className="space-y-4">
        {/* Destination */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Where to?
          </label>
          <input
            type="text"
            required
            disabled={loading}
            placeholder="e.g. Kyoto, Japan or Rome, Italy"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Trip Duration (Days)
          </label>
          <input
            type="number"
            min="1"
            max="14"
            required
            disabled={loading}
            value={durationDays}
            onChange={(e) => setDurationDays(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition"
          />
        </div>

        {/* Budget Tier */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Budget profile
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['Low', 'Medium', 'High'].map((tier) => (
              <button
                key={tier}
                type="button"
                disabled={loading}
                onClick={() => setBudgetTier(tier)}
                className={`py-2 px-3 text-xs font-medium rounded-xl border transition ${
                  budgetTier === tier
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Interests & Activities
          </label>
          <div className="flex flex-wrap gap-2">
            {INTERESTS_OPTIONS.map((interest) => {
              const isSelected = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  disabled={loading}
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition ${
                    isSelected
                      ? 'bg-blue-900/30 border-blue-500 text-blue-300'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-850 hover:text-slate-300'
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary flex justify-center items-center gap-2 text-sm py-3 font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Plotting coordinates with AI...
          </>
        ) : (
          'Generate Smart Itinerary'
        )}
      </button>
    </form>
  );
}
