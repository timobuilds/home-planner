'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db';
import { tasks, taskStatusEnum, projects, DbTask, projectTeamMembers, users } from '@/lib/schema';
import { getRequiredAuthSession } from '@/lib/auth'; // For authentication/authorization

// Define the state type for form actions
export type ActionState = { 
    success: boolean; 
    error?: string | null; 
    errors?: Record<string, string[]> | { _form?: string[] } | null; 
    message?: string | null; 
    task?: DbTask | null; // Add task field for returning data
} | null;

// Type for assignee dropdown
export type AssigneeOption = { 
    clerkId: string; 
    name: string | null; 
    email: string; 
    imageUrl?: string | null;
};

// --- Validation Schemas ---

// Schema for updating a single task's status and order
// const UpdateTaskOrderSchema = z.object({ // Commented out as unused
//     taskId: z.number().positive(),
//     newStatus: z.enum(taskStatusEnum.enumValues),
//     newOrder: z.number().min(0),
//     projectId: z.number().positive(), // Important for authorization check
// });

// Schema for updating multiple tasks (e.g., after reordering a column)
// We might refine this later, but a full snapshot is often simplest
const SyncTasksSchema = z.object({
    projectId: z.number().positive(),
    tasksToSync: z.array(z.object({
        id: z.number().positive(),
        status: z.enum(taskStatusEnum.enumValues),
        order: z.number().min(0),
    })).min(1, "At least one task must be provided for syncing."), // Ensure array is not empty
});

// Schema for Creating a Task
const CreateTaskFormSchema = z.object({
  projectId: z.number().positive(),
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().max(500).optional(),
  status: z.enum(taskStatusEnum.enumValues),
  dueDate: z.date().optional().nullable(), // Add optional dueDate
  // Add other fields as needed (dueDate, etc.)
});

// Schema for Updating Task Details
const UpdateTaskFormSchema = z.object({
    taskId: z.number().positive(),
    projectId: z.number().positive(), // Still needed for auth check
    title: z.string().min(3, "Title must be at least 3 characters").max(100),
    description: z.string().max(500).optional(),
    status: z.enum(taskStatusEnum.enumValues),
    dueDate: z.date().optional().nullable(), // Add optional dueDate
    // Add other fields
});

// Schema for Deleting a Task
const DeleteTaskSchema = z.object({
    taskId: z.number().positive(),
    projectId: z.number().positive(), // For auth check
});

// --- Server Actions ---

/**
 * Updates the status and order of potentially multiple tasks.
 * Intended to be called after drag-and-drop operations on the board.
 */
export async function syncTaskBoardStateAction(
    prevState: ActionState, 
    formData: FormData
) {
     // Basic parsing - consider using useFormState for better client feedback
    const rawData = {
        projectId: parseInt(formData.get('projectId') as string, 10),
        // We expect the tasks state to be JSON stringified in the form data
        tasksToSync: JSON.parse(formData.get('tasksToSync') as string || '[]')
    };

    const validatedData = SyncTasksSchema.safeParse(rawData);

    if (!validatedData.success) {
        console.error("Validation failed (syncTaskBoardStateAction):", validatedData.error.flatten());
        return { success: false, error: "Invalid data provided for task sync.", errors: validatedData.error.flatten().fieldErrors };
    }

    const { projectId, tasksToSync } = validatedData.data;
    const { userId: clerkUserId } = getRequiredAuthSession(); // Auth check

    console.log(`Syncing ${tasksToSync.length} tasks for project ${projectId} by user ${clerkUserId}`);

    try {
        // Verify user owns the project before proceeding
        const project = await db.query.projects.findFirst({
            columns: { id: true },
            where: and(eq(projects.id, projectId), eq(projects.clerkUserId, clerkUserId))
        });
        if (!project) {
             throw new Error("Project not found or user does not have access.");
        }

        // Perform updates within a transaction for atomicity
        await db.transaction(async (tx) => {
            for (const taskData of tasksToSync) {
                 console.log(` -> Updating task ${taskData.id} to status ${taskData.status}, order ${taskData.order}`);
                await tx.update(tasks)
                    .set({
                        status: taskData.status,
                        order: taskData.order,
                        updatedAt: new Date(), // Update timestamp
                    })
                     // IMPORTANT: Ensure we only update tasks belonging to the correct project
                    .where(and(
                        eq(tasks.id, taskData.id),
                        eq(tasks.projectId, projectId)
                        // We rely on the initial project check for user ownership, but could add clerkUserId here too if paranoid
                    ));
                    // Consider adding checks to ensure rows were actually updated if needed
            }
        });

        console.log(`Successfully synced tasks for project ${projectId}`);

        // Revalidate the path for the tasks page to reflect changes
        revalidatePath(`/tasks/${projectId}`);
        // Revalidate layout potentially if nav shows task counts?
        // revalidatePath('/(dashboard)/layout', 'layout');

        return { success: true, message: "Task board updated." };

    } catch (error: unknown) {
        console.error("Error syncing task board state:", error);
        // Handle unknown error type safely
        const errorMessage = error instanceof Error ? error.message : "Failed to update task board.";
        return { success: false, error: errorMessage };
    }
}

/**
 * Fetches team members for a given project, including the owner.
 * Ensures the requesting user is part of the project.
 */
export async function getProjectAssigneesAction(projectId: number): Promise<{ success: boolean; assignees?: AssigneeOption[]; error?: string }> {
    const { userId: requestingUserClerkId } = getRequiredAuthSession();

    if (!projectId || isNaN(projectId)) {
        return { success: false, error: "Invalid project ID." };
    }

    try {
        // 1. Verify the requesting user is part of the project (or the owner)
        const projectMembership = await db.query.projects.findFirst({
            columns: { id: true, clerkUserId: true }, // Check owner
            where: eq(projects.id, projectId),
            with: {
                // Check if user is explicitly listed as a team member
                // This requires defining the inverse relation on the projects schema
                // teamMembers: {
                //     columns: { userClerkId: true },
                //     where: eq(projectTeamMembers.userClerkId, requestingUserClerkId)
                // }
            }
        });
        
        // Basic check: Does project exist and does user own it? 
        // TODO: Enhance this check to include explicit team members once relations are set up
        if (!projectMembership || projectMembership.clerkUserId !== requestingUserClerkId) {
            // For now, only allow owner to see assignees, implement team logic later
             throw new Error("Project not found or access denied to view assignees.");
        }

        // 2. Fetch all users associated with the project
        // This query assumes the owner is implicitly a member and fetches others from the join table.
        // It might be simpler to ensure the owner is always added to projectTeamMembers on project creation.
        const members = await db
            .select({
                clerkId: users.clerkId,
                name: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`,
                email: users.email,
                imageUrl: users.profileImageUrl,
            })
            .from(projectTeamMembers)
            .innerJoin(users, eq(projectTeamMembers.userId, users.id))
            .where(eq(projectTeamMembers.projectId, projectId))
            // Optionally order results
            .orderBy(users.firstName, users.lastName, users.email);
            
        // TODO: Add the project owner to the list if they aren't in the teamMembers table yet
        const owner = await db.query.users.findFirst({
            columns: { clerkId: true, firstName: true, lastName: true, email: true, profileImageUrl: true },
            where: eq(users.clerkId, projectMembership.clerkUserId)
        });
        
        const finalAssignees: AssigneeOption[] = members.map(m => ({ ...m, name: m.name || m.email })); // Ensure name fallback
        
        if (owner && !finalAssignees.some(m => m.clerkId === owner.clerkId)) {
            finalAssignees.push({ 
                clerkId: owner.clerkId, 
                name: `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || owner.email, 
                email: owner.email, 
                imageUrl: owner.profileImageUrl 
            });
            // Re-sort if needed
            finalAssignees.sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));
        }

        return { success: true, assignees: finalAssignees };

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch assignees.";
        console.error("Error fetching assignees:", error);
        return { success: false, error: errorMessage };
    }
}

// --- Other Task Actions (Placeholders - Implement as needed) ---

export async function createTaskAction(
    prevState: ActionState, 
    formData: FormData
) {
    const { userId: clerkUserId } = getRequiredAuthSession();

    const rawData = {
        projectId: parseInt(formData.get('projectId') as string, 10),
        title: formData.get('title') as string,
        description: formData.get('description') as string || undefined,
        status: formData.get('status') as typeof taskStatusEnum.enumValues[number],
        // Parse date string if present, otherwise null
        dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : null,
    };

    const validatedData = CreateTaskFormSchema.safeParse(rawData);

    if (!validatedData.success) {
        console.error("Validation failed (createTaskAction):", validatedData.error.flatten());
        return { success: false, error: "Invalid data provided for new task.", errors: validatedData.error.flatten().fieldErrors };
    }

    const { projectId, title, description, status, dueDate } = validatedData.data;

    try {
        // Verify user owns the project
        const project = await db.query.projects.findFirst({
            columns: { id: true },
            where: and(eq(projects.id, projectId), eq(projects.clerkUserId, clerkUserId))
        });
        if (!project) throw new Error("Project not found or user does not have access.");

        // Calculate initial 'order' 
        const result = await db.select({ count: sql<number>`count(*)::int` }).from(tasks)
            .where(and(eq(tasks.projectId, projectId), eq(tasks.status, status))); // Get count for the target status
        const order = result[0]?.count ?? 0;

        const [newTask] = await db.insert(tasks).values({
            projectId,
            clerkUserId, // Set clerkUserId based on project owner
            title,
            description,
            status,
            order, // Pass the calculated order
            dueDate, // Add dueDate to insert values
            // Ensure all non-nullable fields without defaults are provided
        }).returning();

        if (!newTask) throw new Error("Failed to create task in database.");

        revalidatePath(`/tasks/${projectId}`);
        return { success: true, message: "Task created.", task: newTask };

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Failed to create task.";
        console.error("Error creating task:", error);
        return { success: false, error: errorMessage };
    }
}

export async function updateTaskDetailsAction(
    prevState: ActionState,
    formData: FormData
) {
    const { userId: clerkUserId } = getRequiredAuthSession();

    const rawData = {
        taskId: parseInt(formData.get('taskId') as string, 10),
        projectId: parseInt(formData.get('projectId') as string, 10),
        title: formData.get('title') as string,
        description: formData.get('description') as string || undefined,
        // status: formData.get('status') as typeof taskStatusEnum.enumValues[number], // Status handled by sync
        // Parse date string if present, otherwise null
        dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : null,
    };

    const validatedData = UpdateTaskFormSchema.safeParse(rawData);

    if (!validatedData.success) {
        console.error("Validation failed (updateTaskDetailsAction):", validatedData.error.flatten());
        return { success: false, error: "Invalid data provided for task update.", errors: validatedData.error.flatten().fieldErrors };
    }

    const { taskId, projectId, title, description, /* status, */ dueDate } = validatedData.data;

    try {
        // Verify user owns the project AND the task belongs to the project
        const taskToUpdate = await db.query.tasks.findFirst({
            columns: { id: true, projectId: true },
            where: eq(tasks.id, taskId),
            with: { project: { columns: { clerkUserId: true } } }
        });

        if (!taskToUpdate || taskToUpdate.projectId !== projectId || taskToUpdate.project?.clerkUserId !== clerkUserId) {
             throw new Error("Task not found or user does not have access.");
        }

        // Check if status changed - if so, we might need to recalculate order for columns involved
        // For simplicity now, we only update details, not status/order here.
        // Status/order changes should ideally happen via syncTaskBoardStateAction.
        // If allowing status change here, need to adjust order calculation.

        const [updatedTask] = await db.update(tasks)
            .set({
                title,
                description,
                dueDate, // Add dueDate to update set
                updatedAt: new Date(),
            })
            .where(eq(tasks.id, taskId))
            .returning();

        if (!updatedTask) throw new Error("Failed to update task in database.");

        revalidatePath(`/tasks/${projectId}`);
        // Return the task with potentially the *old* status if not updated here
        return { success: true, message: "Task updated.", task: updatedTask }; // Return optimistic status if changed

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Failed to update task.";
        console.error("Error updating task:", error);
        return { success: false, error: errorMessage };
    }
}

export async function deleteTaskAction(
    prevState: ActionState, 
    formData: FormData
) {
    const { userId: clerkUserId } = getRequiredAuthSession();

    const rawData = {
        taskId: parseInt(formData.get('taskId') as string, 10),
        projectId: parseInt(formData.get('projectId') as string, 10),
    };

    const validatedData = DeleteTaskSchema.safeParse(rawData);

    if (!validatedData.success) {
        return { success: false, error: "Invalid data for deletion.", errors: validatedData.error.flatten().fieldErrors };
    }

    const { taskId, projectId } = validatedData.data;

    try {
        // Verify user owns the project AND the task belongs to the project
        const taskToDelete = await db.query.tasks.findFirst({
            columns: { id: true, projectId: true, order: true, status: true }, // Need order/status for reordering others
            where: eq(tasks.id, taskId),
            with: { project: { columns: { clerkUserId: true } } }
        });

        if (!taskToDelete || taskToDelete.projectId !== projectId || taskToDelete.project?.clerkUserId !== clerkUserId) {
             throw new Error("Task not found or user does not have access.");
        }

        await db.transaction(async (tx) => {
            // Delete the task
            const deleteResult = await tx.delete(tasks).where(eq(tasks.id, taskId)).returning({ id: tasks.id });
            if (deleteResult.length === 0) {
                throw new Error("Failed to delete task."); // Should not happen if check above passed
            }

            // Optional but recommended: Adjust order of remaining tasks in the same status column
            await tx.update(tasks)
                .set({ order: sql`${tasks.order} - 1` })
                .where(and(
                    eq(tasks.projectId, projectId),
                    eq(tasks.status, taskToDelete.status),
                    sql`${tasks.order} > ${taskToDelete.order}`
                ));
        });

        revalidatePath(`/tasks/${projectId}`);
        // Return the ID of the deleted task for client-side removal
        return { success: true, message: "Task deleted.", deletedTaskId: taskId }; 

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete task.";
        console.error("Error deleting task:", error);
        return { success: false, error: errorMessage };
    }
}
