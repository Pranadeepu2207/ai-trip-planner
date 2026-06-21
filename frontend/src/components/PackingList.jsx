import React from 'react';
import { Briefcase, CreditCard, ShieldCheck, Compass, CheckCircle2 } from 'lucide-react';

const CATEGORY_MAP = {
  Documents: { label: 'Documents & Vault', icon: CreditCard, color: 'text-amber-400 bg-amber-950/30 border-amber-900/40' },
  Clothing: { label: 'Climate Wear', icon: Briefcase, color: 'text-blue-400 bg-blue-950/30 border-blue-900/40' },
  Gear: { label: 'Activity Equipment', icon: Compass, color: 'text-purple-400 bg-purple-950/30 border-purple-900/40' },
  Other: { label: 'Essentials & Other', icon: ShieldCheck, color: 'text-slate-400 bg-slate-900/30 border-slate-800/40' }
};

export default function PackingList({ packingList, onToggleItem }) {
  if (!packingList || packingList.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6 text-center text-slate-500 text-xs">
        Generating weather-optimized checklist...
      </div>
    );
  }

  // Calculate packed statistics
  const total = packingList.length;
  const packedCount = packingList.filter((item) => item.isPacked).length;
  const percentage = total > 0 ? Math.round((packedCount / total) * 100) : 0;

  // Group items by category
  const grouped = packingList.reduce((acc, curr) => {
    const cat = curr.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(curr);
    return acc;
  }, {});

  return (
    <div className="glass-panel rounded-2xl p-6 space-y-6">
      <div>
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            ⛈️ AI Weather Packing Assistant
          </h3>
          {percentage === 100 && (
            <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold animate-pulse">
              <CheckCircle2 size={10} /> Fully Packed
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400">
          Climate and itinerary-optimized essentials list. Check items as you pack them.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-slate-400">Completion Status</span>
          <span className="text-indigo-400 font-mono">{percentage}% ({packedCount}/{total})</span>
        </div>
        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-900">
          <div
            className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="space-y-5">
        {Object.keys(CATEGORY_MAP).map((catKey) => {
          const items = grouped[catKey] || [];
          if (items.length === 0) return null;
          
          const config = CATEGORY_MAP[catKey];
          const Icon = config.icon;

          return (
            <div key={catKey} className="space-y-2.5">
              <h4 className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border w-fit flex items-center gap-1.5 ${config.color}`}>
                <Icon size={12} />
                {config.label}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {items.map((item) => (
                  <div
                    key={item._id || item.item}
                    onClick={() => onToggleItem(item._id)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition border ${
                      item.isPacked
                        ? 'bg-slate-950/30 border-slate-900 hover:border-slate-800 text-slate-500'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700/60 text-slate-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.isPacked}
                      onChange={() => {}} // Controlled by div click
                      className="h-4 w-4 rounded bg-slate-950 border-slate-800 accent-emerald-500 cursor-pointer pointer-events-none"
                    />
                    <span className={`text-xs font-medium select-none ${item.isPacked ? 'line-through' : ''}`}>
                      {item.item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
