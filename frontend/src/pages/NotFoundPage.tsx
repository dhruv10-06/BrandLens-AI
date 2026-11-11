import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button.tsx';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-[#F5EFE4] border border-[#DDD2BF] flex items-center justify-center text-brass-800 shadow-parchment">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <div className="text-xs font-mono font-bold text-forest-900 uppercase tracking-widest">
          Chamber Error 404
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-espresso-950 tracking-tight">
          Uncharted Brand Territory
        </h1>
        <p className="text-sm text-espresso-700 max-w-sm mx-auto leading-relaxed font-sans">
          The brand governance resource, guideline, or submission you are looking for does not exist or has been relocated within the atelier.
        </p>
      </div>
      <Link to="/">
        <Button
          variant="primary"
          size="md"
          icon={<ArrowLeft className="w-4 h-4 text-brass-400" />}
        >
          Return to Atelier Desk
        </Button>
      </Link>
    </div>
  );
};
