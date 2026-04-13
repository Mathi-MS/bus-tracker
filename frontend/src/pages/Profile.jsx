import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, setUser } from '../store/authSlice';
import { ChevronLeft, User, Mail, Phone, Shield, Save, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useRef, useEffect } from 'react';

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const [name, setName] = useState(user?.name || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [picture, setPicture] = useState(user?.picture || '');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setMobile(user.mobile || '');
      setPicture(user.picture || '');
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1MB validation
    if (file.size > 1 * 1024 * 1024) {
      toast.error('Image size must be less than 1MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPicture(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.put('/auth/profile', { name, mobile, picture });
      dispatch(setUser(response.data.user));
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Update Error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark pb-8">
      <header className="p-4 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="p-2 glass-morphism rounded-full">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Profile Settings</h1>
      </header>

      <main className="p-4 max-w-md mx-auto">
        <div className="flex flex-col items-center mb-10">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
             <img src={picture} alt={user?.name} className="w-24 h-24 rounded-full border-4 border-primary/20 object-cover" />
             <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <Camera size={24} className="text-white" />
             </div>
             <div className="absolute bottom-0 right-0 bg-primary p-2 rounded-full border-2 border-dark">
               <User size={14} className="text-white" />
             </div>
             <input 
               type="file" 
               ref={fileInputRef} 
               onChange={handleImageChange} 
               accept="image/*" 
               className="hidden" 
             />
          </div>
          <h2 className="text-lg font-bold mt-4">{user?.name}</h2>
          <div className="flex items-center gap-1 text-dark-lightest text-xs uppercase font-bold tracking-widest mt-1">
            <Shield size={12} className="text-secondary" />
            {user?.role} Account
          </div>
        </div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <label className="text-xs font-bold text-dark-lightest uppercase tracking-widest mb-2 block">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-lightest" size={18} />
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field pl-12"
              />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <label className="text-xs font-bold text-dark-lightest uppercase tracking-widest mb-2 block">Email Address</label>
            <div className="relative opacity-60">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-lightest" size={18} />
              <input 
                type="email" 
                value={user?.email}
                disabled
                className="input-field pl-12 bg-dark cursor-not-allowed"
              />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <label className="text-xs font-bold text-dark-lightest uppercase tracking-widest mb-2 block">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-lightest" size={18} />
              <input 
                type="tel" 
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+1 234 567 890"
                className="input-field pl-12"
              />
            </div>
          </motion.div>

          <motion.button 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.4 }}
            onClick={handleSave}
            disabled={saving}
            className="w-full btn-primary mt-8 py-4 rounded-xl"
          >
            {saving ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div> : <><Save size={20} /> Save Changes</>}
          </motion.button>
        </div>
      </main>
    </div>
  );
};

export default Profile;
