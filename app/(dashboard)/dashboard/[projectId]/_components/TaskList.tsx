import React from 'react';
import { DbTask } from '@/lib/schema';
import { TaskCard } from './TaskCard'; // Import the card component

interface TaskListProps {
    tasks: DbTask[];
    // onUpdate: (updatedTasks: DbTask[]) => void; // Prop for handling updates (e.g., inline edits) - Add later
}

export function TaskList({ tasks }: TaskListProps) {

    if (tasks.length === 0) {
        return (
            <div className="mt-6 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center bg-gray-50 dark:bg-gray-800/50">
                <p className="text-gray-500 dark:text-gray-400">No tasks found for the current filters or status.</p>
                 {/* TODO: Add a prominent "Add Task" button here? */}
            </div>
        );
    }

    // TODO: Add sorting and filtering controls here

    return (
        <div className="space-y-3">
            {/* Optional: Add table headers for list view if desired */}
            {/* <div className="grid grid-cols-...?"> Header names </div> */}

            {tasks.map((task) => (
                // Using TaskCard for consistency, but could render as simple rows too
                <TaskCard key={task.id} task={task} />
                // Alternative: Render simple list item or table row
                // <div key={task.id} className="p-2 border rounded">{task.title}</div>
            ))}
        </div>
    );
}
