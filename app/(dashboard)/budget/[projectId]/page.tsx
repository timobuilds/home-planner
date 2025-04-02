import React, { Suspense } from 'react';
import { getRequiredAuthSession, isProUser, getRequiredDbUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { projects } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import ProBanner from '@/components/ProBanner'; // Use the actual component
import UpgradeCTA from '@/components/UpgradeCTA'; // Use the actual component
import { Download, Upload } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
// import BudgetTable from './_components/BudgetTable'; // Example component for budget data

interface PageProps {
  params: { projectId: string };
}

// Server Action (example) for handling PDF export click
async function handleExportPdf(projectId: number, userPlan: string) {
    'use server';
    console.log(`Attempting PDF export for project ${projectId}, user plan: ${userPlan}`);

    // **Security Check:** Re-verify Pro status on the server-side
    if (userPlan !== 'pro') {
        // This should ideally not be reachable if UI is disabled, but essential for security
        console.error("PDF Export Error: User is not Pro.");
        // Could return an error message to the client
        return { success: false, error: "Upgrade to Pro to export PDFs." };
    }

    // Fetch necessary data (project details, budget items)
    // const projectData = await db.query.projects.findFirst(...);
    // const budgetItems = await db.query.budgetItems.findMany(...);
    // if (!projectData || !budgetItems) {
    //    return { success: false, error: "Failed to load data for PDF export." };
    // }

    // Generate the PDF (this might happen client-side or server-side depending on library)
    // import { generateBudgetPdfReport } from '@/lib/pdf';
    // const pdfBlob = await generateBudgetPdfReport(projectData, budgetItems);

    // if (!pdfBlob) {
    //     return { success: false, error: "Failed to generate PDF." };
    // }

    // How to return/trigger download depends on generation method:
    // - If server-generated: Could return a URL to the PDF (if stored) or stream it.
    // - If client-generated: Action might just prep data, client calls lib/pdf.
    console.log("PDF generation logic not implemented yet.");

    // For now, simulate success (if Pro)
    return { success: true, message: "PDF generation started (not implemented)." };
}

// Example Async component to load budget data
async function BudgetDisplay({ projectId, clerkUserId }: { projectId: number, clerkUserId: string }) {
    // TODO: Fetch budget categories and items for this project
    // const budgetData = await db.query...
    await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate fetch delay

    return (
        <div className="mt-6 border rounded-lg p-4 bg-white dark:bg-gray-800">
            {/* Replace with actual budget table/component */}
            {/* <BudgetTable data={budgetData} /> */}
            <p className="text-gray-600 dark:text-gray-400">Budget table/details will be displayed here.</p>
            <p className="text-gray-500 dark:text-gray-500 mt-2"> (Placeholder for budget items)</p>
        </div>
    );
}


export default async function BudgetPage({ params }: PageProps) {
  const { userId } = getRequiredAuthSession();
  const dbUser = await getRequiredDbUser(); // Get full DB user, including plan
  const projectId = parseInt(params.projectId, 10);

  if (isNaN(projectId)) {
    notFound();
  }

  const project = await db.query.projects.findFirst({
    where: (p, { and }) => and(
        eq(p.id, projectId),
        eq(p.clerkUserId, userId) // Ensure user owns the project
    ),
     columns: { name: true, id: true } // Only select needed columns
  });

  if (!project) {
    notFound();
  }

  const userIsPro = dbUser.plan === 'pro'; // Use plan from the fetched DB user

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Budget</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage planned vs. actual costs for {project.name}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {/* Excel Import Button - Placeholder */}
             <Button variant="outline" disabled>
                 <Upload className="mr-2 h-4 w-4" /> Import Excel
             </Button>

            {/* PDF Export Button - Pro-Gated */}
             <form action={async () => {
                 "use server"; // Needs to be a Server Action to call handleExportPdf
                 if (!userIsPro) return; // Prevent action if not pro (UI should also disable)
                 const result = await handleExportPdf(project.id, dbUser.plan);
                 // TODO: Handle result (e.g., show toast message)
                 console.log("Export PDF action result:", result);
             }}>
                 <Button type="submit" variant="default" disabled={!userIsPro} aria-disabled={!userIsPro}>
                     <Download className="mr-2 h-4 w-4" />
                     {userIsPro ? "Export PDF" : "Export PDF (Pro)"}
                 </Button>
             </form>
        </div>
      </div>

      {/* Show Pro banner if user is not Pro */}
      {!userIsPro && <ProBanner featureName="PDF Budget Exports & Excel Import" />}

       {/* Main Budget Content Area */}
       <Suspense fallback={<Skeleton className="h-64 w-full" />}>
         <BudgetDisplay projectId={project.id} clerkUserId={userId} />
       </Suspense>


      {/* Show Upgrade CTA if user is not Pro */}
      {!userIsPro && (
        <UpgradeCTA
            reason="Unlock powerful features like PDF exports, Excel budget uploads, and detailed cost analysis."
            location="budget-page"
        />
       )}
    </div>
  );
}
