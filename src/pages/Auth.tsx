import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { User, Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login: saveAuth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (isLogin) {
        saveAuth(data.token, data.user);
        navigate('/');
      } else {
        setIsLogin(true);
        setError('Account created! Please log in.');
        setUsername('');
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-bg-panel rounded-2xl shadow-2xl p-8 border border-white/10"
      >
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-brand rounded-lg flex items-center justify-center text-white font-bold text-2xl italic mx-auto mb-4 shadow-lg shadow-brand/20">
            Σ
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isLogin ? 'Access Engine' : 'Join the Lab'}
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            {isLogin ? 'Log in to continue your research' : 'Create an account to start generating'}
          </p>
        </div>

        {error && (
          <div className={`p-4 rounded-lg mb-6 text-xs font-medium border ${
            error.includes('created') 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Username</label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-11 pr-4 outline-none focus:border-brand transition-all text-slate-200 text-sm"
                placeholder="euler_math"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-11 pr-4 outline-none focus:border-brand transition-all text-slate-200 text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-3 rounded-lg shadow-lg shadow-brand/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 mt-4 active:scale-[0.98]"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                {isLogin ? 'LOG IN' : 'CREATE ACCOUNT'}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-brand font-semibold hover:text-white transition-colors text-sm"
          >
            {isLogin ? "Request Invitation? Sign up" : "Existing researcher? Log in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
