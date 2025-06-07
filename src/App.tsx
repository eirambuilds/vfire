import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ui/ProtectedRoute";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import About from "./pages/About";
import FAQs from "./pages/FAQs";
import Contact from "./pages/Contact";

// Login Routes
import AdminLogin from "./pages/login/AdminLogin";
import InspectorLogin from "./pages/login/InspectorLogin";
import OwnerLogin from "./pages/login/OwnerLogin";
import OwnerSignUp from "./pages/login/OwnerSignUp";

// Owner Routes
import OwnerDashboard from "./pages/owner/Dashboard";
import OwnerEstablishments from "./pages/owner/Establishments";
import OwnerApplications from "./pages/owner/Applications";
import OwnerCalendar from "./pages/owner/Calendar";
import OwnerMap from "./pages/owner/Map";
import OwnerInspections from "./pages/owner/Inspections";

// Inspector Routes
import InspectorDashboard from "./pages/inspector/Dashboard";
import InspectorInspections from "./pages/inspector/Inspections";
import InspectorCalendar from "./pages/inspector/Calendar";
import InspectorMap from "./pages/inspector/Map";

// Admin Routes
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsersManagement from "./pages/admin/UsersManagement";
import AdminEstablishments from "./pages/admin/Establishments";
import AdminApplications from "./pages/admin/Applications";
import AdminMap from "./pages/admin/Map";
import AdminInspections from "./pages/admin/Inspections";
import AdminCalendar from "./pages/admin/Calendar";

// Shared Routes
import ProfilePage from './pages/shared/ProfilePage';
import LegalPage from './components/shared/LegalPage';

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Public Pages */}
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/faqs" element={<FAQs />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/terms" element={<LegalPage />} />
                <Route path="/privacy" element={<LegalPage />} />
                
                {/* Separate Login Routes */}
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/inspector-login" element={<InspectorLogin />} />
                <Route path="/owner-login" element={<OwnerLogin />} />
                <Route path="/owner-signup" element={<OwnerSignUp />} />
                
                {/* Shared Routes - Accessible to all authenticated users */}
                <Route path="/profile" element={
                  <ProtectedRoute allowedRoles={['admin', 'inspector', 'owner']}>
                    <ProfilePage />
                  </ProtectedRoute>
                } />

                {/* Owner Routes - Protected */}
                <Route path="/owner" element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <OwnerDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/owner/establishments" element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <OwnerEstablishments />
                  </ProtectedRoute>
                } />
                <Route path="/owner/applications" element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <OwnerApplications />
                  </ProtectedRoute>
                } />
                <Route path="/owner/calendar" element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <OwnerCalendar />
                  </ProtectedRoute>
                } />
                <Route path="/owner/inspections" element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <OwnerInspections />
                  </ProtectedRoute>
                } />
                <Route path="/owner/map" element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <OwnerMap />
                  </ProtectedRoute>
                } />
                
                {/* Inspector Routes - Protected */}
                <Route path="/inspector" element={
                  <ProtectedRoute allowedRoles={['inspector']}>
                    <InspectorDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/inspector/inspections" element={
                  <ProtectedRoute allowedRoles={['inspector']}>
                    <InspectorInspections />
                  </ProtectedRoute>
                } />
                <Route path="/inspector/calendar" element={
                  <ProtectedRoute allowedRoles={['inspector']}>
                    <InspectorCalendar />
                  </ProtectedRoute>
                } />
                <Route path="/inspector/map" element={
                  <ProtectedRoute allowedRoles={['inspector']}>
                    <InspectorMap />
                  </ProtectedRoute>
                } />
                
                {/* Admin Routes - Protected */}
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/users" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminUsersManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/establishments" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminEstablishments />
                  </ProtectedRoute>
                } />
                <Route path="/admin/applications" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminApplications />
                  </ProtectedRoute>
                } />
                <Route path="/admin/map" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminMap />
                  </ProtectedRoute>
                } />
                <Route path="/admin/inspections" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminInspections />
                  </ProtectedRoute>
                } />
                <Route path="/admin/calendar" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminCalendar />
                  </ProtectedRoute>
                } />
                
                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;