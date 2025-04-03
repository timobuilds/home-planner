import React from 'react';
import { DbTask, taskStatusEnum } from '@/lib/schema';
import { TaskCard } from './TaskCard';
import { TaskSortableItem } from './TaskSortableItem';
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    DropAnimation,
    PointerSensor,
    useSensor,
    useSensors,
    defaultDropAnimationSideEffects,
    closestCorners
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';

// Define the structure for tasks grouped by status
type TasksByStatusMap = Record<typeof taskStatusEnum.enumValues[number], DbTask[]>;

interface TaskBoardProps {
    tasksByStatus: TasksByStatusMap;
    projectId: number; // May be needed for actions
    onUpdate: (updatedTasks: DbTask[]) => void; // Function to call after DND or updates
    onEditTask: (task: DbTask) => void; // Add prop for edit handler
    onDeleteTask: (taskId: number) => void; // Add onDeleteTask prop
}

// Define the columns based on the enum order (customize order if needed)
const boardColumns: { id: typeof taskStatusEnum.enumValues[number]; title: string }[] = [
    { id: 'todo', title: 'To Do' },
    { id: 'inprogress', title: 'In Progress' },
    { id: 'done', title: 'Done' },
    // Add 'archived' if you want it as a visible column
    // { id: 'archived', title: 'Archived' },
];

// --- Helper functions --- 
const findTaskById = (tasksMap: TasksByStatusMap, taskId: number): DbTask | undefined => {
    return Object.values(tasksMap).flat().find(task => task.id === taskId);
};
const findTaskStatus = (tasksMap: TasksByStatusMap, taskId: number): typeof taskStatusEnum.enumValues[number] | undefined => {
    for (const status of boardColumns.map(col => col.id)) {
        // Use optional chaining for safety
        if (tasksMap[status]?.some(task => task.id === taskId)) {
            return status;
        }
    }
    return undefined;
};

// Configuration for the drop animation
const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: { active: { opacity: '0.5' } },
    }),
};

export function TaskBoard({ tasksByStatus: initialTasksByStatus, projectId, onUpdate, onEditTask, onDeleteTask }: TaskBoardProps) {
    const [tasksByStatus, setTasksByStatus] = React.useState<TasksByStatusMap>(initialTasksByStatus);
    const [activeTask, setActiveTask] = React.useState<DbTask | null>(null);
    const [activeTaskId, setActiveTaskId] = React.useState<number | null>(null);

    // --- Re-add Sensors --- 
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 10 },
        })
    );

    // --- Re-add Drag Event Handlers --- 
    function handleDragStart(event: DragStartEvent) {
        const taskIdNum = Number(String(event.active.id).replace('task-', ''));
        setActiveTaskId(taskIdNum);
        setActiveTask(findTaskById(tasksByStatus, taskIdNum) ?? null);
        console.log(`Drag Start: task-${taskIdNum}`);
    }

    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over || activeTaskId === null) return;
        const activeId = String(active.id);
        const overId = String(over.id);
        if (!activeId.startsWith('task-')) return;

        const activeTaskOriginalStatus = findTaskStatus(tasksByStatus, activeTaskId);
        const overStatus = overId.startsWith('task-')
             ? findTaskStatus(tasksByStatus, Number(overId.replace('task-', '')))
            : (overId.startsWith('column-') ? overId.replace('column-', '') as typeof taskStatusEnum.enumValues[number] : undefined);
        
        if (!activeTaskOriginalStatus || !overStatus || activeTaskOriginalStatus === overStatus) return;

        setTasksByStatus((currentTasks) => {
            const updatedTasks = { ...currentTasks };
            const taskToMove = findTaskById(updatedTasks, activeTaskId);
            if (!taskToMove) return currentTasks;
            updatedTasks[activeTaskOriginalStatus] = updatedTasks[activeTaskOriginalStatus]?.filter(t => t.id !== activeTaskId) ?? [];
            const overTaskIndex = updatedTasks[overStatus]?.findIndex(t => `task-${t.id}` === overId);
            const insertIndex = overTaskIndex !== -1 ? overTaskIndex : updatedTasks[overStatus]?.length ?? 0;
            updatedTasks[overStatus] = [
                ...(updatedTasks[overStatus]?.slice(0, insertIndex) ?? []),
                { ...taskToMove, status: overStatus },
                ...(updatedTasks[overStatus]?.slice(insertIndex) ?? []),
            ];
            updatedTasks[overStatus] = updatedTasks[overStatus]?.map((task, index) => ({ ...task, order: index })) ?? [];
            return updatedTasks;
       });
    }

    function handleDragEnd(event: DragEndEvent) {
         const { active, over } = event;
         setActiveTaskId(null);
         setActiveTask(null); // Clear activeTask too

         if (!over) return;
         const activeId = String(active.id);
         const overId = String(over.id);
         if (!activeId.startsWith('task-')) return;

         const taskId = Number(activeId.replace('task-', ''));
         const finalStatus = findTaskStatus(tasksByStatus, taskId);
         if (!finalStatus) return;

         const taskListInFinalStatus = tasksByStatus[finalStatus] || [];
         const activeIndex = taskListInFinalStatus.findIndex(t => t.id === taskId);
         const overItemId = overId.startsWith('task-') ? overId : null;
         const overIndex = overItemId ? taskListInFinalStatus.findIndex(t => `task-${t.id}` === overItemId) : -1;

         if (activeIndex !== overIndex && overIndex !== -1) {
             // Handle reordering within the same column if necessary (arrayMove)
             // This might be redundant if handleDragOver handled it perfectly, but safer to recalculate
             setTasksByStatus((current) => {
                 const updated = { ...current };
                 updated[finalStatus] = arrayMove(current[finalStatus] || [], activeIndex, overIndex);
                 updated[finalStatus] = updated[finalStatus]?.map((task, index) => ({ ...task, order: index })) ?? [];
                 return updated;
             });
         }
        
         // Final state includes reordered items + status changes from dragOver
         const finalFlattenedTasks = Object.values(tasksByStatus).flat();
         const tasksWithUpdatedOrderAndStatus = finalFlattenedTasks.map(task => {
             const status = findTaskStatus(tasksByStatus, task.id);
             const order = tasksByStatus[status!]?.findIndex(t => t.id === task.id) ?? 0;
             return { ...task, status: status!, order: order };
         });

         onUpdate(tasksWithUpdatedOrderAndStatus);
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners} // Strategy for detecting collisions
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {boardColumns.map((column) => (
                    <div key={`column-${column.id}`} className="flex flex-col rounded-lg bg-gray-100 p-3 dark:bg-gray-900">
                        <h3 className="mb-3 text-sm font-semibold uppercase text-gray-600 dark:text-gray-400">
                            {column.title} ({tasksByStatus[column.id]?.length || 0})
                        </h3>

                        <SortableContext
                            items={(tasksByStatus[column.id] || []).map(task => `task-${task.id}`)}
                            strategy={verticalListSortingStrategy} // How items are arranged
                        >
                            <div className="flex-grow space-y-2 overflow-y-auto min-h-[100px]">
                                {(tasksByStatus[column.id] || []).length > 0 ? (
                                    (tasksByStatus[column.id] || []).map((task) => (
                                        <TaskSortableItem
                                            key={`task-${task.id}`}
                                            id={`task-${task.id}`}
                                            task={task}
                                            onEdit={onEditTask}
                                            onDeleteTask={onDeleteTask}
                                        >
                                            <TaskCard task={task} onEdit={() => onEditTask(task)} onDelete={() => onDeleteTask(task.id)} />
                                        </TaskSortableItem>
                                    ))
                                ) : (
                                    <div className="flex h-20 items-center justify-center text-xs text-gray-400 dark:text-gray-600">
                                        Drop tasks here or click &apos;+&apos; to add.
                                    </div>
                                )}
                            </div>
                        </SortableContext>
                    </div>
                ))}
            </div>
            <DragOverlay dropAnimation={dropAnimation}>
                {activeTask ? <TaskCard task={activeTask} onEdit={() => {}} onDelete={() => {}} /> : null}
            </DragOverlay>
        </DndContext>
    );
}
