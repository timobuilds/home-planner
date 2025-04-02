import React from 'react';
import { UserProfile } from "@clerk/nextjs";
import { Metadata } from "next";
import { getRequiredDbUser } from '@/lib/auth'; // We might need DB user info here too
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
    title: "Account Settings | Home Construction Planner",
};

// Component to show subscription status / management link
async function SubscriptionInfo() {
    const dbUser = await getRequiredDbUser();
    const isPro = dbUser.plan === 'pro';

    // TODO: Implement Stripe Customer Portal link retrieval
    // const getPortalLink = async () => { "use server"; ... return url; }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Subscription Plan</CardTitle>
                <CardDescription>Manage your billing and subscription details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                 <p>
                     Current Plan: <span className={`font-semibold ${isPro ? 'text-green-600' : 'text-gray-700'}`}>
                         {isPro ? 'Pro' : 'Free'}
                     </span>
                 </p>
                 {isPro ? (
                    // TODO: Add button to manage subscription via Stripe Portal
                    <p className="text-sm text-gray-600">Manage your subscription via Stripe.</p>
                    // <form action={getPortalLink}> <Button>Manage Billing</Button> </form>
                 ) : (
                    <Button asChild>
                        <Link href="/pro">Upgrade to Pro</Link>
                    </Button>
                 )}
                 {/* Display expiry if applicable */}
                 {isPro && dbUser.stripeCurrentPeriodEnd && (
                    <p className="text-xs text-gray-500">
                        Renews on: {new Date(dbUser.stripeCurrentPeriodEnd).toLocaleDateString()}
                    </p>
                 )}
            </CardContent>
        </Card>
    );
}

export default function AccountPage() {
  // Clerk's UserProfile handles profile updates (name, password, MFA, etc.)
  // We add custom sections for subscription management.
  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Account Settings</h1>

        {/* Section for Subscription Management */}
        <SubscriptionInfo />

        {/* Clerk's User Profile Component */}
        <Card>
             <CardHeader>
                <CardTitle>Profile Details</CardTitle>
                <CardDescription>Update your personal information, password, and security settings.</CardDescription>
            </CardHeader>
            <CardContent>
                <UserProfile
                    path="/account"
                    routing="path"
                    appearance={{
                        elements: {
                            card: "shadow-none border-none", // Integrate with our Card style
                            headerTitle: "hidden", // Hide default title if we have our own
                            headerSubtitle: "hidden",
                        }
                    }}
                />
            </CardContent>
        </Card>
    </div>
  );
}
