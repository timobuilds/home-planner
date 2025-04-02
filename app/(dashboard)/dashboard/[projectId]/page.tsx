import React, { Suspense } from 'react';
import { getRequiredAuthSession, isProUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { projects } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // Assuming shadcn/ui Card
import { Skeleton } from "@/components/ui/skeleton";
// import ProBanner from '@/components/ProBanner'; // Import when ready
// import UpgradeCTA from '@/components/UpgradeCTA'; // Import when ready

interface PageProps {
  params: { projectId: string };
}

// Example Async component to fetch data for a widget
async function BudgetSummary({ projectId, clerkUserId }: { projectId: number, clerkUserId: string }) {
    // TODO: Fetch actual budget summary data
    // const summary = await db.query... where project id and user id match
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate fetch delay
    const summaryData = { planned: 50000, actual: 15000 }; // Placeholder

    return (
        <Card>
            <CardHeader>
                <CardTitle>Budget Overview</CardTitle>
                <CardDescription>Planned vs. Actual Spending</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Planned: ${summaryData.planned.toLocaleString()}</p>
                <p>Actual: ${summaryData.actual.toLocaleString()}</p>
                {/* Add a progress bar or chart later */}
                 <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500"
                        style={{ width: `${(summaryData.actual / summaryData.planned) * 100}%` }}
                     />
                </div>
            </CardContent>
        </Card>
    );
}

// Example Async component for another widget
async function TaskSummary({ projectId, clerkUserId }: { projectId: number, clerkUserId: string }) {
    // TODO: Fetch actual task summary data
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate fetch delay
    const taskData = { completed: 5, pending: 10, overdue: 1 }; // Placeholder

    return (
        <Card>
            <CardHeader>
                <CardTitle>Task Status</CardTitle>
                 <CardDescription>Completed, Pending, and Overdue</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Completed: {taskData.completed}</p>
                <p>Pending: {taskData.pending}</p>
                <p>Overdue: <span className={taskData.overdue > 0 ? "text-red-600 font-medium" : ""}>{taskData.overdue}</span></p>
            </CardContent>
        </Card>
    );
}


export default async function ProjectDashboardPage({ params }: PageProps) {
  const { userId } = getRequiredAuthSession();
  const projectId = parseInt(params.projectId, 10);
  const userIsPro = await isProUser(); // Check user plan

  if (isNaN(projectId)) {
    console.error(`Invalid projectId: ${params.projectId}`);
    notFound();
  }

  // Fetch the project details, ensuring the current user owns it
  const project = await db.query.projects.findFirst({
    where: (p, { and }) => and(
        eq(p.id, projectId),
        eq(p.clerkUserId, userId) // Crucial security check
    ),
    // Optionally fetch related data if needed directly on dashboard
    // with: { budgets: { limit: 1 }, tasks: { limit: 1 } }
  });

  // If project not found or doesn't belong to the user, show 404
  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {project.name}
        </h1>
        {/* Add project-level actions here, e.g., Edit Project, Archive */}
        <div className="flex space-x-2">
             {/* Example Button */}
             {/* <Button variant="outline" size="sm">Edit Project</Button> */}
        </div>
      </div>

      {project.description && (
        <p className="text-gray-600 dark:text-gray-400">{project.description}</p>
      )}

      {/* Optional: Show Pro banner if applicable */}
      {/* {!userIsPro && <ProBanner />} */}

      {/* Dashboard Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Use Suspense to load widgets independently */}
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <BudgetSummary projectId={project.id} clerkUserId={userId} />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
             <TaskSummary projectId={project.id} clerkUserId={userId} />
          </Suspense>

          {/* Placeholder for more widgets */}
          <Card>
            <CardHeader>
                <CardTitle>Upcoming Deadlines</CardTitle>
                <CardDescription>Tasks due soon</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-gray-500">Widget coming soon...</p>
            </CardContent>
          </Card>

            {/* Example Pro-only widget */}
          {userIsPro ? (
            <Suspense fallback={<Skeleton className="h-48 w-full" />}>
                {/* <CostAnalysisWidget projectId={project.id} clerkUserId={userId} /> */}
                 <Card>
                    <CardHeader><CardTitle>Cost Analysis (Pro)</CardTitle></CardHeader>
                    <CardContent><p className="text-gray-500">Pro widget placeholder...</p></CardContent>
                 </Card>
            </Suspense>
           ) : (
             <Card className="flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-gray-800/50 border-dashed">
                <CardHeader><CardTitle>Cost Analysis</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Detailed cost analysis per room is available for Pro users.</p>
                    {/* <UpgradeCTA location="dashboard-widget" /> */}
                    <Button size="sm" variant="outline" asChild><Link href="/pro">Upgrade to Pro</Link></Button>
                </CardContent>
             </Card>
           )}
      </div>

       {/* Optional: Upgrade CTA at the bottom */}
       {/* {!userIsPro && <UpgradeCTA reason="Get access to advanced reporting and collaboration tools." />} */}
    </div>
  );
}
