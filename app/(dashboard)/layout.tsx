import React, { Suspense } from 'react';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { ensureUserSynced, getRequiredAuthSession } from '@/lib/auth'; // Use ensureUserSynced
import { db } from '@/lib/db';
import { projects } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { Skeleton } from '@/components/ui/skeleton'; // Assuming shadcn/ui Skeleton

// Async component to fetch projects for navigation
async function ProjectNav({ currentProjectId }: { currentProjectId?: number }) {
    const { userId } = getRequiredAuthSession(); // Auth check happens here

    const userProjects = await db.query.projects.findMany({
        where: eq(projects.clerkUserId, userId),
        orderBy: desc(projects.updatedAt),
        columns: { id: true, name: true }, // Select only necessary columns
        limit: 20, // Limit number of projects shown in nav
    });

    return (
        <>
            <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 px-3">
                Projects
            </h3>
            {userProjects.length === 0 && (
                <p className="px-3 text-sm text-gray-500 dark:text-gray-400">No projects yet.</p>
            )}
            {userProjects.map((project) => (
                <Link
                    key={project.id}
                    href={`/dashboard/${project.id}`}
                    className={`block rounded px-3 py-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 ${
                        currentProjectId === project.id
                        ? 'bg-gray-200 font-medium text-gray-900 dark:bg-gray-700 dark:text-white'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                    prefetch={true} // Prefetch project pages
                >
                    {project.name}
                </Link>
            ))}
            {/* TODO: Add "New Project" button/link here */}
             <Link
                href="/projects/new" // Assuming this route exists
                className="mt-2 block rounded px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-gray-700"
             >
                 + Create New Project
             </Link>
        </>
    );
}

// Async component for the main project menu
async function ProjectMenu({ projectId }: { projectId: number }) {
    // Optional: Fetch project name again if needed, or rely on page props
    return (
         <>
            <h3 className="mb-2 mt-4 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 px-3">
                Project Menu
            </h3>
            <Link href={`/dashboard/${projectId}`} className="block rounded px-3 py-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-700">Dashboard</Link>
            <Link href={`/budget/${projectId}`} className="block rounded px-3 py-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-700">Budget</Link>
            <Link href={`/tasks/${projectId}`} className="block rounded px-3 py-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-700">Tasks</Link>
            <Link href={`/team/${projectId}`} className="block rounded px-3 py-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-700">Team</Link>
            <Link href={`/contacts/${projectId}`} className="block rounded px-3 py-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-700">Contacts</Link>
            <Link href={`/docs/${projectId}`} className="block rounded px-3 py-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-700">Documents</Link>
        </>
    );
}


export default async function DashboardLayout({
  children,
  params, // Layouts can access params from child pages
}: {
  children: React.ReactNode;
  params?: { projectId?: string }; // Make params optional as not all child routes have it
}) {
  // Ensure user is authenticated and exists in the DB at the layout level
  // This helps prevent flashes of unauthenticated content or errors deeper down.
  await ensureUserSynced();

  const currentProjectId = params?.projectId ? parseInt(params.projectId, 10) : undefined;
   if (params?.projectId && isNaN(currentProjectId as number)) {
      // Handle invalid projectId in the URL at the layout level if desired
      // or let the individual page handle it with notFound()
       console.warn(`Invalid projectId in layout params: ${params.projectId}`);
   }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar Navigation */}
      <aside className="flex w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="flex h-16 flex-shrink-0 items-center border-b border-gray-200 px-4 dark:border-gray-700">
          <Link href="/dashboard" className="text-xl font-semibold text-gray-900 dark:text-white">
            Home Planner
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Use Suspense for data fetching components in the nav */}
            <Suspense fallback={<Skeleton className="h-24 w-full" />}>
                 <ProjectNav currentProjectId={currentProjectId} />
             </Suspense>

            {/* Conditionally render project menu based on valid projectId */}
            {currentProjectId && !isNaN(currentProjectId) && (
                <Suspense fallback={<Skeleton className="h-32 w-full mt-4" />}>
                    <ProjectMenu projectId={currentProjectId} />
                </Suspense>
            )}
        </nav>
        {/* Sidebar Footer */}
        <div className="mt-auto flex flex-shrink-0 items-center justify-between border-t border-gray-200 p-4 dark:border-gray-700">
            <Link href="/account" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                Account
            </Link>
             {/* Fallback added for UserButton loading state */}
            <Suspense fallback={<Skeleton className="h-8 w-8 rounded-full" />}>
                <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "w-8 h-8" } }} />
            </Suspense>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
