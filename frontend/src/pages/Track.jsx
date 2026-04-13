import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MapPin, Navigation, Info, Route } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/authSlice';
import Map from '../components/Map';
import api from '../services/api';
import io from 'socket.io-client';

const TrackPage = () => {
  const { code: urlCode } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const [session, setSession] = useState(null);
  const [codeInput, setCodeInput] = useState(urlCode || '');
  const [sharerLocation, setSharerLocation] = useState(null);
  const [myLocation, setMyLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [path, setPath] = useState([]);
  const [error, setError] = useState('');
  const [routeMode, setRouteMode] = useState('driving');
  const [showRoute, setShowRoute] = useState(false);

  const currentUser = useSelector(selectCurrentUser);

  const joinSession = async (code) => {
    try {
      const res = await api.get(`/tracking/${code.toUpperCase()}`);
      setSession(res.data);
      setIsTracking(true);
      setError('');
      socketRef.current.emit('join-session', {
        code: res.data.code,
        role: 'viewer',
        user: { socketId: socketRef.current.id, name: currentUser?.name, picture: currentUser?.picture },
      });
    } catch (err) {
      setError('Active session not found. Please check the code.');
      setIsTracking(false);
    }
  };

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      withCredentials: true,
    });
    const socket = socketRef.current;

    socket.on('location-broadcast', (location) => {
      setSharerLocation(location);
      setPath(prev => [...prev, location]);
    });

    socket.on('session-ended', () => {
      setIsTracking(false);
      setSession(null);
      setError('The sharing session has ended.');
    });

    socket.on('kicked', () => {
      setIsTracking(false);
      setSession(null);
      setError('You have been removed from this session.');
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (urlCode && socketRef.current) {
      joinSession(urlCode);
    }
  }, [urlCode]);

  useEffect(() => {
    // Get initial position immediately
    navigator.geolocation.getCurrentPosition((pos) => {
      setMyLocation([pos.coords.latitude, pos.coords.longitude]);
    });

    const watchId = navigator.geolocation.watchPosition((pos) => {
      setMyLocation([pos.coords.latitude, pos.coords.longitude]);
    }, (err) => console.error(err), {
      enableHighAccuracy: true,
      maximumAge: 0,
    });
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (codeInput.length === 6) {
      joinSession(codeInput);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-dark overflow-hidden">
      <header className="fixed top-0 left-0 right-0 p-4 z-50 flex items-center gap-4 bg-gradient-to-b from-dark/80 to-transparent">
        <button onClick={() => navigate('/')} className="p-2 glass-morphism rounded-full">
          <ChevronLeft size={24} />
        </button>
        {isTracking && (
          <div className="flex-1 flex items-center justify-between">
            <div className="glass-morphism px-4 py-2 rounded-full flex items-center gap-2">
              <img src={session?.sharer?.picture} className="w-6 h-6 rounded-full" alt="" />
              <span className="text-xs font-bold">{session?.sharer?.name}'s Live Trip</span>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 relative z-0">
        <Map
          position={myLocation}
          otherPosition={sharerLocation}
          path={path}
          routeMode={routeMode}
          showRoute={showRoute && !!myLocation && !!sharerLocation}
        />
      </main>

      {!isTracking && (
        <div className="absolute inset-0 z-50 bg-dark/80 backdrop-blur-md flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm glass-morphism p-8 rounded-3xl relative"
          >
            <button 
              onClick={() => navigate('/')} 
              className="absolute left-6 top-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-secondary/20 rounded-full">
                <Navigation size={40} className="text-secondary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">Track Location</h2>
            <p className="text-dark-lightest text-center text-sm mb-8">Enter the 6-digit code to start tracking.</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <input 
                type="text" 
                maxLength={6}
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                className="w-full bg-dark-lighter border-2 border-white/10 p-4 rounded-xl text-center text-2xl font-black tracking-[0.5em] focus:border-secondary transition-all outline-none"
              />
              {error && <p className="text-red-500 text-xs text-center">{error}</p>}
              <button 
                disabled={codeInput.length !== 6}
                className="w-full py-4 bg-secondary disabled:opacity-50 text-white font-bold rounded-xl transition-all active:scale-95"
              >
                Join Track
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {isTracking && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 p-6 z-50 rounded-t-3xl glass-morphism border-x-0 border-b-0"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-secondary/10 rounded-full">
              <MapPin className="text-secondary" size={24} />
            </div>
            <div>
              <p className="text-xs text-dark-lightest font-bold uppercase">Current Session</p>
              <h4 className="text-lg font-bold">{session?.code}</h4>
            </div>
          </div>

          {/* Route mode selector */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-dark-lightest font-bold uppercase flex items-center gap-1">
                <Route size={12} /> Route
              </span>
              <button
                onClick={() => setShowRoute(p => !p)}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${
                  showRoute ? 'bg-secondary text-white' : 'bg-white/10 text-dark-lightest'
                }`}
              >
                {showRoute ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex gap-2">
              {[
                { key: 'driving', label: '🚌 Bus/Car' },
                { key: 'cycling', label: '🚲 Bike' },
                { key: 'walking', label: '🚶 Walk' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { setRouteMode(key); setShowRoute(true); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${
                    routeMode === key && showRoute
                      ? 'bg-secondary text-white'
                      : 'bg-white/5 text-dark-lightest hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-dark-lightest">
            <Info size={14} />
            <span>Tracking is active as long as the sharer has the app open.</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TrackPage;
