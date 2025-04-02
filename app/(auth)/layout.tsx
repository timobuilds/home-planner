// Create app/(auth)/layout.tsx
// Simple centered layout for authentication pages
import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-white to-green-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-950 p-4">
        {/* Optional: Add a logo or app name here */}
        {/* <h1 className="text-2xl font-bold mb-6">Home Planner</h1> */}
      {children}
    </div>
  );
}
