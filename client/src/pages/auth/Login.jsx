import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Building2, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
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
    <div className="min-h-screen bg-[#182437] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1E2B40] rounded-3xl shadow-2xl border border-[#334155] p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#6D28D9] to-[#8B5CF6] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[#6D28D9]/30">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-[#F8FAFC] tracking-tight">KODBRAND</h1>
          <p className="text-xs font-bold text-[#A78BFA] tracking-widest uppercase mt-1">Real Estate CRM & ERP</p>
          <p className="text-xs text-[#94A3B8] mt-2">Sign in to access leads, properties, and sales pipeline</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@kodbrand.com"
                className="w-full pl-10 pr-4 py-2.5 bg-[#243249] border border-[#334155] rounded-xl text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#6D28D9] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-[#243249] border border-[#334155] rounded-xl text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#6D28D9] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              isLoading={loading}
              className="w-full py-3 text-sm font-bold shadow-lg shadow-[#6D28D9]/25"
            >
              Sign In to Command Center <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-[#334155] flex items-center justify-between text-xs text-[#94A3B8]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#84CC16]" />
            <span>Role-Based Access Protected</span>
          </div>
          <span className="font-semibold text-[#64748B]">v1.0.0</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
