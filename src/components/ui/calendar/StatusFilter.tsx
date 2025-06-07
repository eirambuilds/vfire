
import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, CheckCircle, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { EventStatus } from '@/types/inspection';

// Define available statuses matching our EventStatus type
const statuses: { value: EventStatus; label: string; color: string }[] = [
  {
    value: "pending",
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "scheduled",
    label: "Scheduled",
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "inspected",
    label: "Inspected",
    color: "bg-indigo-100 text-indigo-800",
  },
  {
    value: "approved",
    label: "Approved",
    color: "bg-green-100 text-green-800",
  },
  {
    value: "rejected",
    label: "Rejected",
    color: "bg-red-100 text-red-800",
  },
];


interface StatusFilterProps {
  selectedStatuses: EventStatus[];
  onSelectionChange: (statuses: EventStatus[]) => void;
}

export function StatusFilter({ selectedStatuses, onSelectionChange }: StatusFilterProps) {
  const toggleStatus = (status: EventStatus) => {
    if (selectedStatuses.includes(status)) {
      onSelectionChange(selectedStatuses.filter(s => s !== status));
    } else {
      onSelectionChange([...selectedStatuses, status]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Filter className="mr-2 h-4 w-4" />
          {selectedStatuses.length > 0 ? (
            <>
              <span>Filters</span>
              <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal">
                {selectedStatuses.length}
              </Badge>
            </>
          ) : (
            <span>Filter by status</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search status..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {statuses.map((status) => (
                <CommandItem
                  key={status.value}
                  onSelect={() => toggleStatus(status.value)}
                >
                  <div
                    className={cn(
                      "mr-2 h-4 w-4 flex items-center justify-center rounded-sm border border-primary",
                      selectedStatuses.includes(status.value)
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible"
                    )}
                  >
                    <CheckCircle className="h-3 w-3" />
                  </div>
                  <span>{status.label}</span>
                  <Badge variant="outline" className={cn("ml-auto", status.color)}>
                    {status.label}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <div className="border-t p-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onSelectionChange([])}
            >
              Clear filters
            </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
