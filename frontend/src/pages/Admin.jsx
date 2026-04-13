import { useState, useEffect } from 'react';
import { ChevronLeft, Users, Zap, ShieldCheck, Mail, Calendar, Share2, Eye, Clock, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';

const Admin = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalUsers: 0, activeSessions: 0, totalShares: 0, totalViews: 0 });
  const [users, setUsers] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'active' | 'history'

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, usersRes, activeRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/users'),
          api.get('/admin/active-sessions')
        ]);
        setStats(statsRes.data);
        setUsers(usersRes.data);
        setActiveSessions(activeRes.data);
      } catch (err) {
        console.error('Failed to fetch admin data');
        toast.error('Error loading admin data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <div className="min-h-screen bg-dark pb-8">
      <header className="fixed top-0 left-0 right-0 z-10 p-4 flex items-center gap-4 bg-dark/80 backdrop-blur-md border-b border-white/5">
        <button onClick={() => navigate('/')} className="p-2 glass-morphism rounded-full">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold font-sans">System Intelligence</h1>
      </header>

      <main className="p-6 pt-24 max-w-5xl mx-auto">
        {/* Real-time Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard icon={<Users className="text-primary" />} value={stats.totalUsers} label="Total Users" />
          <StatCard icon={<Zap className="text-secondary" />} value={stats.activeSessions} label="Active Links" />
          <StatCard icon={<Share2 className="text-blue-400" />} value={stats.totalShares} label="Total Shares" />
          <StatCard icon={<Eye className="text-emerald-400" />} value={stats.totalViews} label="Total Views" />
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl mb-8 w-fit">
          <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={16} />} label="All Users" />
          <TabButton active={activeTab === 'active'} onClick={() => setActiveTab('active')} icon={<Zap size={16} />} label="Live Sessions" />
        </div>

        {activeTab === 'users' && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={20} className="text-primary" />
              <h2 className="text-lg font-bold">User Intelligence</h2>
            </div>
            
            <div className="grid gap-4">
              {users.map((u, idx) => (
                <motion.div 
                  key={u._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass-morphism p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="flex items-center gap-4">
                    <img src={u.picture} alt={u.name} className="w-12 h-12 rounded-full border-2 border-white/10" />
                    <div>
                      <h4 className="font-bold text-base flex items-center gap-2">
                        {u.name}
                        {u.role === 'admin' && <span className="text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-black uppercase">Admin</span>}
                      </h4>
                      <p className="text-dark-lightest text-xs">{u.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:flex items-center gap-4 md:gap-10 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                    <HistoryItem icon={<Clock size={12} />} label="First Login" value={formatDate(u.firstLogin)} />
                    <HistoryItem icon={<Clock size={12} />} label="Last Login" value={formatDate(u.lastLogin)} />
                    <HistoryItem icon={<Share2 size={12} />} label="Shares" value={u.shareCount || 0} />
                    <HistoryItem icon={<Eye size={12} />} label="Views" value={u.viewCount || 0} />
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'active' && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={20} className="text-secondary animate-pulse" />
              <h2 className="text-lg font-bold">Active Sharing Now</h2>
            </div>

            {activeSessions.length === 0 ? (
               <div className="text-center py-20 bg-white/5 rounded-3xl text-dark-lightest">
                  <Zap size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No active sessions at the moment.</p>
               </div>
            ) : (
              <div className="grid gap-4">
                {activeSessions.map((s, idx) => (
                  <motion.div 
                    key={s._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-morphism p-5 rounded-3xl border-l-4 border-secondary flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <img src={s.sharer?.picture} alt={s.sharer?.name} className="w-10 h-10 rounded-full" />
                      <div>
                        <h4 className="font-bold text-sm">{s.sharer?.name} is sharing</h4>
                        <p className="text-dark-lightest text-xs uppercase font-black tracking-widest mt-1">CODE: {s.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-dark-lightest">Active Viewers</p>
                        <p className="text-xl font-black text-secondary">{s.viewerCount || 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-dark-lightest">Started At</p>
                        <p className="text-xs font-bold">{formatDate(s.startTime)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

const StatCard = ({ icon, value, label }) => (
  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-morphism p-6 rounded-[2.5rem] text-center">
    <div className="p-3 bg-white/5 rounded-full w-fit mx-auto mb-3">
      {icon}
    </div>
    <h3 className="text-3xl font-black">{value}</h3>
    <p className="text-dark-lightest text-[10px] uppercase font-black tracking-widest mt-1">{label}</p>
  </motion.div>
);

const TabButton = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-dark-lightest hover:text-white'}`}
  >
    {icon}
    {label}
  </button>
);

const HistoryItem = ({ icon, label, value }) => (
  <div>
    <p className="text-[9px] uppercase font-black text-dark-lightest flex items-center gap-1 mb-1">
      {icon}
      {label}
    </p>
    <p className="text-xs font-bold text-white/90">{value}</p>
  </div>
);

export default Admin;
