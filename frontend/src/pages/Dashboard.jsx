import { motion } from 'framer-motion';
import { Share2, MapPin, User, LogOut, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuth, selectCurrentUser } from '../store/authSlice';
import api from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      dispatch(clearAuth());
    } catch (error) {
      console.error('Logout failed');
    }
  };

  const cards = [
    {
      title: 'Share Location',
      description: 'Start a live session and share a code with others.',
      icon: <Share2 className="text-primary" size={32} />,
      onClick: () => navigate('/share'),
      color: 'bg-primary/10',
    },
    {
      title: 'Track a Session',
      description: 'Enter a 6-digit code to view someone else live.',
      icon: <MapPin className="text-secondary" size={32} />,
      onClick: () => navigate('/track'),
      color: 'bg-secondary/10',
    },
  ];

  return (
    <div className="min-h-screen bg-dark pb-20 pt-8 px-4 max-w-2xl mx-auto">
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <img src={user?.picture} alt={user?.name} className="w-12 h-12 rounded-full border-2 border-primary" />
          <div>
            <h2 className="text-xl font-bold font-sans">Hey, {user?.name.split(' ')[0]}!</h2>
            <p className="text-dark-lightest text-sm">Welcome back</p>
          </div>
        </div>
        <button onClick={handleLogout} className="p-2 hover:bg-red-500/10 rounded-full transition-colors group">
          <LogOut size={24} className="text-dark-lightest group-hover:text-red-500" />
        </button>
      </header>

      <div className="space-y-6">
        {cards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={card.onClick}
            className="glass-morphism p-6 rounded-2xl flex items-center gap-6 cursor-pointer hover:scale-[1.02] transition-transform active:scale-95"
          >
            <div className={`p-4 ${card.color} rounded-xl`}>
              {card.icon}
            </div>
            <div>
              <h3 className="text-lg font-bold">{card.title}</h3>
              <p className="text-dark-lightest text-sm">{card.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 p-4 max-w-2xl mx-auto">
        <div className="glass-morphism h-16 rounded-2xl flex items-center justify-around px-4">
          <button className="flex flex-col items-center text-primary">
            <LayoutDashboard size={24} />
            <span className="text-[10px] uppercase font-bold mt-1">Home</span>
          </button>
          <button onClick={() => navigate('/profile')} className="flex flex-col items-center text-dark-lightest hover:text-white transition-colors">
            <User size={24} />
            <span className="text-[10px] uppercase font-bold mt-1">Profile</span>
          </button>
          {user?.role === 'admin' && (
             <button onClick={() => navigate('/admin')} className="flex flex-col items-center text-dark-lightest hover:text-white transition-colors">
              <ShieldCheck size={24} />
              <span className="text-[10px] uppercase font-bold mt-1">Admin</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Dashboard;
