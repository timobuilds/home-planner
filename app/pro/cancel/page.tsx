import React from 'react';
import { Metadata } from "next";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export const metadata: Metadata = {
    title: "Upgrade Cancelled | Home Construction Planner",
};

export default function ProCancelPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-red-50 via-white to-yellow-50 p-8 text-center">
        <XCircle className="w-20 h-20 text-red-500 mb-6" />
        <h1 className="text-4xl font-bold mb-3 text-gray-900">Upgrade Cancelled</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-md">
            Your upgrade process was cancelled. You can upgrade to Pro anytime to unlock premium features.
        </p>
        <div className="flex gap-4">
            <Button asChild size="lg" variant="outline">
                <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
             <Button asChild size="lg">
                <Link href="/pro">View Pro Features</Link>
            </Button>
        </div>
    </div>
  );
}
