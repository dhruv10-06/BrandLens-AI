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
    <div className="min-h-screen bg-[#FCFBF9] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Luxury ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-lavender-200/40 via-champagne-100/30 to-transparent blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-700 via-brand-600 to-lavender-500 mx-auto flex items-center justify-center text-white shadow-card mb-4 ring-1 ring-white/60">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold text-graphite-900 tracking-tight">
          BrandLens <span className="text-brand-600">AI</span>
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-graphite-500 font-medium">
          Enterprise Multimodal Brand Compliance &amp; Governance
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 relative z-10">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl shadow-card border border-[#EAE8E3]">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50/90 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 shadow-subtle">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Secure Demonstrator Access: Separate fixed-role accounts */}
          <div className="mb-6 p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE8E3]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-graphite-900 uppercase tracking-wider mb-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>CodeNexus India Evaluator Access</span>
            </div>
            <p className="text-[11px] text-graphite-600 mb-3.5 leading-relaxed">
              Authenticate into separate fixed-role demo accounts with pre-indexed brand guidelines and sample violation drafts. Roles are non-switchable once logged in.
            </p>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleDemoSignIn('creator')}
                disabled={isSubmitting}
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 rounded-xl transition-all shadow-sm hover:shadow-card disabled:opacity-60"
              >
                <div className="flex items-center gap-2 font-bold">
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
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold text-graphite-950 bg-champagne-300 hover:bg-champagne-200 rounded-xl transition-all shadow-sm hover:shadow-card disabled:opacity-60"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-graphite-800" />
                  <span>Demo Reviewer Account</span>
                </div>
                <span className="text-[10px] font-mono bg-champagne-400/60 px-2 py-0.5 rounded text-graphite-950 font-bold">
                  reviewer@brandlens.demo
                </span>
              </button>
            </div>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#EAE8E3]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-graphite-400 font-bold text-[10px] tracking-wider font-mono">
                Or sign in with credentials
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-graphite-700 uppercase tracking-wide mb-1.5 font-mono text-[11px]">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#EAE8E3] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-[#FCFBF9] text-graphite-900 placeholder:text-graphite-400 transition-colors font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-graphite-700 uppercase tracking-wide mb-1.5 font-mono text-[11px]">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#EAE8E3] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-[#FCFBF9] text-graphite-900 placeholder:text-graphite-400 transition-colors font-medium"
              />
            </div>

            <Button
              type="submit"
              variant="secondary"
              size="lg"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="w-full mt-2"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-graphite-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-brand-600 hover:text-brand-700 transition-colors">
              Create an organisation workspace
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};