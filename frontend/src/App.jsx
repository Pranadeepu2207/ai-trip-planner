import React, { useState, useEffect } from 'react';
import { api } from './utils/api';
import CreateTripForm from './components/CreateTripForm';
import ItineraryCard from './components/ItineraryCard';
import PackingList from './components/PackingList';
import { 
  Plane, LogOut, Plus, MapPin, 
  DollarSign, Mail, Lock, Sparkles, 
  Compass, Info, Star, ChevronRight
} from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [generatingTrip, setGeneratingTrip] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
  
  // Auth Form State
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Check auth token on startup
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setCurrentPage('dashboard');
      fetchTrips();
    }
  }, []);

  const fetchTrips = async () => {
    setLoadingTrips(true);
    try {
      const data = await api.get('/trips');
      setTrips(data);
      if (data.length > 0) {
        setSelectedTrip(data[0]);
      }
    } catch (err) {
      console.error('Failed to load trips:', err.message);
    } finally {
      setLoadingTrips(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const data = await api.post('/auth/register', { email: authEmail, password: authPassword });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setAuthEmail('');
      setAuthPassword('');
      setCurrentPage('dashboard');
      fetchTrips();
    } catch (err) {
      setAuthError(err.message || 'Registration failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const data = await api.post('/auth/login', { email: authEmail, password: authPassword });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setAuthEmail('');
      setAuthPassword('');
      setCurrentPage('dashboard');
      fetchTrips();
    } catch (err) {
      setAuthError(err.message || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setTrips([]);
    setSelectedTrip(null);
    setCurrentPage('landing');
  };

  const handleCreateTrip = async (tripPref) => {
    setGeneratingTrip(true);
    setDashboardError('');
    try {
      const newTrip = await api.post('/trips', tripPref);
      setTrips([newTrip, ...trips]);
      setSelectedTrip(newTrip);
    } catch (err) {
      setDashboardError(err.message || 'AI Generation failed');
    } finally {
      setGeneratingTrip(false);
    }
  };

  const handleAddActivity = async (dayNum, title) => {
    if (!selectedTrip) return;
    setDashboardError('');
    try {
      const updated = await api.post(`/trips/${selectedTrip._id}/days/${dayNum}/activities`, {
        title,
        description: 'Added manually by traveler',
        estimatedCostUSD: 0,
        timeOfDay: 'Afternoon'
      });
      setSelectedTrip(updated);
      setTrips(trips.map(t => t._id === updated._id ? updated : t));
    } catch (err) {
      console.error(err);
      setDashboardError('Failed to add activity: ' + err.message);
    }
  };

  const handleRemoveActivity = async (dayNum, activityId) => {
    if (!selectedTrip) return;
    setDashboardError('');
    try {
      const updated = await api.delete(`/trips/${selectedTrip._id}/days/${dayNum}/activities/${activityId}`);
      setSelectedTrip(updated);
      setTrips(trips.map(t => t._id === updated._id ? updated : t));
    } catch (err) {
      console.error(err);
      setDashboardError('Failed to delete activity: ' + err.message);
    }
  };

  const handleRegenerateDay = async (dayNum, instructions) => {
    if (!selectedTrip) return;
    setDashboardError('');
    try {
      const updated = await api.post(`/trips/${selectedTrip._id}/days/${dayNum}/regenerate`, {
        instructions
      });
      setSelectedTrip(updated);
      setTrips(trips.map(t => t._id === updated._id ? updated : t));
    } catch (err) {
      console.error(err);
      setDashboardError('Day regeneration failed. Please verify API key settings.');
    }
  };

  const handleTogglePacking = async (itemId) => {
    if (!selectedTrip) return;
    
    const updatedList = selectedTrip.packingList.map(item => {
      if (item._id === itemId) {
        return { ...item, isPacked: !item.isPacked };
      }
      return item;
    });

    try {
      const updated = await api.put(`/trips/${selectedTrip._id}`, {
        packingList: updatedList
      });
      setSelectedTrip(updated);
      setTrips(trips.map(t => t._id === updated._id ? updated : t));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* HEADER NAVBAR */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div 
            onClick={() => setCurrentPage(user ? 'dashboard' : 'landing')} 
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <Plane size={18} className="transform -rotate-45 group-hover:rotate-0 transition duration-300" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
              Trao AI
            </span>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3.5">
                <span className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full font-mono">
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="bg-slate-900 hover:bg-red-950/30 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-900/40 p-2 rounded-xl transition duration-300 flex items-center justify-center cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setCurrentPage('login'); setAuthError(''); }}
                  className="text-xs font-semibold px-4 py-2 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => { setCurrentPage('register'); setAuthError(''); }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition cursor-pointer shadow-md shadow-indigo-600/10"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* CORE PAGES PORTAL */}
      <main className="flex-1">
        
        {/* LANDING PAGE */}
        {currentPage === 'landing' && (
          <div className="space-y-24 pb-20">
            {/* HERO SECTION */}
            <div className="relative overflow-hidden pt-24 pb-16">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-blue-500/10 to-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
              <div className="max-w-4xl mx-auto text-center px-4 space-y-6 relative">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-950/40 border border-indigo-900/60 rounded-full text-indigo-400 text-xs font-semibold">
                  <Sparkles size={12} /> Next-Gen AI Travel Engine
                </div>
                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight font-display">
                  Craft Your Perfect Itinerary in <span className="text-gradient">Seconds</span>
                </h1>
                <p className="text-base md:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
                  Plan destination routes, estimate budget ledgers, and build weather-optimized packing lists automatically with generative AI.
                </p>
                <div className="pt-4 flex justify-center gap-4">
                  <button
                    onClick={() => setCurrentPage('register')}
                    className="btn-primary cursor-pointer text-sm"
                  >
                    Start Planning Free
                  </button>
                  <button
                    onClick={() => setCurrentPage('login')}
                    className="btn-secondary cursor-pointer text-sm"
                  >
                    Sign In Dashboard
                  </button>
                </div>
              </div>
            </div>

            {/* FEATURE CARDS GRID */}
            <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel p-6 rounded-2xl space-y-4 hover:border-indigo-500/30 transition-all duration-300">
                <div className="h-10 w-10 bg-blue-950/40 border border-blue-900/50 text-blue-400 rounded-xl flex items-center justify-center shadow-inner">
                  <Compass size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-200">AI Itinerary Generation</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Input coordinates and interests. The model builds optimized day-by-day itineraries matching typical local constraints.
                </p>
              </div>

              <div className="glass-panel p-6 rounded-2xl space-y-4 hover:border-indigo-500/30 transition-all duration-300">
                <div className="h-10 w-10 bg-indigo-950/40 border border-indigo-900/50 text-indigo-400 rounded-xl flex items-center justify-center shadow-inner">
                  <DollarSign size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-200">Cost & Lodging Ledger</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Receive realistic budget breakdowns for transport, accommodations, food, and activities.
                </p>
              </div>

              <div className="glass-panel p-6 rounded-2xl space-y-4 hover:border-indigo-500/30 transition-all duration-300">
                <div className="h-10 w-10 bg-purple-950/40 border border-purple-900/50 text-purple-400 rounded-xl flex items-center justify-center shadow-inner">
                  <Sparkles size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-200">Weather-Aware Pack Checklist</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Integrates local regional forecasts to auto-generate a smart checklist tailored for your planned days.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* AUTHENTICATION PAGES (LOGIN / REGISTER) */}
        {(currentPage === 'login' || currentPage === 'register') && (
          <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-gradient-to-tr from-indigo-500/10 to-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="w-full max-w-md glass-panel rounded-2xl p-8 space-y-6 relative">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  {currentPage === 'login' ? 'Sign In to Trao AI' : 'Create an Account'}
                </h2>
                <p className="text-xs text-slate-400">
                  {currentPage === 'login' ? 'Access your private encrypted travel vaults' : 'Begin compiling custom travel guides'}
                </p>
              </div>

              {authError && (
                <div className="bg-red-950/40 border border-red-900/50 text-red-400 text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-2">
                  <Info size={14} className="flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={currentPage === 'login' ? handleLogin : handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-700 outline-none transition"
                    />
                    <Mail size={14} className="absolute left-3.5 top-3.5 text-slate-600" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-700 outline-none transition"
                    />
                    <Lock size={14} className="absolute left-3.5 top-3.5 text-slate-600" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full btn-primary py-3 font-semibold text-sm cursor-pointer disabled:opacity-50"
                >
                  {authLoading ? 'Verifying vault credentials...' : currentPage === 'login' ? 'Sign In' : 'Register Account'}
                </button>
              </form>

              <div className="text-center">
                <button
                  onClick={() => {
                    setCurrentPage(currentPage === 'login' ? 'register' : 'login');
                    setAuthError('');
                    setAuthEmail('');
                    setAuthPassword('');
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  {currentPage === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECURE DASHBOARD */}
        {currentPage === 'dashboard' && (
          <div className="max-w-7xl mx-auto px-4 py-8">
            {dashboardError && (
              <div className="mb-6 bg-red-950/40 border border-red-900/50 text-red-400 text-xs px-4 py-3 rounded-xl flex items-center justify-between gap-3 animate-pulse">
                <div className="flex items-center gap-2">
                  <Info size={16} className="flex-shrink-0" />
                  <span>{dashboardError}</span>
                </div>
                <button 
                  onClick={() => setDashboardError('')} 
                  className="text-red-400 hover:text-red-300 font-bold px-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}
            {loadingTrips ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                <p className="text-xs text-slate-400 animate-pulse font-mono">Unlocking secure user vaults...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* SIDEBAR COL (TRIPS LIST & LEDGER) */}
                <div className="space-y-6">
                  {/* TRIPS LIST */}
                  <div className="glass-panel rounded-2xl p-5 space-y-4 no-print">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-slate-200">Active Itineraries</h3>
                      <button
                        onClick={() => setSelectedTrip(null)}
                        className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-indigo-400 p-1.5 rounded-lg flex items-center justify-center transition cursor-pointer"
                        title="Create New Trip"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-[250px] overflow-y-auto custom-scrollbar">
                      {trips.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-xs italic">
                          No saved itineraries. Initialize one to begin!
                        </div>
                      ) : (
                        trips.map((trip) => {
                          const active = selectedTrip && selectedTrip._id === trip._id;
                          return (
                            <div
                              key={trip._id}
                              onClick={() => setSelectedTrip(trip)}
                              className={`p-3.5 rounded-xl cursor-pointer transition border text-left ${
                                active
                                  ? 'bg-indigo-950/30 border-indigo-500/80 shadow-md shadow-indigo-600/5'
                                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-750'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 mb-1 text-slate-100 font-bold text-sm">
                                <MapPin size={12} className="text-indigo-400" />
                                {trip.destination}
                              </div>
                              <div className="text-[10px] text-slate-400 font-medium">
                                {trip.durationDays} Days • {trip.budgetTier} Budget Profile
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* FINANCIAL COST LEDGER */}
                  {selectedTrip && (
                    <div className="glass-panel rounded-2xl p-5 space-y-4 animate-fade-in">
                      <h3 className="font-bold text-slate-200">Financial Ledger</h3>
                      <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between p-2.5 bg-slate-900/40 border border-slate-850 rounded-lg">
                          <span className="text-slate-400">Lodging & Accommodations:</span>
                          <span className="font-semibold text-slate-200">${selectedTrip.estimatedBudget.accommodation}</span>
                        </div>
                        <div className="flex justify-between p-2.5 bg-slate-900/40 border border-slate-850 rounded-lg">
                          <span className="text-slate-400">Culinary & Dining:</span>
                          <span className="font-semibold text-slate-200">${selectedTrip.estimatedBudget.food}</span>
                        </div>
                        <div className="flex justify-between p-2.5 bg-slate-900/40 border border-slate-850 rounded-lg">
                          <span className="text-slate-400">Activities & Sightseeing:</span>
                          <span className="font-semibold text-slate-200">${selectedTrip.estimatedBudget.activities}</span>
                        </div>
                        <div className="flex justify-between p-2.5 bg-slate-900/40 border border-slate-850 rounded-lg">
                          <span className="text-slate-400">Transport & Commute:</span>
                          <span className="font-semibold text-slate-200">${selectedTrip.estimatedBudget.transport}</span>
                        </div>
                        <div className="border-t border-slate-800 pt-3 flex justify-between font-bold text-sm text-white px-1">
                          <span>Grand Budget Total:</span>
                          <span className="text-indigo-400">${selectedTrip.estimatedBudget.total}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* HOTEL RECOMMENDATIONS */}
                  {selectedTrip && selectedTrip.hotels && selectedTrip.hotels.length > 0 && (
                    <div className="glass-panel rounded-2xl p-5 space-y-3.5">
                      <h3 className="font-bold text-slate-200">Hotel Recommendations</h3>
                      <div className="space-y-2.5">
                        {selectedTrip.hotels.map((h, i) => (
                          <div key={i} className="p-3 bg-slate-900/40 border border-slate-850 rounded-lg text-xs space-y-1">
                            <div className="flex justify-between font-semibold text-slate-200">
                              <span>{h.name}</span>
                              <span className="text-indigo-400">${h.estimatedCostNightUSD}/n</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500">
                              <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[9px] uppercase font-mono">{h.tier} Friend</span>
                              <span className="flex items-center gap-0.5 text-amber-500 font-semibold"><Star size={10} fill="currentColor" /> {h.rating}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* BOARD VIEW PORTAL */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* GENERATOR OR BOARD VIEW */}
                  {generatingTrip ? (
                    <div className="glass-panel rounded-2xl p-16 flex flex-col items-center justify-center gap-4 text-center">
                      <div className="relative">
                        <div className="h-14 w-14 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                        <Compass className="absolute top-4 left-4 text-indigo-400 animate-pulse" size={22} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-200">Consulting travel models...</h4>
                        <p className="text-xs text-slate-400 max-w-sm">
                          Structuring itinerary slots, lodging grids, and local weather checklists for your coordinate target.
                        </p>
                      </div>
                    </div>
                  ) : !selectedTrip ? (
                    <CreateTripForm onSubmit={handleCreateTrip} loading={generatingTrip} />
                  ) : (
                    <>
                      {/* TIMELINE INTERACTIVE CARD */}
                      <ItineraryCard
                        trip={selectedTrip}
                        onAddActivity={handleAddActivity}
                        onRemoveActivity={handleRemoveActivity}
                        onRegenerateDay={handleRegenerateDay}
                      />

                      {/* WEATHER-AWARE CHECKS CHECKLIST */}
                      <PackingList
                        packingList={selectedTrip.packingList}
                        onToggleItem={handleTogglePacking}
                      />
                    </>
                  )}
                </div>

              </div>
            )}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-900/60 bg-slate-950 py-6 text-center text-xs text-slate-500 font-mono">
        &copy; 2026 Trao AI Travel Planner. All Rights Isolated.
      </footer>
    </div>
  );
}
