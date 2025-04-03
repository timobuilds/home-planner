import React, { Suspense } from 'react';
import { getRequiredAuthSession, getRequiredDbUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { projects } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UploadCloud } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
// import DocumentList from './_components/DocumentList'; // Example component

interface PageProps {
  params: { projectId: string };
}

// Example Async component to load documents
async function DocumentDisplay({ projectId, clerkUserId }: { projectId: number, clerkUserId: string }) {
    // TODO: Fetch documents/files for this project (likely from Supabase Storage)
    // const documents = await listStorageBucket(...)
    await new Promise(resolve => setTimeout(resolve, 700)); // Simulate delay

    return (
         <div className="mt-6 border rounded-lg p-4 bg-white dark:bg-gray-800">
             {/* <DocumentList documents={documents} /> */}
             <p className="text-gray-600 dark:text-gray-400">Document list (plans, permits, invoices) will be displayed here.</p>
             <p className="text-gray-500 dark:text-gray-500 mt-2"> (Placeholder for documents)</p>
         </div>
    );
}

export default async function DocsPage({ params }: PageProps) {
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

  // TODO: Implement file upload logic (likely using Supabase Storage)

  return (
     <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div>
             <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Documents</h1>
             <p className="text-gray-500 dark:text-gray-400">Store plans, permits, and files for {project.name}</p>
         </div>
         {/* TODO: Create a file upload component */}
         <Button disabled>
            <UploadCloud className="mr-2 h-4 w-4" /> Upload File
         </Button>
       </div>

        {/* Document Content Area */}
        <Suspense fallback={<Skeleton className="h-80 w-full" />}>
             <DocumentDisplay projectId={project.id} clerkUserId={userId} />
        </Suspense>
    </div>
  );
}
