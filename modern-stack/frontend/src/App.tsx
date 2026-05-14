import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ModalProvider } from './components/ModalContext';
import ScrollToTop from './components/ScrollToTop';
import Login from './pages/Login';
import Register from './pages/Register';
import ClientDashboard from './pages/ClientDashboard';
import CaregiverDashboard from './pages/CaregiverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Landing from './pages/Landing';
import FindCaregivers from './pages/FindCaregivers';
import Footer from './components/Footer';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import CookiePolicy from './pages/CookiePolicy';

// Routes where Footer should be hidden
const HIDE_FOOTER = ['/client', '/caregiver', '/admin', '/login', '/register', '/find-caregivers'];

function AppLayout() {
  const { pathname } = useLocation();
  const showFooter = !HIDE_FOOTER.some(r => pathname.startsWith(r));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <ScrollToTop />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/find-caregivers" element={<FindCaregivers />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/client" element={<ClientDashboard />} />
          <Route path="/caregiver" element={<CaregiverDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {showFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <ModalProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </ModalProvider>
  );
}

export default App;
