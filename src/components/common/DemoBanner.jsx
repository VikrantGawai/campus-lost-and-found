import { AlertTriangle } from 'lucide-react';

export default function DemoBanner() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 text-center py-2 px-4 text-xs font-medium flex items-center justify-center gap-2">
      <AlertTriangle className="w-3.5 h-3.5" />
      <span>Demo Mode — Data is stored locally in your browser and is not shared with other users</span>
    </div>
  );
}
