"use client"; // Requires client-side interactivity

import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Adjust path based on your shadcn setup
import { Info } from 'lucide-react'; // Example icon

interface TooltipHintProps {
  label: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  asChild?: boolean;
  children?: React.ReactNode; // Optional trigger override
}

export function TooltipHint({
  label,
  side = 'top',
  asChild = false,
  children
}: TooltipHintProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild={asChild}>
          {children ?? ( // Use provided children or default icon
            <button type="button" className="ml-1 cursor-help opacity-70 hover:opacity-100">
              <Info className="h-4 w-4" />
              <span className="sr-only">More info</span>
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs bg-gray-800 text-white p-2 rounded text-sm shadow-lg">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
