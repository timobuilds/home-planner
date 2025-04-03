import React, { Suspense } from 'react';
import { getRequiredAuthSession, getRequiredDbUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { projects } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
// import ContactList from './_components/ContactList'; // Example component

interface PageProps {
  params: { projectId: string };
}

// Example Async component to load contacts
async function ContactDisplay({ projectId, clerkUserId }: { projectId: number, clerkUserId: string }) {
    // TODO: Fetch contacts for this project
    // const contacts = await db.query...
    await new Promise(resolve => setTimeout(resolve, 900)); // Simulate delay

    return (
         <div className="mt-6 border rounded-lg p-4 bg-white dark:bg-gray-800">
             {/* <ContactList contacts={contacts} /> */}
             <p className="text-gray-600 dark:text-gray-400">Contact list (vendors, contractors, etc.) will be displayed here.</p>
              <p className="text-gray-500 dark:text-gray-500 mt-2"> (Placeholder for contacts)</p>
         </div>
    );
}


export default async function ContactsPage({ params }: PageProps) {
  const { userId } = getRequiredAuthSession();
   const dbUser = await getRequiredDbUser(); // Ensures user exists
  const projectId = parseInt(params.projectId, 10);

  if (isNaN(projectId)) {
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
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div>
             <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Contacts</h1>
             <p className="text-gray-500 dark:text-gray-400">Manage vendors and contacts for {project.name}</p>
         </div>
         <Button>
            <UserPlus className="mr-2 h-4 w-4" /> Add Contact
         </Button>
       </div>

        {/* Contacts Content Area */}
        <Suspense fallback={<Skeleton className="h-80 w-full" />}>
             <ContactDisplay projectId={project.id} clerkUserId={userId} />
        </Suspense>
    </div>
  );
}
