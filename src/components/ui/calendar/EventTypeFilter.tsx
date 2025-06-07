
import React from 'react';
import { CheckIcon, Filter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ApplicationType } from '@/types/inspection';

interface EventTypeFilterProps {
  selectedTypes: string[];
  onSelectionChange: (types: string[]) => void;
}

export function EventTypeFilter({ selectedTypes, onSelectionChange }: EventTypeFilterProps) {
  const eventTypes = [
    { id: 'FSEC', label: 'FSEC', color: 'blue' },
    { id: 'FSIC-Occupancy', label: 'FSIC (Occupancy)', color: 'green' },
    { id: 'FSIC-Business', label: 'FSIC (Business)', color: 'purple' },
    { id: 'deadline', label: 'Deadline', color: 'red' },
    { id: 'meeting', label: 'Meeting', color: 'amber' },
  ];
  
  const toggleType = (typeId: string) => {
    if (selectedTypes.includes(typeId)) {
      onSelectionChange(selectedTypes.filter(id => id !== typeId));
    } else {
      onSelectionChange([...selectedTypes, typeId]);
    }
  };
  
  const clearAll = () => {
    onSelectionChange([]);
  };
  
  const selectAll = () => {
    onSelectionChange(eventTypes.map(type => type.id));
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Filter className="h-4 w-4" />
          <span>Event Types</span>
          {selectedTypes.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {selectedTypes.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Event Types</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {eventTypes.map(type => (
          <DropdownMenuCheckboxItem
            key={type.id}
            checked={selectedTypes.includes(type.id)}
            onCheckedChange={() => toggleType(type.id)}
            className="capitalize"
          >
            <div className="flex items-center">
              <div 
                className={`w-3 h-3 rounded-full mr-2 bg-${type.color}-500`}
              ></div>
              {type.label}
            </div>
          </DropdownMenuCheckboxItem>
        ))}
        
        <DropdownMenuSeparator />
        <div className="flex justify-between px-2 py-1.5">
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-auto text-xs">
            Clear All
          </Button>
          <Button variant="ghost" size="sm" onClick={selectAll} className="h-auto text-xs">
            Select All
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
