import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button.tsx';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-5">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 shadow-subtle">
        <ShieldAlert className="w-7 h-7" />
      </div>
      <div className="space-y-1.5">
        <div className="text-xs font-mono font-bold text-amber-700 uppercase tracking-wider">
          Error 404
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Resource Not Found
        </h1>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          The brand governance resource, guideline, or submission you are looking for does not exist or has been moved.
        </p>
      </div>
      <Link to="/">
        <Button
          variant="primary"
          size="md"
          icon={<ArrowLeft className="w-4 h-4" />}
          className="!bg-slate-900 hover:!bg-slate-800"
        >
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
};
