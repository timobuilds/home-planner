import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { eq, and, asc } from 'drizzle-orm';

import { getRequiredAuthSession, getRequiredDbUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { projects, tasks as tasksSchema, DbTask, DbProject } from '@/lib/schema';
import { Skeleton } from '@/components/ui/skeleton'; // Keep skeleton for suspense
import { TaskPageClient } from './_components/TaskPageClient'; // Correct the import path for the client component

interface PageProps {
  params: { projectId: string };
}

// This is now the Server Component - it fetches data
export default async function TasksServerPage({ params }: PageProps) {
    const { userId } = getRequiredAuthSession(); // Ensures user is logged in
    await getRequiredDbUser(); // Ensures user exists in DB, remove unused variable assignment
    const projectId = parseInt(params.projectId, 10);

    if (isNaN(projectId)) {
        console.error(`Invalid projectId param in server component: ${params.projectId}`);
        notFound();
    }

    // Fetch project details
    const project: DbProject | undefined = await db.query.projects.findFirst({
        where: and(
            eq(projects.id, projectId),
            eq(projects.clerkUserId, userId) // Crucial: Ensures the logged-in user owns this project
        ),
        // columns: { name: true, id: true } // Fetch necessary columns
    });

    // If project doesn't exist or doesn't belong to the user, show 404
    if (!project) {
        notFound();
    }

    // Fetch initial tasks sorted by order (important for board view consistency)
    // We fetch here and pass down to the client component
    const initialTasks: DbTask[] = await db.query.tasks.findMany({
        where: and(
            eq(tasksSchema.projectId, projectId),
            eq(tasksSchema.clerkUserId, userId) // Security check
        ),
        orderBy: asc(tasksSchema.order),
        // TODO: Add relation loading if needed (e.g., assignee details)
        // with: { assignee: true }
    });

    // Render the Client Component, passing fetched data as props
    return (
        <Suspense fallback={<TasksPageSkeleton />}>
             <TaskPageClient project={project} initialTasks={initialTasks} />
        </Suspense>
    );
}

// Simple skeleton component for the page loading state
function TasksPageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                 <div>
                     <Skeleton className="h-8 w-48 mb-2" />
                     <Skeleton className="h-4 w-64" />
                 </div>
                 <div className="flex flex-shrink-0 space-x-2">
                      <Skeleton className="h-9 w-28" />
                 </div>
            </div>
            <Skeleton className="h-96 w-full rounded-lg" />
        </div>
    );
}
