import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Building2, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import Button from '../../components/common/Button';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email || !password) {
      const msg = 'Please enter both email and password';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }
    setLoading(true);
    try {
      const loggedInUser = await login(email.trim(), password);
      toast.success('Authentication successful! Welcome to KODBRAND CRM.');
      if (loggedInUser?.role === 'superadmin' || loggedInUser?.role === 'super_admin') {
        navigate('/super-admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      const msg = err.message || 'Login failed. Please check credentials.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#182437] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#1E2B40] rounded-3xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-[#334155] p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#6D28D9] to-[#8B5CF6] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[#6D28D9]/30">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-[#F8FAFC] tracking-tight">KODBRAND</h1>
          <p className="text-xs font-bold text-[#6D28D9] dark:text-[#A78BFA] tracking-widest uppercase mt-1">Real Estate CRM & ERP</p>
          <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-2">Sign in to access leads, properties, and sales pipeline</p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-300 text-xs flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-[#94A3B8] uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 dark:text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Enter your email address"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#243249] border border-slate-200 dark:border-[#334155] rounded-xl text-sm text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#6D28D9] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-[#94A3B8] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 dark:text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#243249] border border-slate-200 dark:border-[#334155] rounded-xl text-sm text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#6D28D9] focus:border-transparent transition-all"
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

        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-[#334155] flex items-center justify-between text-xs text-slate-500 dark:text-[#94A3B8]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-[#84CC16]" />
            <span>Role-Based Access Protected</span>
          </div>
          <span className="font-semibold text-slate-400 dark:text-[#64748B]">v1.0.0</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
