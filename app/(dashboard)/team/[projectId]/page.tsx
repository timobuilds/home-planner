import React, { Suspense } from 'react';
import { getRequiredAuthSession, getRequiredDbUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { projects } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import ProBanner from '@/components/ProBanner';
import UpgradeCTA from '@/components/UpgradeCTA';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
// import TeamMemberList from './_components/TeamMemberList'; // Example component

interface PageProps {
  params: { projectId: string };
}

// Example Async component for Pro users
async function TeamManagement({ projectId, clerkUserId }: { projectId: number, clerkUserId: string }) {
    // TODO: Fetch team members for this project
    // const teamMembers = await db.query...
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay

    return (
        <div className="space-y-4">
             <div className="flex justify-end">
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" /> Invite Member
                </Button>
             </div>
             <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
                 {/* <TeamMemberList members={teamMembers} /> */}
                 <p className="text-gray-600 dark:text-gray-400">Team member list and permissions management.</p>
                 <p className="text-gray-500 dark:text-gray-500 mt-2"> (Placeholder for team)</p>
             </div>
        </div>
    );
}

export default async function TeamPage({ params }: PageProps) {
  const { userId } = getRequiredAuthSession();
  const dbUser = await getRequiredDbUser(); // Get user and plan
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

  const userIsPro = dbUser.plan === 'pro';

  return (
    <div className="space-y-6">
        <div>
             <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Team</h1>
             <p className="text-gray-500 dark:text-gray-400">Manage collaborators for {project.name}</p>
        </div>

      {/* Conditional Rendering based on Pro plan */}
      {!userIsPro && (
        <>
            <ProBanner featureName="Team Collaboration" />
            <UpgradeCTA
                reason="Invite clients, contractors, and designers to collaborate on your project in real-time."
                location="team-page"
             />
        </>
       )}

      {userIsPro && (
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <TeamManagement projectId={project.id} clerkUserId={userId} />
        </Suspense>
      )}
    </div>
  );
}
