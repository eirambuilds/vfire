
import React, { useState, useEffect } from 'react';
import { format, isAfter, isBefore, isToday } from 'date-fns';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { DateRange } from 'react-day-picker';
import { Label } from '@/components/ui/label';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Shield } from 'lucide-react';
import { InspectorDutyStatus, Profile } from '@/types/inspection';

// Add this helper function to subtract 1 day when reading from DB
const unadjustDate = (dateString: string | null): Date | null => {
  if (!dateString) return null;
  const date = new Date(dateString);
  date.setDate(date.getDate() - 1); // Subtract 1 day to match original selection
  return date;
};

interface DutyStatusCardProps {
  userId: string;
  dutyStatus: InspectorDutyStatus;
  setDutyStatus: (status: InspectorDutyStatus) => void;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  onDutyStatusToggle?: (newStatus: InspectorDutyStatus) => Promise<void>;
}

export const DutyStatusCard: React.FC<DutyStatusCardProps> = ({
  userId,
  dutyStatus: initialDutyStatus,
  setDutyStatus: setParentDutyStatus,
  dateRange: initialDateRange,
  setDateRange: setParentDateRange,
  onDutyStatusToggle
}) => {
  const [localDutyStatus, setLocalDutyStatus] = useState<InspectorDutyStatus>(initialDutyStatus);
  const [localDateRange, setLocalDateRange] = useState<DateRange | undefined>(initialDateRange);
  const [isEditing, setIsEditing] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!dataFetched) {
      setLocalDutyStatus(initialDutyStatus);
      setLocalDateRange(initialDateRange);
    }
  }, [initialDutyStatus, initialDateRange, dataFetched]);

  useEffect(() => {
    const fetchDutyStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('duty_status, availability_start_date, availability_end_date')
          .eq('id', userId)
          .single();

        if (error) throw error;

        console.log('Fetched profile data:', data);

        if (data) {
          const profileData = data as Partial<Profile>;
          const fetchedDutyStatus: InspectorDutyStatus = (profileData.duty_status as InspectorDutyStatus) || 'off_duty';
          
          setLocalDutyStatus(fetchedDutyStatus);
          setParentDutyStatus(fetchedDutyStatus);

          // Use unadjustDate to subtract 1 day from DB values
          const startDate = unadjustDate(profileData.availability_start_date);
          const endDate = unadjustDate(profileData.availability_end_date);

          console.log('Parsed startDate:', startDate, 'endDate:', endDate);

          if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            const newRange: DateRange = { from: startDate, to: endDate };
            setLocalDateRange(newRange);
            setParentDateRange(newRange);
            console.log('Set dateRange from DB:', newRange);
          } else if (fetchedDutyStatus === 'off_duty') {
            setLocalDateRange(undefined);
            setParentDateRange(undefined);
            console.log('Cleared dateRange for off_duty');
          } else {
            console.warn('Invalid dates in database:', { startDate, endDate });
          }
          
          setDataFetched(true);
        } else {
          console.warn('No profile data returned for userId:', userId);
          setLocalDutyStatus('off_duty');
          setParentDutyStatus('off_duty');
          setLocalDateRange(undefined);
          setParentDateRange(undefined);
          setDataFetched(true);
        }
      } catch (error) {
        console.error('Error fetching duty status:', error);
        toast({
          title: "Error",
          description: "Failed to load duty status.",
          variant: "destructive",
        });
        setLocalDutyStatus('off_duty');
        setParentDutyStatus('off_duty');
        setLocalDateRange(undefined);
        setParentDateRange(undefined);
        setDataFetched(true);
      }
    };

    fetchDutyStatus();
  }, [userId, setParentDutyStatus, setParentDateRange, toast]);

  const isDateRangeValid = localDateRange?.from && localDateRange?.to;
  
  const isAvailabilityExpired = () => !localDateRange?.to ? false : isAfter(new Date(), localDateRange.to);
  
  const isWithinAvailabilityPeriod = () => {
    if (!localDateRange?.from || !localDateRange?.to) return false;
    const now = new Date();
    return (isAfter(now, localDateRange.from) || isToday(localDateRange.from)) && 
           (isBefore(now, localDateRange.to) || isToday(localDateRange.to));
  };

  // Add 1 day when saving to DB
  const adjustDate = (date: Date | undefined): string | null => {
    if (!date) return null;
    const adjustedDate = new Date(date);
    adjustedDate.setDate(adjustedDate.getDate());
    return adjustedDate.toISOString();
  };

  const handleDutyToggle = async (newStatus: boolean) => {
    const targetStatus: InspectorDutyStatus = newStatus ? 'on_duty' : 'off_duty';

    if (newStatus) {
      if (!isDateRangeValid) {
        toast({ title: "Date Range Required", description: "Please set both dates.", variant: "destructive" });
        setIsEditing(true);
        return;
      }
      if (isAvailabilityExpired()) {
        toast({ title: "Availability Expired", description: "Update to future dates.", variant: "destructive" });
        setIsEditing(true);
        return;
      }
      if (!isWithinAvailabilityPeriod() && localDateRange?.from && isAfter(localDateRange.from, new Date())) {
        toast({
          title: "Future Availability",
          description: `Availability starts on ${format(localDateRange.from, 'PPP')}.`,
          variant: "default"
        });
        return;
      }
    }

    try {
      const updates = {
        duty_status: targetStatus,
        availability_start_date: newStatus && localDateRange?.from ? adjustDate(localDateRange.from) : null,
        availability_end_date: newStatus && localDateRange?.to ? adjustDate(localDateRange.to) : null,
        phone_number: ''
      };
      console.log('Updating profile with:', updates);

      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          phone_number: ''
        })
        .eq('id', userId);

      if (error) throw error;

      setLocalDutyStatus(targetStatus);
      setParentDutyStatus(targetStatus);
      if (!newStatus) {
        setLocalDateRange(undefined);
        setParentDateRange(undefined);
      }

      if (onDutyStatusToggle) {
        await onDutyStatusToggle(targetStatus);
      }

      toast({
        title: "Duty Status Updated",
        description: targetStatus === 'on_duty'
          ? `On Duty from ${format(localDateRange?.from || new Date(), 'PPP')} to ${format(localDateRange?.to || new Date(), 'PPP')}`
          : "You're now Off Duty"
      });
    } catch (error) {
      console.error('Error updating duty status:', error);
      toast({ 
        title: "Error", 
        description: "Failed to update duty status.", 
        variant: "destructive" 
      });
    }
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    console.log('Date range changed to:', range);
    setLocalDateRange(range);
    setParentDateRange(range);
  };
  
  const handleEditAvailability = () => setIsEditing(true);

  const handleSaveChanges = async () => {
    if (!isDateRangeValid) {
      toast({ title: "Date Range Required", description: "Please set both dates.", variant: "destructive" });
      return;
    }

    try {
      const updates = {
        availability_start_date: adjustDate(localDateRange?.from),
        availability_end_date: adjustDate(localDateRange?.to),
      };
      console.log('Saving availability updates:', updates);

      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          phone_number: ''
        })
        .eq('id', userId);

      if (error) throw error;

      setIsEditing(false);
      toast({
        title: "Availability Updated",
        description: `From ${format(localDateRange?.from || new Date(), 'PPP')} to ${format(localDateRange?.to || new Date(), 'PPP')}`,
      });
    } catch (error) {
      console.error('Error updating availability:', error);
      toast({
        title: "Error",
        description: "Failed to update availability dates.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  return (
    <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          {localDutyStatus === 'on_duty' ? (
            <Shield className="h-5 w-5 mr-2 text-green-500" />
          ) : (
            <Shield className="h-5 w-5 mr-2 text-red-500" />
          )}
          Inspector Duty Status
        </CardTitle>
        <CardDescription>
          {localDutyStatus === 'on_duty'
            ? 'You are currently On Duty and available for inspection assignments'
            : 'You are currently Off Duty and not available for inspection assignments'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-6">
          <div className="flex items-center space-x-4">
            <Switch
              checked={localDutyStatus === 'on_duty'}
              onCheckedChange={handleDutyToggle}
              disabled={isEditing}
            />
            <div className="flex flex-col">
              <span className={`text-lg font-medium ${localDutyStatus === 'on_duty' ? 'text-green-600' : 'text-red-600'}`}>
                {localDutyStatus === 'on_duty' ? 'On Duty' : 'Off Duty'}
              </span>
              {localDutyStatus === 'on_duty' && localDateRange?.from && localDateRange?.to && (
                <span className="text-sm text-gray-500">
                  Available from {format(localDateRange.from, 'PP')} to {format(localDateRange.to, 'PP')}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-medium">Availability Period</Label>
            <DateRangePicker
              value={localDateRange}
              onChange={handleDateRangeChange}
              label="Select duty period"
              className={isEditing ? "" : ""}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {isEditing
                ? "Set the period during which you'll be available for inspection assignments"
                : localDutyStatus === 'on_duty'
                  ? "This is your current availability period"
                  : "You'll need to set an availability period to go On Duty"}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2 pt-0">
        {isEditing ? (
          <>
            <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
            <Button onClick={handleSaveChanges} disabled={!isDateRangeValid}>Save Changes</Button>
          </>
        ) : (
          <Button variant="outline" onClick={handleEditAvailability} className="hover:bg-orange-50">
            Edit Availability
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
