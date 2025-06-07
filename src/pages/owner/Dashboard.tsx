import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FadeInSection } from '@/components/ui/animations/FadeInSection';
import { StatCard } from '@/components/ui/cards/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Building, FileText, Calendar, CheckCircle2, Activity, Eye, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarChart } from '@/components/ui/charts/BarChart';
import { PieChart } from '@/components/ui/charts/PieChart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const OwnerDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ 
    totalEstablishments: 0, 
    pendingApplications: 0, 
    upcomingInspections: 0,
    completedInspections: 0,
    approvedApplications: 0,
  });
  
  const [recentApplications, setRecentApplications] = useState([]);
  const [upcomingInspections, setUpcomingInspections] = useState([]);
  const [myEstablishments, setMyEstablishments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applicationStatusData, setApplicationStatusData] = useState([]);
  const [inspectionStatusData, setInspectionStatusData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [activePieIndex, setActivePieIndex] = useState(-1);
  const [establishmentStatusData, setEstablishmentStatusData] = useState([]);
  const [activeTab, setActiveTab] = useState('combined');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('User not authenticated');
      const owner_id = user.id;

      const { data: establishmentsData, error: estError } = await supabase
        .from('establishments')
        .select('id, status')
        .eq('owner_id', owner_id);

      if (estError) throw estError;
      
      const establishment_ids = establishmentsData.map(est => est.id);

      const { data: inspectionsData, error: inspError } = await supabase
        .from('inspections')
        .select('*, establishments (name)')
        .in('establishment_id', establishment_ids)
        .order('scheduled_date', { ascending: true });

      if (inspError) throw inspError;

      const { data: establishmentsData2, error: estError2 } = await supabase
        .from('establishments')
        .select('id, name, dti_number, status, updated_at') 
        .eq('owner_id', owner_id);

      if (estError2) throw estError2;

      const { data: applicationsData, error: appError } = await supabase
        .from('applications')
        .select('id, type, status, submitted_at, establishments (name)')
        .eq('owner_id', owner_id)
        .order('submitted_at', { ascending: false });

      if (appError) throw appError;

      const totalEstablishments = establishmentsData2.length;
      const pendingApplications = applicationsData.filter(app => app.status === 'pending').length;
      const upcomingInspectionsCount = inspectionsData.filter(insp => insp.status === 'scheduled').length;
      const completedInspections = inspectionsData.filter(insp => 
        ['inspected', 'approved', 'rejected'].includes(insp.status)).length;
      const approvedApplications = applicationsData.filter(app => app.status === 'approved').length;

      const ownerInspections = inspectionsData.filter(inspection => 
        establishment_ids.includes(inspection.establishment_id)
      );

      setStats({
        totalEstablishments,
        pendingApplications,
        upcomingInspections: upcomingInspectionsCount,
        completedInspections,
        approvedApplications,
      });

      setRecentApplications(
        applicationsData
          .slice(0, 5)
          .map(app => ({
            id: app.id,
            establishment_name: app.establishments?.name || 'N/A',
            type: app.type,
            dateSubmitted: app.submitted_at,
            status: app.status,
          }))
      );

      setUpcomingInspections(
        ownerInspections
          .filter(ins => ins.status === 'scheduled')
          .map(ins => ({
            id: ins.id,
            establishment_name: ins.establishments?.name || 'N/A',
            status: ins.status,
            scheduledDate: ins.scheduled_date,
          }))
      );

      setMyEstablishments(
        establishmentsData2.slice(0, 5).map(est => ({
          id: est.id,
          name: est.name,
          dti_number: est.dti_number,
          status: est.status,
          registrationDate: est.status === 'registered' && est.updated_at ? est.updated_at : null,
        }))
      );

      const appStatusCounts = applicationsData.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {});
      
      const applicationStatusArray = Object.entries(appStatusCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: getStatusColor(name),
      }));
      setApplicationStatusData(applicationStatusArray);
      
      const inspStatusCounts = inspectionsData.reduce((acc, insp) => {
        acc[insp.status] = (acc[insp.status] || 0) + 1;
        return acc;
      }, {});
      
      const inspectionStatusArray = Object.entries(inspStatusCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: getStatusColor(name),
      }));
      setInspectionStatusData(inspectionStatusArray);
      
      const estStatusCounts = establishmentsData2.reduce((acc, est) => {
        acc[est.status] = (acc[est.status] || 0) + 1;
        return acc;
      }, {});
      
      const establishmentStatusArray = Object.entries(estStatusCounts).map(([name, value]) => ({
        name: name === 'pre_registered' ? 'Pre-Registered' : name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: getStatusColor(name),
      }));
      setEstablishmentStatusData(establishmentStatusArray);
      
      const monthlyStats = generateMonthlyData(applicationsData, ownerInspections);
      setMonthlyData(monthlyStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#eab308'; // yellow-500 from TabsList
      case 'scheduled':
        return '#3b82f6'; // blue-500 from TabsList
      case 'inspected':
        return '#8b5cf6'; // purple-500 from TabsList
      case 'approved':
        return '#22c55e'; // green-500 from TabsList
      case 'rejected':
        return '#ef4444'; // red-500 from TabsList
      case 'cancelled':
        return '#6b7280'; // gray-500 from TabsList
      case 'unregistered':
        return '#6b7280'; // yellow-500 from badgeStyles
      case 'pre_registered':
        return '#eab308'; // blue-500 from badgeStyles
      case 'registered':
        return '#ff5500'; // green-500 from badgeStyles
      default:
        return '#6b7280'; // gray-100 from badgeStyles
    }
  };

  const generateMonthlyData = (applications, inspections) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthApps = applications.filter(app => {
        const date = new Date(app.submitted_at);
        return date.getMonth() === index && date.getFullYear() === currentYear;
      });
      
      const monthInspections = inspections.filter(insp => {
        if (!insp.scheduled_date) return false;
        const date = new Date(insp.scheduled_date);
        return date.getMonth() === index && date.getFullYear() === currentYear;
      });
      
      return {
        name: month,
        applications: monthApps.length,
        inspections: monthInspections.length,
      };
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:hover:bg-yellow-800">Pending</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800">Scheduled</Badge>;
      case 'inspected':
        return <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-800">Inspected</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800">Rejected</Badge>;
      case 'unregistered':
        return <Badge className="bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">Unregistered</Badge>;
      case 'pre_registered':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:hover:bg-orange-800">Pre-Registered</Badge>;
      case 'registered':
        return <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200 dark:bg-teal-900 dark:text-teal-300 dark:hover:bg-teal-800">Registered</Badge>;
      default:
        return <Badge className="bg-gray-300 text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">Unknown</Badge>;
    }
  };

  const handleStatCardClick = (route, tab) => {
    navigate(`${route}?tab=${tab}`);
  };

  const handleViewApplication = (applicationId) => {
    navigate(`/owner/applications/${applicationId}`);
  };

  const handleViewAllApplications = () => {
    navigate('/owner/applications');
  };

  const handleEstablishmentStatusClick = () => {
    navigate('/owner/establishments');
  };

  const handleApplicationStatusClick = () => {
    navigate('/owner/applications');
  };

  const handleInspectionStatusClick = () => {
    navigate('/owner/inspections');
  };

  const getChartData = () => {
    if (activeTab === 'inspections') {
      return monthlyData.map(({ name, inspections }) => ({
        name,
        inspections,
      }));
    } else if (activeTab === 'applications') {
      return monthlyData.map(({ name, applications }) => ({
        name,
        applications,
      }));
    } 
    return monthlyData;
  };

  const getChartConfig = () => {
    if (activeTab === 'applications') {
      return { keys: ['applications'], colors: ['#eab308'] }; // yellow-500
    } else if (activeTab === 'inspections') {
      return { keys: ['inspections'], colors: ['#8b5cf6'] }; // purple-500
    }
    return { keys: ['applications', 'inspections'], colors: ['#eab308', '#8b5cf6'] }; // yellow-500, purple-500
  };

  const chartConfig = getChartConfig();

  return (
    <DashboardLayout title="Dashboard" userRole="owner">
      <div className="space-y-6 p-1">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your establishments and applications.
          </p>
        </div>
        
        {/* Stats Overview */}
        <FadeInSection delay={100}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard 
              title="My Establishments" 
              value={stats.totalEstablishments}
              icon={<Building className="h-5 w-5 text-[#ff5500]" />}
              onClick={() => handleStatCardClick('/owner/establishments', 'all')}
              className="cursor-pointer hover:bg-gray-100 transition-colors"
            />
            <StatCard 
              title="Pending Applications" 
              value={stats.pendingApplications}
              icon={<FileText className="h-5 w-5 text-yellow-600" />}
              onClick={() => handleStatCardClick('/owner/applications', 'pending')}
              className="cursor-pointer hover:bg-gray-100 transition-colors"
            />
            <StatCard 
              title="Approved Applications" 
              value={stats.approvedApplications}
              icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
              onClick={() => handleStatCardClick('/owner/applications', 'approved')}
              className="cursor-pointer hover:bg-gray-100 transition-colors"
            />
            <StatCard 
              title="Upcoming Inspections" 
              value={stats.upcomingInspections}
              icon={<Calendar className="h-5 w-5 text-purple-600" />}
              onClick={() => handleStatCardClick('/owner/inspections', 'scheduled')}
              className="cursor-pointer hover:bg-gray-100 transition-colors"
            />
            <StatCard 
              title="Approved Inspections" 
              value={stats.completedInspections}
              icon={<Activity className="h-5 w-5 text-teal-600" />}
              onClick={() => handleStatCardClick('/owner/inspections', 'approved')}
              className="cursor-pointer hover:bg-gray-100 transition-colors"
            />
          </div>
        </FadeInSection>

        {/* Main grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Establishment Status */}
          <FadeInSection delay={250}>
            <Card 
              className="border border-border/40 bg-card/60 backdrop-blur-sm cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={handleEstablishmentStatusClick}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Establishment Status</CardTitle>
                <CardDescription>Overview of your establishments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <PieChart 
                    data={establishmentStatusData}
                    height={280}
                    innerRadius={50}
                    outerRadius={70}
                  />
                </div>
              </CardContent>
            </Card>
          </FadeInSection>
          
          {/* Application Status */}
          <FadeInSection delay={200}>
            <Card 
              className="border border-border/40 bg-card/60 backdrop-blur-sm cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={handleApplicationStatusClick}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Application Status</CardTitle>
                <CardDescription>Overview of your applications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <PieChart 
                    data={applicationStatusData}
                    height={280}
                    innerRadius={50}
                    outerRadius={70}
                    activeIndex={activePieIndex}
                    setActiveIndex={setActivePieIndex}
                    showTotal={true}
                  />
                </div>
              </CardContent>
            </Card>
          </FadeInSection>

          {/* Inspection Status */}
          <FadeInSection delay={300}>
            <Card 
              className="border border-border/40 bg-card/60 backdrop-blur-sm cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={handleInspectionStatusClick}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Inspection Status</CardTitle>
                <CardDescription>Overview of your inspections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <PieChart 
                    data={inspectionStatusData}
                    height={280}
                    innerRadius={50}
                    outerRadius={70}
                    activeIndex={activePieIndex}
                    setActiveIndex={setActivePieIndex}
                    showTotal={true}
                  />
                </div>
              </CardContent>
            </Card>
          </FadeInSection>

          {/* Monthly Activity */}
          <FadeInSection delay={250} className="lg:col-span-3">
            <Card className="border border-border/40 bg-card/60 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg font-medium">Monthly Activity</CardTitle>
                  <CardDescription>Applications & inspections this year</CardDescription>
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-[500px] grid-cols-3">
                    <TabsTrigger value="combined">Combined</TabsTrigger>
                    <TabsTrigger value="inspections">Inspections</TabsTrigger>
                    <TabsTrigger value="applications">Applications</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <BarChart
                    data={getChartData()}
                    keys={chartConfig.keys}
                    colors={chartConfig.colors}
                    tickFormatter={(value) => Math.floor(value)}
                    tooltipFormatter={(value) => Math.floor(value)}
                  />
                </div>
              </CardContent>
            </Card>
          </FadeInSection>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OwnerDashboard;