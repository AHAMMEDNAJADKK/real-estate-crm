import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Building, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import Button from '../../components/common/Button';

export const Login = () => {
  const [email, setEmail] = useState('admin@kodbrand.com');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Authentication successful! Welcome to KODBRAND CRM.');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0f16] via-[#121924] to-[#1e1438] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#442d82] to-[#b7d333] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-900/30">
            <Building className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">KODBRAND ERP</h1>
          <p className="text-sm font-semibold text-[#442d82] mt-1">Real Estate CRM & Sales Management</p>
          <p className="text-xs text-slate-500 mt-2">Sign in to access leads, inventory, and sales pipeline</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@kodbrand.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#442d82] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#442d82] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              isLoading={loading}
              className="w-full py-3 text-sm font-bold shadow-md shadow-purple-900/20"
            >
              Sign In to Command Center <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1 text-slate-600">
            <ShieldCheck className="w-4 h-4 text-[#b7d333]" />
            <span>Role-Based Access Protected</span>
          </div>
          <span className="font-semibold text-slate-700">v1.0.0</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
