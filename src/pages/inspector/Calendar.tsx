import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FadeInSection } from "@/components/ui/animations/FadeInSection";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, XCircle, Calendar, User } from "lucide-react";
import { CalendarDetailsDialog } from "@/components/shared/calendar/CalendarDetailsDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RawInspection {
  id: string;
  establishment_name: string;
  inspector: string | null;
  status: string;
  type: string;
  scheduled_date: string | null;
  inspector_id: string;
}

interface InspectionEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: string;
  establishment_name: string;
  inspector: string | null;
  status: string;
}

const localizer = momentLocalizer(moment);

type CalendarView = "month" | "week" | "day" | "agenda";

const InspectorCalendar = () => {
  const { toast } = useToast();
  const [view, setView] = useState<CalendarView>("month");
  const [selectedEvent, setSelectedEvent] = useState<InspectionEvent | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [events, setEvents] = useState<InspectionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(moment().month() + 1);
  const [selectedYear, setSelectedYear] = useState(moment().year());

  // Generate month and year options
  const months = moment.months().map((month, index) => ({
    value: index + 1,
    label: month,
  }));
  const years = Array.from({ length: 10 }, (_, i) => moment().year() - 5 + i);

  useEffect(() => {
    const fetchInspections = async () => {
      try {
        setIsLoading(true);

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error("User not authenticated");
        }

        const startDate = moment(`${selectedYear}-${selectedMonth}-01`).startOf('month').toISOString();
        const endDate = moment(`${selectedYear}-${selectedMonth}-01`).endOf('month').toISOString();

        const { data, error } = await supabase
          .from('inspections')
          .select('id, establishment_name, inspector, status, type, scheduled_date, inspector_id')
          .eq('inspector_id', user.id)
          .not('scheduled_date', 'is', null)
          .gte('scheduled_date', startDate)
          .lte('scheduled_date', endDate) as { data: RawInspection[] | null, error: any };

        if (error) throw error;
        if (!data) {
          setEvents([]);
          return;
        }

        const transformedEvents: InspectionEvent[] = data
          .filter((inspection): inspection is RawInspection & { scheduled_date: string } => 
            !!inspection.scheduled_date)
          .map(inspection => ({
            id: inspection.id,
            title: `${inspection.establishment_name} - ${inspection.status}`,
            start: new Date(inspection.scheduled_date),
            end: new Date(new Date(inspection.scheduled_date).getTime() + 60 * 60 * 1000),
            type: inspection.type ?? 'default',
            establishment_name: inspection.establishment_name,
            inspector: inspection.inspector || 'Unassigned',
            status: inspection.status,
          }));

        setEvents(transformedEvents);
      } catch (error) {
        console.error('Error fetching inspections:', error);
        toast({
          title: "Error",
          description: "Failed to load calendar events.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInspections();
  }, [toast, selectedMonth, selectedYear]);

  const handleViewChange = (newView: CalendarView) => setView(newView);
  const handleSelectEvent = (event: InspectionEvent) => setSelectedEvent(event);
  const handleCloseDetails = () => setSelectedEvent(null);
  const handleViewDetails = (event: InspectionEvent) => {
    setSelectedEvent(event);
    setIsDetailsDialogOpen(true);
  };

  const handleNavigate = (newDate: Date) => {
    const newMonth = moment(newDate).month() + 1;
    const newYear = moment(newDate).year();
    
    // Only update if within year range
    if (years.includes(newYear)) {
      setSelectedMonth(newMonth);
      setSelectedYear(newYear);
    } else {
      toast({
        title: "Navigation Restricted",
        description: `Please select a year between ${years[0]} and ${years[years.length - 1]}.`,
        variant: "destructive",
      });
    }
  };

  const eventStyleGetter = (event: InspectionEvent) => {
    let backgroundColor = "#9E9E9E";
    let gradient = "";
    switch (event.status) {
      case "pending":
        backgroundColor = "#F59E0B";
        gradient = "linear-gradient(135deg, #F59E0B, #D97706)";
        break;
      case "scheduled":
        backgroundColor = "#3B82F6";
        gradient = "linear-gradient(135deg, #3B82F6, #2563EB)";
        break;
      case "inspected":
        backgroundColor = "#8B5CF6";
        gradient = "linear-gradient(135deg, #8B5CF6, #7C3AED)";
        break;
      case "rejected":
        backgroundColor = "#EF4444";
        gradient = "linear-gradient(135deg, #EF4444, #DC2626)";
        break;
      case "approved":
        backgroundColor = "#22C55E";
        gradient = "linear-gradient(135deg, #22C55E, #16A34A)";
        break;
    }
    return {
      style: {
        background: gradient,
        backgroundColor,
        borderRadius: "6px",
        color: "white",
        border: "none",
        display: "block",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      },
    };
  };

  const calendarVariants = {
    full: {
      width: "100%",
      marginRight: 0,
      transition: { duration: 0.3, ease: "easeInOut" },
    },
    shrunk: {
      width: "calc(100% - 25% - 1.5rem)",
      marginRight: "1.5rem",
      transition: { duration: 0.3, ease: "easeInOut" },
    },
  };

  const detailsVariants = {
    hidden: {
      opacity: 0,
      width: 0,
      transition: { duration: 0.3, ease: "easeInOut" },
    },
    visible: {
      opacity: 1,
      width: "25%",
      transition: { duration: 0.3, ease: "easeInOut" },
    },
  };

  const statusLegend = [
    { status: "Pending", color: "#F59E0B", gradient: "linear-gradient(135deg, #F59E0B, #D97706)" },
    { status: "Scheduled", color: "#3B82F6", gradient: "linear-gradient(135deg, #3B82F6, #2563EB)" },
    { status: "Inspected", color: "#8B5CF6", gradient: "linear-gradient(135deg, #8B5CF6, #7C3AED)" },
    { status: "Rejected", color: "#EF4444", gradient: "linear-gradient(135deg, #EF4444, #DC2626)" },
    { status: "Approved", color: "#22C55E", gradient: "linear-gradient(135deg, #22C55E, #16A34A)" },
  ];

  return (
    <DashboardLayout title="Inspection Calendar" userRole="inspector">
          <div className="space-y-6 p-1">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h1 className="text-2xl font-bold">Inspection Calendar</h1>
              </div>
              <p className="text-muted-foreground">
                View your inspection schedule. Click on an establishment to see more details.
              </p>
            </div>

        <FadeInSection delay={150}>
          <div className="flex flex-wrap gap-4 justify-center mb-6">
            {statusLegend.map(({ status, gradient }) => (
              <motion.div
                key={status}
                className="flex items-center gap-2 px-3 py-1 rounded-full"
                style={{ background: gradient }}
                whileHover={{ scale: 1.05, boxShadow: "0 4px 8px rgba(0,0,0,0.2)" }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-sm font-semibold text-white">{status}</span>
              </motion.div>
            ))}
          </div>
        </FadeInSection>

        <FadeInSection delay={200}>
          <Card className="p-6 bg-gradient-to-br from-white to-red-50 shadow-lg rounded-xl">
            <div className="flex justify-center gap-4 mb-6">
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => {
                  setSelectedMonth(Number(value));
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => {
                  setSelectedYear(Number(value));
                }}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Select Year" />
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

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
                <span className="ml-2 text-gray-600 font-medium">Loading calendar...</span>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-6">
                <motion.div
                  variants={calendarVariants}
                  animate={selectedEvent ? "shrunk" : "full"}
                  initial="full"
                >
                  <BigCalendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 650 }}
                    view={view}
                    onView={handleViewChange}
                    date={moment(`${selectedYear}-${selectedMonth}-01`).toDate()}
                    onNavigate={handleNavigate}
                    onSelectEvent={handleSelectEvent}
                    eventPropGetter={eventStyleGetter}
                  />
                </motion.div>

                <AnimatePresence>
                  {selectedEvent && (
                    <motion.div
                      variants={detailsVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                    >
                      <Card className="p-6 bg-gradient-to-br from-white to-gray-100 shadow-xl rounded-lg border-l-4 border-red-400">
                        <div className="flex items-center justify-between">
                          <h2 className="text-2xl font-bold text-gray-800">
                            {selectedEvent.establishment_name}
                          </h2>
                          <button
                            onClick={handleCloseDetails}
                            className="p-1 rounded-full hover:bg-red-100 transition-colors"
                            aria-label="Close details"
                          >
                            <XCircle className="h-5 w-5 text-red-500" />
                          </button>
                        </div>
                        <div className="space-x-2 my-4">
                          <Badge
                            className={`text-white ${selectedEvent.status === "pending" ? "bg-yellow-500" : selectedEvent.status === "scheduled" ? "bg-blue-500" : selectedEvent.status === "inspected" ? "bg-purple-500" : selectedEvent.status === "rejected" ? "bg-red-500" : "bg-green-500"}`}
                          >
                            {selectedEvent.status}
                          </Badge>
                          <Badge className="bg-red-100 text-red-800">{selectedEvent.type}</Badge>
                        </div>
                        <div className="space-y-3 text-sm text-gray-700">
                          <p className="flex items-center gap-2">
                            <User className="h-4 w-4 text-red-500" />
                            <span className="font-medium">Inspector:</span> {selectedEvent.inspector || 'Unassigned'}
                          </p>
                          <p className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-red-500" />
                            <span className="font-medium">Date:</span>{" "}
                            {moment(selectedEvent.start).format('MMMM D, YYYY, h:mm A')}
                          </p>
                        </div>
                        <div className="mt-6">
                          <Button
                            className="w-full bg-red-500 hover:bg-red-600 text-white"
                            size="sm"
                            onClick={() => handleViewDetails(selectedEvent)}
                          >
                            View Full Inspection Details
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </Card>
        </FadeInSection>

        {selectedEvent && (
          <CalendarDetailsDialog
            event={selectedEvent}
            open={isDetailsDialogOpen}
            onOpenChange={setIsDetailsDialogOpen}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default InspectorCalendar;