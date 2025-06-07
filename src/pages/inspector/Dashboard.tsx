import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FadeInSection } from '@/components/ui/animations/FadeInSection';
import { Activity, Calendar, Clock, CheckCircle2, AlertTriangle, BarChart as BarChartIcon } from 'lucide-react';
import { useFadeIn } from '@/utils/animations';
import { DateRange } from 'react-day-picker';
import { InspectorDutyStatus } from '@/types/inspection';
import { DutyStatusCard } from '@/components/inspector/DutyStatusCard';
import { InspectionStats } from '@/components/inspector/InspectionStats';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { PieChart } from '@/components/ui/charts/PieChart';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";

type DashboardInspection = {
  id: string;
  establishment_name?: string;
  type?: 'fsic_occupancy' | 'fsic_business';
  scheduled_date?: string | null;
  status: 'scheduled' | 'inspected' | 'approved' | 'rejected' | 'cancelled';
  inspector_id: string;
  establishment_id: string;
  inspector?: string;
  address?: string;
  rejection_reason?: string;
  updated_at?: string;
  establishments?: {
    name: string;
    address: string;
  };
};

type Inspection = {
  id: string;
  establishment_name: string;
  type: 'fsic_occupancy' | 'fsic_business';
  scheduled_date: string | null;
  status: 'scheduled' | 'inspected' | 'approved' | 'rejected' | 'cancelled';
  inspector_id: string;
  establishment_id: string;
  inspector?: string;
  address?: string;
  rejection_reason?: string;
  updated_at?: string;
  establishment_name?: string;
  establishment_id?: string;
};

const InspectorDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate(); // Initialize navigation hook
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [dutyStatus, setDutyStatus] = useState<InspectorDutyStatus>('off_duty');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyCounts, setWeeklyCounts] = useState<any[]>([]);
  const [inspectionStatusData, setInspectionStatusData] = useState<any[]>([]);
  const [upcomingForToday, setUpcomingForToday] = useState<number>(0);
  const [activePieIndex, setActivePieIndex] = useState<number>(-1);
  
  const titleAnimation = useFadeIn(50);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Error fetching user:', userError);
        return;
      }
      setUser(user);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, role')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }
      
      if (profileData) {
        setProfile(profileData);
        
        // Try to get duty status
        try {
          // Using a function to get the duty status
          const { data: dutyStatusData } = await supabase
            .rpc('get_inspector_duty_status', { inspector_id: user.id });
            
          if (dutyStatusData) {
            setDutyStatus(dutyStatusData as InspectorDutyStatus);
          }
          
          // Get availability dates
          const { data: availabilityData } = await supabase
            .rpc('get_inspector_availability', { inspector_id: user.id });
            
          if (availabilityData && availabilityData.start_date && availabilityData.end_date) {
            const startDate = new Date(availabilityData.start_date);
            const endDate = new Date(availabilityData.end_date);
            
            setDateRange({
              from: startDate,
              to: endDate
            });
          }
        } catch (error) {
          console.error('Error fetching inspector status:', error);
        }
      }

      // Fetch inspector's assigned inspections
      const { data: inspectionsData, error: inspectionsError } = await supabase
        .from('inspections')
        .select(`
          id, 
          status, 
          inspector_id, 
          establishment_id, 
          scheduled_date,
          updated_at,
          establishments (
            name,
            address
          )
        `)
        .eq('inspector_id', user.id);
        
      if (inspectionsError) {
        console.error('Error fetching inspections:', inspectionsError);
        toast({
          variant: "destructive",
          title: "Error fetching inspections",
          description: "Please try again later."
        });
      } else if (inspectionsData) {
        // Transform the data to the required format
        const formattedInspections: Inspection[] = inspectionsData.map(inspection => ({
          id: inspection.id,
          establishment_name: inspection.establishments?.name || 'Unknown',
          type: inspection.type || 'fsic_business',
          scheduled_date: inspection.scheduled_date,
          status: inspection.status,
          inspector_id: inspection.inspector_id,
          establishment_id: inspection.establishment_id,
          address: inspection.establishments?.address || '',
          updated_at: inspection.updated_at || ''
        }));
        
        setInspections(formattedInspections);
        
        // Generate weekly inspection data
        const weeklyData = generateWeeklyData(formattedInspections);
        setWeeklyCounts(weeklyData);
        
        // Calculate status distribution
        calculateStatusDistribution(formattedInspections);
        
        // Calculate today's inspections
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayInspections = formattedInspections.filter(insp => {
          if (!insp.scheduled_date) return false;
          const inspDate = new Date(insp.scheduled_date);
          inspDate.setHours(0, 0, 0, 0);
          return inspDate.getTime() === today.getTime() && insp.status === 'scheduled';
        });
        
        setUpcomingForToday(todayInspections.length);
      }
    } catch (error) {
      console.error('Error in fetchData:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const calculateStatusDistribution = (inspectionData: Inspection[]) => {
    const statusCount = inspectionData.reduce((acc, insp) => {
      acc[insp.status] = (acc[insp.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const statusData = [
      { name: 'Scheduled', value: statusCount['scheduled'] || 0, color: '#3b82f6' },
      { name: 'Inspected', value: statusCount['inspected'] || 0, color: '#8b5cf6' },
      { name: 'Approved', value: statusCount['approved'] || 0, color: '#22c55e' },
      { name: 'Rejected', value: statusCount['rejected'] || 0, color: '#ef4444' },
      { name: 'Cancelled', value: statusCount['cancelled'] || 0, color: '#6b7260' },
    ];
    
    setInspectionStatusData(statusData);
  };
  
  const generateWeeklyData = (inspectionData: Inspection[]) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    
    return days.map((day, index) => {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + index);
      currentDay.setHours(0, 0, 0, 0);
      
      // Find inspections for this day
      const dayInspections = inspectionData.filter(insp => {
        if (!insp.scheduled_date) return false;
        const inspDate = new Date(insp.scheduled_date);
        inspDate.setHours(0, 0, 0, 0);
        return inspDate.getTime() === currentDay.getTime();
      });
      
      const scheduled = dayInspections.filter(insp => insp.status === 'scheduled').length;
      const completed = dayInspections.filter(insp => 
        ['inspected', 'approved', 'rejected'].includes(insp.status)).length;
      
      return {
        name: day,
        scheduled,
        completed,
        date: currentDay.toLocaleDateString(),
        isToday: currentDay.getDate() === today.getDate() && 
                 currentDay.getMonth() === today.getMonth() &&
                 currentDay.getFullYear() === today.getFullYear()
      };
    });
  };

  // Calculate dashboard statistics
  const inspectorDashboardStats = {
    totalInspections: inspections.length,
    scheduledInspections: inspections.filter(i => i.status === 'scheduled').length,
    inspectedInspections: inspections.filter(i => ['inspected', 'approved', 'rejected'].includes(i.status)).length,
  };

  // Get 5 most recent scheduled inspections
  const assignedInspections = inspections
    .filter(i => i.status === 'scheduled')
    .slice(0, 5)
    .sort((a, b) => new Date(a.scheduled_date || '').getTime() - new Date(b.scheduled_date || '').getTime());
  
  const handleViewInspectionDetails = (inspection: Inspection) => {
    setSelectedInspection(inspection);
    setIsDetailsDialogOpen(true);
  };

  // Navigation handler
  const handleInspectionsClick = (status?: string) => {
    if (status) {
      navigate(`/inspector/inspections?status=${status.toLowerCase()}`);
    } else {
      navigate('/inspector/inspections');
    }
  };

  if (!user || !profile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12"></div>
          <p className="text-gray-600 text-lg">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout title="Dashboard" userRole="inspector">
      <div className="space-y-6 p-1">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center gap-2" style={titleAnimation.style}>
            <Activity className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Welcome back, {profile.first_name || 'Inspector'}! Your daily overview is ready.
          </p>
        </div>

        <FadeInSection delay={100}>
          <div
            className="cursor-pointer"
            onClick={() => handleInspectionsClick()}
          >
            <InspectionStats stats={inspectorDashboardStats} />
          </div>
        </FadeInSection>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <FadeInSection delay={50} className="lg:col-span-1">
            <DutyStatusCard
              userId={user.id}
              dutyStatus={dutyStatus}
              setDutyStatus={setDutyStatus}
              dateRange={dateRange}
              setDateRange={setDateRange}
            />
          </FadeInSection>
          
          {/* Inspection Status */}
          <FadeInSection delay={250}>
            <Card
              className="shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer"
              onClick={() => handleInspectionsClick()}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">Inspection Status</CardTitle>
                <CardDescription>Overview of your inspections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[260px]">
                  <PieChart 
                    height={260}
                    data={inspectionStatusData}
                    innerRadius={50}
                    outerRadius={70}
                    activeIndex={activePieIndex}
                    setActiveIndex={setActivePieIndex}
                  />
                </div>
              </CardContent>
            </Card>
          </FadeInSection>

          <FadeInSection delay={150}>
            <Card
              className="border border-border bg-card backdrop-blur-sm cursor-pointer h-full"
              onClick={() => handleInspectionsClick('scheduled')}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Today's Schedule</CardTitle>
                <CardDescription>Your inspections for today</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-center pt-4 m-8">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="relative">
                    <Calendar className="h-16 w-16 text-primary opacity-60" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{new Date().getDate()}</span>
                    </div>
                  </div>
                  <span className="text-3xl font-bold">{upcomingForToday}</span>
                  <span className="text-sm text-muted-foreground">Inspections Today</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0 pb-4 flex justify-center">
                <Button variant="outline" size="sm" className="w-full">
                  View Today's Schedule
                </Button>
              </CardFooter>
            </Card>
          </FadeInSection>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Schedule */}
          {/* <FadeInSection delay={200} className="lg:col-span-2">
            <Card
              className="border border-border/40 bg-card/60 backdrop-blur-sm cursor-pointer"
              onClick={() => handleInspectionsClick()}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Weekly Overview</CardTitle>
                <CardDescription>Your inspection schedule this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[260px]">
                  <BarChart
                    data={weeklyCounts}
                    keys={['scheduled', 'completed']}
                    colors={['#3b82f6', '#22c55e']}
                    showLegend={true}
                    showGrid={true}
                  />
                </div>
              </CardContent>
            </Card>
          </FadeInSection> */}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InspectorDashboard;