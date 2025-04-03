'use client'; // This component manages state and interacts with client-side libraries

import React, { useState, /* useEffect, */ useMemo, useEffect, useRef } from 'react'; // Comment out useEffect
import { DbTask, taskStatusEnum } from '@/lib/schema'; // Import task type and enum
import { Button } from '@/components/ui/button';
import { List, LayoutGrid } from 'lucide-react'; // Icons for toggle
import { TaskList } from './TaskList'; // We'll create this
import { TaskBoard } from './TaskBoard'; // We'll create this
// import { Skeleton } from '@/components/ui/skeleton'; // No longer needed here
import { syncTaskBoardStateAction } from '../actions'; // Import the new action
import { useFormState } from 'react-dom'; // Removed useFormStatus for now
import { type ActionState } from '../actions'; // Import the shared state type

// TODO: Define types for Server Actions later
// import { getProjectTasks } from '../actions';

interface TaskViewManagerProps {
    projectId: number;
    tasks: DbTask[]; // Receive tasks as a prop directly
    // Callback to notify parent of changes from DND or other internal updates
    onTasksChange: (updatedTasks: DbTask[]) => void;
    onEditTask: (task: DbTask) => void; // Add prop for edit handler
    onDeleteTask: (taskId: number) => void; // Add onDeleteTask prop
}

// Type for the active view
type TaskViewMode = 'list' | 'board';

export function TaskViewManager({ projectId, tasks, onTasksChange, onEditTask, onDeleteTask }: TaskViewManagerProps) {
    const [viewMode, setViewMode] = useState<TaskViewMode>('board'); // Default to board view

    // Ref for the hidden form
    const formRef = useRef<HTMLFormElement>(null);
    // Ref for the hidden input holding the tasks data
    const tasksInputRef = useRef<HTMLInputElement>(null);

    // Use the imported ActionState type for the initial state
    const initialState: ActionState = null; 
    const [syncFormState, formAction] = useFormState(syncTaskBoardStateAction, initialState);
    // Get pending status - Requires reading from useFormStatus INSIDE the form
    // We can show a general loading state based on form submission start/end instead for now
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Memoize tasks grouped by status for the board view
    const tasksByStatus = useMemo(() => {
        const grouped: Record<typeof taskStatusEnum.enumValues[number], DbTask[]> = {
            todo: [],
            inprogress: [],
            done: [],
            archived: [],
        };
        tasks.forEach(task => {
            if (grouped[task.status]) {
                grouped[task.status].push(task);
            } else {
                grouped.todo.push(task); // Fallback to todo if status is unexpected
            }
        });
        // Sort tasks within each status group by the 'order' field
        for (const status in grouped) {
             grouped[status as keyof typeof grouped].sort((a, b) => a.order - b.order);
        }
        return grouped;
    }, [tasks]);
    // Prevent tasksByStatus from being marked as unused immediately
    // console.log('Tasks grouped by status (for board view):', tasksByStatus); 


    // Handler for task updates FROM TaskBoard (DND end)
    const handleUpdateTasks = (updatedTasksSnapshot: DbTask[]) => {
        setIsSubmitting(true);

        // 1. NO LONGER Notify the parent component immediately
        // The parent state will be updated when the form action completes and revalidation occurs
        // OR if we explicitly call onTasksChange in the useEffect based on syncFormState success
        // onTasksChange(updatedTasksSnapshot);

        // 2. Prepare data and submit the form for server action
        const tasksToSync = updatedTasksSnapshot.map(task => ({
            id: task.id, status: task.status, order: task.order,
        }));
        if (tasksInputRef.current && formRef.current) {
            tasksInputRef.current.value = JSON.stringify(tasksToSync);
            console.log("Submitting form to syncTaskBoardStateAction from TaskViewManager");
            formRef.current.requestSubmit();
        } else {
            console.error("Form or input ref not found in TaskViewManager!");
            setIsSubmitting(false);
        }
    };

    // Effect to handle form submission completion
    useEffect(() => {
        if (syncFormState !== initialState) { setIsSubmitting(false); }
        if (syncFormState?.success === true) {
            // Optionally notify parent on SUCCESS to update state immediately 
            // *if* revalidation isn't fast enough or if optimistic UI is desired
            // This requires the action to return the updated tasks list, which syncTaskBoardStateAction doesn't currently do.
            // If the action *did* return the updated tasks: 
            // if (syncFormState.tasks) { onTasksChange(syncFormState.tasks); } 
            console.log("Action Success:", syncFormState.message);
            // toast({ title: "Success", description: syncFormState.message });
        } else if (syncFormState?.success === false && syncFormState.error) {
             console.error("Action Error:", syncFormState.error);
             // toast({ variant: "destructive", title: "Error", description: syncFormState.error });
             // Revert optimistic DND move? Requires more state tracking.
        }
    }, [syncFormState, initialState, onTasksChange]); // Added onTasksChange to dependencies


    return (
        <div className="space-y-4">
            {/* View Mode Toggle */}
            <div className="flex justify-end space-x-2">
                <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    aria-pressed={viewMode === 'list'}
                 >
                    <List className="mr-2 h-4 w-4" /> List
                </Button>
                <Button
                    variant={viewMode === 'board' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('board')}
                    aria-pressed={viewMode === 'board'}
                 >
                     <LayoutGrid className="mr-2 h-4 w-4" /> Board
                </Button>
            </div>

            {/* Loading State */}
            {/* {loading && (
                 <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-48 w-full" />
                 </div>
             )} */}

            {/* Hidden form to trigger the server action */}
            <form ref={formRef} action={formAction} className="hidden">
                <input type="hidden" name="projectId" value={projectId} />
                {/* Ref is attached to the input to update its value */}
                <input ref={tasksInputRef} type="hidden" name="tasksToSync" /> 
            </form>

             {/* Display potential form errors */} 
             {/* Simplify error display to focus on the general error message for now */}
             {syncFormState?.success === false && syncFormState.error && (
                <div className="text-red-500 text-sm p-2 border border-red-200 bg-red-50 rounded">
                    {syncFormState.error} 
                </div>
             )}

            {/* Conditional Rendering of Views */}
            {viewMode === 'list' && (
                 <TaskList tasks={tasks} />
            )}

            {viewMode === 'board' && (
                 <TaskBoard
                    tasksByStatus={tasksByStatus}
                    onUpdate={handleUpdateTasks}
                    projectId={projectId}
                    onEditTask={onEditTask}
                    onDeleteTask={onDeleteTask}
                 />
            )}

             {/* Global Loading Indicator using local state */}
             {isSubmitting && (
                <div className="fixed bottom-4 right-4 bg-gray-800 text-white text-sm px-3 py-1 rounded shadow-lg z-50 animate-pulse">
                    Syncing...
                </div>
             )}
        </div>
    );
}
