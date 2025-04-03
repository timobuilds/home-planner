'use client'; // This component manages state and interactivity

import React, { useState, useEffect } from 'react'; // Removed useEffect
import { DbTask, DbProject } from '@/lib/schema'; // Import types
import { Button } from "@/components/ui/button"; // Ensure shadcn button is added
import { PlusCircle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"; // Ensure shadcn dialog is added
import { TaskForm } from './TaskForm'; // Ensure TaskForm exists
import { TaskViewManager } from './TaskViewManager'; // Ensure TaskViewManager exists
import { useToast } from "@/components/ui/use-toast"; // Import toast hook
import { useRouter } from 'next/navigation'; // Import router for potential refresh
import { deleteTaskAction } from '../actions'; // Import delete action
import { useFormState } from 'react-dom'; // Import useFormState

// Props received from the Server Component
interface TaskPageClientProps {
    project: DbProject;
    initialTasks: DbTask[];
}

export function TaskPageClient({ project, initialTasks }: TaskPageClientProps) {
    // State to manage dialog visibility and task being edited
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<DbTask | null>(null);
    // State to hold the tasks list, initialized from props, updated by interactions
    const [tasks, setTasks] = useState<DbTask[]>(initialTasks);
    const { toast } = useToast(); // Initialize toast hook
    const router = useRouter(); // Initialize router

    // State and action binding for delete
    const [deleteFormState, deleteAction] = useFormState(deleteTaskAction, null);
    const [isDeleting, setIsDeleting] = useState<number | null>(null); // Track which task ID is deleting

    // Handler for opening the dialog to add a task
    const handleAddTaskClick = () => {
        setEditingTask(null); // Ensure we are in "create" mode
        setIsDialogOpen(true);
    };

    // Handler for opening the dialog to edit a task (to be called from TaskCard)
    const handleEditTaskClick = (task: DbTask) => {
        console.log("Editing task:", task); // Log for debugging
        setEditingTask(task);
        setIsDialogOpen(true);
    };

    // Handler for when a task is successfully saved via TaskForm (created or updated)
    const handleTaskSaved = (savedTask: DbTask) => {
         console.log("Task saved via form:", savedTask);
         setIsDialogOpen(false); // Close dialog

         // Update the local task state to reflect the change immediately
         setTasks(currentTasks => {
            const existingIndex = currentTasks.findIndex(t => t.id === savedTask.id);
            if (existingIndex !== -1) {
                // Update existing task in the list
                console.log(`Updating task ${savedTask.id} in client state.`);
                const updatedTasks = [...currentTasks];
                updatedTasks[existingIndex] = savedTask;
                return updatedTasks;
            } else {
                // Add new task to the list (append for now)
                console.log(`Adding new task ${savedTask.id} to client state.`);
                // Note: Order might not be perfect here, depends on where new tasks should appear by default
                return [...currentTasks, savedTask];
            }
        });
         // Show success feedback
         toast({ title: "Success", description: `Task "${savedTask.title}" saved.` });
         // Revalidation should happen via server action, but refresh can be fallback
         // router.refresh(); // Optional: manually trigger refresh
    };

    // Handler for task deletion trigger from TaskCard
    const handleDeleteTask = (taskId: number) => {
        // TODO: Implement confirmation dialog here
        // Example: if (!window.confirm("Are you sure you want to delete this task?")) return;
        
        setIsDeleting(taskId); // Show loading state for this task
        const formData = new FormData();
        formData.append('taskId', String(taskId));
        formData.append('projectId', String(project.id));
        deleteAction(formData); // Trigger the delete server action
    };

    // Effect to handle delete action completion
    useEffect(() => {
        if (deleteFormState?.success === true && deleteFormState.deletedTaskId) {
            const deletedId = deleteFormState.deletedTaskId;
            console.log("Task deleted successfully:", deletedId);
            toast({ title: "Success", description: deleteFormState.message || "Task deleted." });
            // Remove task from client state
            setTasks(currentTasks => currentTasks.filter(t => t.id !== deletedId));
            setIsDeleting(null); // Clear deleting state
            // Reset form state if needed, although not strictly necessary for delete
            // deleteAction(null); // Not how useFormState reset works
        } else if (deleteFormState?.success === false) {
            console.error("Error deleting task:", deleteFormState.error);
            toast({ variant: "destructive", title: "Error", description: deleteFormState.error || "Failed to delete task." });
            setIsDeleting(null); // Clear deleting state
        }
    }, [deleteFormState, toast]);

    // Handler for task list updates originating from TaskViewManager (e.g., DND)
    const handleTasksUpdatedByManager = (updatedTasks: DbTask[]) => {
        // Update the state managed by this parent component
        console.log("Updating tasks state from TaskViewManager (DND)");
        setTasks(updatedTasks);
        // Server action was already called within TaskViewManager's DND handler
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
             <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                 <div>
                     {/* Use project data passed as props */}
                     <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Tasks</h1>
                     <p className="mt-1 text-gray-500 dark:text-gray-400">Track progress for project: {project.name}</p>
                 </div>
                 <div className="flex flex-shrink-0 space-x-2">
                     {/* Add Task Button triggers Dialog */}
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                          <DialogTrigger asChild>
                              {/* Add onClick back to ensure state is set before dialog opens */}
                              <Button onClick={handleAddTaskClick}>
                                  <PlusCircle className="mr-2 h-4 w-4" /> Add Task
                              </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                  <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
                                  <DialogDescription>
                                      {editingTask ? 'Make changes to your existing task.' : 'Fill in the details for the new task.'}
                                  </DialogDescription>
                              </DialogHeader>
                               {/* Render TaskForm inside the Dialog */}
                               {/* Ensure projectId is passed correctly */}
                               <TaskForm
                                  projectId={project.id}
                                  task={editingTask}
                                  onOpenChange={setIsDialogOpen}
                                  onTaskSaved={handleTaskSaved} // Use the updated handler
                               />
                          </DialogContent>
                      </Dialog>
                 </div>
             </div>

             {/* Task Content Area - Render TaskViewManager */}
             {/* Pass down the current 'tasks' state and the callback handler */}
             <TaskViewManager
                 projectId={project.id}
                 tasks={tasks}
                 onTasksChange={handleTasksUpdatedByManager}
                 onEditTask={handleEditTaskClick} // Pass the actual edit handler
                 onDeleteTask={handleDeleteTask} // Pass the delete handler
             />

             {/* Placeholder comment reminding about prop drilling */}
             <p className="text-xs text-center text-gray-400 mt-4">Note: Delete button added, ensure `onDeleteTask` prop is passed down to TaskCard.</p>

        </div>
    );
}
