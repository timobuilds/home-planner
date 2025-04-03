import React, { Suspense } from 'react';
import { getRequiredAuthSession, getRequiredDbUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { projects } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PageProps {
  params: { projectId: string };
}

async function TaskDisplay({ projectId, clerkUserId }: { projectId: number, clerkUserId: string }) {
    console.log(`Fetching tasks for project ${projectId} (placeholder)...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const tasks: any[] = [];

    return (
         <div className="mt-6 rounded-lg border bg-card p-4 text-card-foreground shadow-sm dark:bg-gray-800">
             {tasks.length === 0 ? (
                 <p className="text-center text-gray-500 dark:text-gray-400">No tasks created for this project yet.</p>
             ) : (
                 <p className="text-gray-600 dark:text-gray-400">Task list or Gantt chart will be displayed here.</p>
             )}
             <p className="mt-2 text-sm text-gray-500 dark:text-gray-500"> (Placeholder UI for tasks)</p>
         </div>
    );
}

export default async function TasksPage({ params }: PageProps) {
  const { userId } = getRequiredAuthSession();
  const dbUser = await getRequiredDbUser();
  const projectId = parseInt(params.projectId, 10);

  if (isNaN(projectId)) {
    console.error(`Invalid projectId param: ${params.projectId}`);
    notFound();
  }

  const project = await db.query.projects.findFirst({
    where: (p, { and }) => and(
        eq(p.id, projectId),
        eq(p.clerkUserId, userId)
    ),
    columns: { name: true, id: true }
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
         <div>
             <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Tasks</h1>
             <p className="mt-1 text-gray-500 dark:text-gray-400">Track progress and manage tasks for project: {project.name}</p>
         </div>
         <div className="flex flex-shrink-0 space-x-2">
            <Button disabled>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Task
             </Button>
         </div>
       </div>

        <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" />}>
            <TaskDisplay projectId={project.id} clerkUserId={userId} />
        </Suspense>
    </div>
  );
}
