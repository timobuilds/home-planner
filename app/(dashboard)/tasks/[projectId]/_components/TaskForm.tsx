'use client';

import React, { useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"; // For status
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Import Popover
import { Calendar } from "@/components/ui/calendar"; // Import Calendar
import { CalendarIcon } from "lucide-react"; // Import Icon
import { cn } from "@/lib/utils"; // Import cn utility (from shadcn setup)
import { format } from "date-fns"; // Import format
// Import Dialog components if managing state here, or receive props if managed by parent
// import { DialogFooter } from "@/components/ui/dialog";

import { DbTask, taskStatusEnum } from '@/lib/schema';
import { createTaskAction, updateTaskDetailsAction } from '../actions'; // Import server actions

// Validation schema using Zod
const TaskFormSchema = z.object({
    id: z.number().optional(), // Present only when editing
    projectId: z.number().positive(),
    title: z.string().min(3, "Title must be at least 3 characters").max(100),
    description: z.string().max(500).optional(),
    status: z.enum(taskStatusEnum.enumValues),
    dueDate: z.date().optional().nullable(), // Add dueDate
    // Add fields for due date, assignee, priority later
});

type TaskFormData = z.infer<typeof TaskFormSchema>;

interface TaskFormProps {
    projectId: number;
    task?: DbTask | null; // Task data if editing, null/undefined if creating
    onOpenChange: (isOpen: boolean) => void; // Callback to close the dialog
    onTaskSaved: (task: DbTask) => void; // Callback after successful save
}

export function TaskForm({ projectId, task, onOpenChange, onTaskSaved }: TaskFormProps) {
    const [isPending, startTransition] = useTransition(); // For loading state on submit

    // React Hook Form setup
    const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<TaskFormData>({
        resolver: zodResolver(TaskFormSchema),
        defaultValues: {
            projectId: projectId,
            id: task?.id,
            title: task?.title || '',
            description: task?.description || '',
            status: task?.status || 'todo', // Default to 'todo' for new tasks
            dueDate: task?.dueDate ? new Date(task.dueDate) : null, // Initialize date
        },
    });

    // Watch dueDate value for the Calendar component
    const currentDueDate = watch("dueDate");

    // Reset form if task prop changes (e.g., opening dialog for different task)
    useEffect(() => {
        reset({
            projectId: projectId,
            id: task?.id,
            title: task?.title || '',
            description: task?.description || '',
            status: task?.status || 'todo',
            dueDate: task?.dueDate ? new Date(task.dueDate) : null,
        });
    }, [task, projectId, reset]);

    const processForm = async (data: TaskFormData) => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append('projectId', String(data.projectId));
            formData.append('title', data.title);
            if (data.description) formData.append('description', data.description);
            formData.append('status', data.status);
            // Format date as ISO string for formData, handle null
            if (data.dueDate) formData.append('dueDate', data.dueDate.toISOString());

            let result;
            if (task?.id) {
                // Editing existing task
                console.log("Updating task:", task.id);
                formData.append('taskId', String(task.id));
                result = await updateTaskDetailsAction(null, formData); // Pass null for prevState for now
            } else {
                // Creating new task
                console.log("Creating new task");
                result = await createTaskAction(null, formData); // Pass null for prevState for now
            }

            console.log("Action Result:", result);
            if (result?.success && result.task) {
                onTaskSaved(result.task as DbTask); // Pass saved task back
                onOpenChange(false); // Close dialog on success
                // TODO: Show success toast
            } else {
                // TODO: Show error toast/message from result.error
                console.error("Form submission error:", result?.error);
            }
        });
    };


    return (
        <form onSubmit={handleSubmit(processForm)} className="space-y-4">
            <input type="hidden" {...register("projectId")} />
            {task?.id && <input type="hidden" {...register("id")} />}

            {/* Title */}
            <div className="space-y-1">
                <Label htmlFor="title">Title</Label>
                <Input id="title" {...register("title")} placeholder="Task title..." />
                {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div className="space-y-1">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea id="description" {...register("description")} placeholder="Add more details..." rows={3} />
                {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
            </div>

            {/* Status */}
             <div className="space-y-1">
                <Label htmlFor="status">Status</Label>
                 {/* Need to use Controller for shadcn Select with react-hook-form */}
                 <Select
                    defaultValue={task?.status || 'todo'}
                    onValueChange={(value) => reset({ ...watch(), status: value as typeof taskStatusEnum.enumValues[number] })} // Update form state on change
                 >
                    <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        {taskStatusEnum.enumValues.map(status => (
                            <SelectItem key={status} value={status} className="capitalize">
                                {status}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 {/* Register hidden input to capture value for validation, though Controller is better */}
                 <input type="hidden" {...register("status")} />
                 {errors.status && <p className="text-xs text-red-600">{errors.status.message}</p>}
            </div>

             {/* Due Date Picker */}
             <div className="space-y-1">
                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            id="dueDate"
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !currentDueDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {currentDueDate ? format(currentDueDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={currentDueDate ?? undefined}
                            onSelect={(date) => setValue("dueDate", date instanceof Date ? date : null, { shouldValidate: true })}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
                 {/* Hidden input for RHF/Zod validation - consider Controller for better integration */}
                 <input type="hidden" {...register("dueDate")} /> 
                 {errors.dueDate && <p className="text-xs text-red-600">{errors.dueDate.message}</p>}
            </div>

             {/* TODO: Add Assignee Selector, Priority fields here */}

            {/* Form Actions */}
             <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                    {isPending ? (task?.id ? 'Saving...' : 'Creating...') : (task?.id ? 'Save Changes' : 'Create Task')}
                </Button>
             </div>
        </form>
    );
}
