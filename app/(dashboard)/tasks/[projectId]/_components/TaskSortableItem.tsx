import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DbTask } from '@/lib/schema'; // Import DbTask type

interface TaskSortableItemProps {
    id: string;
    task: DbTask; // Pass the task data itself
    onEdit: (task: DbTask) => void; // Accept the onEdit handler
    onDeleteTask: (taskId: number) => void; // Add onDeleteTask prop here
    children: React.ReactNode; // Keep children prop if TaskCard is passed this way
}

export function TaskSortableItem({ id, task, onEdit, onDeleteTask, children }: TaskSortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // Clone the child element (TaskCard) and add the necessary props
     const childWithProps = React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, { 
            task: task, 
            onEdit: () => onEdit(task), 
            onDelete: () => onDeleteTask(task.id) // Map onDeleteTask to onDelete prop of TaskCard
          }) 
        : children;


    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
             {/* Render the child (TaskCard) with the added props */}
             {childWithProps}
        </div>
    );
}
