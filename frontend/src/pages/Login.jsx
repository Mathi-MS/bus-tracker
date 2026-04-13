import { GoogleLogin } from '@react-oauth/google';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import { setAuth, selectIsAuthenticated } from '../store/authSlice';
import api from '../services/api';
import { Bus, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const from = location.state?.from?.pathname || "/";

  const handleSuccess = async (credentialResponse) => {
    try {
      const res = await api.post('/auth/google', { idToken: credentialResponse.credential });
      dispatch(setAuth(res.data));
      
      const user = res.data.user;
      const target = (user.role === 'admin' && from === '/') ? '/admin' : from;
      navigate(target, { replace: true });
    } catch (error) {
      console.error('Login Error:', error);
    }
  };

  if (isAuthenticated) return <Navigate to={from} replace />;

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-dark">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 glass-morphism rounded-2xl text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-primary/20 rounded-full">
            <Bus size={48} className="text-primary" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-2">BusTrack</h1>
        <p className="text-dark-lightest mb-8">Secure, real-time location sharing made simple.</p>
        
        <div className="flex justify-center mb-8">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => console.log('Login Failed')}
            useOneTap
            theme="filled_blue"
            shape="pill"
          />
        </div>

        <div className="flex items-center justify-center gap-4 text-sm text-dark-lightest">
          <div className="flex items-center gap-1">
            <ShieldCheck size={16} />
            Secure
          </div>
          <span>•</span>
          <div>No tracking history saved</div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
