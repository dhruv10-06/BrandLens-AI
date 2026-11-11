import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button.tsx';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-5">
      <div className="w-16 h-16 rounded-3xl bg-champagne-100 border border-champagne-200 flex items-center justify-center text-champagne-800 shadow-subtle">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <div className="space-y-1.5">
        <div className="text-xs font-mono font-bold text-brand-600 uppercase tracking-wider">
          Error 404
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-graphite-900 tracking-tight">
          Resource Not Found
        </h1>
        <p className="text-sm text-graphite-500 max-w-sm mx-auto leading-relaxed">
          The brand governance resource, guideline, or submission you are looking for does not exist or has been moved.
        </p>
      </div>
      <Link to="/">
        <Button
          variant="secondary"
          size="md"
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
};