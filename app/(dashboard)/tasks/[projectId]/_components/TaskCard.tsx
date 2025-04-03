import React from 'react';
import { DbTask } from '@/lib/schema';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge'; // Assuming shadcn Badge
import { formatDistanceToNow } from 'date-fns'; // For relative dates: npm install date-fns
import { Pencil, Trash2 } from 'lucide-react'; // Import Pencil and Trash2 icons
import { Button } from '@/components/ui/button';

interface TaskCardProps {
    task: DbTask;
    onEdit: (task: DbTask) => void;
    onDelete: (taskId: number) => void;
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const isOverdue = dueDate && dueDate < new Date();

    const handleEditClick = (event: React.MouseEvent) => {
        event.stopPropagation(); 
        onEdit(task); 
    };

    const handleDeleteClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        console.log("Attempting delete for task:", task.id); 
        onDelete(task.id);
    };

    return (
        <Card className="mb-2 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow duration-150 bg-white dark:bg-gray-800 relative group">
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleEditClick}
                aria-label="Edit task"
            >
                <Pencil className="h-3 w-3" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-8 h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleDeleteClick}
                aria-label="Delete task"
            >
                <Trash2 className="h-3 w-3" />
            </Button>

            <CardHeader className="p-3 pr-16">
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
