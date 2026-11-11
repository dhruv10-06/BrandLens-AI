import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { Button } from '../components/common/Button.tsx';
import { ShieldCheck, ArrowRight, AlertCircle, Building2, CheckCircle2, Award } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await register({
        name,
        email,
        password,
        orgName,
      });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] flex flex-col lg:flex-row text-espresso-900 selection:bg-brand-600 selection:text-cream-50">
      {/* Left Wing: Architectural Brand Ledger */}
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
                Organization Provisioning
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-6">
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.15] text-cream-50">
              Establish your enterprise brand governance chamber.
            </h1>
            <p className="text-sm text-forest-200 leading-relaxed max-w-md font-sans">
              Connect your brand guidelines, configure autonomous AI guardrails, and grant your creative team safe pre-flight publication confidence.
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-forest-700/50">
            <div className="flex items-center gap-2.5 text-xs text-forest-200">
              <CheckCircle2 className="w-4 h-4 text-brass-400" />
              <span>Multi-tenant isolation with isolated vector partitions</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-forest-200">
              <CheckCircle2 className="w-4 h-4 text-brass-400" />
              <span>Sub-3-second multimodal audit processing</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-forest-200">
              <CheckCircle2 className="w-4 h-4 text-brass-400" />
              <span>Audit-ready cryptographic compliance records</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-10 text-[11px] text-forest-400 font-serif italic border-t border-forest-800/80 mt-8">
          "Architecture is built with stone; great brands are built with unwavering consistency."
        </div>
      </div>

      {/* Right Wing: Registration Form */}
      <div className="lg:w-7/12 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-20 relative">
        <div className="max-w-md w-full mx-auto space-y-8">
          <div>
            <div className="text-[11px] font-bold text-brass-700 uppercase tracking-widest font-mono mb-2">
              Workspace Setup
            </div>
            <h2 className="font-serif text-3xl font-bold text-espresso-950 tracking-tight">
              Create Brand Organization
            </h2>
            <p className="text-xs text-espresso-700 mt-1">
              Initialize brand governance and AI compliance for your organization.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-lg bg-oxblood-50 border border-oxblood-200 text-xs text-oxblood-900 flex items-start gap-2.5 shadow-parchment-sm">
              <AlertCircle className="w-4 h-4 text-oxblood-700 flex-shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-espresso-800 uppercase tracking-widest mb-1.5 font-mono text-[11px]">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sarah Chen"
                className="atelier-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-espresso-800 uppercase tracking-widest mb-1.5 font-mono text-[11px]">
                Enterprise Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah@globalbrands.com"
                className="atelier-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-espresso-800 uppercase tracking-widest mb-1.5 font-mono text-[11px]">
                Organization / Brand Name
              </label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Aura Haute Couture"
                className="atelier-input"
              />
            </div>

            <div className="p-3.5 rounded-lg bg-[#F5EFE4] border border-[#DDD2BF] text-[11px] text-espresso-700 flex items-start gap-2.5">
              <Building2 className="w-4 h-4 text-forest-800 flex-shrink-0 mt-0.5" />
              <span>
                New workspaces register your initial user as a <strong className="text-espresso-950 font-bold">Content Creator</strong>. Reviewer roles are granted by organization administrators.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-espresso-800 uppercase tracking-widest mb-1.5 font-mono text-[11px]">
                Password (min 8 characters)
              </label>
              <input
                type="password"
                required
                minLength={8}
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
              {isSubmitting ? 'Provisioning Workspace...' : 'Initialize Brand Chamber'}
            </Button>
          </form>

          <p className="text-center text-xs text-espresso-700">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-forest-800 hover:text-forest-900 underline underline-offset-2">
              Sign in to your account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
