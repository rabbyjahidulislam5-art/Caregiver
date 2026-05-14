import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ModalProvider } from './components/ModalContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ClientDashboard from './pages/ClientDashboard';
import CaregiverDashboard from './pages/CaregiverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Landing from './pages/Landing';
import Footer from './components/Footer';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import CookiePolicy from './pages/CookiePolicy';

// Pages that should NOT show the footer
const NO_FOOTER_ROUTES = ['/client', '/caregiver', '/admin'];

function AppInner() {
  const path = window.location.pathname;
  const showFooter = !NO_FOOTER_ROUTES.some(r => path.startsWith(r));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<Landing />} />
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
        <AppInner />
      </BrowserRouter>
    </ModalProvider>
  );
}

export default App;
