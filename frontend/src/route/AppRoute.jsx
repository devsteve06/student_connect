
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import UniversityAudits from '../features/university/UniversityAudits';
import FirmApplicants from '../features/firm/views/FirmApplicants';

// Structural Layouts
import DashboardLayout from '../components/layouts/DashboardLayout';

// Authorization Gateway Suite
import StudentAuth from '../features/auth/StudentAuth';
import FirmAuth from '../features/auth/FirmAuth';
import UniversityAuth from '../features/auth/UniversityAuth';
import AdminAuth from '../features/admin/AdminAuth';

// Feature Views
import StudentDashboard from '../features/student/views/StudentDashboard';
import StudentMarketplace from '../features/student/views/StudentMarketplace';
import StudentLogbook from '../features/student/views/StudentLogBook'; // <-- IMPORT CORE VIEW
import FirmDashboard from '../features/firm/views/FirmDashboard';
import UniversityDashboard from '../features/university/views/UniversityDashboard';
import AdminDashboard from '../features/admin/views/AdminDashboard';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* FALLBACK REDIRECTS */}
        <Route path="/" element={<Navigate to="/login/student" replace />} />

        {/* AUTH ARCHITECTURE ENTRIES */}
        <Route path="/login/student" element={<StudentAuth />} />
        <Route path="/login/firm" element={<FirmAuth />} />
        <Route path="/login/university" element={<UniversityAuth />} />
        <Route path="/login/admin" element={<AdminAuth />} />

        {/* MOUNTED STUDENT HUB INTERFACE */}
        <Route path="/student" element={<DashboardLayout role="student"><StudentDashboard /></DashboardLayout>} />
        <Route path="/student/marketplace" element={<DashboardLayout role="student"><StudentMarketplace /></DashboardLayout>} />
        <Route path="/student/logbook" element={<DashboardLayout role="student"><StudentLogbook /></DashboardLayout>} /> {/* <-- LINK COMPONENT */}

        {/* MOUNTED CORPORATE WORKSPACE */}
        <Route path="/firm" element={<DashboardLayout role="firm"><FirmDashboard /></DashboardLayout>} />
        <Route path="/firm/applicants" element={<DashboardLayout role="firm"><FirmApplicants /></DashboardLayout>} />

        {/* MOUNTED UNIVERSITY REGISTRY */}
        <Route path="/university" element={<DashboardLayout role="university"><UniversityDashboard /></DashboardLayout>} />
        <Route path="/university/audits" element={<DashboardLayout role="university"><UniversityAudits /></DashboardLayout>} />

        {/* MOUNTED ADMIN CONTROL PLANE */}
        <Route path="/admin" element={<DashboardLayout role="admin"><AdminDashboard /></DashboardLayout>} />

        {/* 404 CATCH-ALL PROTECTION BLOCK */}
        <Route path="*" element={
          <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center font-sans">
            <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Error 404</span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Requested Secure Node Not Found</h1>
            <a href="/" className="mt-5 text-xs font-bold uppercase text-indigo-600 tracking-wider underline underline-offset-4">Return to Platform Edge</a>
          </div>
        } />

      </Routes>
    </BrowserRouter>
  );
}