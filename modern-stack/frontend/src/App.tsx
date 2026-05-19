import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ModalProvider } from './components/ModalContext';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/Footer';

const Landing = lazy(() => import('./pages/Landing'));
const FindCaregivers = lazy(() => import('./pages/FindCaregivers'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ClientDashboard = lazy(() => import('./pages/ClientDashboard'));
const CaregiverDashboard = lazy(() => import('./pages/CaregiverDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const CookiePolicy = lazy(() => import('./pages/CookiePolicy'));

// Routes where Footer should be hidden
const HIDE_FOOTER = ['/client', '/caregiver', '/admin', '/login', '/register', '/find-caregivers'];

// Inline keyframe animation injecting for loading spin
const style = document.createElement('style');
style.textContent = `
  @keyframes app-spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

function AppLayout() {
  const { pathname } = useLocation();
  const showFooter = !HIDE_FOOTER.some(r => pathname.startsWith(r));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <ScrollToTop />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Suspense fallback={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flex: 1, background: '#090d16' }}>
            <div style={{ width: 40, height: 40, border: '4px solid rgba(255,255,255,0.05)', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'app-spin 1s linear infinite' }} />
          </div>
        }>
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
        </Suspense>
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
