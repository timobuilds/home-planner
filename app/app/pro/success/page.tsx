import React from 'react';
import { Metadata } from "next";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { getRequiredDbUser } from '@/lib/auth'; // Verify plan change server-side
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
    title: "Upgrade Successful | Home Construction Planner",
};

export default async function ProSuccessPage() {
    // Server-side check to ensure the user *just* upgraded or is actually Pro now.
    // This prevents accessing this page directly without paying.
    const dbUser = await getRequiredDbUser();
    if (dbUser.plan !== 'pro') {
        console.warn(`User ${dbUser.clerkId} accessed /pro/success but is not Pro. Redirecting.`);
        redirect('/pro'); // Redirect to upgrade page if not pro
    }

    // TODO: Optionally check Stripe session ID from query params if passed back for verification?
    // const { searchParams } = useSearchParams();
    // const sessionId = searchParams.get('session_id'); -> Verify this server-side

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 p-8 text-center">
        <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
        <h1 className="text-4xl font-bold mb-3 text-gray-900">Upgrade Successful!</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-lg">
            Thank you for upgrading to Home Planner Pro! You now have access to all premium features.
        </p>
        <div className="space-y-4">
            <p className="text-gray-500">You can now:</p>
            <ul className="list-disc list-inside text-left text-gray-600 inline-block">
                <li>Export projects as PDF reports</li>
                <li>Invite team members to collaborate</li>
                <li>Perform advanced cost analysis</li>
                <li>And much more!</li>
            </ul>
        </div>
        <Button asChild size="lg" className="mt-10">
            <Link href="/dashboard">Go to Your Dashboard</Link>
        </Button>
    </div>
  );
}
