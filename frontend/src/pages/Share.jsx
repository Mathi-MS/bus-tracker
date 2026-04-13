import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Share, StopCircle, RefreshCw, Users, Copy, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Map from '../components/Map';
import api from '../services/api';
import io from 'socket.io-client';

const SharePage = () => {
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const [session, setSession] = useState(null);
  const [location, setLocation] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [viewers, setViewers] = useState([]);
  const [showViewers, setShowViewers] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      withCredentials: true,
    });
    const socket = socketRef.current;
    socket.on('viewer-count-update', (count) => setViewerCount(count));
    socket.on('viewers-update', (list) => setViewers(list));
    return () => socket.disconnect();
  }, []);

  const startSharing = async () => {
    try {
      const res = await api.post('/tracking/start');
      setSession(res.data);
      setIsSharing(true);
      socketRef.current.emit('join-session', { code: res.data.code, role: 'sharer' });
    } catch (error) {
      console.error('Failed to start sharing');
    }
  };

  const stopSharing = async () => {
    if (!session) return;
    try {
      await api.post('/tracking/stop', { code: session.code });
      socketRef.current.emit('stop-sharing', { code: session.code });
      setIsSharing(false);
      setSession(null);
      navigate('/');
    } catch (error) {
      console.error('Failed to stop sharing');
    }
  };

  const updateLocation = useCallback((pos) => {
    const newLocation = [pos.coords.latitude, pos.coords.longitude];
    setLocation(newLocation);
    if (isSharing && session) {
      socketRef.current.emit('location-update', { code: session.code, location: newLocation });
    }
  }, [isSharing, session]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(updateLocation);

    const watchId = navigator.geolocation.watchPosition(updateLocation, (err) => console.error(err), {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [updateLocation]);

  const kickViewer = (socketId) => {
    socketRef.current.emit('kick-viewer', { code: session.code, socketId });
  };

    const link = `${window.location.origin}/track/${session.code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-screen flex flex-col bg-dark overflow-hidden">
      <header className="fixed top-0 left-0 right-0 p-4 z-50 flex justify-between items-center bg-gradient-to-b from-dark/80 to-transparent">
        <button onClick={() => navigate('/')} className="p-2 glass-morphism rounded-full">
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-2 glass-morphism px-4 py-2 rounded-full text-sm font-bold cursor-pointer" onClick={() => setShowViewers(true)}>
          <Users size={16} className="text-primary" />
          {viewerCount} Viewers
        </div>
      </header>

      <main className="flex-1 relative z-0 mt-4">
        <Map position={location} />
      </main>

      <AnimatePresence>
        {showViewers && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setShowViewers(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="w-full max-w-md glass-morphism rounded-t-3xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Viewers ({viewerCount})</h3>
                <button onClick={() => setShowViewers(false)} className="p-1 hover:bg-white/10 rounded-full">
                  <X size={20} />
                </button>
              </div>
              {viewers.length === 0 ? (
                <p className="text-dark-lightest text-sm text-center py-4">No viewers yet</p>
              ) : (
                <ul className="space-y-3 max-h-64 overflow-y-auto">
                  {viewers.map((v) => (
                    <li key={v.socketId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {v.picture ? (
                          <img src={v.picture} className="w-9 h-9 rounded-full" alt={v.name} />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary/30 flex items-center justify-center text-sm font-bold">
                            {v.name?.[0] || '?'}
                          </div>
                        )}
                        <span className="text-sm font-semibold">{v.name || 'Anonymous'}</span>
                      </div>
                      <button
                        onClick={() => kickViewer(v.socketId)}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-full transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isSharing ? (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 p-6 z-50 bg-gradient-to-t from-dark to-dark/60 backdrop-blur-sm"
          >
            <button 
              onClick={startSharing}
              className="w-full py-4 bg-primary text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-primary-dark transition-all shadow-xl shadow-primary/20"
            >
              <Share size={20} />
              Start Live Sharing
            </button>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-0 left-0 right-0 p-6 z-50 rounded-t-3xl glass-morphism border-x-0 border-b-0"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-dark-lightest text-xs uppercase font-bold tracking-widest mb-1">Session Code</p>
                <div className="flex items-center gap-3">
                  <h3 className="text-3xl font-black text-white">{session?.code}</h3>
                  <button onClick={copyLink} className="p-1 hover:bg-white/10 rounded-md transition-colors">
                    {copied ? <Check size={18} className="text-secondary" /> : <Copy size={18} className="text-dark-lightest" />}
                  </button>
                </div>
              </div>
              <button onClick={stopSharing} className="flex flex-col items-center gap-1 text-red-500">
                <div className="p-3 bg-red-500/10 rounded-full">
                  <StopCircle size={24} />
                </div>
                <span className="text-[10px] font-bold uppercase">Stop</span>
              </button>
            </div>

            <div className="flex gap-4">
               <button className="flex-1 py-3 bg-dark-lighter border border-white/10 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-dark-lightest transition-colors">
                <RefreshCw size={18} />
                Refresh Code
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SharePage;
