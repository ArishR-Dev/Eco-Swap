import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute, PublicRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Auth Pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";

// Dashboard Layouts
import AdminLayout from "@/pages/admin/AdminLayout";
import UserLayout from "@/pages/user/UserLayout";
import CollectorLayout from "@/pages/collector/CollectorLayout";
import RecyclerLayout from "@/pages/recycler/RecyclerLayout";

// Admin Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import UserManagement from "@/pages/admin/UserManagement";
import PickupManagement from "@/pages/admin/PickupManagement";
import Approvals from "@/pages/admin/Approvals";
import RoutePlanning from "@/pages/admin/RoutePlanning";
import Reports from "@/pages/admin/Reports";
import Settings from "@/pages/admin/Settings";
import AdminProfile from "@/pages/admin/AdminProfile";
import AdminNotifications from "@/pages/admin/AdminNotifications";
import LivePickupQueue from "@/pages/admin/LivePickupQueue";

// User Pages
import UserDashboard from "@/pages/user/UserDashboard";
import NewPickupRequest from "@/pages/user/NewPickupRequest";
import TrackPickup from "@/pages/user/TrackPickup";
import PickupDetails from "@/pages/user/PickupDetails";
import PickupHistory from "@/pages/user/PickupHistory";
import Notifications from "@/pages/user/Notifications";
import UserSettings from "@/pages/user/UserSettings";
import UserProfile from "@/pages/user/UserProfile";
import Feedback from "@/pages/user/Feedback";

// Collector Pages
import CollectorDashboard from "@/pages/collector/CollectorDashboard";
import CollectorTasks from "@/pages/collector/CollectorTasks";
import CollectorTaskDetail from "@/pages/collector/CollectorTaskDetail";
import CollectorCompleted from "@/pages/collector/CollectorCompleted";
import CollectorPerformance from "@/pages/collector/CollectorPerformance";
import CollectorProfile from "@/pages/collector/CollectorProfile";
import CollectorSettings from "@/pages/collector/CollectorSettings";
import CollectorNotifications from "@/pages/collector/CollectorNotifications";

// Recycler Pages
import RecyclerDashboard from "@/pages/recycler/RecyclerDashboard";
import RecyclerIncoming from "@/pages/recycler/RecyclerIncoming";
import RecyclerLog from "@/pages/recycler/RecyclerLog";
import RecyclerCertificates from "@/pages/recycler/RecyclerCertificates";
import RecyclerReports from "@/pages/recycler/RecyclerReports";
import RecyclerProfile from "@/pages/recycler/RecyclerProfile";
import RecyclerSettings from "@/pages/recycler/RecyclerSettings";
import RecyclerNotifications from "@/pages/recycler/RecyclerNotifications";

// Other Pages
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <PublicRoute>
                  <ResetPassword />
                </PublicRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="queue" element={<LivePickupQueue />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="pickups" element={<PickupManagement />} />
              <Route path="approvals" element={<Approvals />} />
              <Route path="routes" element={<RoutePlanning />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<AdminProfile />} />
              <Route path="notifications" element={<AdminNotifications />} />
            </Route>

            {/* User Routes */}
            <Route
              path="/user"
              element={
                <ProtectedRoute allowedRoles={['USER']}>
                  <UserLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<UserDashboard />} />
              <Route path="new-pickup" element={<NewPickupRequest />} />
              <Route path="track" element={<TrackPickup />} />
              <Route path="track/:id" element={<PickupDetails />} />
              <Route path="history" element={<PickupHistory />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="settings" element={<UserSettings />} />
              <Route path="profile" element={<UserProfile />} />
              <Route path="feedback" element={<Feedback />} />
            </Route>

            {/* Collector Routes */}
            <Route
              path="/collector"
              element={
                <ProtectedRoute allowedRoles={['COLLECTOR']}>
                  <CollectorLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<CollectorDashboard />} />
              <Route path="tasks" element={<CollectorTasks />} />
              <Route path="task/:id" element={<CollectorTaskDetail />} />
              <Route path="completed" element={<CollectorCompleted />} />
              <Route path="performance" element={<CollectorPerformance />} />
              <Route path="notifications" element={<CollectorNotifications />} />
              <Route path="settings" element={<CollectorSettings />} />
              <Route path="profile" element={<CollectorProfile />} />
            </Route>

            {/* Recycler Routes */}
            <Route
              path="/recycler"
              element={
                <ProtectedRoute allowedRoles={['RECYCLER']}>
                  <RecyclerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<RecyclerDashboard />} />
              <Route path="incoming" element={<RecyclerIncoming />} />
              <Route path="log" element={<RecyclerLog />} />
              <Route path="certificates" element={<RecyclerCertificates />} />
              <Route path="reports" element={<RecyclerReports />} />
              <Route path="notifications" element={<RecyclerNotifications />} />
              <Route path="settings" element={<RecyclerSettings />} />
              <Route path="profile" element={<RecyclerProfile />} />
            </Route>

            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
