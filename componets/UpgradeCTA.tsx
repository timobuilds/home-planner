import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle } from 'lucide-react';

interface UpgradeCTAProps {
    reason?: string; // Why the user should upgrade in this context
    location?: string; // Where this CTA is placed (e.g., 'budget-page', 'team-page')
}

export function UpgradeCTA({ reason, location }: UpgradeCTAProps) {
  return (
    <div className="mt-6 rounded-lg border border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 dark:border-blue-800 dark:from-gray-800 dark:to-gray-900 shadow-md">
        <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-shrink-0 text-blue-600 dark:text-blue-400">
                {/* Replace with a more relevant icon if desired */}
                 <CheckCircle className="h-10 w-10" />
            </div>
            <div className="flex-grow text-center md:text-left">
                 <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Go Pro for More Power</h3>
                 {reason && <p className="mt-1 text-gray-600 dark:text-gray-400">{reason}</p>}
                 <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                     Includes PDF exports, team collaboration, scenario modeling, and more.
                 </p>
            </div>
            <div className="flex-shrink-0 mt-4 md:mt-0">
                 <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white">
                     <Link href="/pro">
                         Upgrade to Pro <ArrowRight className="ml-2 h-4 w-4" />
                     </Link>
                 </Button>
            </div>
        </div>
    </div>
  );
}

export default UpgradeCTA;
