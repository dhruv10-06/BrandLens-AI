import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { Button } from '../components/common/Button.tsx';
import { ShieldCheck, ArrowRight, UserCheck, Sparkles, AlertCircle, Lock, Compass, Award } from 'lucide-react';

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
    <div className="min-h-screen bg-[#FAF7F0] flex flex-col lg:flex-row text-espresso-900 selection:bg-brand-600 selection:text-cream-50">
      {/* Left Wing: Editorial Heritage & Brand Manifesto */}
      <div className="lg:w-5/12 bg-[#1C3228] text-cream-50 p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-forest-800">
        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-forest-900 border border-brass-600/40 flex items-center justify-center text-cream-50 shadow-parchment">
              <ShieldCheck className="w-5 h-5 text-brass-400" />
            </div>
            <div>
              <span className="font-serif text-xl tracking-tight font-bold text-cream-50">
                BrandLens <span className="text-brass-400 italic font-normal">Atelier</span>
              </span>
              <p className="text-[10px] text-forest-300 uppercase tracking-widest font-mono">
                Brand Governance
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-900/80 border border-brass-500/30 text-brass-300 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-brass-400" />
              <span>CodeNexus India Round 3</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.15] text-cream-50">
              The sovereign checkpoint where world-class brands preserve absolute integrity.
            </h1>
            <p className="text-sm text-forest-200 leading-relaxed max-w-md font-sans">
              Autonomous multimodal intelligence safeguarding visual standards, messaging claims, and brand voice before content reaches the world.
            </p>
          </div>

          {/* Three Pillars */}
          <div className="space-y-4 pt-4 border-t border-forest-700/50">
            <div className="flex items-start gap-3">
              <Compass className="w-4 h-4 text-brass-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-xs font-bold text-cream-50 uppercase tracking-wider font-mono">
                  01 / Brand Knowledge Base
                </h4>
                <p className="text-xs text-forest-300 leading-relaxed">
                  Real-time semantic retrieval against vectorized guideline rules and verified brand facts.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Award className="w-4 h-4 text-brass-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-xs font-bold text-cream-50 uppercase tracking-wider font-mono">
                  02 / Human Review Gate
                </h4>
                <p className="text-xs text-forest-300 leading-relaxed">
                  Strict separation of duties ensuring creator content receives impartial reviewer sign-off.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-10 text-[11px] text-forest-400 font-serif italic border-t border-forest-800/80 mt-8">
          "Pristine brand equity is cultivated over decades, yet compromised in an instant."
        </div>
      </div>

      {/* Right Wing: Private Access Portal */}
      <div className="lg:w-7/12 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-20 relative">
        <div className="max-w-md w-full mx-auto space-y-8">
          <div>
            <div className="text-[11px] font-bold text-brass-700 uppercase tracking-widest font-mono mb-2">
              Authentication Portal
            </div>
            <h2 className="font-serif text-3xl font-bold text-espresso-950 tracking-tight">
              Sign In to Your Workspace
            </h2>
            <p className="text-xs text-espresso-700 mt-1">
              Enter your credentials or select a demo account below.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-lg bg-oxblood-50 border border-oxblood-200 text-xs text-oxblood-900 flex items-start gap-2.5 shadow-parchment-sm">
              <AlertCircle className="w-4 h-4 text-oxblood-700 flex-shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Secure Demonstrator Access: Separate fixed-role accounts */}
          <div className="p-5 rounded-xl bg-[#F5EFE4] border border-[#DDD2BF] shadow-parchment-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-espresso-900 uppercase tracking-wider font-mono">
                <Sparkles className="w-3.5 h-3.5 text-brass-700" />
                <span>Quick Access Demo Accounts</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-brass-800 bg-brass-100 px-2 py-0.5 rounded border border-brass-300 font-mono">
                Fixed Role
              </span>
            </div>
            <p className="text-[11px] text-espresso-700 leading-relaxed">
              Instantly authenticate into dedicated evaluator roles with indexed brand guidelines and sample violation drafts:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleDemoSignIn('creator')}
                disabled={isSubmitting}
                className="flex flex-col items-start p-3 text-left bg-forest-800 hover:bg-forest-900 text-cream-50 rounded-lg transition-all shadow-parchment hover:shadow-forest-glow border border-forest-700 disabled:opacity-60"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                  <UserCheck className="w-3.5 h-3.5 text-brass-400" />
                  <span>Creator</span>
                </div>
                <span className="text-[10px] font-mono text-forest-200">
                  creator@brandlens.demo
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSignIn('reviewer')}
                disabled={isSubmitting}
                className="flex flex-col items-start p-3 text-left bg-[#EAE1D2] hover:bg-[#DDD2BF] text-espresso-950 rounded-lg transition-all shadow-parchment border border-[#CCA678] disabled:opacity-60"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                  <Lock className="w-3.5 h-3.5 text-brass-800" />
                  <span>Reviewer</span>
                </div>
                <span className="text-[10px] font-mono text-espresso-800 font-semibold">
                  reviewer@brandlens.demo
                </span>
              </button>
            </div>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#DDD2BF]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#FAF7F0] px-3 text-espresso-600 font-bold text-[10px] tracking-widest font-mono">
                Or authenticate with credentials
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-espresso-800 uppercase tracking-widest mb-1.5 font-mono text-[11px]">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="evaluator@company.com"
                className="atelier-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-espresso-800 uppercase tracking-widest mb-1.5 font-mono text-[11px]">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="atelier-input"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="w-full mt-3"
              iconRight={<ArrowRight className="w-4 h-4 text-brass-400" />}
            >
              {isSubmitting ? 'Verifying Credentials...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-xs text-espresso-700">
            Provision a new brand workspace?{' '}
            <Link to="/register" className="font-bold text-forest-800 hover:text-forest-900 underline underline-offset-2">
              Create an organization
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
