import React from 'react';
import { DbTask } from '@/lib/schema';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge'; // Assuming shadcn Badge
import { formatDistanceToNow } from 'date-fns'; // For relative dates: npm install date-fns

interface TaskCardProps {
    task: DbTask;
    // Add props for event handlers like onClick, onEdit, etc.
}

export function TaskCard({ task }: TaskCardProps) {
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const isOverdue = dueDate && dueDate < new Date();

    return (
        <Card className="mb-2 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow duration-150 bg-white dark:bg-gray-800">
             {/* Add drag handle if needed for dnd-kit */}
            <CardHeader className="p-3">
                 <CardTitle className="text-sm font-medium line-clamp-2">{task.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2 text-xs">
                {task.description && (
                    <p className="text-gray-600 dark:text-gray-400 line-clamp-3">{task.description}</p>
                )}
                 <div className="flex justify-between items-center text-gray-500 dark:text-gray-500">
                     <span>ID: T-{task.id}</span>
                    {dueDate && (
                        <Badge variant={isOverdue ? "destructive" : "outline"} className="text-xs">
                            Due: {formatDistanceToNow(dueDate, { addSuffix: true })}
                        </Badge>
                    )}
                 </div>
                 {/* Add Assignee Avatar/Name here later */}
            </CardContent>
        </Card>
    );
}
