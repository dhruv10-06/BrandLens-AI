import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { Button } from '../components/common/Button.tsx';
import { ShieldCheck, ArrowRight, AlertCircle, Building2 } from 'lucide-react';

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
    <div className="min-h-screen bg-[#FCFBF9] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Luxury ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-lavender-200/40 via-champagne-100/30 to-transparent blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-700 via-brand-600 to-lavender-500 mx-auto flex items-center justify-center text-white shadow-card mb-4 ring-1 ring-white/60">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold text-graphite-900 tracking-tight">
          Create BrandLens Workspace
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-graphite-500 font-medium">
          Set up brand governance and AI compliance for your organisation
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-graphite-700 uppercase tracking-wide mb-1.5 font-mono text-[11px]">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sarah Chen"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#EAE8E3] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-[#FCFBF9] text-graphite-900 placeholder:text-graphite-400 transition-colors font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-graphite-700 uppercase tracking-wide mb-1.5 font-mono text-[11px]">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah@company.com"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#EAE8E3] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-[#FCFBF9] text-graphite-900 placeholder:text-graphite-400 transition-colors font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-graphite-700 uppercase tracking-wide mb-1.5 font-mono text-[11px]">
                Organisation / Brand Name
              </label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Acme Corp"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#EAE8E3] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-[#FCFBF9] text-graphite-900 placeholder:text-graphite-400 transition-colors font-medium"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE8E3] text-[11px] text-graphite-600 flex items-start gap-2.5">
              <Building2 className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
              <span>
                New workspaces register your initial user as a <strong className="text-graphite-900 font-bold">Content Creator</strong>. Reviewer roles are granted by organisation administrators.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-graphite-700 uppercase tracking-wide mb-1.5 font-mono text-[11px]">
                Password (min 8 characters)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#EAE8E3] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-[#FCFBF9] text-graphite-900 placeholder:text-graphite-400 transition-colors font-medium"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="w-full mt-4"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {isSubmitting ? 'Creating Workspace...' : 'Register Workspace'}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-graphite-500">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700 transition-colors">
              Sign in to your account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};