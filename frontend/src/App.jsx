import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthGuard from './guards/AuthGuard';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Share from './pages/Share';
import Track from './pages/Track';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<AuthGuard />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/share" element={<Share />} />
          <Route path="/track" element={<Track />} />
          <Route path="/track/:code" element={<Track />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
