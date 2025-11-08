import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleProvider } from "@/contexts/RoleContext";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { CookieConsent } from "@/components/CookieConsent";
import ChatSupportWidget from "@/components/ChatSupportWidget";
import { useAnalytics } from "@/hooks/useAnalytics";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AnalyticsAuthBridge } from "@/components/analytics/AnalyticsAuthBridge";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Herbs from "./pages/Herbs";
import HerbDetail from "./pages/HerbDetail";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import WhatIsTTM from "./pages/WhatIsTTM";
import ForPractitioners from "./pages/ForPractitioners";
import Safety from "./pages/Safety";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import UserManagement from "./pages/admin/UserManagement";
import PatientManagement from "./pages/admin/PatientManagement";
import SupportMessages from "./pages/admin/SupportMessages";
import GuestSupport from "./pages/admin/GuestSupport";
import CourseManagement from "./pages/admin/CourseManagement";
import CourseBuilder from "./pages/admin/CourseBuilder";
import LessonManagement from "./pages/admin/LessonManagement";
import AdminAnalytics from "./pages/admin/insights/Analytics";
import AdminSales from "./pages/admin/insights/Sales";
import AdminUsers from "./pages/admin/insights/Users";
import AdminPageViews from "./pages/admin/insights/PageViews";
import AdminCourses from "./pages/admin/insights/Courses";
import PractitionerAnalytics from "./pages/practitioner/Analytics";
import PractitionerMessages from "./pages/practitioner/Messages";
import HealthRecords from "./pages/patient/HealthRecords";
import OrderHistory from "./pages/patient/OrderHistory";
import Messages from "./pages/patient/Messages";
import Patients from "./pages/Patients";
import PatientDetail from "./pages/PatientDetail";
import Recommendations from "./pages/Recommendations";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutCancel from "./pages/CheckoutCancel";
import Orders from "./pages/Orders";
import PatientConnect from "./pages/patient/PatientConnect";
import LineConnected from "./pages/patient/LineConnected";
import LineConnect from "./pages/patient/LineConnect";
import LineError from "./pages/patient/LineError";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import MyCourses from "./pages/MyCourses";
import CourseLearning from "./pages/CourseLearning";
import CertificateVerification from "./pages/CertificateVerification";
import Certifications from "./pages/practitioner/Certifications";
import CertificateManagement from "./pages/admin/CertificateManagement";
import LiveMeetings from "./pages/LiveMeetings";
import LiveMeetingPlayer from "./pages/LiveMeetingPlayer";
import LiveMeetingManagement from "./pages/admin/LiveMeetingManagement";
import MyLiveMeetings from "./pages/practitioner/MyLiveMeetings";

const queryClient = new QueryClient();

const AppContent = () => {
  useAnalytics(); // Initialize analytics and track page views
  return null;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
          <Toaster />
          <Sonner />
          <PWAInstallPrompt />
          <CookieConsent />
          <BrowserRouter>
          <RoleProvider>
            <AppContent />
            <AnalyticsAuthBridge />
            <ChatSupportWidget />
            <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/about" element={<About />} />
          <Route path="/what-is-ttm" element={<WhatIsTTM />} />
          <Route path="/for-practitioners" element={<ForPractitioners />} />
          <Route path="/safety" element={<Safety />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/patient-connect/signup/:token" element={<PatientConnect />} />
          <Route path="/patient-connect/line/:token" element={<LineConnect />} />
          <Route path="/patient-connect/line-success" element={<LineConnected />} />
          <Route path="/patient-connect/line-error" element={<LineError />} />
          <Route path="/checkout/:token" element={<Checkout />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/checkout/cancel" element={<CheckoutCancel />} />
          <Route path="/verify-certificate" element={<CertificateVerification />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/dashboard/recommendations" 
            element={
              <ProtectedRoute requiredRole={['practitioner', 'admin']}>
                <Recommendations />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/herbs" 
            element={
              <ProtectedRoute>
                <Herbs />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/herbs/:id" 
            element={
              <ProtectedRoute>
                <HerbDetail />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/dashboard/patients"
            element={
              <ProtectedRoute>
                <Patients />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/dashboard/patients/:id"
            element={
              <ProtectedRoute>
                <PatientDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/dashboard/admin/users"
            element={
              <ProtectedRoute requiredRole={["admin", "dev"]}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/dashboard/admin/patients"
            element={
              <ProtectedRoute requiredRole={["admin", "dev"]}>
                <PatientManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/admin/support-messages"
            element={
              <ProtectedRoute requiredRole={["admin", "dev"]}>
                <SupportMessages />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/admin/courses"
            element={
              <ProtectedRoute requiredRole={["admin", "dev"]}>
                <CourseManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/admin/courses/:courseId/builder"
            element={
              <ProtectedRoute requiredRole={["admin", "dev"]}>
                <CourseBuilder />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/admin/courses/:courseId/lessons"
            element={
              <ProtectedRoute requiredRole={["admin", "dev"]}>
                <LessonManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/admin/certificates"
            element={
              <ProtectedRoute requiredRole={["admin", "dev"]}>
                <CertificateManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/guest-support"
            element={
              <ProtectedRoute requiredRole={["admin", "dev"]}>
                <GuestSupport />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/dashboard/admin/insights/analytics"
            element={
              <ProtectedRoute requiredRole={["admin", "dev"]}>
                <AdminAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin/insights/sales"
            element={
              <ProtectedRoute requiredRole={["admin", "dev"]}>
                <AdminSales />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin/insights/users"
            element={
              <ProtectedRoute requiredRole={["admin", "dev"]}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin/insights/page-views"
            element={
              <ProtectedRoute requiredRole={["admin", "dev"]}>
                <AdminPageViews />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin/insights/courses"
            element={
              <ProtectedRoute requiredRole={["admin", "dev"]}>
                <AdminCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/practitioner/analytics"
            element={
              <ProtectedRoute requiredRole="practitioner">
                <PractitionerAnalytics />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/dashboard/practitioner/messages" 
            element={
              <ProtectedRoute requiredRole="practitioner">
                <PractitionerMessages />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/dashboard/practitioner/certifications" 
            element={
              <ProtectedRoute requiredRole="practitioner">
                <Certifications />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/patient/records" 
            element={
              <ProtectedRoute requiredRole="patient">
                <HealthRecords />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/patient/messages" 
            element={
              <ProtectedRoute requiredRole="patient">
                <Messages />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/patient/orders" 
            element={
              <ProtectedRoute requiredRole="patient">
                <OrderHistory />
              </ProtectedRoute>
            } 
          />
          {/* Course Routes */}
          <Route 
            path="/dashboard/courses" 
            element={
              <ProtectedRoute>
                <Courses />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/courses/my-courses" 
            element={
              <ProtectedRoute>
                <MyCourses />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/courses/:courseId" 
            element={
              <ProtectedRoute>
                <CourseDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/courses/:courseId/learn" 
            element={
              <ProtectedRoute>
                <CourseLearning />
              </ProtectedRoute>
            } 
          />
          {/* Live Meeting Routes */}
          <Route 
            path="/dashboard/live-meetings" 
            element={
              <ProtectedRoute>
                <LiveMeetings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/live-meetings/:meetingId" 
            element={
              <ProtectedRoute>
                <LiveMeetingPlayer />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/admin/live-meetings" 
            element={
              <ProtectedRoute requiredRole={["admin", "dev"]}>
                <LiveMeetingManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/practitioner/live-meetings" 
            element={
              <ProtectedRoute requiredRole="practitioner">
                <MyLiveMeetings />
              </ProtectedRoute>
            } 
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </RoleProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
