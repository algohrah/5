import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './lib/AppContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Search from './pages/Search';
import Plans from './pages/Plans';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import CompleteProfile from './pages/CompleteProfile';
import MemberProfile from './pages/MemberProfile';
import InterestRequests from './pages/InterestRequests';
import Checkout from './pages/Checkout';
import AdminChat from './pages/AdminChat';
import Notifications from './pages/Notifications';
import Legal from './pages/Legal';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import JourneyPage from './pages/JourneyPage';
import NotFound from './pages/NotFound';

// Admin Pages
import AdminLayout from './components/admin/AdminLayout';
import AdminLogin from './pages/AdminLogin';
import AdminOverviewHub from './pages/admin/AdminOverviewHub';
import AdminMembersHub from './pages/admin/AdminMembersHub';
import AdminJourneysHub from './pages/admin/AdminJourneysHub';
import AdminFinanceHub from './pages/admin/AdminFinanceHub';
import AdminFinancials from './pages/admin/AdminFinancials';
import AdminTrustHub from './pages/admin/AdminTrustHub';
import AdminSettingsHub from './pages/admin/AdminSettingsHub';
import AdminImportMembers from './pages/admin/AdminImportMembers';
import AdminImportedCoordination from './pages/admin/AdminImportedCoordination';
import AdminAuditLog from './pages/admin/AdminAuditLog';
import AdminBackupRestore from './pages/admin/AdminBackupRestore';
import AdminKhataabaDirectory from './pages/admin/AdminKhataabaDirectory';
import AdminCities from './pages/admin/AdminCities';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Main User Routes with Layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Journey Routes */}
            <Route path="/journey" element={<JourneyPage />} />
            <Route path="/journey/:id" element={<JourneyPage />} />

            {/* Member Profiles */}
            <Route path="/member/:id" element={<MemberProfile />} />
            <Route path="/u/:username" element={<MemberProfile />} />

            {/* Legal */}
            <Route path="/legal/privacy" element={<Legal type="privacy" />} />
            <Route path="/legal/terms" element={<Legal type="terms" />} />
            <Route path="/privacy" element={<Legal type="privacy" />} />
            <Route path="/terms" element={<Legal type="terms" />} />

            {/* Support / Admin Chat */}
            <Route path="/support" element={<ProtectedRoute><AdminChat /></ProtectedRoute>} />
            <Route path="/admin-chat" element={<ProtectedRoute><AdminChat /></ProtectedRoute>} />

            {/* Member Profile and Management */}
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
            <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
            <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />
            <Route path="/profile/complete" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />
            <Route path="/requests" element={<ProtectedRoute><InterestRequests /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/checkout/:planId" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverviewHub />} />
            <Route path="members" element={<AdminMembersHub />} />
            <Route path="journeys" element={<AdminJourneysHub />} />
            <Route path="finance" element={<AdminFinanceHub />} />
            <Route path="financials" element={<AdminFinancials />} />
            <Route path="trust" element={<AdminTrustHub />} />
            <Route path="settings" element={<AdminSettingsHub />} />
            <Route path="import" element={<AdminImportMembers />} />
            <Route path="imported-coordination" element={<AdminImportedCoordination />} />
            <Route path="audit-log" element={<AdminAuditLog />} />
            <Route path="backup" element={<AdminBackupRestore />} />
            <Route path="khataaba-directory" element={<AdminKhataabaDirectory />} />
            <Route path="cities" element={<AdminCities />} />
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
