
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, getYear, setMonth, setYear } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';

interface MonthYearPickerProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

export function MonthYearPicker({ date, onDateChange }: MonthYearPickerProps) {
  const currentYear = getYear(new Date());
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleMonthChange = (value: string) => {
    const monthIndex = months.findIndex(month => month === value);
    if (monthIndex !== -1) {
      const newDate = setMonth(date, monthIndex);
      onDateChange(newDate);
    }
  };

  const handleYearChange = (value: string) => {
    const year = parseInt(value);
    if (!isNaN(year)) {
      const newDate = setYear(date, year);
      onDateChange(newDate);
    }
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(date);
    newDate.setMonth(date.getMonth() - 1);
    onDateChange(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(date);
    newDate.setMonth(date.getMonth() + 1);
    onDateChange(newDate);
  };

  const goToCurrentMonth = () => {
    onDateChange(new Date());
  };

  return (
    <div className="flex flex-col space-y-2 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-5 w-5 text-orange-500" />
          <span className="font-medium">Monthly View</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={goToCurrentMonth}
          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
        >
          Today
        </Button>
      </div>
      
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={goToPreviousMonth}
          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center space-x-2">
          <Select value={format(date, 'MMMM')} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={format(date, 'yyyy')} onValueChange={handleYearChange}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={goToNextMonth}
          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
