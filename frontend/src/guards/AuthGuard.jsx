import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { selectAccessToken, setAuth, clearAuth } from '../store/authSlice';
import api from '../services/api';

const AuthGuard = () => {
  const token = useSelector(selectAccessToken);
  const location = useLocation();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(!token);

  useEffect(() => {
    const verifySession = async () => {
      if (token) {
        setLoading(false);
        return;
      }

      try {
        // Try to get a new access token using the refresh cookie
        const response = await api.post('/auth/refresh');
        const { accessToken, user } = response.data;
        dispatch(setAuth({ accessToken, user }));
      } catch (error) {
        dispatch(clearAuth());
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, [token, dispatch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return token ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace />;
};

export default AuthGuard;
