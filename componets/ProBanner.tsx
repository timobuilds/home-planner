import Link from 'next/link';
import { Button } from '@/components/ui/button'; // Assuming shadcn/ui Button
import { Zap } from 'lucide-react'; // Example icon

interface ProBannerProps {
    featureName?: string; // Optional: Mention the specific feature gated
}

export function ProBanner({ featureName }: ProBannerProps) {
    const message = featureName
        ? `Unlock ${featureName} and all Pro features!`
        : "Upgrade to Pro to unlock advanced features!";

  return (
    <div className="mb-4 rounded-lg border border-purple-300 bg-purple-50 p-4 text-center text-sm text-purple-800 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-200 shadow-sm">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400 hidden sm:inline-block" />
        <p className="font-medium">{message}</p>
        <Button asChild size="sm" variant="outline" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 shrink-0">
          <Link href="/pro">Upgrade Now</Link>
        </Button>
      </div>
    </div>
  );
}

export default ProBanner; // Default export if preferred
