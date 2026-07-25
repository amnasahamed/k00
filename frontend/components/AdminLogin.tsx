import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../src/context/AuthContext';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const data = await response.json();
        // Use AuthContext login
        login(data.token, { role: 'admin' });
        navigate('/dashboard');
      } else {
        const data = await response.json();
        setError(data.error || 'Invalid password. Please try again.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/login-bg.mp4" type="video/mp4" />
      </video>

      <div className="w-full max-w-md animate-fade-in relative z-20">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg border border-white/20">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md">ADMIN PORTAL</h1>
          <p className="text-white/70 font-medium uppercase tracking-widest text-[10px] mt-2">Secure access for administrators</p>
        </div>

        <Card className="shadow-2xl bg-white/95 backdrop-blur-sm border-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Admin Key"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoFocus
              className="text-lg tracking-[0.5em] bg-secondary-50/50"
              error={error}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full py-4 text-sm font-black uppercase tracking-widest shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
              isLoading={loading}
              disabled={password.length === 0}
            >
              Unlock Dashboard
            </Button>
          </form>
        </Card>

        <p className="text-center text-[10px] font-bold uppercase tracking-widest text-white/50 mt-8">
          k0nach! &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;