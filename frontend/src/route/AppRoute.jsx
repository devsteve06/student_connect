
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UniversityAudits from '../features/university/UniversityAudits';
import FirmApplicants from '../features/firm/views/FirmApplicants';

// Structural Layouts
import DashboardLayout from '../components/layouts/DashboardLayout';

// Authorization Gateway Suite
import StudentAuth from '../features/auth/StudentAuth';
import FirmAuth from '../features/auth/FirmAuth';
import UniversityAuth from '../features/auth/UniversityAuth';
import Register from '../features/auth/Register';
import AdminAuth from '../features/admin/AdminAuth';

// Session State + Route Guards
import { AuthProvider } from '../context/AuthProvider';
import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';

// Feature Views
import StudentDashboard from '../features/student/views/StudentDashboard';
import StudentMarketplace from '../features/student/views/StudentMarketplace';
import StudentLogbook from '../features/student/views/StudentLogBook'; // <-- IMPORT CORE VIEW
import StudentProfile from '../features/student/views/StudentProfile';
import CvBuilderWizard from '../features/student/views/CvBuilderWizard';
import FirmDashboard from '../features/firm/views/FirmDashboard';
import UniversityDashboard from '../features/university/views/UniversityDashboard';
import AdminDashboard from '../features/admin/views/AdminDashboard';
import Landing from '../features/Landing';
import NotFound from '../features/NotFound';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* PUBLIC LANDING PAGE — front door to all portals */}
          <Route path="/" element={<Landing />} />

          {/* AUTH ARCHITECTURE ENTRIES (guests only; signed-in users bounce home) */}
          <Route path="/login/students" element={<GuestRoute><StudentAuth /></GuestRoute>} />
          <Route path="/login/firms" element={<GuestRoute><FirmAuth /></GuestRoute>} />
          <Route path="/login/universities" element={<GuestRoute><UniversityAuth /></GuestRoute>} />
          <Route path="/login/admin" element={<GuestRoute><AdminAuth /></GuestRoute>} />

          {/* SELF-SERVE SIGNUP — /register picks a portal, /register/:role locks it */}
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/register/:role" element={<GuestRoute><Register /></GuestRoute>} />

          {/* MOUNTED STUDENT HUB INTERFACE (student role required) */}
          <Route path="/students" element={<ProtectedRoute role="student"><DashboardLayout role="student"><StudentDashboard /></DashboardLayout></ProtectedRoute>} />
          <Route path="/students/marketplace" element={<ProtectedRoute role="student"><DashboardLayout role="student"><StudentMarketplace /></DashboardLayout></ProtectedRoute>} />
          <Route path="/students/logbook" element={<ProtectedRoute role="student"><DashboardLayout role="student"><StudentLogbook /></DashboardLayout></ProtectedRoute>} /> {/* <-- LINK COMPONENT */}
          <Route path="/students/profile" element={<ProtectedRoute role="student"><DashboardLayout role="student"><StudentProfile /></DashboardLayout></ProtectedRoute>} />

          {/* CV builder (Phase 2 — guided wizard; export/preview arrive in Phases 3–4) */}
          <Route path="/students/cv-builder" element={<ProtectedRoute role="student"><DashboardLayout role="student"><CvBuilderWizard /></DashboardLayout></ProtectedRoute>} />
          <Route path="/students/cv-builder/:cvId" element={<ProtectedRoute role="student"><DashboardLayout role="student"><CvBuilderWizard /></DashboardLayout></ProtectedRoute>} />

          {/* MOUNTED CORPORATE WORKSPACE (firm role required) */}
          <Route path="/firms" element={<ProtectedRoute role="firm"><DashboardLayout role="firm"><FirmDashboard /></DashboardLayout></ProtectedRoute>} />
          <Route path="/firms/applicants" element={<ProtectedRoute role="firm"><DashboardLayout role="firm"><FirmApplicants /></DashboardLayout></ProtectedRoute>} />

          {/* MOUNTED UNIVERSITY REGISTRY (university role required) */}
          <Route path="/universities" element={<ProtectedRoute role="university"><DashboardLayout role="university"><UniversityDashboard /></DashboardLayout></ProtectedRoute>} />
          <Route path="/universities/audits" element={<ProtectedRoute role="university"><DashboardLayout role="university"><UniversityAudits /></DashboardLayout></ProtectedRoute>} />

          {/* MOUNTED ADMIN CONTROL PLANE (admin role required) */}
          <Route path="/admin" element={<ProtectedRoute role="admin"><DashboardLayout role="admin"><AdminDashboard /></DashboardLayout></ProtectedRoute>} />

          {/* 404 CATCH-ALL */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
