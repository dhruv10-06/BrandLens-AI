import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { Button } from '../components/common/Button.tsx';
import { ShieldCheck, ArrowRight, UserCheck, Sparkles, AlertCircle, Lock } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoSignIn = async (role: 'creator' | 'reviewer') => {
    setError(null);
    setIsSubmitting(true);
    const demoEmail = role === 'creator' ? 'creator@brandlens.demo' : 'reviewer@brandlens.demo';
    const demoPassword = role === 'creator' ? 'DemoCreator123!' : 'DemoReviewer123!';
    try {
      await login(demoEmail, demoPassword);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Demo authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle ambient lighting effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-brand-600/15 via-indigo-600/5 to-transparent blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-400 mx-auto flex items-center justify-center text-white shadow-lg shadow-brand-500/25 mb-4 ring-1 ring-white/20">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          BrandLens <span className="text-brand-400">AI</span>
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-400 font-medium">
          Enterprise Multimodal Brand Compliance & Governance
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 relative z-10">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl shadow-elevated border border-slate-200/80">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Secure Demonstrator Access: Separate fixed-role accounts */}
          <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200/90">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>CodeNexus India Evaluator Access</span>
            </div>
            <p className="text-[11px] text-slate-600 mb-3.5 leading-relaxed">
              Authenticate into separate fixed-role demo accounts with pre-indexed brand guidelines and sample violation drafts. Roles are non-switchable once logged in.
            </p>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleDemoSignIn('creator')}
                disabled={isSubmitting}
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-all shadow-subtle hover:shadow-card disabled:opacity-60"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  <span>Demo Creator Account</span>
                </div>
                <span className="text-[10px] font-mono bg-brand-700/80 px-2 py-0.5 rounded text-white/95">
                  creator@brandlens.demo
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSignIn('reviewer')}
                disabled={isSubmitting}
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-subtle hover:shadow-card disabled:opacity-60"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>Demo Reviewer Account</span>
                </div>
                <span className="text-[10px] font-mono bg-amber-500/50 px-2 py-0.5 rounded text-slate-950 font-semibold">
                  reviewer@brandlens.demo
                </span>
              </button>
            </div>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2.5 text-slate-400 font-semibold text-[10px] tracking-wider">
                Or sign in with credentials
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="w-full !bg-slate-900 hover:!bg-slate-800 text-white mt-2"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-500 transition-colors">
              Create an organisation workspace
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
