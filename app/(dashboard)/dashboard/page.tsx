import { redirect } from 'next/navigation';
import { getRequiredAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { projects } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import { Button } from '@/components/ui/button'; // Assuming shadcn/ui is set up

export const dynamic = 'force-dynamic'; // Ensure fresh data on each load

export default async function DashboardRootPage() {
  const { userId } = getRequiredAuthSession(); // Ensures user is logged in

  // Fetch only the ID of the most recently updated project
  const latestProject = await db.query.projects.findFirst({
    where: eq(projects.clerkUserId, userId),
    orderBy: desc(projects.updatedAt),
    columns: { id: true }, // Only need the ID for redirection
  });

  // If the user has at least one project, redirect to its dashboard
  if (latestProject) {
    redirect(`/dashboard/${latestProject.id}`);
  }

  // If no projects exist, show a welcome/setup message
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center h-full min-h-[400px] bg-white dark:bg-gray-800">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>

      <h1 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Welcome to Home Planner!</h1>
      <p className="mb-6 max-w-md text-gray-600 dark:text-gray-400">
        It looks like you haven't created any projects yet. Let's get started by setting up your first home build or renovation plan.
      </p>
      <Button asChild size="lg">
        <Link href="/projects/new"> {/* Ensure this route exists */}
          Create Your First Project
        </Link>
      </Button>
    </div>
  );
}
