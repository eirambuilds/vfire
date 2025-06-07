
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from 'react-day-picker';
import { InspectorDutyStatus } from '@/types/inspection';

export interface InspectorProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  duty_status: InspectorDutyStatus;
  availability_start_date: string | null;
  availability_end_date: string | null;
}

export const useInspectorProfile = (inspectorId: string) => {
  const [profile, setProfile] = useState<InspectorProfile | null>(null);
  const [availabilityRange, setAvailabilityRange] = useState<DateRange | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInspectorProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // First fetch the basic profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name, duty_status')
          .eq('id', inspectorId)
          .single();

        if (profileError) {
          throw new Error(`Error fetching profile: ${profileError.message}`);
        }

        if (!profileData) {
          throw new Error('Profile not found');
        }

        // Now fetch availability dates separately to handle potential missing columns
        let availabilityStartDate: string | null = null;
        let availabilityEndDate: string | null = null;

        try {
          const { data: availabilityData, error: availabilityError } = await supabase
            .from('profiles')
            .select('availability_start_date, availability_end_date')
            .eq('id', inspectorId)
            .single();
          
          if (!availabilityError && availabilityData) {
            availabilityStartDate = availabilityData.availability_start_date;
            availabilityEndDate = availabilityData.availability_end_date;
          }
        } catch (availabilityErr) {
          console.warn('Could not fetch availability dates, they might not exist in the table yet');
        }

        // Combine the data
        const completeProfile: InspectorProfile = {
          ...profileData,
          availability_start_date: availabilityStartDate,
          availability_end_date: availabilityEndDate,
        };

        setProfile(completeProfile);

        // Convert dates to DateRange object if both exist
        if (completeProfile.availability_start_date && completeProfile.availability_end_date) {
          setAvailabilityRange({
            from: new Date(completeProfile.availability_start_date),
            to: new Date(completeProfile.availability_end_date)
          });
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching the inspector profile');
        console.error('Error in useInspectorProfile:', err);
      } finally {
        setLoading(false);
      }
    };

    if (inspectorId) {
      fetchInspectorProfile();
    }
  }, [inspectorId]);

  return { profile, availabilityRange, loading, error };
};
