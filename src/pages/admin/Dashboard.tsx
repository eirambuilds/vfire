import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FadeInSection } from '@/components/ui/animations/FadeInSection';
import { StatCard } from '@/components/ui/cards/StatCard';
import { PieChart } from '@/components/ui/charts/PieChart';
import { BarChart } from '@/components/ui/charts/BarChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Building, FileText, Calendar, Activity, LayoutDashboard, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('combined');

  // State for dashboard data
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    owners: 0,
    fireInspectors: 0,
    admins: 0,
    onDuty: 0,
    offDuty: 0,
    totalApplications: 0,
    fsecApplications: 0,
    fsicOccupancyApplications: 0,
    fsicBusinessApplications: 0,
    totalInspections: 0,
    totalEstablishments: 0,
    unreadNotifications: 0,
  });

  const [applications, setApplications] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [users, setUsers] = useState([]);
  const [establishments, setEstablishments] = useState([]);
  const [fsecStatusData, setFsecStatusData] = useState([]);
  const [fsicOccupancyStatusData, setFsicOccupancyStatusData] = useState([]);
  const [fsicBusinessStatusData, setFsicBusinessStatusData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inspectionFilters, setInspectionFilters] = useState({
    search: undefined,
    status: undefined,
    type: undefined,
    dateRange: undefined,
  });
  const [applicationStatusData, setApplicationStatusData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [activePieIndex, setActivePieIndex] = useState(-1);
  const [activeAppIndex, setActiveAppIndex] = useState(-1);

  // Get today's date
  const today = new Date();
  const currentMonth = today.toLocaleString('default', { month: 'long' });
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1).toLocaleString('default', { month: 'long' });

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*');
      if (usersError) throw usersError;
      
      const { data: establishmentsData, error: establishmentsError } = await supabase
        .from('establishments')
        .select('*');
      if (establishmentsError) throw establishmentsError;
      
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select('*');
      if (applicationsError) throw applicationsError;
      
      const { data: inspectionsData, error: inspectionsError } = await supabase
        .from('inspections')
        .select('*');
      if (inspectionsError) throw inspectionsError;

      setUsers(usersData || []);
      setEstablishments(establishmentsData || []);
      setApplications(applicationsData || []);
      setInspections(inspectionsData || []);

      const stats = {
        totalUsers: usersData?.length || 0,
        owners: usersData?.filter(u => u.role === 'owner').length || 0,
        fireInspectors: usersData?.filter(u => u.role === 'inspector').length || 0,
        admins: usersData?.filter(u => u.role === 'admin').length || 0,
        onDuty: usersData?.filter(u => u.status === 'on_duty').length || 0,
        offDuty: usersData?.filter(u => u.status === 'off_duty').length || 0,
        totalApplications: applicationsData?.length || 0,
        fsecApplications: applicationsData?.filter(a => a.type === 'FSEC').length || 0,
        fsicOccupancyApplications: applicationsData?.filter(a => a.type === 'FSIC-Occupancy').length || 0,
        fsicBusinessApplications: applicationsData?.filter(a => a.type === 'FSIC-Business').length || 0,
        totalInspections: inspectionsData?.length || 0,
        totalEstablishments: establishmentsData?.length || 0,
        unreadNotifications: 0,
      };
      setDashboardStats(stats);

      const fsecData = calculateStatusDistribution(applicationsData?.filter(a => a.type === 'FSEC') || []);
      const fsicOccupancyData = calculateStatusDistribution(applicationsData?.filter(a => a.type === 'FSIC-Occupancy') || []);
      const fsicBusinessData = calculateStatusDistribution(applicationsData?.filter(a => a.type === 'FSIC-Business') || []);
      
      setFsecStatusData(fsecData);
      setFsicOccupancyStatusData(fsicOccupancyData);
      setFsicBusinessStatusData(fsicBusinessData);
      
      const statusCounts = (applicationsData || []).reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {});
      
      const applicationStatusArr = Object.entries(statusCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: getStatusColor(name),
      }));
      setApplicationStatusData(applicationStatusArr);
      
      const monthlyStats = generateMonthlyData(inspectionsData || [], applicationsData || []);
      setMonthlyData(monthlyStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch dashboard data" });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStatusDistribution = (applications) => {
    const statusCount = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(statusCount).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: getStatusColor(name),
    }));
  };
  
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return '#eab308';
      case 'scheduled': return '#3b82f6';
      case 'inspected': return '#8b5cf6';
      case 'approved': return '#22c55e';
      case 'rejected': return '#ef4444';
      case 'cancelled': return '#6b7280';
      default: return '#94a3b8';
    }
  };
  
  const generateMonthlyData = (inspections, applications) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthInspections = inspections.filter(inspection => {
        const date = new Date(inspection.created_at || inspection.scheduled_date);
        return date.getMonth() === index && date.getFullYear() === currentYear;
      });
      
      const monthApplications = applications.filter(application => {
        const date = new Date(application.submitted_at);
        return date.getMonth() === index && date.getFullYear() === currentYear;
      });
      
      return {
        name: month,
        inspections: monthInspections.length,
        applications: monthApplications.length,
      };
    });
  };

  const upcomingInspections = inspections
    .filter(i => i.status === 'scheduled')
    .slice(0, 5)
    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

  const getActiveFilterCount = () => {
    let count = 0;
    if (inspectionFilters.search) count++;
    if (inspectionFilters.status) count++;
    if (inspectionFilters.type) count++;
    if (inspectionFilters.dateRange) count++;
    return count;
  };

  const inspectionStatusData = [
    { name: 'Scheduled', value: inspections.filter(i => i.status === 'scheduled').length, color: '#3b82f6' },
    { name: 'Inspected', value: inspections.filter(i => i.status === 'inspected').length, color: '#8b5cf6' },
    { name: 'Approved', value: inspections.filter(i => i.status === 'approved').length, color: '#22c55e' },
    { name: 'Rejected', value: inspections.filter(i => i.status === 'rejected').length, color: '#ef4444' },
  ];

  // Navigation handlers
  const handleUsersClick = () => navigate('/admin/users');
  const handleEstablishmentsClick = () => navigate('/admin/establishments');
  const handleApplicationsClick = () => navigate('/admin/applications');
  const handleInspectionsClick = () => navigate('/admin/inspections');

  const handleUserPieClick = (datastad: any, index: number) => {
    const roleMap: { [key: string]: string } = {
      'Owners': 'owner',
      'Fire Inspectors': 'inspector',
      'Admins': 'admin'
    };
    const role = roleMap[datastad.name] || datastad.name.toLowerCase();
    navigate(`/admin/users?role=${role}`);
  };

  const handleApplicationPieClick = (data: any, index: number) => {
    navigate(`/admin/applications?status=${data.name.toLowerCase()}`);
  };

  const handleInspectionPieClick = (data: any, index: number) => {
    navigate(`/admin/inspections?status=${data.name.toLowerCase()}`);
  };

  const handleBarChartClick = (data: any, index: number) => {
    navigate(activeTab === 'inspections' ? '/admin/inspections' : '/admin/applications');
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
      return { keys: ['applications'], colors: ['#eab308'] };
    } else if (activeTab === 'inspections') {
      return { keys: ['inspections'], colors: ['#3b82f6'] };
    }
    return { keys: ['applications', 'inspections'], colors: ['#eab308', '#3b82f6'] };
  };

  const chartConfig = getChartConfig();

  return (
    <DashboardLayout title="Dashboard" userRole="admin">
      <div className="space-y-6 p-1">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Welcome to the admin dashboard! Here you can manage users, establishments, applications, and inspections.
          </p>
        </div>

        <FadeInSection delay={100}>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="Total Users" 
              value={dashboardStats.totalUsers}
              icon={<Users className="h-5 w-5" />}
              trend={{ value: 5, isUpward: true }}
              onClick={handleUsersClick}
              className="cursor-pointer hover:bg-gray-100 transition-colors"
            />
            <StatCard 
              title="Total Establishments" 
              value={dashboardStats.totalEstablishments}
              icon={<Building className="h-5 w-5" />}
              trend={{ value: 12, isUpward: true }}
              onClick={handleEstablishmentsClick}
              className="cursor-pointer hover:bg-gray-100 transition-colors"
            />
            <StatCard 
              title="Total Applications" 
              value={dashboardStats.totalApplications}
              icon={<FileText className="h-5 w-5" />}
              trend={{ value: 3, isUpward: false }}
              onClick={handleApplicationsClick}
              className="cursor-pointer hover:bg-gray-100 transition-colors"
            />
            <StatCard 
              title="Total Inspections" 
              value={dashboardStats.totalInspections}
              icon={<Activity className="h-5 w-5" />}
              trend={{ value: 8, isUpward: true }}
              onClick={handleInspectionsClick}
              className="cursor-pointer hover:bg-gray-100 transition-colors"
            />
          </div>
        </FadeInSection>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <FadeInSection delay={200}>
            <Card className="border border-border/40 bg-card/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium">User Distribution</CardTitle>
                <CardDescription>Breakdown of users by role</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[225px]">
                  <PieChart
                    data={[
                      { name: 'Owners', value: dashboardStats.owners, color: '#eab308' },
                      { name: 'Fire Inspectors', value: dashboardStats.fireInspectors, color: '#3b82f6' },
                      { name: 'Admins', value: dashboardStats.admins, color: '#22c55e' }
                    ]}
                    innerRadius={60}
                    outerRadius={80}
                    activeIndex={activePieIndex}
                    setActiveIndex={setActivePieIndex}
                    showTotal={true}
                    height={225}
                    /* onClick={handleUserPieClick} */
                  />
                </div>
              </CardContent>
            </Card>
          </FadeInSection>

          <FadeInSection delay={250}>
            <Card className="border border-border/40 bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Application Status</CardTitle>
                <CardDescription>Overview of all applications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[240px]">
                  <PieChart 
                    data={applicationStatusData}
                    height={240}
                    innerRadius={50}
                    outerRadius={70}
                    activeIndex={activeAppIndex}
                    setActiveIndex={setActiveAppIndex}
                    /* onClick={handleApplicationPieClick} */
                  />
                </div>
              </CardContent>
            </Card>
          </FadeInSection>

          <FadeInSection delay={300}>
            <Card className="border border-border/40 bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Inspection Stats</CardTitle>
                <CardDescription>Current month overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[240px]">
                  <PieChart 
                    data={inspectionStatusData}
                    height={240}
                    showTotal={false}
                    /* onClick={handleInspectionPieClick} */
                  />
                </div>
              </CardContent>
            </Card>
          </FadeInSection>

          <FadeInSection delay={150} className="lg:col-span-2">
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
                    tickFormatter={(value: number) => Math.floor(value)}
                    tooltipFormatter={(value: number) => Math.floor(value)}
                    /* onClick={handleBarChartClick} */
                  />
                </div>
              </CardContent>
            </Card>
          </FadeInSection>

          <FadeInSection delay={350} className="lg:col-span-1">
            <Card className="border border-border/40 bg-card/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Application Types</CardTitle>
                <CardDescription>Distribution by application type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[240px]">
                  <PieChart 
                    data={[
                      { name: 'FSEC', value: dashboardStats.fsecApplications, color: '#eab308' },
                      { name: 'FSIC-Occupancy', value: dashboardStats.fsicOccupancyApplications, color: '#3b82f6' },
                      { name: 'FSIC-Business', value: dashboardStats.fsicBusinessApplications, color: '#22c55e' },
                    ]}
                    height={240}
                    showTotal={true}
                  />
                </div>
                <div className="space-y-4 mt-4">
                  <div className="flex items-center justify-between cursor-pointer hover:bg-gray-100 p-2 rounded" onClick={handleApplicationsClick}>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-medium">FSEC</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{dashboardStats.fsecApplications}</span>
                      <span className="text-xs text-muted-foreground">
                        ({Math.round((dashboardStats.fsecApplications / dashboardStats.totalApplications || 0) * 100)}%)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between cursor-pointer hover:bg-gray-100 p-2 rounded" onClick={handleApplicationsClick}>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                      <span className="text-sm font-medium">FSIC-Occupancy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{dashboardStats.fsicOccupancyApplications}</span>
                      <span className="text-xs text-muted-foreground">
                        ({Math.round((dashboardStats.fsicOccupancyApplications / dashboardStats.totalApplications || 0) * 100)}%)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between cursor-pointer hover:bg-gray-100 p-2 rounded" onClick={handleApplicationsClick}>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium">FSIC-Business</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{dashboardStats.fsicBusinessApplications}</span>
                      <span className="text-xs text-muted-foreground">
                        ({Math.round((dashboardStats.fsicBusinessApplications / dashboardStats.totalApplications || 0) * 100)}%)
                      </span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button variant="outline" className="w-full gap-1 text-xs" size="sm" onClick={handleApplicationsClick}>
                      View All Applications
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeInSection>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;